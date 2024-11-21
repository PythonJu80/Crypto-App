const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

// Database file path
const DB_PATH = path.join(__dirname, 'trades.db');

// Password hashing function using Node's crypto module
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function seedDatabase() {
  console.log('Starting database seeding...');

  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error connecting to database:', err.message);
      process.exit(1);
    }
  });

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  try {
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Seed Users
        const passwordHash = hashPassword('testpass123');
        db.run(`
          INSERT OR IGNORE INTO users (id, username, email, password_hash)
          VALUES (?, ?, ?, ?)
        `, [1, 'testuser', 'test@example.com', passwordHash], function(err) {
          if (err) {
            console.error('Error seeding users:', err.message);
            return reject(err);
          }
          console.log('✓ Users seeded');
        });

        // Seed Cryptocurrencies
        const cryptos = [
          [1, 'BTC', 'Bitcoin', 50000, 1000000000000, 50000000000, 2.5],
          [2, 'ETH', 'Ethereum', 3000, 400000000000, 20000000000, 1.8]
        ];

        db.run(`
          INSERT OR IGNORE INTO cryptocurrencies 
          (id, symbol, name, current_price, market_cap, volume_24h, price_change_24h)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, cryptos[0], function(err) {
          if (err) {
            console.error('Error seeding cryptocurrencies:', err.message);
            return reject(err);
          }
        });

        db.run(`
          INSERT OR IGNORE INTO cryptocurrencies 
          (id, symbol, name, current_price, market_cap, volume_24h, price_change_24h)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, cryptos[1], function(err) {
          if (err) {
            console.error('Error seeding cryptocurrencies:', err.message);
            return reject(err);
          }
          console.log('✓ Cryptocurrencies seeded');
        });

        // Seed Wallets
        const wallets = [
          [1, 1, 1, 0.5],
          [2, 1, 2, 5.0]
        ];

        wallets.forEach((wallet, index) => {
          db.run(`
            INSERT OR IGNORE INTO wallets (id, user_id, crypto_id, balance)
            VALUES (?, ?, ?, ?)
          `, wallet, function(err) {
            if (err) {
              console.error('Error seeding wallets:', err.message);
              return reject(err);
            }
            if (index === wallets.length - 1) {
              console.log('✓ Wallets seeded');
            }
          });
        });

        // Seed Trades
        const trades = [
          [1, 1, 1, 'buy', 0.1, 44000, 4400, 'completed'],
          [2, 1, 2, 'sell', 1.0, 3100, 3100, 'completed']
        ];

        trades.forEach((trade, index) => {
          db.run(`
            INSERT OR IGNORE INTO trades 
            (id, user_id, crypto_id, trade_type, amount, price, total_value, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, trade, function(err) {
            if (err) {
              console.error('Error seeding trades:', err.message);
              return reject(err);
            }
            if (index === trades.length - 1) {
              console.log('✓ Trades seeded');
            }
          });
        });

        // Seed Alerts
        const alerts = [
          [1, 1, 1, 55000, 'above', 1, 0],
          [2, 1, 2, 2800, 'below', 1, 0]
        ];

        alerts.forEach((alert, index) => {
          db.run(`
            INSERT OR IGNORE INTO alerts 
            (id, user_id, crypto_id, target_price, condition, is_active, is_triggered)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, alert, function(err) {
            if (err) {
              console.error('Error seeding alerts:', err.message);
              return reject(err);
            }
            if (index === alerts.length - 1) {
              console.log('✓ Alerts seeded');
            }
          });
        });

        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction:', err.message);
            db.run('ROLLBACK');
            return reject(err);
          }
          resolve();
        });
      });
    });

    console.log('\nDatabase seeding completed successfully! 🌱');

  } catch (error) {
    console.error('Failed to seed database:', error.message);
    db.run('ROLLBACK');
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run seeding
seedDatabase();