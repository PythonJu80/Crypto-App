# Routes Directory

This directory contains all route definitions for the crypto trading application. Routes handle incoming HTTP requests and direct them to the appropriate controllers.

## Structure

Each feature should have its own route file:
- `trading.routes.js` - Trading operations endpoints
- `market.routes.js` - Market data and price information
- `portfolio.routes.js` - Portfolio management endpoints
- `auth.routes.js` - Authentication and authorization
- `user.routes.js` - User management endpoints
- `alerts.routes.js` - Price alert configurations
- `analytics.routes.js` - Trading analytics and reports

## Route Organization Guidelines

### File Structure
```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/feature.controller');
const middleware = require('../middleware/auth.middleware');

router.get('/', middleware, controller.method);

module.exports = router;
```

### Naming Conventions
- Files: `feature.routes.js`
- Route paths: Use kebab-case for URLs
  - ✅ `/api/stop-loss`
  - ❌ `/api/stopLoss`
- Route parameters: Use camelCase
  - ✅ `/api/trades/:tradeId`
  - ❌ `/api/trades/:trade_id`

### Best Practices
1. Group related endpoints in the same route file
2. Use middleware for:
   - Authentication
   - Request validation
   - Rate limiting
   - Logging
3. Keep routes simple - business logic belongs in services
4. Use proper HTTP methods:
   - GET: Retrieve data
   - POST: Create new resources
   - PUT/PATCH: Update existing resources
   - DELETE: Remove resources

### API Versioning
Structure routes with versioning:
```
/api/v1/trades
/api/v1/market-data
/api/v1/portfolio
```

### Error Handling
- Use middleware for centralized error handling
- Return consistent error responses
- Include appropriate HTTP status codes

### Documentation
- Each route file should include JSDoc comments
- Document expected request/response formats
- List required permissions or authentication
- Include example requests and responses