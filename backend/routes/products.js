const express = require('express');
const { readData, writeData, nextId } = require('../utils/db');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// GET /api/products  - list, with optional ?category= & ?search= & ?featured=true
router.get('/', (req, res) => {
  let products = readData('products');
  const { category, search, featured } = req.query;

  if (category && category !== 'all') {
    products = products.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (featured === 'true') {
    products = products.filter((p) => p.featured);
  }

  res.json(products);
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const products = readData('products');
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST /api/products  (admin only)
router.post('/', requireAdmin, (req, res) => {
  const products = readData('products');
  const {
    name,
    category,
    price,
    mrp,
    description,
    image,
    fabric,
    colors,
    stock,
    featured,
  } = req.body;

  if (!name || !category || !price) {
    return res.status(400).json({ error: 'name, category and price are required' });
  }

  const product = {
    id: nextId(products),
    name,
    category,
    price: Number(price),
    mrp: mrp ? Number(mrp) : Number(price),
    description: description || '',
    image: image || '',
    fabric: fabric || '',
    colors: colors || [],
    stock: stock !== undefined ? Number(stock) : 10,
    featured: Boolean(featured),
    createdAt: new Date().toISOString(),
  };

  products.push(product);
  writeData('products', products);
  res.status(201).json(product);
});

// PUT /api/products/:id (admin only)
router.put('/:id', requireAdmin, (req, res) => {
  const products = readData('products');
  const idx = products.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  products[idx] = { ...products[idx], ...req.body, id: products[idx].id };
  writeData('products', products);
  res.json(products[idx]);
});

// DELETE /api/products/:id (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  const products = readData('products');
  const idx = products.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  const [removed] = products.splice(idx, 1);
  writeData('products', products);
  res.json({ deleted: removed });
});

module.exports = router;
