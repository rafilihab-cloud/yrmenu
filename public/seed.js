const mongoose = require('mongoose');
require('dotenv').config();

// الاتصال بقاعدة البيانات باستخدام الرابط الموجود في .env أو الرابط المحلي
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yrmenu';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Connection error:', err));

const itemSchema = new mongoose.Schema({
  name: String,
  name_en: String,
  description: String,
  description_en: String,
  price: String,
  image: String
});

const categorySchema = new mongoose.Schema({
  name: String,
  name_en: String,
  items: [itemSchema]
});

// تأكد من مطابقة اسم الـ Collection لديك
const Category = mongoose.model('Category', categorySchema);

async function updateMenuData() {
  try {
    // 1. تحديث قسم الوجبات الرئيسية والمنتجات العائدة له
    await Category.updateOne(
      { name: "الوجبات الرئيسية" },
      { 
        $set: { 
          name_en: "Main Meals",
          "items.$[item1].name_en": "Chicken Burger",
          "items.$[item1].description_en": "Crispy chicken with special sauce",
          "items.$[item2].name_en": "Classic Burger",
          "items.$[item2].description_en": "Fresh beef with lettuce and tomato"
        } 
      },
      {
        arrayFilters: [
          { "item1.name": "تشيكن برجر" },
          { "item2.name": "كلاسيك برجر" }
        ]
      }
    );

    // 2. تحديث قسم المشروبات
    await Category.updateOne(
      { name: "المشروبات" },
      { $set: { name_en: "Drinks" } }
    );

    console.log("✅ تم تحديث بيانات المنيو باللغة الإنجليزية بنجاح!");
  } catch (error) {
    console.error("❌ حدث خطأ أثناء التحديث:", error);
  } finally {
    mongoose.connection.close();
  }
}

updateMenuData();