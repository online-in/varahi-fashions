# VARAHI FASHIONS — Full-Stack Saree Store

Timeless Elegance • Traditional You

A complete, functional women's saree ecommerce website: plain HTML/CSS/JS
storefront + admin dashboard, backed by a real Node.js/Express REST API.
No frameworks, no build step — open it, run it, and it works.

---

## 1. Directory Structure

```
varahi-fashions/
├── README.md                  ← you are here
│
├── backend/                    Node.js + Express API server
│   ├── server.js               App entry point (also serves the frontend)
│   ├── package.json
│   ├── .env                    Config: port, admin login, WhatsApp number
│   ├── data/                   JSON "database" — edit or back up as plain files
│   │   ├── products.json
│   │   ├── orders.json
│   │   ├── coupons.json
│   │   └── contacts.json
│   ├── routes/
│   │   ├── auth.js             Admin login → JWT
│   │   ├── products.js         Product CRUD
│   │   ├── orders.js           Place order, admin list/update status
│   │   ├── coupons.js          Coupon CRUD + validation
│   │   └── contact.js          Contact form submissions
│   ├── middleware/
│   │   └── auth.js             JWT check for admin-only routes
│   └── utils/
│       └── db.js                Tiny JSON read/write helper
│
└── frontend/                   Plain HTML/CSS/JS — no build tools needed
    ├── index.html               Home (banner with brand + contact details)
    ├── shop.html                 All sarees, category filter + search
    ├── product.html              Single product detail + add to cart
    ├── cart.html                  Cart + checkout (COD or WhatsApp)
    ├── about.html
    ├── contact.html
    ├── css/
    │   ├── style.css             Storefront theme (maroon + gold)
    │   └── admin.css             Admin dashboard theme
    ├── js/
    │   ├── main.js                Shared nav/config/WhatsApp wiring
    │   ├── cart-store.js          Cart logic (localStorage)
    │   ├── shop.js                 Product grid rendering + filters
    │   ├── product.js              Product detail page logic
    │   ├── cart.js                  Cart/checkout page logic
    │   ├── contact.js               Contact form submit
    │   └── admin.js                  Admin dashboard logic
    ├── images/                    Put your saree photos here
    └── admin/
        ├── login.html
        └── dashboard.html
```

---

## 2. Requirements

- **Node.js 18+** (includes `npm`). Check with: `node -v`
- Any modern browser
- No database server needed — data is stored in JSON files under `backend/data/`

---

## 3. How to Run It (step by step)

```bash
# 1. Unzip / copy the project, then open a terminal inside it
cd varahi-fashions/backend

# 2. Install backend dependencies (only needed once)
npm install

# 3. Start the server
npm start
```

You should see:
```
Varahi Fashions server running at http://localhost:4000
```

Now open **http://localhost:4000** in your browser — that's the whole site.
The Express server serves both the API (`/api/...`) and the frontend files,
so you only ever run **one command** and everything works together.

To stop the server, press `Ctrl + C` in that terminal.

### Running on a different port
Edit `backend/.env` and change `PORT=4000` to any port you like, then restart.

---

## 4. Admin Dashboard

Go to **http://localhost:4000/admin/login.html**

Default login (set in `backend/.env`):
```
Username: admin
Password: varahi@2026
```

**Change this password before putting the site online** — edit
`ADMIN_PASSWORD` in `backend/.env` and restart the server.

From the dashboard you can:
- **Products** — add/edit/delete sarees, mark as featured, set stock
- **Orders** — see every order placed on the site and update its status
  (pending → confirmed → shipped → delivered / cancelled)
- **Coupons** — create percentage or flat-amount discount codes
- **Messages** — read messages submitted through the Contact page

---

## 5. How Orders & WhatsApp Work

- Customers add sarees to a cart (stored in their browser via `localStorage`).
- At checkout they can either:
  - **Place Order (Cash on Delivery)** — this saves the order to
    `backend/data/orders.json` and shows a confirmation. You'll see and
    manage it from the Admin → Orders tab.
  - **Checkout via WhatsApp** — this *also* saves the order (so nothing is
    lost), and opens WhatsApp with a pre-filled message summarizing the
    order, ready to send to your store's WhatsApp number.
- The WhatsApp number and phone number shown across the site come from
  `backend/.env` (`WHATSAPP_NUMBER`, `STORE_PHONE`) — change them there,
  not in the HTML files, so they update everywhere at once.

---

## 6. Email Alerts for Orders & Contact Messages

