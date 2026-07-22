async function renderProductDetail() {
  const container = document.getElementById('product-detail');
  if (!container) return;

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    container.innerHTML = '<div class="empty-state"><p>No product selected.</p><a class="btn btn-primary" href="shop.html">Back to Shop</a></div>';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error('not found');
    const product = await res.json();

    const off = product.mrp > product.price
      ? Math.round(100 - (product.price / product.mrp) * 100)
      : 0;

    container.innerHTML = `
      <div class="split" style="align-items:flex-start">
        <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/560x700/4a0e18/f5e6c8?text=Varahi+Fashions'">
        <div>
          <span class="eyebrow">${product.category}</span>
          <h1 style="margin:8px 0 12px">${product.name}</h1>
          <div class="price-row" style="margin-bottom:14px">
            <span class="price-now" style="font-size:1.4rem">${formatINR(product.price)}</span>
            ${product.mrp > product.price ? `<span class="price-mrp">${formatINR(product.mrp)}</span>` : ''}
            ${off ? `<span class="price-off">${off}% off</span>` : ''}
          </div>
          <p style="color:var(--ink-soft);line-height:1.7">${product.description}</p>
          <ul style="margin:18px 0;font-size:0.9rem;color:var(--ink-soft);line-height:1.8">
            <li><strong>Fabric:</strong> ${product.fabric || '—'}</li>
            <li><strong>Colors:</strong> ${(product.colors || []).join(', ') || '—'}</li>
            <li><strong>Availability:</strong> ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</li>
          </ul>
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
            <div class="qty-control">
              <button id="qty-minus">−</button>
              <span id="qty-value">1</span>
              <button id="qty-plus">+</button>
            </div>
            <button id="add-to-cart-btn" class="btn btn-primary">Add to Cart</button>
          </div>
          <a class="btn btn-whatsapp js-whatsapp-link" data-message="Hello Varahi Fashions, I'm interested in: ${product.name} (${formatINR(product.price)})." href="#">💬 Order this on WhatsApp</a>
        </div>
      </div>`;

    let qty = 1;
    const qtyEl = container.querySelector('#qty-value');
    container.querySelector('#qty-minus').addEventListener('click', () => {
      qty = Math.max(1, qty - 1);
      qtyEl.textContent = qty;
    });
    container.querySelector('#qty-plus').addEventListener('click', () => {
      qty += 1;
      qtyEl.textContent = qty;
    });
    container.querySelector('#add-to-cart-btn').addEventListener('click', (e) => {
      CartStore.addItem(product, qty);
      e.target.textContent = 'Added to Cart ✓';
      setTimeout(() => (e.target.textContent = 'Add to Cart'), 1400);
    });

    wireWhatsappLinks();
    renderRecommendations(product);
  } catch (e) {
    container.innerHTML = '<div class="empty-state"><p>Sorry, we could not find this saree.</p><a class="btn btn-primary" href="shop.html">Back to Shop</a></div>';
  }
}

async function renderRecommendations(currentProduct) {
  const section = document.getElementById('recommend-section');
  const grid = document.getElementById('recommend-grid');
  if (!section || !grid) return;

  try {
    let related = await fetchProducts({ category: currentProduct.category });
    related = related.filter((p) => p.id !== currentProduct.id);

    if (!related.length) {
      // Fall back to featured sarees so the section is never empty.
      related = (await fetchProducts({ featured: 'true' })).filter((p) => p.id !== currentProduct.id);
    }
    if (!related.length) return;

    related = related.slice(0, 8);
    grid.innerHTML = related.map(productCardHTML).join('');
    wireAddToCartButtons(grid, related);
    wireWishlistButtons(grid);
    section.style.display = '';
  } catch (e) {
    /* silently skip recommendations if the API call fails */
  }
}

document.addEventListener('DOMContentLoaded', renderProductDetail);
