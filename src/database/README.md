# Database Directory

This directory manages all database-related components of the crypto trading application, including models, migrations, configurations, and query utilities.

## Structure

### Core Components
- `models/` - Database models and schemas
- `migrations/` - Database migration files
- `seeds/` - Seed data for development/testing
- `config/` - Database configuration files
- `utils/` - Database utility functions

## Database Schema

### Tables
1. **users**
   - User authentication and profile data
   - Trading preferences and settings

2. **trades**
   - Trading history and active orders
   - Order types and status tracking

3. **portfolios**
   - Asset holdings and balances
   - Performance metrics

4. **market_data**
   - Price history and market statistics
   - Technical indicators

5. **alerts**
   - Price alerts and notifications
   - Trading triggers

## SQLite3 Best Practices

### Security
```javascript
// ✅ DO: Use parameterized queries
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
const user = stmt.get(userId);

// ❌ DON'T: Use string concatenation
// const query = `SELECT * FROM users WHERE id = ${userId}`; // UNSAFE!
```

### Transaction Management
```javascript
// Handle transactions properly
db.transaction(() => {
  // Perform multiple operations atomically
  stmt1.run(params1);
  stmt2.run(params2);
})();
```

### Query Optimization
- Use appropriate indexes
- Keep queries simple and efficient
- Avoid N+1 query problems
- Use EXPLAIN QUERY PLAN for optimization

## Migrations

### File Naming
```
YYYYMMDDHHMMSS_descriptive_name.js
Example: 20231215120000_create_users_table.js
```

### Migration Structure
```javascript
exports.up = function(db) {
  return db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

exports.down = function(db) {
  return db.exec('DROP TABLE users;');
};
```

### Migration Guidelines
1. Always include both `up` and `down` migrations
2. Keep migrations atomic and focused
3. Test migrations thoroughly
4. Document complex migrations
5. Back up data before running migrations

## Backup and Maintenance

### Backup Strategy
```bash
# Backup command example
sqlite3 database.db ".backup 'backup-$(date +%Y%m%d).db'"
```

### Database Maintenance
- Regular vacuum operations
- Index optimization
- Performance monitoring
- Data archival strategy

## Error Handling

### Database Errors
```javascript
try {
  // Database operation
} catch (error) {
  if (error.code === 'SQLITE_CONSTRAINT') {
    // Handle constraint violation
  } else if (error.code === 'SQLITE_BUSY') {
    // Handle database locked
  }
  throw error;
}
```

## Testing

### Test Database
- Use separate test database
- Reset database before tests
- Use transactions for test isolation
- Mock database calls when appropriate

## Documentation

### Schema Documentation
- Document all tables and relationships
- Include field descriptions and constraints
- Document indexes and their purposes
- Keep schema diagrams updated

### Query Documentation
```javascript
/**
 * Retrieves user's trading history
 * @param {number} userId - The user's ID
 * @param {Object} options - Query options (limit, offset, etc.)
 * @returns {Promise<Array>} Trading history records
 */
function getUserTrades(userId, options) {
  // Implementation
}
```

## Performance Monitoring

### Key Metrics
- Query execution time
- Connection pool usage
- Lock contention
- Index effectiveness
- Cache hit rates

## Development Guidelines

1. **Schema Changes**
   - Document all changes
   - Update related models
   - Create appropriate migrations
   - Test thoroughly

2. **Data Access**
   - Use prepared statements
   - Implement connection pooling
   - Handle concurrent access
   - Implement proper error handling

3. **Maintenance**
   - Regular backups
   - Performance monitoring
   - Index optimization
   - Data archival