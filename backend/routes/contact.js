const express = require('express');
const { readData, writeData, nextId } = require('../utils/db');
const { requireAdmin } = require('../middleware/auth');
const { notifyNewContact } = require('../utils/notify');
const router = express.Router();

// POST /api/contact - public, submit a contact message
router.post('/', (req, res) => {
  const { name, phone, email, message } = req.body;
  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'name, phone and message are required' });
  }

  const messages = readData('contacts');
  const entry = {
    id: nextId(messages),
    name,
    phone,
    email: email || '',
    message,
    createdAt: new Date().toISOString(),
  };
  messages.push(entry);
  writeData('contacts', messages);
  res.status(201).json({ success: true, message: 'Thank you! We will get back to you soon.' });

  notifyNewContact(entry).catch(() => {});
});

// GET /api/contact - admin only
router.get('/', requireAdmin, (req, res) => {
  const messages = readData('contacts').sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(messages);
});

module.exports = router;
