const express = require('express');
const { readData, writeData, nextId } = require('../utils/db');
const { requireAdmin } = require('../middleware/auth');
const { notifyNewOrder } = require('../utils/notify');
const router = express.Router();

// POST /api/orders - customer places an order (public)
router.post('/', (req, res) => {
  const { customerName, phone, address, items, couponCode, notes } = req.body;

  if (!customerName || !phone || !items || !items.length) {
    return res
      .status(400)
      .json({ error: 'customerName, phone and items are required' });
  }

  const products = readData('products');
  let subtotal = 0;
  const orderItems = items.map((item) => {
    const product = products.find((p) => p.id === Number(item.productId));
    const price = product ? product.price : item.price || 0;
    subtotal += price * item.quantity;
    return {
      productId: item.productId,
      name: product ? product.name : item.name,
      price,
      quantity: item.quantity,
    };
  });

  let discount = 0;
  if (couponCode) {
    const coupons = readData('coupons');
    const coupon = coupons.find(
      (c) => c.code.toLowerCase() === couponCode.toLowerCase() && c.active
    );
    if (coupon) {
      discount =
        coupon.type === 'percent'
          ? Math.round((subtotal * coupon.value) / 100)
          : coupon.value;
    }
  }

  const orders = readData('orders');
  const order = {
    id: nextId(orders),
    customerName,
    phone,
    address: address || '',
    items: orderItems,
    subtotal,
    discount,
    total: Math.max(subtotal - discount, 0),
    couponCode: couponCode || null,
    notes: notes || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  orders.push(order);
  writeData('orders', orders);
  res.status(201).json(order);

  // Fire-and-forget: don't make the customer wait on the email, and never
  // let a notification failure affect the order that was just saved.
  notifyNewOrder(order).catch(() => {});
});

// GET /api/orders - admin only, list all orders
router.get('/', requireAdmin, (req, res) => {
  const orders = readData('orders').sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(orders);
});

// PATCH /api/orders/:id - admin updates status
router.patch('/:id', requireAdmin, (req, res) => {
  const orders = readData('orders');
  const idx = orders.findIndex((o) => o.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });

  if (req.body.status) orders[idx].status = req.body.status;
  writeData('orders', orders);
  res.json(orders[idx]);
});

module.exports = router;
