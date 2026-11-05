// Legacy display names and status text alone do not establish who issued a record.
export function recordSource(record){
  if(!record?.created_by)return 'unknown';
  if(record.source==='verified')return 'verified';
  if(['upload','uploaded'].includes(record.source))return 'uploaded';
  return 'unknown';
}
