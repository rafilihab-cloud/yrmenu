// 1. قاموس الترجمة الفوري للكلمات والأقسام والمنتجات
const dictionary = {
  // الأقسام
  "الوجبات الرئيسية": "Main Meals",
  "المشروبات": "Drinks",
  "مشروبات الطاقة": "Energy Drinks",
  "قهوة اختصاص": "Specialty Coffee",
  
  // نصوص الواجهة الثابتة
  "المنيو": "Menu",
  "تقييم": "Feedback",
  "د.ع": "IQD"
};

const translations = {
  ar: { menuBtn: "المنيو", feedbackBtn: "تقييم", defaultMenuTitle: "المنيو" },
  en: { menuBtn: "Menu", feedbackBtn: "Feedback", defaultMenuTitle: "Menu" }
};

// توحيد مفتاح اللغة مع صفحة index.html
const LANG_STORAGE_KEY = 'selectedLang';

let currentLang = localStorage.getItem(LANG_STORAGE_KEY) || 'ar';
let menuCategoriesData = [];
let activeCategoryIndex = 0;
let restaurantSettings = {}; // تخزين إعدادات المطعم والوصف الفرعي

// استخراج معامل المطعم (Slug) من الرابط الحالي مثل ?res=al-baik
const urlParams = new URLSearchParams(window.location.search);
const currentRestaurantSlug = urlParams.get('res') || '';

document.addEventListener('DOMContentLoaded', () => {
  currentLang = localStorage.getItem(LANG_STORAGE_KEY) || 'ar';
  
  applyLanguage(currentLang);
  setupLanguageDropdown();
  fetchSettings(); // جلب إعدادات المظهر والاسم والوصف الفرعي للمطعم الحالي

  const menuContainer = document.getElementById('menu-container');
  if (menuContainer) {
    fetchMenuData();
  }
});

