const sqlite3 = require('sqlite3').verbose();
const fs = require('fs-extra');
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'trades.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');

    // Check if database file exists
    const dbExists = await fs.pathExists(DB_PATH);
    if (dbExists) {
      console.log('Database file already exists. Checking schema...');
    }

    // Read schema file
    const schema = await fs.readFile(SCHEMA_PATH, 'utf8');
    
    // Create/connect to database
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        throw new Error(`Error connecting to database: ${err.message}`);
      }
    });

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Execute schema in a transaction
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Split schema into individual statements
        const statements = schema
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);

        // Execute each statement
        for (const statement of statements) {
          db.run(statement, (err) => {
            if (err) {
              // Only log error if it's not a "table already exists" error
              if (!err.message.includes('already exists')) {
                console.error(`Error executing statement: ${err.message}`);
                db.run('ROLLBACK');
                reject(err);
                return;
              }
            }
          });
        }

        db.run('COMMIT', (err) => {
          if (err) {
            console.error(`Error committing transaction: ${err.message}`);
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          resolve();
        });
      });
    });

    // Close database connection
    await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

    console.log('Database initialization completed successfully!');
    console.log(`Database location: ${DB_PATH}`);

  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();