# Obsidian Capital

A luxury stock brokerage and trading platform. Dark mode, commission-based trading, three-tier membership structure.

**Headquarters:** Washington D.C. | **Founded:** 2026  
**Leadership:** CEO Massimo · COO Hugh · COO Marco

---

## Architecture

```
Obsidian-Capital/
├── frontend/        # React 18 + TypeScript + Vite + Tailwind (port 5173)
├── backend/         # Node.js + Express + TypeScript + Socket.IO (port 3001)
├── admin/           # React admin dashboard (port 5174)
└── README.md
```

---

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
# → http://localhost:3001
```

### Admin Dashboard

```bash
cd admin
npm install
npm run dev
# → http://localhost:5174
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `MARKET_DATA_API_KEY` | Market data provider API key |
| `APEX_CLEARING_API_KEY` | Apex Clearing integration key |
| `AWS_ACCESS_KEY` | AWS access key (S3, CloudFront) |
| `AWS_SECRET_KEY` | AWS secret key |
| `STRIPE_KEY` | Stripe key for Private tier subscriptions |
| `SENDGRID_KEY` | SendGrid key for email notifications |
| `TWILIO_KEY` | Twilio key for 2FA SMS |

---

## Database Setup

```bash
psql -U postgres -c "CREATE DATABASE obsidian_capital;"
psql -U postgres -d obsidian_capital -f backend/src/db/schema.sql
```

The schema creates: `users`, `holdings`, `trades`, `watchlist`, `audit_log` tables with seed data for demo accounts.

---

## Commission Structure

| Tier | Rate | Target Market |
|---|---|---|
| Standard | 10–12% | Retail investors |
| Obsidian Member | 7–9% | Active traders |
| Obsidian Private | 5–6% | High-net-worth individuals |

Commission is calculated at the midpoint of each range, disclosed on every order before execution per SEC Reg BI.

---

## Revenue Projections

| Year | Users | Annual Revenue |
|---|---|---|
| 1 | 1,000 | $2.55M |
| 2 | 10,000 | $25.5M |
| 3 | 50,000 | $127.5M |
| 4 | 100,000 | $255M |
| 5 | 500,000 | $1.27B |

*Based on $500 avg trade × 5 trades/month/user × 8.5% blended commission*

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, React Router v6, TanStack Query
- **Backend:** Node.js, Express, TypeScript, Socket.IO, PostgreSQL (pg), JWT, bcryptjs
- **Admin:** React 18, TypeScript, Vite, Tailwind CSS, Recharts
- **Cloud:** AWS (EC2, RDS, S3, CloudFront)
- **Clearing:** Apex Clearing API
- **Payments:** Stripe (Private tier subscriptions)

---

## Compliance

- KYC identity verification on signup (name, SSN last 4, DOB, address)
- SEC Regulation Best Interest (Reg BI) disclosure on every trade
- SIPC membership ($500K account protection)
- AML transaction monitoring
- FINRA filing calendar tracked in admin portal
- Cookie consent banner on landing page

---

## Design System

| Token | Value | Usage |
|---|---|---|
| `obsidian` | `#0a0a0a` | Page backgrounds |
| `surface` | `#111111` | Card backgrounds |
| `surface-2` | `#1a1a1a` | Nested surfaces |
| `surface-3` | `#222222` | Input backgrounds |
| `gold` | `#c9a84c` | CTAs, accents, branding |
| `off-white` | `#f0ede8` | Primary text |
| `gain` | `#3d9e6e` | Positive returns |
| `loss` | `#c0453a` | Negative returns |
| `border` | `#2a2a2a` | All borders |

Fonts: **Playfair Display** (headings) · **Inter** (data/body)
