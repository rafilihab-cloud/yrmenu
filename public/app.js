document.addEventListener('DOMContentLoaded', () => {
  fetchMenuData();
});

async function fetchMenuData() {
  const menuContainer = document.getElementById('menu-container');
  const categoriesNav = document.getElementById('categories-nav');

  try {
    const response = await fetch('/api/menu');
    if (!response.ok) throw new Error('فشل جلب البيانات');

    let data = await response.json();

    if (!data || (Array.isArray(data) && data.length === 0)) {
      menuContainer.innerHTML = '<div class="loading-state">لا تتوفر عناصر حالياً.</div>';
      return;
    }

    // تحويل البيانات لشكل موحد (أقسام ووجبات)
    let formattedData = normalizeData(data);

    renderCategoriesNav(formattedData, categoriesNav);
    renderMenuItems(formattedData, menuContainer);

  } catch (error) {
    console.error('Error loading menu:', error);
    menuContainer.innerHTML = '<div class="loading-state">حدث خطأ أثناء تحميل المنيو.</div>';
  }
}

// دالة لتنظيم شكل البيانات مهما كان مصدرها
function normalizeData(data) {
  if (!Array.isArray(data)) data = [data];

  // إذا كانت البيانات تحتوي مباشرة على حقل category و items
  if (data[0] && data[0].category && Array.isArray(data[0].items)) {
    return data;
  }

  // إذا كانت البيانات عبارة عن قائمة وجبات مباشرة منفصلة
  const categoriesMap = {};

  data.forEach(item => {
    const catName = item.category || 'القائمة الرئيسية';
    if (!categoriesMap[catName]) {
      categoriesMap[catName] = [];
    }
    categoriesMap[catName].push(item);
  });

  return Object.keys(categoriesMap).map(catName => ({
    category: catName,
    items: categoriesMap[catName]
  }));
}

function renderCategoriesNav(categories, container) {
  container.innerHTML = '';

  categories.forEach((cat, index) => {
    const btn = document.createElement('button');
    btn.className = `category-btn ${index === 0 ? 'active' : ''}`;
    btn.textContent = cat.category;
    btn.onclick = () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetSection = document.getElementById(`cat-${index}`);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    container.appendChild(btn);
  });
}

function renderMenuItems(categories, container) {
  container.innerHTML = '';

  categories.forEach((cat, index) => {
    const categorySection = document.createElement('section');
    categorySection.id = `cat-${index}`;

    const title = document.createElement('h2');
    title.className = 'category-title';
    title.textContent = cat.category;
    categorySection.appendChild(title);

    if (Array.isArray(cat.items)) {
      cat.items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';

        const fallbackImg = 'https://placehold.co/150x150/0f172a/ffffff?text=YRmenu';
        const imageSrc = item.image || fallbackImg;

        card.innerHTML = `
          <div class="item-details">
            <h3 class="item-title">${item.name || 'بدون اسم'}</h3>
            <p class="item-description">${item.description || ''}</p>
            <span class="item-price">${Number(item.price || 0).toLocaleString('ar-IQ')} د.ع</span>
          </div>
          <img src="${imageSrc}" alt="${item.name}" class="item-image" onerror="this.onerror=null; this.src='${fallbackImg}';">
        `;

        categorySection.appendChild(card);
      });
    }

    container.appendChild(categorySection);
  });
}