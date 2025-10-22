// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// demo: lưu tạm vào users.json (chỉ demo). Dùng DB thực cho production.
const DB_FILE = path.join(__dirname, 'users.json');
function loadUsers(){
  if(!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE));
}
function saveUsers(users){ fs.writeFileSync(DB_FILE, JSON.stringify(users, null,2)); }

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// helper: gửi email thông báo cho admin
async function notifyAdmin(subject, html){
  const info = await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: process.env.ADMIN_EMAIL,
    subject,
    html
  });
  return info;
}

// route: register
app.post('/register', async (req, res) => {
  try{
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({ error: 'Thiếu email hoặc password' });

    const users = loadUsers();
    if(users[email]) return res.status(400).json({ error: 'Email đã tồn tại' });

    const hash = await bcrypt.hash(password, 10);
    users[email] = { email, passwordHash: hash, createdAt: new Date().toISOString() };
    saveUsers(users);

    // gửi thông tin về cho admin
    const subject = `Người dùng mới đăng ký: ${email}`;
    const html = `<p>Người dùng vừa đăng ký bằng email: <b>${email}</b></p>
                  <p>Thời gian: ${new Date().toLocaleString()}</p>`;
    await notifyAdmin(subject, html);

    res.json({ ok: true, message: 'Đăng ký thành công' });
  } catch(err){
    console.error(err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});


app.post('/login', async (req, res) => {
  try{
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({ error: 'Thiếu email hoặc password' });

    const users = loadUsers();
    const u = users[email];
    if(!u) return res.status(400).json({ error: 'Email không tồn tại' });

    const ok = await bcrypt.compare(password, u.passwordHash);
    if(!ok) return res.status(400).json({ error: 'Mật khẩu sai' });


    const subject = `Đăng nhập: ${email}`;
    const html = `<p>Người dùng đăng nhập: <b>${email}</b></p>
                  <p>Thời gian: ${new Date().toLocaleString()}</p>`;
    await notifyAdmin(subject, html);

    res.json({ ok: true, message: 'Đăng nhập thành công' });
  } catch(err){
    console.error(err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server running on', PORT));
