# ReviewBoost — Google Review Management Platform

A full **MERN Stack SaaS** application for marketing agencies to manage Google reviews for multiple business clients.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite, Tailwind CSS, ShadCN UI, React Query, React Router, Recharts, Framer Motion, React Hook Form + Zod |
| Backend | Node.js, Express.js, MongoDB Atlas, Mongoose, JWT (access + refresh tokens), bcryptjs, Multer, Nodemailer |
| QR Code | qrcode (server), qrcode.react (client) |
| Reports | xlsx |

---

## Project Structure

```
google-review-platform/
├── server/                  # Express API
│   ├── config/db.js
│   ├── controllers/         # authController, clientController, reviewController, …
│   ├── middleware/          # authMiddleware, adminMiddleware, clientMiddleware, uploadMiddleware
│   ├── models/              # User, Client, Category, Review, Feedback, QRCode
│   ├── routes/              # /api/auth, /api/clients, /api/reviews, …
│   ├── services/emailService.js
│   ├── utils/               # generateToken, slugify, seed
│   ├── uploads/             # file storage
│   ├── .env                 # ← configure this
│   └── server.js
│
└── client/                  # React + Vite
    └── src/
        ├── api/             # axios instance + all API calls
        ├── components/      # ShadCN UI + AdminSidebar, ClientSidebar, StatCard, …
        ├── context/         # AuthContext, ThemeContext
        ├── layouts/         # AdminLayout, ClientLayout
        ├── pages/
        │   ├── auth/Login.jsx
        │   ├── admin/       # Dashboard, Clients, Reviews, Analytics, Reports, …
        │   ├── client/      # Dashboard, Reviews, Feedback, QRCodes, Analytics, …
        │   └── public/      # ReviewPage (public-facing)
        ├── routes/          # ProtectedRoute
        └── lib/utils.js
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- (Optional) Gmail account for email notifications

---

### 1. Clone & Install

```bash
# Clone (or extract the zip)
cd google-review-platform

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

---

### 2. Configure Environment

**Server** — edit `server/.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/google-review-platform
JWT_SECRET=your_super_long_random_secret
JWT_REFRESH_SECRET=another_different_random_secret
CLIENT_URL=http://localhost:5173
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App passwords → Generate.

---

### 3. Seed Super Admin

```bash
cd server
node utils/seed.js
```

This creates:
- **Email**: `admin@platform.com`
- **Password**: `Admin@1234`

---

### 4. Run Development Servers

Open two terminals:

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Open `http://localhost:5173` and log in with the seed credentials.

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Super Admin** | Manage all clients, users, categories, global reviews, analytics, reports, settings |
| **Client Admin** | Manage own business profile, generate QR codes, view reviews/feedback, analytics, export reports |

---

## Key Features

### Review Flow (Public Page)
- Customer scans QR code → `/review/:slug`
- Rates 1-5 stars
- **4-5 stars**: selects category → redirected to Google Reviews page
- **1-3 stars**: fills private feedback form → stored in DB, client notified by email

### QR Code Generator
- Generates unique token per QR code
- QR image rendered via `qrcode.react` SVG
- Download as PNG, copy URL, track scan count

### Analytics Dashboard
- Monthly review trends (line chart)
- Positive vs Negative pie chart
- Rating distribution bar chart
- CSAT score, feedback by status

### Reports Export
- XLSX export of reviews (positive / negative / all)
- XLSX export of private feedback
- Full report (both sheets in one file)

### JWT Auth
- Access token (15m) + Refresh token (7d)
- Auto-refresh on 401 via Axios interceptor
- Role-based protected routes

---

## API Endpoints

```
POST   /api/auth/login          — Login
POST   /api/auth/refresh        — Refresh tokens
POST   /api/auth/logout         — Logout
GET    /api/auth/me             — Current user

GET    /api/clients             — List clients (admin)
POST   /api/clients             — Create client + owner (admin)
GET    /api/clients/me          — Client's own profile
PUT    /api/clients/me          — Update own profile

GET    /api/reviews             — List reviews (filtered)
POST   /api/reviews/submit      — Public review submission
GET    /api/reviews/overview    — Summary stats

GET    /api/feedback            — List feedback
PATCH  /api/feedback/:id/status — Update status

GET    /api/qrcodes             — List QR codes
POST   /api/qrcodes             — Create QR code
POST   /api/qrcodes/scan/:token — Track scan (public)

GET    /api/analytics           — Analytics data
GET    /api/analytics/overview  — Admin overview stats

GET    /api/reports/reviews     — Download XLSX
GET    /api/reports/feedback    — Download XLSX
GET    /api/reports/full        — Download XLSX (full)

GET    /api/public/client/:slug — Public client data for review page
```

---

## Production Deployment

### Backend (Render / Railway / Fly.io)

1. Set all environment variables in the hosting dashboard
2. Set `NODE_ENV=production`
3. Set `CLIENT_URL` to your frontend URL (e.g. `https://app.reviewboost.com`)
4. Run `node utils/seed.js` once to create the super admin

### Frontend (Vercel / Netlify)

1. Set `VITE_API_URL=https://your-backend.com/api`
2. Add a `vercel.json` / `_redirects` for SPA routing:

**Vercel** (`client/vercel.json`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

**Netlify** (`client/public/_redirects`):
```
/* /index.html 200
```

### MongoDB Atlas

1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user
3. Whitelist `0.0.0.0/0` (all IPs) or your server's IP
4. Copy the connection string to `MONGODB_URI`

---

## Environment Variables Reference

### Server

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string | required |
| `JWT_SECRET` | Access token secret | required |
| `JWT_REFRESH_SECRET` | Refresh token secret | required |
| `JWT_EXPIRE` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRE` | Refresh token expiry | `7d` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username | — |
| `EMAIL_PASS` | SMTP password / app password | — |
| `MAX_FILE_SIZE` | Max upload size in bytes | `5242880` (5MB) |

---

## License

MIT
