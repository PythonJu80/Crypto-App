-- Users table to store user information
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cryptocurrencies table to store crypto information
CREATE TABLE cryptocurrencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    current_price DECIMAL(20, 8) NOT NULL,
    market_cap DECIMAL(20, 2),
    volume_24h DECIMAL(20, 2),
    price_change_24h DECIMAL(8, 2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Wallets table to store user balances
CREATE TABLE wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    crypto_id INTEGER NOT NULL,
    balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (crypto_id) REFERENCES cryptocurrencies(id) ON DELETE CASCADE,
    UNIQUE(user_id, crypto_id)
);

-- Trades table to record trading activity
CREATE TABLE trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    crypto_id INTEGER NOT NULL,
    trade_type TEXT NOT NULL CHECK(trade_type IN ('buy', 'sell')),
    amount DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    total_value DECIMAL(20, 8) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled', 'failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (crypto_id) REFERENCES cryptocurrencies(id) ON DELETE CASCADE
);

-- Alerts table for price notifications
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    crypto_id INTEGER NOT NULL,
    target_price DECIMAL(20, 8) NOT NULL,
    condition TEXT NOT NULL CHECK(condition IN ('above', 'below')),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    is_triggered BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    triggered_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (crypto_id) REFERENCES cryptocurrencies(id) ON DELETE CASCADE
);

-- Transactions table for wallet operations
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('trade', 'deposit', 'withdrawal')),
    amount DECIMAL(20, 8) NOT NULL,
    balance_after DECIMAL(20, 8) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- Stop losses table for automated sell orders
CREATE TABLE stop_losses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    crypto_id INTEGER NOT NULL,
    trade_id INTEGER,
    trigger_price DECIMAL(20, 8) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'triggered', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    triggered_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (crypto_id) REFERENCES cryptocurrencies(id) ON DELETE CASCADE,
    FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE SET NULL
);

-- Indexes for performance optimization
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_crypto_id ON trades(crypto_id);
CREATE INDEX idx_trades_created_at ON trades(created_at);

CREATE INDEX idx_wallets_user_crypto ON wallets(user_id, crypto_id);
CREATE INDEX idx_wallets_balance ON wallets(balance);

CREATE INDEX idx_alerts_user_crypto ON alerts(user_id, crypto_id);
CREATE INDEX idx_alerts_active_triggered ON alerts(is_active, is_triggered);

CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

CREATE INDEX idx_stop_losses_user_crypto ON stop_losses(user_id, crypto_id);
CREATE INDEX idx_stop_losses_status ON stop_losses(status);

-- Triggers to update timestamps
CREATE TRIGGER update_cryptocurrencies_timestamp 
AFTER UPDATE ON cryptocurrencies
BEGIN
    UPDATE cryptocurrencies SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_wallets_timestamp 
AFTER UPDATE ON wallets
BEGIN
    UPDATE wallets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;