By default, orders and contact messages are only visible by logging into the
Admin Dashboard. If you want an **email sent to you automatically** every
time a customer places a Cash-on-Delivery order or submits the Contact form,
set this up (takes about 3 minutes, and it's free):

1. Use (or create) a Gmail account you're happy to send store notifications from.
2. Turn on 2-Step Verification on that Google account (required for the next step):
   `myaccount.google.com/security` → 2-Step Verification → turn it on.
3. Create an **App Password**: `myaccount.google.com/apppasswords` → choose
   "Mail" → generate → Google gives you a 16-character password.
4. Open `backend/.env` and fill in:
   ```
   EMAIL_USER=youraccount@gmail.com
   EMAIL_PASS=the16characterapppassword
   EMAIL_TO=whereyouwanttoreceivealerts@gmail.com
   ```
   (`EMAIL_TO` can be the same address, or a different one — e.g. your
   personal email while `EMAIL_USER` stays a dedicated "store" Gmail.)
5. Restart the server (`Ctrl+C`, then `npm start`).

That's it — from then on, every order and every contact message triggers an
email to `EMAIL_TO` with the customer's details.

**If you leave these blank:** nothing breaks. Orders and messages still save
normally — you just won't get an email, and you'll see a line like
`[notify] Email not configured — skipping notification` in the server's
terminal output, which is expected and harmless.

**Note on WhatsApp alerts to yourself:** there's no official free way for a
website to auto-send a WhatsApp message to your own number (Meta's WhatsApp
Business API requires business verification and per-message cost). Email is
the reliable free option here. If you'd like, a lightweight workaround using
a third-party service like CallMeBot can also be added later — just ask.

## 7. Adding Product Photos (Locally or Once Hosted Online)

**Easiest way — upload straight from the Admin Dashboard:**
1. Go to Admin → Products → Add/Edit a product
2. Click **"Upload Photo"**, pick a JPG/PNG/WEBP/GIF from your device (max 5MB)
3. It uploads immediately, shows a preview, and fills in the image path for you
4. Click **Save Product**

This works the same way whether you're running the site on your own laptop
or once it's hosted online — you don't need FTP or a file manager, just the
Admin Dashboard in your browser.

**Alternative — paste an image URL:** In the same field, you can instead
paste a direct link to a photo hosted elsewhere (e.g. Cloudinary, Imgur, or
your own CDN) — anything starting with `http://` or `https://` works as-is,
no upload needed.

**Alternative — copy files manually:** You can still copy photos directly
into `frontend/images/` yourself and type the path (e.g. `images/my-saree.jpg`)
into the same field — useful for bulk-adding many photos at once.

Until a product has a photo, the site shows a clean placeholder graphic
automatically — nothing will look broken.

> **Important if you host this on a free/serverless platform** (e.g. Render
> free tier, Vercel, Railway without a persistent volume): those platforms
> often wipe locally-uploaded files whenever the app restarts or redeploys,
> because their filesystem is temporary. If that's where you're hosting,
> use the **"paste an image URL"** option above with a proper image host
> (Cloudinary's free tier works well) instead of uploading through Admin,
> so your photos survive redeploys. If you're hosting on a normal VPS,
> DigitalOcean droplet, or shared hosting with real persistent storage,
> uploading through Admin is fine long-term.

---

## 8. Editing Store Info (name, address, phone, colors)

| What | Where |
|---|---|
| WhatsApp / phone numbers | `backend/.env` |
| Store address, Instagram handle | search-and-replace in the HTML files (`frontend/*.html`) — it appears in the top bar, hero banner, and footer |
| Brand colors / fonts | CSS variables at the top of `frontend/css/style.css` (`:root { --rust, --ink, --gold, ... }`) |
| Admin login | `backend/.env` (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) |

---

## 9. Deploying Online (optional)

This is a normal Node.js app, so it runs on any host that supports Node
(Render, Railway, a VPS, etc.):

1. Upload the whole `varahi-fashions` folder
2. On the server: `cd backend && npm install && npm start`
   (or use a process manager like `pm2 start server.js` to keep it running)
3. Point your domain at the server's port (or put it behind Nginx/Caddy)
4. **Important:** change `JWT_SECRET` and `ADMIN_PASSWORD` in `.env` to
   something private before going live — the values in this project are
   placeholders for local testing only.

For real payment collection (UPI/Razorpay/cards) you'd add a payment
gateway integration in `backend/routes/orders.js` — the current setup
covers Cash on Delivery and WhatsApp-based ordering, which matches how
the brand already takes orders.

---

## 10. Quick Troubleshooting

| Problem | Fix |
|---|---|
| Browser shows "Could not load products" | The backend isn't running — go back to step 3 and run `npm start` inside `backend/` |
| `npm install` fails | Make sure Node.js 18+ is installed (`node -v`) |
| Port 4000 already in use | Change `PORT` in `backend/.env` |
| Admin login says "Invalid username or password" | Check `ADMIN_USERNAME`/`ADMIN_PASSWORD` in `backend/.env` match what you're typing |
| Changes to `.env` don't take effect | Restart the server (`Ctrl+C`, then `npm start` again) |
| Not receiving email alerts | Check `EMAIL_USER`/`EMAIL_PASS`/`EMAIL_TO` are all filled in `backend/.env`, that `EMAIL_PASS` is a Gmail **App Password** (not your normal Gmail password), and check the server terminal for `[notify]` log lines |