// دالة جلب إعدادات المظهر وتحديث اسم المطعم والوصف الفرعي والتحقق من حالة الاشتراك
async function fetchSettings() {
  try {
    const queryParam = currentRestaurantSlug ? `?res=${currentRestaurantSlug}&t=${new Date().getTime()}` : `?t=${new Date().getTime()}`;
    const response = await fetch(`/api/settings${queryParam}`);
    if (response.ok) {
      restaurantSettings = await response.json();
      
      // التحقق من حالة الاشتراك وتاريخ الانتهاء
      if (checkSubscriptionExpired(restaurantSettings)) {
        showSubscriptionExpiredOverlay();
        return;
      }
      
      applySettingsToUI();
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// دالة التحقق من انتهاء أو تعطيل الاشتراك
function checkSubscriptionExpired(settings) {
  if (!settings) return false;
  
  if (settings.subscriptionStatus === 'disabled') {
    return true;
  }
  
  if (settings.expiryDate) {
    const today = new Date().toISOString().split('T')[0];
    const expiry = settings.expiryDate.split('T')[0];
    if (expiry < today) {
      return true;
    }
  }
  
  return false;
}

// دالة إظهار واجهة توقف الخدمة للزبائن
function showSubscriptionExpiredOverlay() {
  let overlay = document.getElementById('subscription-expired-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'subscription-expired-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #ffffff;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 20px;
      box-sizing: border-box;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    
    const isAr = currentLang === 'ar';
    overlay.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
      <h2 style="color: #c0392b; margin-bottom: 10px; font-size: 24px;">
        ${isAr ? 'الخدمة غير متوفرة حالياً' : 'Service Currently Unavailable'}
      </h2>
      <p style="color: #555; font-size: 16px; max-width: 400px; line-height: 1.6; margin: 0;">
        ${isAr ? 'عفواً، المنيو غير متوفر حالياً. يرجى مراجعة إدارة المطعم.' : 'Sorry, the menu is currently unavailable. Please contact management.'}
      </p>
    `;
    document.body.appendChild(overlay);
  } else {
    overlay.style.display = 'flex';
  }
}

// دالة تطبيق البيانات على عناصر الواجهة
function applySettingsToUI() {
  const resNameElem = document.getElementById('restaurant-name') || document.getElementById('res-name-display') || document.getElementById('brand-title');
  if (resNameElem && restaurantSettings.restaurantName) {
    resNameElem.textContent = restaurantSettings.restaurantName;
  }

  const taglineElem = document.getElementById('restaurant-subtitle') || 
                      document.getElementById('restaurant-tagline') || 
                      document.getElementById('brand-tagline');
  
  const taglineValue = restaurantSettings.restaurantTagline || 
                       restaurantSettings.restaurantSubtitle || 
                       restaurantSettings.tagline || '';
                       
  if (taglineElem) {
    taglineElem.textContent = taglineValue;
  }
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem(LANG_STORAGE_KEY, lang);

  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;

  const menuBtnText = document.getElementById('menu-btn-text');
  if (menuBtnText) menuBtnText.textContent = translations[lang]?.menuBtn || 'Menu';

  const feedbackBtnText = document.getElementById('feedback-btn-text');
  if (feedbackBtnText) feedbackBtnText.textContent = translations[lang]?.feedbackBtn || 'Feedback';

  if (menuCategoriesData && menuCategoriesData.length > 0) {
    const categoriesNav = document.getElementById('categories-nav');
    if (categoriesNav) renderCategoriesNav(menuCategoriesData, categoriesNav);
    displayCategoryItems(activeCategoryIndex);
  }

  applySettingsToUI();
}

function setupLanguageDropdown() {
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.onchange = (e) => {
      applyLanguage(e.target.value);
    };
  }
}

async function fetchMenuData() {
  try {
    const queryParam = currentRestaurantSlug ? `?res=${currentRestaurantSlug}` : '';
    const response = await fetch(`/api/menu${queryParam}`);
    const data = await response.json();

    if (Array.isArray(data)) menuCategoriesData = data;
    else if (Array.isArray(data.categories)) menuCategoriesData = data.categories;
    else if (Array.isArray(data.data)) menuCategoriesData = data.data;
    else menuCategoriesData = [];

    const categoriesNav = document.getElementById('categories-nav');
    if (categoriesNav) renderCategoriesNav(menuCategoriesData, categoriesNav);
    
    if (menuCategoriesData.length > 0) {
      displayCategoryItems(0);
    }
  } catch (error) {
    console.error('Error loading menu:', error);
  }
}

function translateText(originalText, enField) {
  if (!originalText) return '';
  
  if (currentLang === 'en') {
    if (enField && enField.trim() !== '') return enField;
    if (dictionary[originalText]) return dictionary[originalText];
  }
  
  return originalText;
}

function renderCategoriesNav(categories, container) {
  container.innerHTML = '';
  if (!Array.isArray(categories)) return;

  let indicator = container.querySelector('#category-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'nav-active-indicator';
    indicator.id = 'category-indicator';
    container.appendChild(indicator);
  }

  categories.forEach((cat, index) => {
    const btn = document.createElement('button');
    const isActive = index === activeCategoryIndex;
    btn.className = `category-btn ${isActive ? 'active' : ''}`;
    btn.dataset.index = index;
    if (cat.id || cat._id) btn.dataset.id = cat.id || cat._id;

    const catName = translateText(cat.name || cat.name_ar || cat.title, cat.name_en);
    btn.textContent = catName;

    btn.addEventListener('click', () => {
      activeCategoryIndex = index;
      
      container.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const offsetLeft = btn.offsetLeft;
      const btnWidth = btn.offsetWidth;
      indicator.style.width = `${btnWidth}px`;
      indicator.style.transform = `translateX(${offsetLeft}px)`;

      const scrollLeftPosition = offsetLeft - (container.clientWidth / 2) + (btnWidth / 2);
      container.scrollTo({
        left: scrollLeftPosition,
        behavior: 'smooth'
      });

      displayCategoryItems(index);
    });

    container.appendChild(btn);
  });

  setTimeout(() => {
    const activeBtn = container.querySelector('.category-btn.active') || container.querySelector('.category-btn');
    if (activeBtn && indicator) {
      const offsetLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      indicator.style.width = `${btnWidth}px`;
      indicator.style.transform = `translateX(${offsetLeft}px)`;
    }
  }, 100);
}

function displayCategoryItems(categoryIndex) {
  activeCategoryIndex = categoryIndex;
  const container = document.getElementById('menu-container');
  const titleElem = document.getElementById('current-category-title');
  const category = menuCategoriesData[categoryIndex];

  if (!category) return;

  if (titleElem) {
    const catTitle = translateText(category.name || category.name_ar || category.title, category.name_en);
    titleElem.textContent = catTitle;
  }

  container.innerHTML = '';
  const items = category.items || category.products || [];

  items.forEach((item, itemIdx) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.style.setProperty('--stagger-delay', `${itemIdx * 0.05}s`);

    const itemName = translateText(item.name || item.title || item.name_ar, item.name_en);
    const itemDesc = translateText(item.description || item.desc || item.description_ar, item.description_en);
    const itemPrice = item.price ? `${item.price}` : '';

    let cardContent = `
      <div class="product-info">
        <h3 class="product-name">${itemName}</h3>
        ${itemDesc ? `<p class="product-description">${itemDesc}</p>` : ''}
        ${itemPrice ? `<span class="product-price">${itemPrice}</span>` : ''}
      </div>
    `;

    const imgUrl = item.image || item.imageUrl;
    if (imgUrl) {
      cardContent += `<img src="${imgUrl}" alt="${itemName}" class="product-image">`;
    }

    card.innerHTML = cardContent;

    card.addEventListener('click', () => {
      if (typeof window.openProductModal === 'function') {
        window.openProductModal({
          name: itemName,
          description: itemDesc,
          price: itemPrice,
          image: imgUrl,
          ingredients: item.ingredients || []
        });
      }
    });

    container.appendChild(card);
  });
}