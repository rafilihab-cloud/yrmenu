const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const https = require('https');

const app = express();

const MONGO_URI = "mongodb+srv://rafilihab_db_user:iOsatFqoINY1g5Jp@cluster0.je5q3pg.mongodb.net/yrmenu?retryWrites=true&w=majority&appName=Cluster0";

const storage = multer.memoryStorage();
const upload = multer({  
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
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
  
  // الحقول المحدثة تدعم اللغتين (عربي وإنجليزي)
  welcomeText: { type: String, default: '' },        // الترحيب بالعربية
  welcomeText_en: { type: String, default: '' },    // الترحيب بالإنجليزية
  subTitle: { type: String, default: '' },          // الوصف بالعربية
  subTitle_en: { type: String, default: '' },       // الوصف بالإنجليزية

  primaryColor: { type: String, default: '#0f2537' },
  secondaryColor: { type: String, default: '#e5d5be' },
  cardBgColor: { type: String, default: '#d7c4a8' },
  textColor: { type: String, default: '#1f1912' },
  
  headerBgColor: { type: String, default: '#ffffff' },
  headingColor: { type: String, default: '#1a1a1a' },
  brandTitleColor: { type: String, default: '#1a1a1a' },
  descriptionColor: { type: String, default: '#1f1912' },
  cardBorderColor: { type: String, default: '#cccccc' },
  buttonTextColor: { type: String, default: '#ffffff' },
  categoriesBgColor: { type: String, default: '#ffffff' },

  logoUrl: { type: String, default: '' },
  bannerUrl: { type: String, default: '' },
  heroBgUrl: { type: String, default: '' },
  heroVideoUrl: { type: String, default: '' },
  expiryDate: { type: String, default: '' },                     
  subscriptionStatus: { type: String, default: 'active' }  
});

const ItemSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  name_en: { type: String, default: '' },
  price: { type: String, default: '' },
  description: { type: String, default: '' },
  description_en: { type: String, default: '' },
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

function formatFileToBase64(file) {
  if (!file) return null;
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('حجم الملف كبير جداً. الحد الأقصى المسموح هو 25 ميجابايت.');
  }
  const b64 = Buffer.from(file.buffer).toString('base64');
  return `data:${file.mimetype};base64,${b64}`;
}

// --- API ROUTE FOR ADMIN LOGIN ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "admin123") {
    res.json({ success: true, message: "تم تسجيل دخول المشرف بنجاح", token: "admin-token-xyz" });
  } else {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  }
});

