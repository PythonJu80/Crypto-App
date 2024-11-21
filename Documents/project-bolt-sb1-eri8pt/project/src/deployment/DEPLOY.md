# Deployment Guide

## Prerequisites

1. Node.js v18 or higher
2. SQLite3
3. Environment variables configured
4. SSL certificates (for production)

## Deployment Steps

### 1. Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Update environment variables
nano .env
```

Required variables:
- `NODE_ENV=production`
- `PORT=3000`
- `JWT_SECRET`
- `API_SECRET`
- `DB_PATH`
- `CORS_ORIGIN`

### 2. Database Setup

```bash
# Initialize database
node src/database/init.js

# Verify database
node src/database/verifySeed.js
```

### 3. Build Process

```bash
# Install dependencies
npm ci

# Build frontend
npm run build

# Verify build
ls -la dist/
```

### 4. Security Configuration

1. Configure SSL certificates
2. Set up reverse proxy (nginx recommended)
3. Enable security headers
4. Configure firewall rules

### 5. Start Application

```bash
# Start production server
npm start

# Verify server
curl http://localhost:3000/api/health
```

## Monitoring Setup

### 1. Metrics

- Enable Prometheus metrics endpoint
- Configure alerting rules
- Set up Grafana dashboards

### 2. Logging

- Configure log rotation
- Set up log aggregation
- Enable error tracking

## Troubleshooting

### Common Issues

1. Database Connection
```bash
# Verify database file
ls -l $DB_PATH

# Check permissions
chmod 644 $DB_PATH
```

2. WebSocket Connection
```bash
# Test WebSocket
wscat -c ws://localhost:3000/ws
```

3. Memory Issues
```bash
# Monitor memory usage
node --max-old-space-size=4096 src/server.js
```

## Rollback Procedure

1. Stop current deployment
2. Restore previous version
3. Rollback database if needed
4. Restart services

## Health Checks

- `/api/health` - API status
- `/api/metrics` - Prometheus metrics
- `/api/ws` - WebSocket health

## Performance Tuning

1. Database Optimization
   - Index optimization
   - Query optimization
   - Connection pooling

2. WebSocket Tuning
   - Message batching
   - Connection limits
   - Heartbeat intervals

3. Cache Configuration
   - Response caching
   - Static asset caching
   - API result caching