const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// الميدلوير لمعالجة بيانات JSON والملفات الاستاتيكية
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// بيانات المنيو التجريبية (يمكن استبدالها لاحقاً بالاتصال بقاعدة البيانات)
const sampleMenu = [
  {
    category: "المشروبات الساخنة",
    items: [
      {
        name: "إسبريسو",
        description: "قهوة إسبريسو مركزة وغنية بالطعم",
        price: 3000,
        image: "https://placehold.co/150x150/0f172a/ffffff?text=Espresso"
      },
      {
        name: "كابتشينو",
        description: "إسبريسو مع حليب مبخر ورغوة غنية",
        price: 4500,
        image: "https://placehold.co/150x150/0f172a/ffffff?text=Cappuccino"
      }
    ]
  },
  {
    category: "المشروبات الباردة",
    items: [
      {
        name: "آيس لاتيه",
        description: "إسبريسو بارد مع الحليب والثلج",
        price: 5000,
        image: "https://placehold.co/150x150/0f172a/ffffff?text=Iced+Latte"
      },
      {
        name: "موهيتو ليمون ونعناع",
        description: "مشروب منعش بالليمون والنعناع والثلج",
        price: 4000,
        image: "https://placehold.co/150x150/0f172a/ffffff?text=Mojito"
      }
    ]
  },
  {
    category: "الحلويات",
    items: [
      {
        name: "تشيز كيك",
        description: "تشيز كيك كلاسيكي مع صوص التوت",
        price: 6000,
        image: "https://placehold.co/150x150/0f172a/ffffff?text=Cheesecake"
      }
    ]
  }
];

// مسار API لجلب المنيو
app.get('/api/menu', (req, res) => {
  res.json(sampleMenu);
});

// المسار الشامل المصلح المتوافق مع الإصدارات الحديثة
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});