// --- API ROUTE FOR RESTAURANT LOGIN ---
app.post('/api/restaurant-login', (req, res) => {
  const { username, password } = req.body;
  if (username === "restaurant" && password === "rest123") {
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
      restaurantName, restaurantTagline, tagline, 
      welcomeText, subTitle, 
      primaryColor, secondaryColor, cardBgColor, textColor,
      headerBgColor, headingColor, brandTitleColor, descriptionColor, cardBorderColor, buttonTextColor,
      categoriesBgColor, expiryDate, subscriptionStatus
    } = req.body;

    // التقاط الحقول الإنجليزية بغض النظر عن طريقة إرسالها (شرطة سفلية أو وسطى)
    const welcomeTextEnVal = req.body.welcomeText_en || req.body['welcomeText-en'];
    const subTitleEnVal = req.body.subTitle_en || req.body['subTitle-en'];

    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    if (restaurantName !== undefined) settings.restaurantName = restaurantName;
    const finalTagline = restaurantTagline !== undefined ? restaurantTagline : tagline;
    if (finalTagline !== undefined) settings.restaurantTagline = finalTagline;

    // حفظ النصوص باللغتين
    if (welcomeText !== undefined) settings.welcomeText = welcomeText;
    if (welcomeTextEnVal !== undefined) settings.welcomeText_en = welcomeTextEnVal;
    if (subTitle !== undefined) settings.subTitle = subTitle;
    if (subTitleEnVal !== undefined) settings.subTitle_en = subTitleEnVal;

    if (primaryColor) settings.primaryColor = primaryColor;
    if (secondaryColor) settings.secondaryColor = secondaryColor;
    if (cardBgColor) settings.cardBgColor = cardBgColor;
    if (textColor) settings.textColor = textColor;
    if (headerBgColor) settings.headerBgColor = headerBgColor;
    if (headingColor) settings.headingColor = headingColor;
    if (brandTitleColor) settings.brandTitleColor = brandTitleColor;
    if (descriptionColor) settings.descriptionColor = descriptionColor;
    if (cardBorderColor) settings.cardBorderColor = cardBorderColor;
    if (buttonTextColor) settings.buttonTextColor = buttonTextColor;
    if (categoriesBgColor) settings.categoriesBgColor = categoriesBgColor;

    if (expiryDate !== undefined) settings.expiryDate = expiryDate;
    if (subscriptionStatus !== undefined) settings.subscriptionStatus = subscriptionStatus;

    if (req.files) {
      if (req.files['logo'] && req.files['logo'][0]) settings.logoUrl = formatFileToBase64(req.files['logo'][0]);
      if (req.files['banner'] && req.files['banner'][0]) settings.bannerUrl = formatFileToBase64(req.files['banner'][0]);
      if (req.files['heroBg'] && req.files['heroBg'][0]) settings.heroBgUrl = formatFileToBase64(req.files['heroBg'][0]);
      if (req.files['heroVideo'] && req.files['heroVideo'][0]) settings.heroVideoUrl = formatFileToBase64(req.files['heroVideo'][0]);
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error("Error saving settings:", err);
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
    const { name, name_en, price, description, description_en } = req.body;
    const imageUrl = formatFileToBase64(req.file) || '';
    const category = await Category.findById(req.params.catId);
    if (!category) return res.status(404).json({ error: 'القسم غير موجود' });

    category.items.push({ 
      name: name || '', 
      name_en: name_en || '', 
      price: price || '', 
      description: description || '', 
      description_en: description_en || '', 
      image: imageUrl 
    });
    await category.save();
    return res.status(201).json(category);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:catId/items/:itemId', upload.single('image'), async (req, res) => {
  try {
    const { name, name_en, price, description, description_en } = req.body;
    const category = await Category.findById(req.params.catId);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    const item = category.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.name = name;
    item.name_en = name_en;
    item.price = price;
    item.description = description;
    item.description_en = description_en;

    if (req.file) {
      item.image = formatFileToBase64(req.file);
    }

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

// --- API ROUTE FOR FEEDBACK & TELEGRAM NOTIFICATION ---
app.post('/api/feedback', (req, res) => {
  try {
    const { staff, service, cleanliness, experience, phone, comment } = req.body;

    const emojisMap = { '1': '😫', '2': '🙁', '3': '😊', '4': '😁', '5': '🤩' };
    const expEmoji = emojisMap[String(experience)] || '❓';

    const message = `⭐ تقييم جديد للمطعم (YRmenu):\n` +
                    `----------------------------------\n` +
                    `👨‍🍳 طاقم العمل: ${staff || 0}/5 نجوم\n` +
                    `🛎️ الخدمة: ${service || 0}/5 نجوم\n` +
                    `✨ النظافة: ${cleanliness || 0}/5 نجوم\n` +
                    `💬 التجربة العامة: ${expEmoji}\n` +
                    `📱 الهاتف: ${phone || 'لم يُذكر'}\n` +
                    `📝 الملاحظات: ${comment || 'لا توجد ملاحظات'}`;

    const BOT_TOKEN = '8912632300:AAHrAWxIEwWQfoxM4wY6pO5SqZA_NvfUmLg';
    const CHAT_ID = '152837530';

    const data = JSON.stringify({
      chat_id: CHAT_ID,
      text: message
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const telegramReq = https.request(options, (telegramRes) => {
      let responseBody = '';
      telegramRes.on('data', (chunk) => {
        responseBody += chunk;
      });
      telegramRes.on('end', () => {
        console.log('Telegram API Response:', responseBody);
        res.status(200).json({ success: true, message: 'Feedback sent successfully' });
      });
    });

    telegramReq.on('error', (error) => {
      console.error('Telegram Request Error:', error);
      res.status(500).json({ success: false, error: error.message });
    });

    telegramReq.write(data);
    telegramReq.end();

  } catch (err) {
    console.error('Server Catch Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));