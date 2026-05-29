# Obsidian Capital

A luxury stock brokerage and trading platform. Dark mode, flat-fee commission trading, three-tier membership.

**Headquarters:** Washington D.C. | **Founded:** 2026  
**Leadership:** Massimo Claver-Carone (CEO) · Marco Torterelli (CTO) · Hugh Snyder (CFO)

---

## Architecture

```
Obsidian-Capital/
├── frontend/        # React 18 + TypeScript + Vite + Tailwind  (port 5173)
├── backend/         # Node.js + Express + TypeScript + Socket.IO (port 3001)
├── admin/           # React admin dashboard                     (port 5174)
├── render.yaml      # One-click Render deployment blueprint
└── docker-compose.yml
```

---

## Deploy to Render (live URL in ~10 minutes)

Render hosts the backend, frontend, admin panel, and Postgres database for free.

### Step 1 — Create a Render account
Go to **render.com** and sign up with your GitHub account.

### Step 2 — Connect the repo and import the blueprint
1. In the Render dashboard click **New → Blueprint**
2. Connect your GitHub account and select the **Obsidian-Capital** repository
3. Render will detect `render.yaml` and show 3 services + 1 database — click **Apply**

### Step 3 — Set secret environment variables
After the initial deploy, go to each service and fill in the following in **Environment**:

**oc-backend**
| Variable | Value |
|---|---|
| `ADMIN_ACCESS_CODE` | Your admin portal access code |
| `ALPACA_BROKER_KEY` | Alpaca Broker API key |
| `ALPACA_BROKER_SECRET` | Alpaca Broker API secret |
| `POLYGON_API_KEY` | Polygon.io API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `STRIPE_MEMBER_PRICE_ID` | Stripe price ID for Member plan |
| `STRIPE_PRIVATE_PRICE_ID` | Stripe price ID for Private plan |
| `FRONTEND_URL` | `https://oc-frontend.onrender.com` |

**oc-frontend**
| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://oc-backend.onrender.com/api` |
| `VITE_WS_URL` | `https://oc-backend.onrender.com` |
| `VITE_POLYGON_API_KEY` | Polygon.io API key |

**oc-admin**
| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://oc-backend.onrender.com/api` |

### Step 4 — Trigger a redeploy
After setting env vars, click **Manual Deploy → Deploy latest commit** on each service.

### Your live URLs
| Service | URL |
|---|---|
| Trading app | `https://oc-frontend.onrender.com` |
| Admin panel | `https://oc-admin.onrender.com` |
| Backend API | `https://oc-backend.onrender.com` |

> **Note:** Free tier services spin down after 15 minutes of inactivity — the first request after idle takes ~30 seconds. Upgrade to the Starter plan ($7/mo) to keep them always on.

---

## Run with Docker (local or VPS)

```bash
# Copy and fill in your secrets
cp backend/.env.example backend/.env

# Build and start everything
docker compose up --build

# Services:
#   Frontend  → http://localhost:5173
#   Backend   → http://localhost:3001
#   Admin     → http://localhost:5174
```

---

## Local Development

```bash
# Backend
cd backend && cp .env.example .env   # fill in credentials
npm install && npm run dev           # → http://localhost:3001

# Frontend (new terminal)
cd frontend && npm install && npm run dev   # → http://localhost:5173

# Admin (new terminal)
cd admin && npm install && npm run dev     # → http://localhost:5174
```

---

## Commission Structure

| Tier | Per Trade | Monthly Fee |
|---|---|---|
| Standard | $4.99 flat | Free |
| Obsidian Member | $2.99 flat | $29.99/mo |
| Obsidian Private | $0.99 flat | $199.99/mo |

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts, TradingView Lightweight Charts
- **Backend:** Node.js, Express, TypeScript, Socket.IO, PostgreSQL, JWT, bcryptjs
- **Brokerage:** Alpaca Broker API (white-label, programmatic account creation)
- **Market Data:** Polygon.io (real-time quotes, OHLCV bars, news, movers)
- **Payments:** Stripe (subscriptions + billing)
- **Deployment:** Render (backend + static sites + Postgres)

---

## Design System

| Token | Value | Usage |
|---|---|---|
| `obsidian` | `#0a0a0f` | Page backgrounds |
| `surface` | `#111118` | Card backgrounds |
| `gold` | `#c9a54e` | CTAs, accents, branding |
| `off-white` | `#f0ede8` | Primary text |
| `gain` | `#3d9e6e` | Positive P&L |
| `loss` | `#c0453a` | Negative P&L |

Fonts: **Playfair Display** (headings) · **Inter** (body) · **JetBrains Mono** (prices/data)
