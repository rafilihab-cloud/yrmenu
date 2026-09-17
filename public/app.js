// 1. قاموس الترجمة الفوري للكلمات والأقسام والمنتجات
const dictionary = {
  // الأقسام
  "الوجبات الرئيسية": "Main Meals",
  "المشروبات": "Drinks",
  
  // المنتجات
  "تشيكن برجر": "Chicken Burger",
  "كلاسيك برجر": "Classic Burger",
  "د.ع": "IQD",

  // نصوص الواجهة الثابتة
  "المنيو": "Menu",
  "تقييم": "Feedback"
};

const translations = {
  ar: { menuBtn: "المنيو", feedbackBtn: "تقييم", defaultMenuTitle: "المنيو" },
  en: { menuBtn: "Menu", feedbackBtn: "Feedback", defaultMenuTitle: "Menu" }
};

let currentLang = localStorage.getItem('menu_lang') || 'ar';
let menuCategoriesData = [];

document.addEventListener('DOMContentLoaded', () => {
  currentLang = localStorage.getItem('menu_lang') || 'ar';
  applyLanguage(currentLang);
  setupLanguageDropdown();

  const menuContainer = document.getElementById('menu-container');
  if (menuContainer) {
    fetchMenuData();
  }
});

function applyLanguage(lang) {
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;

  const menuBtnText = document.getElementById('menu-btn-text');
  if (menuBtnText) menuBtnText.textContent = translations[lang].menuBtn;

  const feedbackBtnText = document.getElementById('feedback-btn-text');
  if (feedbackBtnText) feedbackBtnText.textContent = translations[lang].feedbackBtn;

  const titleElem = document.getElementById('current-category-title');
  if (titleElem && (!menuCategoriesData || menuCategoriesData.length === 0)) {
    titleElem.textContent = translations[lang].defaultMenuTitle;
  }
}

function setupLanguageDropdown() {
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.onchange = (e) => {
      currentLang = e.target.value;
      localStorage.setItem('menu_lang', currentLang);
      applyLanguage(currentLang);
    };
  }
}

async function fetchMenuData() {
  try {
    const response = await fetch('/api/menu');
    const data = await response.json();

    if (Array.isArray(data)) menuCategoriesData = data;
    else if (Array.isArray(data.categories)) menuCategoriesData = data.categories;
    else if (Array.isArray(data.data)) menuCategoriesData = data.data;
    else menuCategoriesData = [];

    const categoriesNav = document.getElementById('categories-nav');
    if (categoriesNav) renderCategoriesNav(menuCategoriesData, categoriesNav);
    if (menuCategoriesData.length > 0) displayCategoryItems(0);
  } catch (error) {
    console.error('Error loading menu:', error);
  }
}

// دالة الترجمة التلقائية: تفحص الحقل الإنجليزي أولاً، ثم القاموس، ثم النص الأصلي
function translateText(originalText, enField) {
  if (currentLang === 'en') {
    if (enField) return enField;
    if (dictionary[originalText]) return dictionary[originalText];
  }
  return originalText || '';
}

function renderCategoriesNav(categories, container) {
  container.innerHTML = '';
  if (!Array.isArray(categories)) return;

  categories.forEach((cat, index) => {
    const btn = document.createElement('button');
    btn.className = `category-item ${index === 0 ? 'active' : ''}`;
    btn.dataset.index = index;

    btn.textContent = translateText(cat.name, cat.name_en);

    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      displayCategoryItems(index);
    });

    container.appendChild(btn);
  });
}

function displayCategoryItems(categoryIndex) {
  const container = document.getElementById('menu-container');
  const titleElem = document.getElementById('current-category-title');
  const category = menuCategoriesData[categoryIndex];

  if (!category) return;

  if (titleElem) {
    titleElem.textContent = translateText(category.name, category.name_en);
  }

  container.innerHTML = '';
  const items = category.items || [];

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const itemName = translateText(item.name, item.name_en);
    const itemDesc = translateText(item.description, item.description_en);
    const itemPrice = translateText(item.price, null);

    card.innerHTML = `
      <div class="product-info">
        <h3 class="product-name">${itemName}</h3>
        <p class="product-description">${itemDesc}</p>
        <span class="product-price">${itemPrice}</span>
      </div>
      ${item.image ? `<img src="${item.image}" alt="${itemName}" class="product-image">` : ''}
    `;

    container.appendChild(card);
  });
}