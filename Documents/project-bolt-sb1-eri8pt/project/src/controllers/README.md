# Controllers Directory

This directory contains controller files that handle the HTTP request/response cycle and coordinate between routes and services in the crypto trading application.

## Purpose
Controllers act as an intermediary layer between routes and services, responsible for:
- Processing incoming HTTP requests
- Input validation and sanitization
- Coordinating with services for business logic
- Formatting and sending responses
- Error handling and status codes

## Structure

### Controller Files
- `trading.controller.js` - Trading operations
- `market.controller.js` - Market data and price information
- `portfolio.controller.js` - Portfolio management
- `auth.controller.js` - Authentication and authorization
- `user.controller.js` - User management
- `alert.controller.js` - Price alerts and notifications
- `analytics.controller.js` - Trading statistics and reports

### Controller Method Pattern
```javascript
// Example controller structure
class TradingController {
  async createOrder(req, res, next) {
    try {
      // 1. Extract and validate input
      const { symbol, amount, type } = req.body;

      // 2. Call appropriate service
      const result = await tradingService.createOrder({
        symbol,
        amount,
        type,
        userId: req.user.id
      });

      // 3. Send response
      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      // 4. Error handling
      next(error);
    }
  }
}
```

## Best Practices

### Do's
✅ Keep controllers thin - delegate business logic to services
✅ Use async/await for consistent error handling
✅ Implement proper input validation
✅ Return consistent response structures
✅ Use appropriate HTTP status codes
✅ Include request logging
✅ Handle all possible error scenarios

### Don'ts
❌ Don't include business logic in controllers
❌ Don't access databases directly (use services)
❌ Don't handle complex calculations
❌ Don't maintain state in controllers
❌ Don't mix concerns between different features

## Error Handling
```javascript
// Example error handling pattern
try {
  // Controller logic
} catch (error) {
  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  next(error); // Pass to global error handler
}
```

## Response Format
Maintain consistent response structures:
```javascript
// Success response
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    // Pagination, etc.
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid trade amount"
  }
}
```

## Documentation
- Use JSDoc comments for all controller methods
- Document expected request/response formats
- Include validation requirements
- List possible error scenarios
- Add examples for complex operations

## Testing
- Write unit tests for all controller methods
- Test error handling scenarios
- Mock service layer calls
- Verify response formats and status codes
- Test input validation logic</content>