require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// رابط الاتصال بقاعدة البيانات
const dbURI = process.env.MONGO_URI || "mongodb+srv://rafilihab_db_user:iOsatFqoINY1g5Jp@cluster0.je5q3pg.mongodb.net/menuDB?retryWrites=true&w=majority&appName=Cluster0";

// الاتصال بقاعدة البيانات
mongoose.connect(dbURI)
  .then(() => console.log('✅ تم الاتصال بقاعدة بيانات MongoDB بنجاح!'))
  .catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

// هيكل بيانات المنيو (Schema)
const menuItemSchema = new mongoose.Schema({
  name: String,
  desc: String,
  price: String,
  image: String
});

const categorySchema = new mongoose.Schema({
  name: String,
  items: [menuItemSchema]
});

const restaurantSchema = new mongoose.Schema({
  restaurantName: String,
  categories: [categorySchema]
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

// جلب بيانات المنيو أو إضافة بيانات افتراضية
app.get('/api/menu', async (req, res) => {
  try {
    let restaurant = await Restaurant.findOne();

    if (!restaurant) {
      restaurant = await Restaurant.create({
        restaurantName: "نوفارة كافيه - Nawfara Cafe",
        categories: [
          {
            name: "المشروبات الساخنة",
            items: [
              { name: "اسبريسو", desc: "قهوة مركزة غنية بالطعمة", price: "3,000 د.ع", image: "https://via.placeholder.com/80" },
              { name: "كابتشينو", desc: "اسبريسو مع حليب مبخر ورغوة غنية", price: "4,500 د.ع", image: "https://via.placeholder.com/80" }
            ]
          },
          {
            name: "الحلويات",
            items: [
              { name: "وافل شوكولاتة", desc: "وافل طازج مع نوتيلا وفواكه", price: "6,000 د.ع", image: "https://via.placeholder.com/80" }
            ]
          }
        ]
      });
      console.log('📌 تم إنشاء منيو تجريبي في قاعدة البيانات لأول مرة');
    }

    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ في جلب البيانات' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 السيرفر شغال على: http://localhost:${PORT}`);
});