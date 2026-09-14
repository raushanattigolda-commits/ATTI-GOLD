require('dotenv').config();
const express=require('express');
const path=require('path');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const Database=require('better-sqlite3');

const app=express();
const db=new Database('atti_gold.db');
const PORT=process.env.PORT||3000;
const SECRET=process.env.JWT_SECRET||'dev-only-secret';

app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));

function auth(req,res,next){
  try {
    const token=(req.headers.authorization||'').replace('Bearer ','');
    req.user=jwt.verify(token,SECRET);
    next();
  } catch(e){ res.status(401).json({error:'Unauthorized'}); }
}

app.post('/api/register', async (req,res)=>{
  const {name,mobile,password,referralCode}=req.body;
  if(!name||!mobile||!password) return res.status(400).json({error:'Name, mobile and password are required'});
  if(password.length<8) return res.status(400).json({error:'Password must be at least 8 characters'});
  const exists=db.prepare('SELECT id FROM users WHERE mobile=?').get(mobile);
  if(exists) return res.status(409).json({error:'Mobile already registered'});
  const code='AG'+Math.random().toString(36).slice(2,9).toUpperCase();
  const hash=await bcrypt.hash(password,12);
  const result=db.prepare('INSERT INTO users(name,mobile,password_hash,referral_code,referred_by) VALUES(?,?,?,?,?)')
    .run(name,mobile,hash,code,referralCode||null);
  db.prepare('INSERT INTO wallets(user_id) VALUES(?)').run(result.lastInsertRowid);
  res.json({message:'Registration successful',referralCode:code});
});

app.post('/api/login', async (req,res)=>{
  const {mobile,password}=req.body;
  const user=db.prepare('SELECT * FROM users WHERE mobile=?').get(mobile);
  if(!user || !(await bcrypt.compare(password,user.password_hash))) return res.status(401).json({error:'Invalid login'});
  const token=jwt.sign({id:user.id,role:user.role},SECRET,{expiresIn:'7d'});
  res.json({token,user:{id:user.id,name:user.name,mobile:user.mobile,referralCode:user.referral_code,role:user.role}});
});

app.get('/api/me',auth,(req,res)=>{
  const user=db.prepare('SELECT id,name,mobile,referral_code,role,created_at FROM users WHERE id=?').get(req.user.id);
  const wallet=db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(req.user.id);
  const transactions=db.prepare('SELECT id,type,amount,status,note,created_at FROM transactions WHERE user_id=? ORDER BY id DESC LIMIT 20').all(req.user.id);
  res.json({user,wallet,transactions});
});

app.get('/api/plans',auth,(req,res)=>res.json(db.prepare('SELECT * FROM plans ORDER BY amount').all()));

app.post('/api/withdrawals',auth,(req,res)=>{
  const {amount,method,account}=req.body;
  if(!Number.isFinite(amount)||amount<=0||!method||!account) return res.status(400).json({error:'Invalid withdrawal request'});
  const wallet=db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(req.user.id);
  if(!wallet || wallet.balance<amount) return res.status(400).json({error:'Insufficient balance'});
  const tx=db.transaction(()=>{
    db.prepare('UPDATE wallets SET balance=balance-? WHERE user_id=?').run(amount,req.user.id);
    return db.prepare('INSERT INTO withdrawals(user_id,amount,method,account) VALUES(?,?,?,?)').run(req.user.id,amount,method,account);
  });
  tx();
  res.json({message:'Withdrawal request submitted'});
});

app.get('/api/admin/users',auth,(req,res)=>{
  if(req.user.role!=='admin') return res.status(403).json({error:'Admin only'});
  res.json(db.prepare('SELECT id,name,mobile,referral_code,referred_by,role,created_at FROM users ORDER BY id DESC').all());
});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`ATTI GOLD running at http://localhost:${PORT}`));
