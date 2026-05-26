-- ============================================================
-- Obsidian Capital — PostgreSQL Database Schema
-- ============================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                  VARCHAR(255) NOT NULL UNIQUE,
  password_hash          TEXT NOT NULL,
  name                   VARCHAR(100) NOT NULL,

  -- Membership tier determines commission rate
  tier                   VARCHAR(20) NOT NULL DEFAULT 'standard'
                           CHECK (tier IN ('standard', 'member', 'private')),

  -- KYC verification status
  kyc_status             VARCHAR(20) NOT NULL DEFAULT 'pending'
                           CHECK (kyc_status IN ('pending', 'approved', 'rejected', 'under_review')),

  -- Sensitive KYC data (hashed)
  ssn_last4_hash         TEXT,
  dob                    DATE,
  address                JSONB,

  -- Account financials
  buying_power           NUMERIC(18, 2) NOT NULL DEFAULT 0.00
                           CHECK (buying_power >= 0),

  -- Access control
  role                   VARCHAR(20) NOT NULL DEFAULT 'user'
                           CHECK (role IN ('user', 'admin', 'support')),
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,

  -- Two-factor authentication
  two_fa_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  two_fa_secret          TEXT,
  two_fa_code            VARCHAR(6),
  two_fa_session_token   UUID,
  two_fa_session_expires TIMESTAMPTZ,

  -- Security tracking
  failed_login_attempts  INTEGER NOT NULL DEFAULT 0,
  last_failed_login      TIMESTAMPTZ,
  last_login             TIMESTAMPTZ,

  -- Timestamps
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes on users
CREATE INDEX IF NOT EXISTS idx_users_email         ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_tier          ON users (tier);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status    ON users (kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_role          ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active     ON users (is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at    ON users (created_at DESC);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── HOLDINGS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS holdings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker       VARCHAR(10) NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  shares       NUMERIC(18, 6) NOT NULL CHECK (shares > 0),
  avg_cost     NUMERIC(18, 6) NOT NULL CHECK (avg_cost > 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each user can only have one holding per ticker
  CONSTRAINT uq_holdings_user_ticker UNIQUE (user_id, ticker)
);

-- Indexes on holdings
CREATE INDEX IF NOT EXISTS idx_holdings_user_id  ON holdings (user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_ticker   ON holdings (ticker);

DROP TRIGGER IF EXISTS trg_holdings_updated_at ON holdings;
CREATE TRIGGER trg_holdings_updated_at
  BEFORE UPDATE ON holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── TRADES ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trades (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker       VARCHAR(10) NOT NULL,
  company_name VARCHAR(200) NOT NULL,

  -- Order details
  type         VARCHAR(4) NOT NULL CHECK (type IN ('buy', 'sell')),
  shares       NUMERIC(18, 6) NOT NULL CHECK (shares > 0),
  price        NUMERIC(18, 6) NOT NULL CHECK (price > 0),
  order_type   VARCHAR(10) NOT NULL DEFAULT 'market'
                 CHECK (order_type IN ('market', 'limit', 'stop')),
  limit_price  NUMERIC(18, 6),

  -- Financials
  commission   NUMERIC(18, 2) NOT NULL CHECK (commission >= 0),
  total        NUMERIC(18, 2) NOT NULL CHECK (total > 0),

  -- Status tracking
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),

  -- Timestamps
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at   TIMESTAMPTZ
);

-- Indexes on trades
CREATE INDEX IF NOT EXISTS idx_trades_user_id    ON trades (user_id);
CREATE INDEX IF NOT EXISTS idx_trades_ticker     ON trades (ticker);
CREATE INDEX IF NOT EXISTS idx_trades_type       ON trades (type);
CREATE INDEX IF NOT EXISTS idx_trades_status     ON trades (status);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_created ON trades (user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_trades_updated_at ON trades;
CREATE TRIGGER trg_trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── WATCHLIST ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS watchlist (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker       VARCHAR(10) NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A user can only have each ticker once in their watchlist
  CONSTRAINT uq_watchlist_user_ticker UNIQUE (user_id, ticker)
);

-- Indexes on watchlist
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist (user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_ticker  ON watchlist (ticker);

-- ─── AUDIT LOG ───────────────────────────────────────────────────────────────
-- Tracks sensitive administrative and user actions

CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id    ON audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action     ON audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at DESC);

-- ─── SEED ADMIN USER ─────────────────────────────────────────────────────────
-- Default admin account (password: Admin@Obsidian1 — CHANGE IN PRODUCTION)

INSERT INTO users (
  id,
  email,
  password_hash,
  name,
  tier,
  kyc_status,
  buying_power,
  role,
  is_active
)
VALUES (
  uuid_generate_v4(),
  'admin@obsidian-capital.com',
  -- bcrypt hash of 'Admin@Obsidian1' with salt rounds 12
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfQGFf5yEe66.',
  'Obsidian Admin',
  'private',
  'approved',
  0.00,
  'admin',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- ─── SEED DEMO USERS ─────────────────────────────────────────────────────────
-- Demo accounts for development/testing

INSERT INTO users (id, email, password_hash, name, tier, kyc_status, buying_power, role, is_active)
VALUES
  (
    uuid_generate_v4(),
    'demo.standard@obsidian-capital.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfQGFf5yEe66.',
    'Alex Standard',
    'standard',
    'approved',
    25000.00,
    'user',
    TRUE
  ),
  (
    uuid_generate_v4(),
    'demo.member@obsidian-capital.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfQGFf5yEe66.',
    'Jordan Member',
    'member',
    'approved',
    100000.00,
    'user',
    TRUE
  ),
  (
    uuid_generate_v4(),
    'demo.private@obsidian-capital.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfQGFf5yEe66.',
    'Morgan Private',
    'private',
    'approved',
    1000000.00,
    'user',
    TRUE
  )
ON CONFLICT (email) DO NOTHING;
