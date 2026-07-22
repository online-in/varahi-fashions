const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Simple single-admin login using credentials from .env
// (bcryptjs is available if you want to move to a hashed password store later)
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );
    return res.json({ token, username });
  }

  return res.status(401).json({ error: 'Invalid username or password' });
});

module.exports = router;
