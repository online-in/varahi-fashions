const express = require('express');
const { readData, writeData, nextId } = require('../utils/db');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// GET /api/coupons/check/:code - public, validate a coupon at checkout
router.get('/check/:code', (req, res) => {
  const coupons = readData('coupons');
  const coupon = coupons.find(
    (c) => c.code.toLowerCase() === req.params.code.toLowerCase() && c.active
  );
  if (!coupon) return res.status(404).json({ error: 'Invalid or expired coupon' });
  res.json(coupon);
});

// GET /api/coupons - admin only, list all
router.get('/', requireAdmin, (req, res) => {
  res.json(readData('coupons'));
});

// POST /api/coupons - admin only
router.post('/', requireAdmin, (req, res) => {
  const coupons = readData('coupons');
  const { code, type, value, active } = req.body;

  if (!code || !type || value === undefined) {
    return res.status(400).json({ error: 'code, type and value are required' });
  }

  const coupon = {
    id: nextId(coupons),
    code: code.toUpperCase(),
    type, // 'percent' or 'flat'
    value: Number(value),
    active: active !== undefined ? Boolean(active) : true,
    createdAt: new Date().toISOString(),
  };

  coupons.push(coupon);
  writeData('coupons', coupons);
  res.status(201).json(coupon);
});

// PUT /api/coupons/:id - admin only
router.put('/:id', requireAdmin, (req, res) => {
  const coupons = readData('coupons');
  const idx = coupons.findIndex((c) => c.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Coupon not found' });

  coupons[idx] = { ...coupons[idx], ...req.body, id: coupons[idx].id };
  writeData('coupons', coupons);
  res.json(coupons[idx]);
});

// DELETE /api/coupons/:id - admin only
router.delete('/:id', requireAdmin, (req, res) => {
  const coupons = readData('coupons');
  const idx = coupons.findIndex((c) => c.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Coupon not found' });

  const [removed] = coupons.splice(idx, 1);
  writeData('coupons', coupons);
  res.json({ deleted: removed });
});

module.exports = router;
