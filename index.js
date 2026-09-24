const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

const app = express();

const MONGO_URI = "mongodb+srv://rafilihab_db_user:iOsatFqoINY1g5Jp@cluster0.je5q3pg.mongodb.net/yrmenu?retryWrites=true&w=majority&appName=Cluster0";

// استخدام التخزين المؤقت في الذاكرة (Memory Storage) لتحويل الملف إلى Base64 وحفظه في MongoDB مباشرة
const storage = multer.memoryStorage();

// تعيين حد أقصى لحجم الملف (50 ميجابايت لدعم الفيديوهات)
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- SCHEMAS ---

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
  expiryDate: { type: String, default: '' },              // حقل تاريخ انتهاء الاشتراك
  subscriptionStatus: { type: String, default: 'active' } // حقل حالة الاشتراك
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

// دالة مساعدة لتحويل الملف المخزن في الذاكرة إلى Base64 String
function formatFileToBase64(file) {
  if (!file) return null;
  const b64 = Buffer.from(file.buffer).toString('base64');
  return `data:${file.mimetype};base64,${b64}`;
}

// --- API ROUTE FOR ADMIN LOGIN ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const ADMIN_USER = "admin";
  const ADMIN_PASS = "admin123";

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, message: "تم تسجيل دخول المشرف بنجاح", token: "admin-token-xyz" });
  } else {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  }
});

// --- API ROUTE FOR RESTAURANT LOGIN ---
app.post('/api/restaurant-login', (req, res) => {
  const { username, password } = req.body;
  const REST_USER = "restaurant";
  const REST_PASS = "rest123";

  if (username === REST_USER && password === REST_PASS) {
    res.json({ success: true, message: "تم تسجيل دخول المطعم بنجاح", token: "restaurant-token-xyz" });
  } else {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  }
});

// --- API ROUTES FOR SETTINGS & THEME ---

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
      expiryDate,
      subscriptionStatus
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

    // حفظ بيانات الاشتراك وحالتها
    if (expiryDate !== undefined) settings.expiryDate = expiryDate;
    if (subscriptionStatus !== undefined) settings.subscriptionStatus = subscriptionStatus;

    // حفظ الملفات مباشرة كـ Base64 داخل قاعدة البيانات
    if (req.files && req.files['logo']) {
      settings.logoUrl = formatFileToBase64(req.files['logo'][0]);
    }
    if (req.files && req.files['banner']) {
      settings.bannerUrl = formatFileToBase64(req.files['banner'][0]);
    }
    if (req.files && req.files['heroBg']) {
      settings.heroBgUrl = formatFileToBase64(req.files['heroBg'][0]);
    }
    if (req.files && req.files['heroVideo']) {
      settings.heroVideoUrl = formatFileToBase64(req.files['heroVideo'][0]);
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    const imageUrl = formatFileToBase64(req.file) || '';
    const newCat = new Category({ name, name_en, image: imageUrl, items: [] });
    await newCat.save();
    res.status(201).json(newCat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, name_en } = req.body;
    const updateData = { name, name_en };
    
    if (req.file) {
      updateData.image = formatFileToBase64(req.file);
    }

    const updatedCat = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
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
    const imageUrl = formatFileToBase64(req.file) || '';
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

app.delete('/api/categories/:catId/items/:itemId/image', async (Creq, res) => {
  try {
    const category = await Category.findById(Creq.params.catId);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const item = category.items.id(Creq.params.itemId);
    if (item) item.image = '';

    await category.save();
    res.json({ success: `true` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));