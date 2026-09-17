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
    console.error("❌ خطأ في إضافة البيانات:", err);
  }
};