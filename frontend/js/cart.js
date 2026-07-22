let appliedCoupon = null;

function renderCart() {
  const wrap = document.getElementById('cart-items');
  if (!wrap) return;
  const cart = CartStore.getCart();

  if (!cart.length) {
    wrap.innerHTML = `
      <div class="empty-state">
        <p>Your cart is empty.</p>
        <a class="btn btn-primary" href="shop.html">Browse Sarees</a>
      </div>`;
    updateSummary();
    return;
  }

  wrap.innerHTML = cart.map((item) => `
    <div class="cart-item" data-id="${item.productId}">
      <img src="${item.image || 'images/product-placeholder-1.jpg'}" alt="${item.name}" loading="lazy" decoding="async" onerror="this.src='https://placehold.co/80x100/4a0e18/f5e6c8?text=VF'">
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <span class="product-meta">${formatINR(item.price)} each</span>
      </div>
      <div class="qty-control">
        <button class="js-qty-minus" aria-label="Decrease quantity">−</button>
        <span>${item.quantity}</span>
        <button class="js-qty-plus" aria-label="Increase quantity">+</button>
      </div>
      <strong class="cart-item-total">${formatINR(item.price * item.quantity)}</strong>
      <button class="remove-btn js-remove-item" aria-label="Remove item">🗑</button>
    </div>
  `).join('');

  wrap.querySelectorAll('.cart-item').forEach((el) => {
    const id = Number(el.dataset.id);
    el.querySelector('.js-qty-minus').addEventListener('click', () => {
      const item = CartStore.getCart().find((i) => i.productId === id);
      CartStore.updateQuantity(id, item.quantity - 1);
      renderCart();
    });
    el.querySelector('.js-qty-plus').addEventListener('click', () => {
      const item = CartStore.getCart().find((i) => i.productId === id);
      CartStore.updateQuantity(id, item.quantity + 1);
      renderCart();
    });
    el.querySelector('.js-remove-item').addEventListener('click', () => {
      CartStore.removeItem(id);
      renderCart();
    });
  });

  updateSummary();
}

function updateSummary() {
  const subtotal = CartStore.totalPrice();
  let discount = 0;
  if (appliedCoupon) {
    discount = appliedCoupon.type === 'percent'
      ? Math.round((subtotal * appliedCoupon.value) / 100)
      : appliedCoupon.value;
  }
  const total = Math.max(subtotal - discount, 0);

  document.getElementById('summary-subtotal').textContent = formatINR(subtotal);
  document.getElementById('summary-discount').textContent = `− ${formatINR(discount)}`;
  document.getElementById('summary-total').textContent = formatINR(total);
}

function formatPhoneForMessage(phone) {
  const digits = phone.replace(/\D/g, '');
  // Show with +91 country code, same way WhatsApp itself displays it,
  // unless the customer already typed a country code.
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  return phone;
}

function buildWhatsAppMessage(name, phone, fullAddress) {
  const cart = CartStore.getCart();
  const itemLines = cart.map(
    (i, idx) => `${idx + 1}. ${i.name} (Qty: ${i.quantity}) - ${formatINR(i.price * i.quantity)}`
  );
  const subtotal = CartStore.totalPrice();
  let discount = 0;
  if (appliedCoupon) {
    discount = appliedCoupon.type === 'percent'
      ? Math.round((subtotal * appliedCoupon.value) / 100)
      : appliedCoupon.value;
  }
  const total = Math.max(subtotal - discount, 0);

  return [
    'New Order from Varahi Fashions',
    '',
    'Customer Details:',
    `Name: ${name}`,
    `Phone: ${formatPhoneForMessage(phone)}`,
    `Address: ${fullAddress}`,
    '',
    'Order Items:',
    ...itemLines,
    '',
    discount ? `Discount (${appliedCoupon.code}): − ${formatINR(discount)}` : null,
    `Total Amount: ${formatINR(total)}`,
    '',
    'Please confirm my order and share payment details.',
  ].filter((line) => line !== null).join('\n');
}

async function submitOrder(viaWhatsapp) {
  const cart = CartStore.getCart();
  const name = document.getElementById('c-name').value.trim();
  const phone = document.getElementById('c-phone').value.trim();
  const street = document.getElementById('c-address').value.trim();
  const city = document.getElementById('c-city').value.trim();
  const state = document.getElementById('c-state').value.trim();
  const pincode = document.getElementById('c-pincode').value.trim();
  const notes = document.getElementById('c-notes').value.trim();
  const alertBox = document.getElementById('checkout-alert');

  const address = [street, city, state].filter(Boolean).join(', ') + (pincode ? ` - ${pincode}` : '');

  if (!cart.length) {
    alertBox.innerHTML = '<div class="alert alert-error">Your cart is empty.</div>';
    return;
  }
  if (!name || !phone || !street || !city || !state || !pincode) {
    alertBox.innerHTML = '<div class="alert alert-error">Please fill in your name, phone, address, city, state and pincode.</div>';
    return;
  }
  if (!/^\d{6}$/.test(pincode)) {
    alertBox.innerHTML = '<div class="alert alert-error">Please enter a valid 6-digit pincode.</div>';
    return;
  }

  const payload = {
    customerName: name,
    phone,
    address,
    notes: viaWhatsapp ? `${notes} (Checkout via WhatsApp)`.trim() : notes,
    couponCode: appliedCoupon ? appliedCoupon.code : null,
    items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  };

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Order failed');

    if (viaWhatsapp) {
      const message = buildWhatsAppMessage(name, phone, address);
      window.open(`https://wa.me/${SiteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      alertBox.innerHTML = '<div class="alert alert-success">Order placed! We will contact you shortly to confirm delivery.</div>';
    }
    CartStore.clearCart();
    renderCart();
  } catch (e) {
    alertBox.innerHTML = '<div class="alert alert-error">Something went wrong placing your order. Please try WhatsApp checkout instead.</div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();

  document.getElementById('apply-coupon-btn')?.addEventListener('click', async () => {
    const code = document.getElementById('coupon-input').value.trim();
    const msg = document.getElementById('coupon-message');
    if (!code) return;
    try {
      const res = await fetch(`${API_BASE}/coupons/check/${code}`);
      if (!res.ok) throw new Error('invalid');
      appliedCoupon = await res.json();
      msg.style.color = 'var(--success)';
      msg.textContent = `Coupon "${appliedCoupon.code}" applied!`;
      updateSummary();
    } catch (e) {
      appliedCoupon = null;
      msg.style.color = 'var(--danger)';
      msg.textContent = 'Invalid or expired coupon code.';
      updateSummary();
    }
  });

  document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    submitOrder(false);
  });

  document.getElementById('whatsapp-checkout-btn')?.addEventListener('click', () => {
    submitOrder(true);
  });
});
