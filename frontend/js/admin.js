const API_BASE = '/api';
const TOKEN_KEY = 'varahi_admin_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

function formatINR(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

// Redirect to login if there's no token. Individual API calls still handle
// 401s below in case the token has expired server-side.
if (!getToken()) {
  window.location.href = 'login.html';
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = 'login.html';
    throw new Error('Session expired');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/* ---------------- Panel navigation ---------------- */
function wirePanelNav() {
  document.querySelectorAll('.js-nav').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.js-nav').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.admin-panel').forEach((p) => (p.style.display = 'none'));
      document.getElementById(`panel-${btn.dataset.panel}`).style.display = 'block';

      if (btn.dataset.panel === 'products') loadProducts();
      if (btn.dataset.panel === 'orders') loadOrders();
      if (btn.dataset.panel === 'coupons') loadCoupons();
      if (btn.dataset.panel === 'messages') loadMessages();
    });
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = 'login.html';
  });
}

/* ---------------- Overview ---------------- */
async function loadOverview() {
  try {
    const [products, orders] = await Promise.all([
      apiFetch('/products'),
      apiFetch('/orders'),
    ]);
    document.getElementById('stat-products').textContent = products.length;
    document.getElementById('stat-orders').textContent = orders.length;
    document.getElementById('stat-pending').textContent = orders.filter((o) => o.status === 'pending').length;
    const revenue = orders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'pending')
      .reduce((sum, o) => sum + o.total, 0);
    document.getElementById('stat-revenue').textContent = formatINR(revenue);

    document.getElementById('overview-recent-orders').innerHTML = orders.slice(0, 6).map((o) => `
      <tr>
        <td>#${o.id}</td>
        <td>${o.customerName}</td>
        <td>${formatINR(o.total)}</td>
        <td><span class="status-pill status-${o.status}">${o.status}</span></td>
        <td>${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
      </tr>`).join('') || '<tr><td colspan="5">No orders yet.</td></tr>';
  } catch (e) { /* handled by apiFetch redirect */ }
}

/* ---------------- Products ---------------- */
let currentProducts = [];

async function loadProducts() {
  const body = document.getElementById('products-table-body');
  try {
    currentProducts = await apiFetch('/products');
    body.innerHTML = currentProducts.map((p) => `
      <tr>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${formatINR(p.price)}</td>
        <td>${p.stock}</td>
        <td>${p.featured ? '⭐ Yes' : 'No'}</td>
        <td>
          <a class="action-link js-edit-product" data-id="${p.id}">Edit</a>
          <a class="action-link danger js-delete-product" data-id="${p.id}">Delete</a>
        </td>
      </tr>`).join('') || '<tr><td colspan="6">No products yet.</td></tr>';

    body.querySelectorAll('.js-edit-product').forEach((el) =>
      el.addEventListener('click', () => openProductModal(Number(el.dataset.id)))
    );
    body.querySelectorAll('.js-delete-product').forEach((el) =>
      el.addEventListener('click', () => deleteProduct(Number(el.dataset.id)))
    );
  } catch (e) { /* redirect already handled */ }
}

function resolveAdminImagePath(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path; // external URL, use as-is
  if (path.startsWith('../')) return path; // already relative to /admin/
  return `../${path}`; // e.g. "images/x.jpg" -> "../images/x.jpg"
}

function updateImagePreview() {
  const path = document.getElementById('p-image').value.trim();
  const preview = document.getElementById('p-image-preview');
  if (path) {
    preview.src = resolveAdminImagePath(path);
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
}

function openProductModal(id = null) {
  const modal = document.getElementById('product-modal');
  const form = document.getElementById('product-form');
  form.reset();
  document.getElementById('product-form-alert').innerHTML = '';
  document.getElementById('p-id').value = '';
  document.getElementById('p-image-upload-status').textContent = '';
  document.getElementById('product-modal-title').textContent = id ? 'Edit Product' : 'Add Product';

  if (id) {
    const p = currentProducts.find((prod) => prod.id === id);
    document.getElementById('p-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-category').value = p.category;
    document.getElementById('p-fabric').value = p.fabric || '';
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-mrp').value = p.mrp;
    document.getElementById('p-stock').value = p.stock;
    document.getElementById('p-featured').value = String(Boolean(p.featured));
    document.getElementById('p-image').value = p.image || '';
    document.getElementById('p-colors').value = (p.colors || []).join(', ');
    document.getElementById('p-description').value = p.description || '';
  }
  updateImagePreview();
  modal.classList.add('open');
}

async function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  try {
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    loadProducts();
  } catch (e) {
    alert(e.message);
  }
}

/* ---------------- Orders ---------------- */
async function loadOrders() {
  const body = document.getElementById('orders-table-body');
  try {
    const orders = await apiFetch('/orders');
    body.innerHTML = orders.map((o) => `
      <tr>
        <td>#${o.id}</td>
        <td>${o.customerName}<br><span class="product-meta">${o.phone}</span></td>
        <td>${o.items.map((i) => `${i.name} x${i.quantity}`).join('<br>')}</td>
        <td>${formatINR(o.total)}</td>
        <td>
          <select class="js-status-select" data-id="${o.id}" style="padding:5px 8px;border-radius:4px;border:1px solid rgba(184,134,11,0.3)">
            ${['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) =>
              `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
        <td>${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
      </tr>`).join('') || '<tr><td colspan="6">No orders yet.</td></tr>';

    body.querySelectorAll('.js-status-select').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          await apiFetch(`/orders/${sel.dataset.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: sel.value }),
          });
        } catch (e) {
          alert(e.message);
        }
      });
    });
  } catch (e) { /* redirect handled */ }
}

