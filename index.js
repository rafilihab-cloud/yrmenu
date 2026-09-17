require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// إعدادات خادم الملفات الثابتة
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Schema & Model لقائمة الطعام
const menuItemSchema = new mongoose.Schema({
  category: { type: String, required: true },
  items: [
    {
      name: { type: String, required: true },
      description: String,
      price: { type: Number, required: true },
      image: String
    }
  ]
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// دالة البذر (Seed Database)
const seedDatabase = async () => {
  try {
    await MenuItem.deleteMany({});
    
    await MenuItem.create([
      {
        category: "المشروبات الساخنة",
        items: [
          {
            name: "اسبريسو",
            description: "قهوة مركزة غنية بالطعم",
            price: 3000,
            image: "https://placehold.co/150x150/0f172a/ffffff?text=Espresso"
          },
          {
            name: "كابتشينو",
            description: "اسبريسو مع حليب مبخر ورغوة غنية",
            price: 4500,
            image: "https://placehold.co/150x150/0f172a/ffffff?text=Cappuccino"
          }
        ]
      },
      {
        category: "الحلويات",
        items: [
          {
            name: "وافل شوكولاتة",
            description: "وافل طازج مع نوتيلا وفواكه",
            price: 6000,
            image: "https://placehold.co/150x150/0f172a/ffffff?text=Waffle"
          }
        ]
      }
    ]);

    console.log("✅ تم تحديث بيانات المنيو بنجاح لـ YRmenu");
  } catch (err) {
    console.error("❌ خطأ أثناء تعبئة قاعدة البيانات:", err);
  }
};

// الاتصال بقاعدة البيانات MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(async () => {
      console.log('✅ تم الاتصال بـ MongoDB Atlas بنجاح');
      await seedDatabase();
    })
    .catch((err) => {
      console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err);
    });
} else {
  console.warn('⚠️ لم يتم العثور على متغير MONGO_URI في البيئة.');
}

// API Route - جلب المنيو
app.get('/api/menu', async (req, res) => {
  try {
    const menuData = await MenuItem.find({});
    res.status(200).json(menuData);
  } catch (error) {
    console.error('❌ خطأ في جلب بيانات المنيو:', error);
    res.status(500).json({ message: 'حدث خطأ في السيرفر أثناء جلب البيانات' });
  }
});

// المسار الشامل المصلح (Catch-All Route) المعالج لخطأ Routing
app.get('*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل حالياً على Port: ${PORT}`);
});