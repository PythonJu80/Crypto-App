const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'trades.db');

async function verifySeededData() {
  console.log('Verifying seeded data...\n');

  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error connecting to database:', err.message);
      process.exit(1);
    }
  });

  const tables = ['users', 'cryptocurrencies', 'wallets', 'trades', 'alerts'];

  try {
    for (const table of tables) {
      await new Promise((resolve, reject) => {
        // Get count
        db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, countRow) => {
          if (err) {
            reject(err);
            return;
          }

          // Get first row
          db.get(`SELECT * FROM ${table} LIMIT 1`, (err, dataRow) => {
            if (err) {
              reject(err);
              return;
            }

            console.log(`\n📊 ${table.toUpperCase()}`);
            console.log('------------------------');
            
            if (countRow.count === 0) {
              console.log(`⚠️  Warning: No data found in ${table}`);
            } else {
              console.log(`✓ Total entries: ${countRow.count}`);
              console.log('✓ Sample entry:');
              
              // Format the sample entry for better readability
              const formattedData = Object.entries(dataRow)
                .map(([key, value]) => `  ${key}: ${value}`)
                .join('\n');
              
              console.log(formattedData);
            }

            resolve();
          });
        });
      });
    }

    console.log('\n✨ Verification completed!');
  } catch (error) {
    console.error('Error during verification:', error.message);
  } finally {
    db.close();
  }
}

// Run verification
verifySeededData();