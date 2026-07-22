require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');
const contactRoutes = require('./routes/contact');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ---- API routes ----
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Small public config endpoint so the frontend can read WhatsApp/phone numbers
// without hardcoding them in multiple JS files.
app.get('/api/config', (req, res) => {
  res.json({
    whatsappNumber: process.env.WHATSAPP_NUMBER,
    storePhone: process.env.STORE_PHONE,
  });
});

// ---- Serve the static frontend ----
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// Fallback: any non-API GET request returns index.html (simple multi-page
// site, so this mainly helps with pretty URLs / refreshes on sub-pages).
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(FRONTEND_DIR, req.path), (err) => {
    if (err) res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  });
});

app.listen(PORT, () => {
  console.log(`Varahi Fashions server running at http://localhost:${PORT}`);
});
