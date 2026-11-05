import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import routes from '../server-api-handlers/routes.js';

test('every static API endpoint referenced by the website is dispatched',async()=>{
  const sourceRoot=new URL('../src/',import.meta.url);const missing=[],files=new Map();
  for(const entry of await readdir(sourceRoot,{recursive:true,withFileTypes:true})){
    if(!entry.isFile()||!/\.[jt]sx?$/.test(entry.name))continue;
    const path=resolve(entry.parentPath,entry.name);
    files.set(path,ts.createSourceFile(path,await readFile(path,'utf8'),ts.ScriptTarget.Latest,true));
  }
  // Follow the application's imports; unused legacy endpoint catalogs are not requests.
  const visited=new Set();
  function scan(path){
    if(visited.has(path)||!files.has(path))return;visited.add(path);const source=files.get(path);
    function dependency(specifier){
      if(!specifier?.startsWith('.'))return;const base=resolve(dirname(path),specifier);
      const target=[base,...['.ts','.tsx','.js','.jsx','/index.ts','/index.tsx'].map(ext=>base+ext)].find(candidate=>files.has(candidate));
      if(target)scan(target);
    }
    function visit(node){
      if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))dependency(node.moduleSpecifier.text);
      if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword&&ts.isStringLiteral(node.arguments[0]))dependency(node.arguments[0].text);
      if((ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node))&&node.text.startsWith('/api/')){
        const parts=node.text.split('?')[0].slice(5).split('/').filter(Boolean);
        if(!routes.some(route=>route.segments.length===parts.length&&route.segments.every((segment,i)=>segment===':id'||segment===parts[i])))missing.push(`${path}: ${node.text}`);
      }
      ts.forEachChild(node,visit);
    }
    visit(source);
  }
  scan(fileURLToPath(new URL('main.tsx',sourceRoot)));assert.ok(visited.size>100,'Application import graph must be traversed');
  assert.deepEqual(missing,[],'Website endpoints must have server routes');
});
