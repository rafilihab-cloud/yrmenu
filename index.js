const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();

const MONGO_URI = "mongodb+srv://rafilihab_db_user:iOsatFqoINY1g5Jp@cluster0.je5q3pg.mongodb.net/yrmenu?retryWrites=true&w=majority&appName=Cluster0";

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

// تعيين حد أقصى لحجم الملف (مثلاً 50 ميجابايت لدعم الفيديوهات)
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- SCHEMAS ---

// Schema الخاص بـ إعدادات الثيمة والمظهر والحالة والوصف الفرعي
const SettingsSchema = new mongoose.Schema({
  restaurantName: { type: String, default: 'اسم المطعم' },
  restaurantTagline: { type: String, default: '' },
  primaryColor: { type: String, default: '#0f2537' },
  secondaryColor: { type: String, default: '#e5d5be' },
  cardBgColor: { type: String, default: '#d7c4a8' },
  textColor: { type: String, default: '#1f1912' },
  logoUrl: { type: String, default: '' },
  bannerUrl: { type: String, default: '' },
  heroBgUrl: { type: String, default: '' },
  heroVideoUrl: { type: String, default: '' },
  subscriptionStatus: { type: String, default: 'active' }, 
  expiryDate: { type: String, default: '' }
});

const ItemSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  name_en: { type: String, default: '' },
  price: { type: String, default: '' },
  description: { type: String, default: '' },
  image: { type: String, default: '' }
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  name_en: { type: String, default: '' },
  image: { type: String, default: '' },
  items: [ItemSchema]
});

const Settings = mongoose.model('Settings', SettingsSchema);
const Category = mongoose.model('Category', CategorySchema);

// --- API ROUTE FOR LOGIN ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // اسم المستخدم وكلمة المرور الخاصة بلوحة التحكم
  const ADMIN_USER = "admin";
  const ADMIN_PASS = "admin123"; // يمكنك تعديلها لاحقاً كما تريد

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, message: "تم تسجيل الدخول بنجاح" });
  } else {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  }
});

// --- API ROUTES FOR SETTINGS & THEME ---

// جلب إعدادات الثيمة
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حفظ إعدادات الثيمة والحالة والشعار/الغلاف/خلفية الرئيسية/فيديو الرئيسية
app.post('/api/settings', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
  { name: 'heroBg', maxCount: 1 },
  { name: 'heroVideo', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      restaurantName, 
      restaurantTagline, 
      tagline,            
      primaryColor, 
      secondaryColor, 
      cardBgColor, 
      textColor,
      subscriptionStatus, 
      expiryDate          
    } = req.body;

    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    if (restaurantName !== undefined) settings.restaurantName = restaurantName;
    
    const finalTagline = restaurantTagline !== undefined ? restaurantTagline : tagline;
    if (finalTagline !== undefined) settings.restaurantTagline = finalTagline;

    if (primaryColor) settings.primaryColor = primaryColor;
    if (secondaryColor) settings.secondaryColor = secondaryColor;
    if (cardBgColor) settings.cardBgColor = cardBgColor;
    if (textColor) settings.textColor = textColor;

    if (subscriptionStatus !== undefined) settings.subscriptionStatus = subscriptionStatus;
    if (expiryDate !== undefined) settings.expiryDate = expiryDate;

    if (req.files && req.files['logo']) {
      settings.logoUrl = `/uploads/${req.files['logo'][0].filename}`;
    }
    if (req.files && req.files['banner']) {
      settings.bannerUrl = `/uploads/${req.files['banner'][0].filename}`;
    }
    if (req.files && req.files['heroBg']) {
      settings.heroBgUrl = `/uploads/${req.files['heroBg'][0].filename}`;
    }
    if (req.files && req.files['heroVideo']) {
      settings.heroVideoUrl = `/uploads/${req.files['heroVideo'][0].filename}`;
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// مسار حذف صورة الشعار، الغلاف، خلفية الرئيسية، أو الفيديو
app.delete('/api/settings/image/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const settings = await Settings.findOne();
    if (settings) {
      if (type === 'logo') settings.logoUrl = '';
      if (type === 'banner') settings.bannerUrl = '';
      if (type === 'heroBg') settings.heroBgUrl = '';
      if (type === 'heroVideo') settings.heroVideoUrl = '';
      await settings.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API ROUTES FOR MENU ---

app.get('/api/menu', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', upload.single('image'), async (req, res) => {
  try {
    const { name, name_en } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const newCat = new Category({ name, name_en, image: imageUrl, items: [] });
    await newCat.save();
    res.status(201).json(newCat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, name_en } = req.body;
    const updatedCat = await Category.findByIdAndUpdate(req.params.id, { name, name_en }, { new: true });
    res.json(updatedCat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف صورة قسم
app.delete('/api/categories/:id/image', async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { image: '' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories/:catId/items', upload.single('image'), async (req, res) => {
  try {
    const { name, name_en, price, description } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const category = await Category.findById(req.params.catId);
    if (!category) return res.status(404).json({ error: 'القسم غير موجود' });

    category.items.push({ name: name || '', name_en: name_en || '', price: price || '', description: description || '', image: imageUrl });
    await category.save();
    return res.status(201).json(category);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:catId/items/:itemId', async (req, res) => {
  try {
    const { name, name_en, price, description } = req.body;
    const category = await Category.findById(req.params.catId);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    const item = category.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.name = name;
    item.name_en = name_en;
    item.price = price;
    item.description = description;

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:catId/items/:itemId', async (req, res) => {
  try {
    const category = await Category.findById(req.params.catId);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    category.items.pull({ _id: req.params.itemId });
    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف صورة منتج
app.delete('/api/categories/:catId/items/:itemId/image', async (req, res) => {
  try {
    const category = await Category.findById(req.params.catId);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const item = category.items.id(req.params.itemId);
    if (item) item.image = '';

    await category.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
