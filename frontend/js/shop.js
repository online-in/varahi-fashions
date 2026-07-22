/* Renders product cards on the home page's featured grid and the shop
   page's filterable grid. Both pull from GET /api/products. */

const Wishlist = {
  KEY: 'varahi_wishlist',
  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch (e) { return []; }
  },
  has(id) { return this.get().includes(id); },
  toggle(id) {
    const list = this.get();
    const idx = list.indexOf(id);
    if (idx === -1) list.push(id); else list.splice(idx, 1);
    localStorage.setItem(this.KEY, JSON.stringify(list));
    return idx === -1;
  },
};

function productCardHTML(product) {
  const off = product.mrp > product.price
    ? Math.round(100 - (product.price / product.mrp) * 100)
    : 0;
  const img = product.image || 'images/product-placeholder-1.jpg';
  const wished = Wishlist.has(product.id);
  return `
    <div class="product-card">
      <a class="product-thumb" href="product.html?id=${product.id}">
        ${off ? `<span class="product-tag">${off}% OFF</span>` : ''}
        <img src="${img}" alt="${product.name}" loading="lazy" decoding="async" onerror="this.src='https://placehold.co/300x400/4a0e18/f5e6c8?text=Varahi+Fashions'">
      </a>
      <button class="wishlist-btn js-wishlist${wished ? ' active' : ''}" data-id="${product.id}" aria-label="Save to wishlist">${wished ? '♥' : '♡'}</button>
      <div class="product-info">
        <span class="product-meta">${product.category} · ${product.fabric || ''}</span>
        <h4><a href="product.html?id=${product.id}">${product.name}</a></h4>
        <div class="price-row">
          <span class="price-now">${formatINR(product.price)}</span>
          ${product.mrp > product.price ? `<span class="price-mrp">${formatINR(product.mrp)}</span>` : ''}
          ${off ? `<span class="price-off">${off}% off</span>` : ''}
        </div>
        <div class="product-actions">
          <button class="btn btn-primary btn-sm js-add-cart" data-id="${product.id}">Add to Cart</button>
          <a class="btn btn-outline btn-sm" href="product.html?id=${product.id}">View</a>
        </div>
      </div>
    </div>`;
}

function wireWishlistButtons(container) {
  container.querySelectorAll('.js-wishlist').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      const nowWished = Wishlist.toggle(id);
      btn.classList.toggle('active', nowWished);
      btn.textContent = nowWished ? '♥' : '♡';
    });
  });
}

async function fetchProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/products${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}

function wireAddToCartButtons(container, products) {
  container.querySelectorAll('.js-add-cart').forEach((btn) => {
    btn.addEventListener('click', () => {
      const product = products.find((p) => p.id === Number(btn.dataset.id));
      if (!product) return;
      CartStore.addItem(product, 1);
      btn.textContent = 'Added ✓';
      setTimeout(() => (btn.textContent = 'Add to Cart'), 1200);
    });
  });
}

async function renderFeaturedGrid() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  try {
    const products = await fetchProducts({ featured: 'true' });
    if (!products.length) {
      grid.innerHTML = '<p class="text-center">New arrivals coming soon.</p>';
      return;
    }
    grid.innerHTML = products.map(productCardHTML).join('');
    wireAddToCartButtons(grid, products);
    wireWishlistButtons(grid);
  } catch (e) {
    grid.innerHTML = '<p class="text-center">Could not load products. Please make sure the backend server is running.</p>';
  }
}

async function renderShopGrid() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;

  const urlParams = new URLSearchParams(window.location.search);
  let activeCategory = urlParams.get('category') || 'all';

  const chips = document.querySelectorAll('.filter-chip');
  const searchInput = document.getElementById('shop-search');

  async function load() {
    grid.innerHTML = '<p class="text-center">Loading sarees…</p>';
    try {
      const params = {};
      if (activeCategory && activeCategory !== 'all') params.category = activeCategory;
      if (searchInput && searchInput.value.trim()) params.search = searchInput.value.trim();
      const products = await fetchProducts(params);
      if (!products.length) {
        grid.innerHTML = '<div class="empty-state"><p>No sarees found in this collection yet.</p></div>';
        return;
      }
      grid.innerHTML = products.map(productCardHTML).join('');
      wireAddToCartButtons(grid, products);
      wireWishlistButtons(grid);
    } catch (e) {
      grid.innerHTML = '<p class="text-center">Could not load products. Please make sure the backend server is running (see README).</p>';
    }
  }

  chips.forEach((chip) => {
    if (chip.dataset.category === activeCategory) chip.classList.add('active');
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.dataset.category;
      load();
    });
  });

  if (searchInput) {
    let timer;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(load, 300);
    });
  }

  load();
}

document.addEventListener('DOMContentLoaded', () => {
  renderFeaturedGrid();
  renderShopGrid();
});
