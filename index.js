const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yrmenu';

// 1. إنشاء مجلد uploads تلقائياً إذا لم يكن موجوداً
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// 2. Middlewares الأساسية
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. إعداد الـ Session (بدون maxAge لتنتهي الجلسة فور إغلاق المتصفح)
app.use(session({
  secret: 'my_super_secret_key_123', // يمكنك تغيير هذا المفتاح
  resave: false,
  saveUninitialized: false
}));

// 4. دالة التحقق من تسجيل الدخول (Middleware)
function requireLogin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.redirect('/login.html');
}

// 5. إعداد Multer لتخزين صور الأقسام
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 6. الاتصال بـ MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB Error:', err));

// 7. Schemas
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  name_en: { type: String, default: '' },
  description: { type: String, default: '' },
  price: { type: String, required: true }
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  name_en: { type: String, default: '' },
  image: { type: String, default: '' },
  items: [itemSchema]
});

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

// بيانات مدير النظام (اسم المستخدم: admin | كلمة السر: admin123)
const ADMIN_USER = "admin";
const ADMIN_PASS_HASH = bcrypt.hashSync("admin@123", 10);

// 8. Auth Routes (تسجيل الدخول والخروج)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && bcrypt.compareSync(password, ADMIN_PASS_HASH)) {
    req.session.isAdmin = true;
    return res.json({ success: true, message: "تم تسجيل الدخول بنجاح" });
  }
  res.status(401).json({ error: "اسم المستخدم أو كلمة السر غير صحيحة" });
});

app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});

// 9. حماية صفحة admin.html من المجلد الرئيسي
app.get('/admin.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// 10. إتاحة مجلد public للملفات العامة (مثل login.html و index.html للزبائن)
app.use(express.static(path.join(__dirname, 'public')));

// 11. API Routes (محمية لأوامر التعديل والحذف والإضافة)

app.get('/api/menu', async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/categories', requireLogin, upload.single('image'), async (req, res) => {
  try {
    const { name, name_en } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';
    const newCategory = new Category({ name, name_en: name_en || '', image: imagePath, items: [] });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/categories/:id', requireLogin, async (req, res) => {
  try {
    const { name, name_en } = req.body;
    const updated = await Category.findByIdAndUpdate(req.params.id, { name, name_en }, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/categories/:id', requireLogin, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "تم حذف القسم بنجاح" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/categories/:catId/items', requireLogin, async (req, res) => {
  try {
    const { name, name_en, price, description } = req.body;
    const cat = await Category.findById(req.params.catId);
    if (!cat) return res.status(404).json({ error: "القسم غير موجود" });

    cat.items.push({ name, name_en: name_en || '', price, description: description || '' });
    await cat.save();
    res.status(201).json(cat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/categories/:catId/items/:itemId', requireLogin, async (req, res) => {
  try {
    const cat = await Category.findById(req.params.catId);
    const item = cat.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: "الصنف غير موجود" });

    Object.assign(item, req.body);
    await cat.save();
    res.json(cat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/categories/:catId/items/:itemId', requireLogin, async (req, res) => {
  try {
    const cat = await Category.findById(req.params.catId);
    cat.items.pull(req.params.itemId);
    await cat.save();
    res.json(cat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));