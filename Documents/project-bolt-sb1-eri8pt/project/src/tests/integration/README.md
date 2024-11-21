## Integration Tests

This directory contains integration tests that verify the interaction between different components of the system.

### Auth Middleware Tests
- Validates authentication across all routes
- Tests rate limiting functionality
- Verifies permission checks
- Tests error handling scenarios

### Running Tests
```bash
npm test src/tests/integration
```

### Coverage
The tests aim to verify:
- Token validation
- Request signing
- Permission checks
- Rate limiting
- Error handling
- Security metrics