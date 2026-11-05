// Test-only Supabase query adapter. Handlers and SQL run unchanged against real PostgreSQL.
// Authentication and object storage are explicit fixture boundaries, never production bypasses.
const identifier = value => { if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error('Invalid test SQL identifier'); return `"${value}"`; };
function selectParts(text) {
  let level=0,start=0;const parts=[];
  for(let index=0;index<text.length;index++){if(text[index]==='(')level++;if(text[index]===')')level--;if(text[index]===','&&!level){parts.push(text.slice(start,index).trim());start=index+1;}}
  parts.push(text.slice(start).trim());return parts.filter(Boolean);
}
export function pgApiAdapter(pg) {
  const sessions=new Map();const files=new Map();
  const adapter={
    sessions,files,
    auth:{
      async getUser(token){const id=sessions.get(token);if(!id)return {data:{user:null},error:{message:'Invalid test session'}};const row=(await pg.query('SELECT * FROM auth.users WHERE id=$1',[id])).rows[0];return {data:{user:row?{...row,user_metadata:row.raw_user_meta_data||{},factors:row.factors||[]}:null},error:null};},
      admin:{
        async getUserById(id){const row=(await pg.query('SELECT * FROM auth.users WHERE id=$1',[id])).rows[0];return {data:{user:row?{...row,user_metadata:row.raw_user_meta_data||{}}:null},error:null};},
        async listUsers({page=1,perPage=50}={}){const rows=(await pg.query('SELECT * FROM auth.users ORDER BY created_at LIMIT $1 OFFSET $2',[perPage,(page-1)*perPage])).rows;return {data:{users:rows.map(row=>({...row,user_metadata:row.raw_user_meta_data||{}}))},error:null};},
      },
    },
    storage:{from(bucket){return {
      async upload(key,bytes){files.set(`${bucket}/${key}`,Buffer.from(bytes));return {data:{path:key},error:null};},
      async download(key){const bytes=files.get(`${bucket}/${key}`);return {data:bytes?new Blob([bytes]):null,error:bytes?null:{message:'Missing object'}};},
      async createSignedUrl(key){return {data:{signedUrl:`https://files.example.test/${bucket}/${key}?test-signature=fixture`},error:null};},
      async remove(keys){keys.forEach(key=>files.delete(`${bucket}/${key}`));return {data:[],error:null};},
    };}},
    async rpc(name,args={}){try {const keys=Object.keys(args);const values=keys.map(key=>typeof args[key]==='object'&&args[key]!==null?JSON.stringify(args[key]):args[key]);const set=(await pg.query('SELECT proretset FROM pg_proc WHERE proname=$1',[name])).rows[0]?.proretset;const call=`${identifier(name)}(${keys.map((key,index)=>`${identifier(key)} => $${index+1}`).join(',')})`;const result=await pg.query(set?`SELECT to_jsonb(value) AS data FROM ${call} AS value`:`SELECT ${call} AS data`,values);return {data:set?result.rows.map(row=>row.data):result.rows.length===1?result.rows[0].data:result.rows.map(row=>row.data),error:null};}catch(error){return {data:null,error:{code:error.code,message:error.message}};}},
    from(table){
      identifier(table);
      let action='select',payload,conflict,columns='*',mode='many',limit,offset=0,count,head=false;
      const filters=[],orders=[];
      const builder={
        select(value='*',options={}){columns=value;count=options.count;head=options.head||false;return builder;},
        insert(value){action='insert';payload=value;return builder;},
        update(value){action='update';payload=value;return builder;},
        delete(){action='delete';return builder;},
        upsert(value,options={}){action='upsert';payload=value;conflict=options.onConflict;return builder;},
        eq(column,value){filters.push([column,'=',value]);return builder;},
        neq(column,value){filters.push([column,'<>',value]);return builder;},
        gt(column,value){filters.push([column,'>',value]);return builder;},
        gte(column,value){filters.push([column,'>=',value]);return builder;},
        lt(column,value){filters.push([column,'<',value]);return builder;},
        lte(column,value){filters.push([column,'<=',value]);return builder;},
        is(column,value){filters.push([column,'IS',value]);return builder;},
        not(column,operator,value){if(operator!=='is')throw new Error('Unsupported test filter');filters.push([column,'IS NOT',value]);return builder;},
        in(column,values){filters.push([column,'IN',values]);return builder;},
        contains(column,value){filters.push([column,'@>',JSON.stringify(value)]);return builder;},
        or(value){filters.push(['OR','OR',value]);return builder;},
        order(column,options={}){orders.push(`${identifier(column)} ${options.ascending===false?'DESC':'ASC'}`);return builder;},
        limit(value){limit=value;return builder;},range(first,last){offset=first;limit=last-first+1;return builder;},
        single(){mode='single';return builder;},maybeSingle(){mode='maybe';return builder;},
        then(resolve,reject){return execute().then(resolve,reject);},
      };
      async function execute(){try {
        const parameters=[];const bind=value=>{parameters.push(value);return `$${parameters.length}`;};
        const parts=selectParts(columns),relations=parts.filter(part=>part.includes('('));
        const select=parts.filter(part=>!part.includes('(')).map(column=>column==='*'?'*':identifier(column)).join(',')||'*';
        const predicate=(column,operator,value)=>{
          if(operator==='OR')return '('+value.split(',').map(term=>{const [field,op,...rest]=term.split('.');return predicate(field,{is:'IS',eq:'=',gt:'>',gte:'>='}[op],rest.join('.')==='null'?null:rest.join('.'));}).join(' OR ')+')';
          const col=identifier(column);
          if(operator==='IS'||operator==='IS NOT')return `${col} ${operator} ${value===null?'NULL':value===true?'TRUE':'FALSE'}`;
          if(operator==='IN')return value.length?`${col} IN (${value.map(bind).join(',')})`:'FALSE';
          return `${col} ${operator} ${bind(value)}`;
        };
        let sql;
        if(action==='select')sql=`SELECT ${select} FROM ${identifier(table)}`;
        else if(action==='delete')sql=`DELETE FROM ${identifier(table)}`;
        else {
          const rows=Array.isArray(payload)?payload:[payload];const keys=Object.keys(rows[0]);
          const meta=(await pg.query('SELECT column_name,data_type FROM information_schema.columns WHERE table_schema=\'public\' AND table_name=$1',[table])).rows;
          const convert=(key,value)=>meta.find(column=>column.column_name===key)?.data_type==='jsonb'?JSON.stringify(value):value;
          if(action==='update')sql=`UPDATE ${identifier(table)} SET ${keys.map(key=>`${identifier(key)}=${bind(convert(key,payload[key]))}`).join(',')}`;
          else {sql=`INSERT INTO ${identifier(table)}(${keys.map(identifier).join(',')}) VALUES ${rows.map(row=>'('+keys.map(key=>bind(convert(key,row[key]))).join(',')+')').join(',')}`;
            if(action==='upsert'){const targets=(conflict||'id').split(',');sql+=` ON CONFLICT(${targets.map(identifier).join(',')}) DO UPDATE SET ${keys.filter(key=>!targets.includes(key)).map(key=>`${identifier(key)}=EXCLUDED.${identifier(key)}`).join(',')}`;}
          }
        }
        if(filters.length)sql+=' WHERE '+filters.map(args=>predicate(...args)).join(' AND ');
        if(action==='select'){
          if(orders.length)sql+=' ORDER BY '+orders.join(',');
          if(limit!==undefined)sql+=' LIMIT '+bind(limit);
          if(offset)sql+=' OFFSET '+bind(offset);
        }else sql+=' RETURNING '+select;
        let rows=(await pg.query(sql,parameters)).rows;
        for(const relation of relations){const match=relation.match(/^(\w+)\((.*)\)$/);if(!match)throw new Error('Unsupported test relationship');const related=match[1];const fk={organizations:'organization_id',lab_orders:'lab_order_id',profiles:'user_id'}[related];if(!fk)throw new Error('Unsupported relationship: '+related);for(const row of rows){let foreignId=row[fk];if(!foreignId&&row.id)foreignId=(await pg.query(`SELECT ${identifier(fk)} FROM ${identifier(table)} WHERE id=$1`,[row.id])).rows[0]?.[fk];row[related]=foreignId?(await adapter.from(related).select(match[2]).eq('id',foreignId).maybeSingle()).data:null;}}
        if(mode==='single'&&rows.length!==1||mode==='maybe'&&rows.length>1)return {data:null,error:{code:'PGRST116',message:'Expected one row'}};
        return {data:head?null:mode==='many'?rows:rows[0]||null,error:null,...(count?{count:rows.length}:{})};
      }catch(error){return {data:null,error:{code:error.code||'TEST_ADAPTER',message:error.message}};}}
      return builder;
    },
  };
  return adapter;
}
