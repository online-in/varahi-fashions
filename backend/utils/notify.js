const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_USER || !EMAIL_PASS) return null;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
  return transporter;
}

function isNotifyConfigured() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_TO);
}

async function sendMail(subject, html) {
  if (!isNotifyConfigured()) {
    console.log(`[notify] Email not configured — skipping notification: "${subject}"`);
    return;
  }
  const t = getTransporter();
  try {
    await t.sendMail({
      from: `"Varahi Fashions Website" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject,
      html,
    });
    console.log(`[notify] Email sent: "${subject}"`);
  } catch (err) {
    // Never let a notification failure break the customer-facing request.
    console.error('[notify] Failed to send email:', err.message);
  }
}

async function notifyNewOrder(order) {
  const itemsHtml = order.items
    .map((i) => `<li>${i.name} x${i.quantity} — ₹${(i.price * i.quantity).toLocaleString('en-IN')}</li>`)
    .join('');

  const html = `
    <h2>New Order #${order.id} — Varahi Fashions</h2>
    <p><strong>Customer:</strong> ${order.customerName}</p>
    <p><strong>Phone:</strong> ${order.phone}</p>
    <p><strong>Address:</strong> ${order.address}</p>
    <p><strong>Items:</strong></p>
    <ul>${itemsHtml}</ul>
    <p><strong>Subtotal:</strong> ₹${order.subtotal.toLocaleString('en-IN')}</p>
    ${order.discount ? `<p><strong>Discount:</strong> ₹${order.discount.toLocaleString('en-IN')}</p>` : ''}
    <p><strong>Total:</strong> ₹${order.total.toLocaleString('en-IN')}</p>
    ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
    <p>Log in to the admin dashboard to confirm and update this order's status.</p>
  `;

  await sendMail(`🛍️ New Order #${order.id} from ${order.customerName}`, html);
}

async function notifyNewContact(entry) {
  const html = `
    <h2>New Contact Message — Varahi Fashions</h2>
    <p><strong>Name:</strong> ${entry.name}</p>
    <p><strong>Phone:</strong> ${entry.phone}</p>
    ${entry.email ? `<p><strong>Email:</strong> ${entry.email}</p>` : ''}
    <p><strong>Message:</strong></p>
    <p>${entry.message}</p>
  `;

  await sendMail(`✉️ New message from ${entry.name}`, html);
}

module.exports = { notifyNewOrder, notifyNewContact, isNotifyConfigured };
