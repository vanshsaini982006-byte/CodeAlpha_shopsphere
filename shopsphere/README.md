# ShopSphere — Full-Stack E-Commerce Platform

A production-ready e-commerce web application built with a vanilla HTML/CSS/JS
frontend and a Node.js/Express/MongoDB backend. Includes customer-facing
shopping (catalog, cart, wishlist, checkout with Razorpay, order tracking)
and a full admin panel (dashboard analytics, product/order/user management).

---

## 1. Tech Stack

| Layer          | Technology                                              |
|-----------------|----------------------------------------------------------|
| Frontend        | HTML5, CSS3 (custom design system, no framework), vanilla JavaScript |
| Backend         | Node.js, Express.js                                      |
| Database        | MongoDB Atlas (via Mongoose)                              |
| Auth            | JWT (JSON Web Tokens) + bcrypt password hashing           |
| Payments        | Razorpay (test/live mode)                                 |
| Icons           | Font Awesome 6 (CDN)                                       |

---

## 2. Folder Structure

```
shopsphere/
├── backend/
│   ├── config/db.js              MongoDB connection
│   ├── models/                   User, Product, Cart, Wishlist, Order
│   ├── controllers/               Route handler logic
│   ├── routes/                    Express routers
│   ├── middleware/                Auth guard, error handler, async wrapper
│   ├── utils/                     JWT + Razorpay helpers
│   ├── seed/seedData.js           Sample data + admin account seeding
│   ├── server.js                  App entry point
│   ├── package.json
│   └── .env.example               Copy to .env and fill in your keys
│
├── frontend/
│   ├── css/style.css              Full design system (single stylesheet)
│   ├── js/                        Shared utilities + one file per page
│   ├── admin/                     Admin panel pages (dashboard/products/orders/users)
│   ├── index.html, products.html, product-detail.html,
│   │   cart.html, wishlist.html, checkout.html, login.html,
│   │   register.html, profile.html, orders.html, order-detail.html
│
└── README.md                      You are here
```

---

## 3. Prerequisites

