require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// إعدادات خادم الملفات الثابتة (Public Directory)
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

// دالة البذر (Seed Database) لإضافة بيانات YRmenu الأولية
const seedDatabase = async () => {
  try {
    await MenuItem.deleteMany({}); // مسح البيانات القديمة لضمان عدم التكرار
    
    await MenuItem.create([
      {
        category: "المشروبات الساخنة",
        items: [
          {
            name: "اسبريسو",
            description: "قهوة مركزة غنية بالطعم",
            price: 3000,
            image: "images/espresso.jpg"
          },
          {
            name: "كابتشينو",
            description: "اسبريسو مع حليب مبخر ورغوة غنية",
            price: 4500,
            image: "images/cappuccino.jpg"
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
            image: "images/waffle.jpg"
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

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ تم الاتصال بـ MongoDB Atlas بنجاح');
    await seedDatabase(); // تشغيل البذر فور الاتصال بالداتابيز
  })
  .catch((err) => {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err);
  });

// API Route - جلب المنيو بالكامل
app.get('/api/menu', async (req, res) => {
  try {
    const menuData = await MenuItem.find({});
    res.status(200).json(menuData);
  } catch (error) {
    console.error('❌ خطأ في جلب بيانات المنيو:', error);
    res.status(500).json({ message: 'حدث خطأ في السيرفر أثناء جلب البيانات' });
  }
});

// Route لتشغيل الصفحة الرئيسية
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل حالياً على Port: ${PORT}`);
});