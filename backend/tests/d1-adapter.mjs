import {DatabaseSync} from 'node:sqlite';
export function testDB(){const db=new DatabaseSync(':memory:');return {
 close:()=>db.close(),async exec(sql){db.exec(sql);return {count:1,duration:0};},
 async batch(statements){db.exec('BEGIN');try{const rows=statements.map(statement=>statement.execute());db.exec('COMMIT');return rows;}catch(error){db.exec('ROLLBACK');throw error;}},
 prepare(sql){let args=[];const stmt=db.prepare(sql);return {
  bind(...values){args=values;return this;},
  async run(){const r=stmt.run(...args);return {success:true,results:[],meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};},
  execute(){if(!stmt.columns().length){const r=stmt.run(...args);return {success:true,results:[],meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}const results=stmt.all(...args);return {success:true,results,meta:{changes:0,last_row_id:0}};},
  async all(){return this.execute();},
  async first(){return stmt.get(...args)||null;}
 };
 }};}