- **Node.js** v18 or later ([nodejs.org](https://nodejs.org))
- A **MongoDB Atlas** account (free tier is enough) — [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register)
- A **Razorpay** account for payment keys (test mode is free) — [dashboard.razorpay.com](https://dashboard.razorpay.com/)
- A code editor (VS Code recommended) and a terminal

---

## 4. Installation Guide

### Step 1 — Get a MongoDB Atlas connection string

1. Sign in at [cloud.mongodb.com](https://cloud.mongodb.com), create a free (M0) cluster.
2. Under **Database Access**, create a database user with a username/password.
3. Under **Network Access**, add your current IP (or `0.0.0.0/0` for quick testing — not recommended for production).
4. Click **Connect → Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Add a database name before the `?`, e.g. `.../shopsphere?retryWrites=true...`

### Step 2 — Get Razorpay test keys

1. Sign in at [dashboard.razorpay.com](https://dashboard.razorpay.com/), switch to **Test Mode** (toggle top-right).
2. Go to **Settings → API Keys → Generate Test Key**.
3. Copy the **Key Id** and **Key Secret**.

### Step 3 — Configure the backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/shopsphere?retryWrites=true&w=majority
JWT_SECRET=<any long random string>
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=<your key secret>
```

> Generate a strong `JWT_SECRET` with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### Step 4 — Seed the database

This creates 12 sample products, an admin account, and a demo customer account:

```bash
npm run seed
```

You should see output confirming the admin/demo logins:
```
Admin login  -> email: admin@shopsphere.com | password: Admin@123456
Demo login   -> email: demo@shopsphere.com  | password: Demo@123456
```

### Step 5 — Start the backend

```bash
npm run dev
```

The API will run at `http://localhost:5000`. Visit `http://localhost:5000/api/health` to confirm it's running.

### Step 6 — Serve the frontend

The frontend is static HTML/CSS/JS — no build step required. From the `frontend/` folder, use any static server, for example:

```bash
cd ../frontend
npx serve -l 5500
```

Or with the VS Code **Live Server** extension: right-click `index.html` → "Open with Live Server".

Then open `http://localhost:5500` in your browser.

> **Important:** `frontend/js/config.js` auto-detects the API URL as `http://<your-hostname>:5000/api`. If your backend runs on a different port, edit `API_BASE_URL` in that file.

---

## 5. Default Login Credentials (after seeding)

| Role     | Email                  | Password       |
|----------|-------------------------|----------------|
| Admin    | admin@shopsphere.com    | Admin@123456   |
| Customer | demo@shopsphere.com     | Demo@123456    |

Admin users are automatically redirected to `/admin/dashboard.html` after login and see an "Admin Dashboard" link in the account menu.

---

## 6. Testing Instructions

### Manual smoke test checklist

1. **Auth**: Register a new account → log out → log back in → edit profile → add an address.
2. **Browsing**: Visit the home page, click through categories, use the search bar (try typing "watch"), apply filters (category, brand, price range, rating) on the Shop page, change sort order, paginate.
3. **Product detail**: Open a product, switch gallery images, adjust quantity, add to cart, add to wishlist, submit a review (requires being logged in and not having reviewed it yet).
4. **Cart**: Update quantities, remove an item, apply coupon code `WELCOME10` (10% off), remove the coupon.
5. **Checkout**:
   - Add a shipping address.
   - Choose **Cash on Delivery** → place order → confirm it appears in Order History with status "placed".
   - Add another item, choose **Pay Online** → Razorpay's test checkout modal opens. Use Razorpay's [test card numbers](https://razorpay.com/docs/payments/payments/test-card-upi-details/) (e.g. card `4111 1111 1111 1111`, any future expiry, any CVV) to simulate a successful payment.
6. **Order tracking**: Open an order's detail page, confirm the status timeline renders, try cancelling an order that's still "placed".
7. **Admin panel** (log in as admin@shopsphere.com):
   - Dashboard: confirm stats and the 7-day revenue chart render (place a couple of paid test orders first so the chart has data).
   - Products: add a new product, edit an existing one, delete one.
   - Orders: change an order's status and confirm it updates instantly and reflects on the customer's order page.
   - Users: search for a user, disable/enable an account.

### API testing with curl

```bash
# Health check
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@shopsphere.com","password":"Demo@123456"}'

# Get products (public)
curl http://localhost:5000/api/products?limit=5
```

For authenticated endpoints, copy the `token` from the login response and pass it as:
```bash
curl http://localhost:5000/api/cart -H "Authorization: Bearer <token>"
```

---

## 7. Deployment Instructions

You can deploy the backend and frontend separately, or serve the frontend from the backend as a single service.

### Option A — Separate deployments (recommended)

**Backend → Render / Railway:**
1. Push this repo to GitHub.
2. Create a new **Web Service** on [Render](https://render.com) or [Railway](https://railway.app), pointing at the `backend/` folder as the root directory.
3. Build command: `npm install` — Start command: `npm start`.
4. Add all variables from `.env` (MONGO_URI, JWT_SECRET, RAZORPAY keys, etc.) in the platform's environment variables settings, plus `NODE_ENV=production` and `CLIENT_URL=<your deployed frontend URL>`.
5. Deploy — note the resulting backend URL (e.g. `https://shopsphere-api.onrender.com`).

**Frontend → Netlify / Vercel:**
1. Before deploying, edit `frontend/js/config.js` and set `window.__API_BASE__` at the top of `frontend/index.html` (and every page) or simplest: change the fallback in `config.js` to your deployed backend URL + `/api`.
2. Deploy the `frontend/` folder as a static site on [Netlify](https://netlify.com) (drag-and-drop the folder, or connect the GitHub repo with publish directory `frontend`) or [Vercel](https://vercel.com).
3. In Razorpay dashboard, whitelist your frontend's deployed domain if prompted.

### Option B — Single service (backend serves the frontend)

`server.js` already includes a production static-file handler. To use it:
1. Ensure `NODE_ENV=production` is set.
2. Deploy just the `backend/` folder to Render/Railway, but make sure the `frontend/` folder is included in the deployed repo alongside it (i.e. deploy the whole project root, with the start command run from `backend/`).
3. The Express server will serve `frontend/index.html` and all static assets automatically for any non-`/api` route.
4. Update `frontend/js/config.js`'s fallback so `API_BASE_URL` resolves to the same origin (`${protocol}//${hostname}/api` with no port).

### Database & payments in production

- Use a dedicated MongoDB Atlas cluster (not the same one as local dev) and restrict Network Access to your server's IP.
- Switch Razorpay to **Live Mode** and use live keys once you're ready to accept real payments — live keys require KYC verification on Razorpay's dashboard.
- Rotate `JWT_SECRET` to a fresh random value in production; never reuse the example value.

---

## 8. Notable Implementation Details

- **Coupons**: `WELCOME10`, `SAVE20`, `FLAT15` are hardcoded in `backend/controllers/cartController.js` for demo purposes — replace with a real `Coupon` collection for production use.
- **Shipping**: Flat ₹49 fee, free above ₹999 subtotal (after discount). Tax is a flat 5% demo rate. Both are configurable constants in `cartController.js`.
- **Stock**: Decremented on order placement, restored on cancellation.
- **Reviews**: One review per user per product; product rating is recalculated on every new review.
- **Security**: Helmet, rate limiting (auth routes: 50 req/15min; general API: 500 req/15min), bcrypt (10 salt rounds), JWT in httpOnly cookie + Bearer header (dual support), Razorpay payment signatures verified server-side before any order is marked "paid".

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `MongoServerError: bad auth` | Double-check the username/password in `MONGO_URI` — special characters in the password must be URL-encoded. |
| Frontend shows "Could not reach the server" | Confirm the backend is running and `API_BASE_URL` in `frontend/js/config.js` points to the right host/port. |
| Razorpay modal doesn't open | Check `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are set and you're using Test Mode keys for local development. |
| CORS errors in browser console | Set `CLIENT_URL` in the backend `.env` to match exactly where your frontend is served from (including port). |
| 401 errors right after login | Clear `localStorage` (`ss_token`, `ss_user`) and log in again — likely a stale token from a previous `JWT_SECRET`. |