/* ---------------- Coupons ---------------- */
async function loadCoupons() {
  const body = document.getElementById('coupons-table-body');
  try {
    const coupons = await apiFetch('/coupons');
    body.innerHTML = coupons.map((c) => `
      <tr>
        <td>${c.code}</td>
        <td>${c.type}</td>
        <td>${c.type === 'percent' ? `${c.value}%` : formatINR(c.value)}</td>
        <td>${c.active ? '✅ Active' : '❌ Inactive'}</td>
        <td>
          <a class="action-link js-toggle-coupon" data-id="${c.id}" data-active="${c.active}">${c.active ? 'Deactivate' : 'Activate'}</a>
          <a class="action-link danger js-delete-coupon" data-id="${c.id}">Delete</a>
        </td>
      </tr>`).join('') || '<tr><td colspan="5">No coupons yet.</td></tr>';

    body.querySelectorAll('.js-toggle-coupon').forEach((el) =>
      el.addEventListener('click', async () => {
        try {
          await apiFetch(`/coupons/${el.dataset.id}`, {
            method: 'PUT',
            body: JSON.stringify({ active: el.dataset.active !== 'true' }),
          });
          loadCoupons();
        } catch (e) { alert(e.message); }
      })
    );
    body.querySelectorAll('.js-delete-coupon').forEach((el) =>
      el.addEventListener('click', async () => {
        if (!confirm('Delete this coupon?')) return;
        try {
          await apiFetch(`/coupons/${el.dataset.id}`, { method: 'DELETE' });
          loadCoupons();
        } catch (e) { alert(e.message); }
      })
    );
  } catch (e) { /* redirect handled */ }
}

/* ---------------- Messages ---------------- */
async function loadMessages() {
  const body = document.getElementById('messages-table-body');
  try {
    const messages = await apiFetch('/contact');
    body.innerHTML = messages.map((m) => `
      <tr>
        <td>${m.name}</td>
        <td>${m.phone}</td>
        <td>${m.message}</td>
        <td>${new Date(m.createdAt).toLocaleDateString('en-IN')}</td>
      </tr>`).join('') || '<tr><td colspan="4">No messages yet.</td></tr>';
  } catch (e) { /* redirect handled */ }
}

/* ---------------- Modal wiring ---------------- */
function wireModals() {
  document.getElementById('add-product-btn').addEventListener('click', () => openProductModal());
  document.getElementById('add-coupon-btn').addEventListener('click', () => {
    document.getElementById('coupon-form').reset();
    document.getElementById('coupon-form-alert').innerHTML = '';
    document.getElementById('coupon-modal').classList.add('open');
  });

  document.getElementById('p-image').addEventListener('input', updateImagePreview);

  document.getElementById('p-image-upload-btn').addEventListener('click', () => {
    document.getElementById('p-image-file').click();
  });

  document.getElementById('p-image-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const statusEl = document.getElementById('p-image-upload-status');
    statusEl.textContent = 'Uploading…';

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` }, // no Content-Type — browser sets the multipart boundary
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      document.getElementById('p-image').value = data.path;
      updateImagePreview();
      statusEl.textContent = `Uploaded ✓ (${data.path})`;
    } catch (err) {
      statusEl.textContent = `Upload failed: ${err.message}`;
    }
    e.target.value = ''; // allow re-selecting the same file if needed
  });

  document.querySelectorAll('.js-close-modal').forEach((btn) =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach((m) => m.classList.remove('open'));
    })
  );

  document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('p-id').value;
    const payload = {
      name: document.getElementById('p-name').value.trim(),
      category: document.getElementById('p-category').value,
      fabric: document.getElementById('p-fabric').value.trim(),
      price: Number(document.getElementById('p-price').value),
      mrp: Number(document.getElementById('p-mrp').value) || Number(document.getElementById('p-price').value),
      stock: Number(document.getElementById('p-stock').value) || 0,
      featured: document.getElementById('p-featured').value === 'true',
      image: document.getElementById('p-image').value.trim(),
      colors: document.getElementById('p-colors').value.split(',').map((c) => c.trim()).filter(Boolean),
      description: document.getElementById('p-description').value.trim(),
    };

    try {
      if (id) {
        await apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
      }
      document.getElementById('product-modal').classList.remove('open');
      loadProducts();
    } catch (err) {
      document.getElementById('product-form-alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  });

  document.getElementById('coupon-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      code: document.getElementById('cp-code').value.trim(),
      type: document.getElementById('cp-type').value,
      value: Number(document.getElementById('cp-value').value),
      active: true,
    };
    try {
      await apiFetch('/coupons', { method: 'POST', body: JSON.stringify(payload) });
      document.getElementById('coupon-modal').classList.remove('open');
      loadCoupons();
    } catch (err) {
      document.getElementById('coupon-form-alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  wirePanelNav();
  wireModals();
  loadOverview();
});
