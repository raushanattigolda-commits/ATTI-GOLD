require('dotenv').config();
const fs=require('fs');
const bcrypt=require('bcryptjs');
const Database=require('better-sqlite3');
const db=new Database('atti_gold.db');
db.exec(fs.readFileSync('schema.sql','utf8'));

const plans=[
 ['Starter',100,30,'Example plan — configure only after legal/compliance review.'],
 ['Standard',500,60,'Example plan — configure only after legal/compliance review.'],
 ['Premium',1000,90,'Example plan — configure only after legal/compliance review.']
];
const ins=db.prepare('INSERT INTO plans(name,amount,duration_days,description) VALUES(?,?,?,?)');
if(db.prepare('SELECT COUNT(*) c FROM plans').get().c===0) plans.forEach(p=>ins.run(...p));

if(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD){
 const mobile=process.env.ADMIN_EMAIL;
 const existing=db.prepare('SELECT id FROM users WHERE mobile=?').get(mobile);
 if(!existing){
  const hash=bcrypt.hashSync(process.env.ADMIN_PASSWORD,12);
  const code='ADMIN'+Math.random().toString(36).slice(2,7).toUpperCase();
  const r=db.prepare('INSERT INTO users(name,mobile,password_hash,referral_code,role) VALUES(?,?,?,?,?)')
   .run('Administrator',mobile,hash,code,'admin');
  db.prepare('INSERT INTO wallets(user_id) VALUES(?)').run(r.lastInsertRowid);
 }
}
console.log('Database initialized.');
