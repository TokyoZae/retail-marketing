# LocalDeals Hub Backend - Deployment Guide

## Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB 4.4+
- Redis (optional, for caching)

### Local Development
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure
3. Start MongoDB: `mongod`
4. Seed database: `npm run seed`
5. Start server: `npm run dev`

### Production Deployment

#### Option 1: Heroku (Recommended for beginners)
```bash
# Install Heroku CLI
heroku login

# Create app
heroku create localdeals-hub-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=<your-mongodb-uri>
heroku config:set JWT_SECRET=<your-jwt-secret>

# Deploy
git add .
git commit -m "Deploy backend"
git push heroku main
```

#### Option 2: AWS EC2
```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Clone and setup
git clone <your-repo-url>
cd localdeals-hub/backend
npm install --production

# Configure environment
nano .env  # Add your environment variables

# Start with PM2
pm2 start server.js --name localdeals-api
pm2 startup
pm2 save
```

#### Option 3: DigitalOcean App Platform
1. Connect your GitHub repository
2. Create new app
3. Configure environment variables
4. Deploy

#### Option 4: Docker
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t localdeals-api .
docker run -p 5000:5000 --env-file .env localdeals-api
```

## Environment Configuration

### Required Variables
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/localdeals
JWT_SECRET=your-super-secret-key
```

### Optional Variables
```bash
# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary (Images)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_live_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Redis (Caching)
REDIS_URL=redis://localhost:6379
```

## Database Setup

### MongoDB Atlas (Recommended)
1. Create free cluster at mongodb.com
2. Add database user
3. Whitelist IP addresses (0.0.0.0/0 for development)
4. Get connection string
5. Set as MONGODB_URI in environment

### Local MongoDB
```bash
# Install MongoDB
sudo apt install mongodb  # Ubuntu/Debian
brew install mongodb-community  # Mac

# Start MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # Mac
```

## SSL/TLS Setup

### Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt install certbot  # Ubuntu/Debian

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Using with Express
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
};

https.createServer(options, app).listen(443);
```

## Monitoring & Logging

### PM2 Monitoring
```bash
pm2 monit  # Real-time monitoring
pm2 logs   # View logs
pm2 list   # List processes
```

### Log Rotation
```bash
# Install logrotate
sudo apt install logrotate

# Configure logrotate for PM2
sudo nano /etc/logrotate.d/pm2
```

### Application Monitoring Tools
- **New Relic**: Full-stack monitoring
- **Datadog**: Infrastructure and APM
- **Sentry**: Error tracking
- **LogRocket**: Session replay

## Scaling

### Horizontal Scaling with PM2
```bash
# Start multiple instances
pm2 start server.js -i max --name localdeals-api

# Scale up/down
pm2 scale localdeals-api 4  # 4 instances
```

### Load Balancing with Nginx
```nginx
upstream localdeals {
  server 127.0.0.1:5000;
  server 127.0.0.1:5001;
  server 127.0.0.1:5002;
  server 127.0.0.1:5003;
}

server {
  listen 80;
  server_name api.localdeals.com;
  
  location / {
    proxy_pass http://localdeals;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### Database Scaling
- **Read Replicas**: For read-heavy workloads
- **Sharding**: For large datasets
- **Connection Pooling**: Optimize connections

## Security Best Practices

1. **Environment Variables**
   - Never commit secrets to version control
   - Use strong JWT secrets (256-bit)
   - Rotate secrets regularly

2. **Rate Limiting**
   - Implement stricter limits for sensitive endpoints
   - Use Redis for distributed rate limiting

3. **Input Validation**
   - Validate all inputs on server-side
   - Use parameterized queries
   - Sanitize user inputs

4. **HTTPS Only**
   - Redirect HTTP to HTTPS
   - Use HSTS headers
   - Implement proper CORS

5. **Database Security**
   - Use MongoDB authentication
   - Limit network access
   - Regular backups

## Backup & Recovery

### Database Backups
```bash
# MongoDB dump
mongodump --uri="mongodb://localhost:27017/localdeals" --out=/backups/

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out=/backups/$DATE
tar -czf /backups/localdeals_$DATE.tar.gz /backups/$DATE
rm -rf /backups/$DATE
```

### Application Backup
```bash
# Create deployment package
tar -czf localdeals-api.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=logs \
  .
```

## CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy Backend
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          # Add your deployment commands here
          echo "Deploying to production..."
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MongoDB is running
   - Verify connection string
   - Check firewall settings

2. **JWT Token Invalid**
   - Verify JWT_SECRET matches
   - Check token expiration
   - Ensure proper token format

3. **CORS Errors**
   - Check FRONTEND_URL environment variable
   - Verify client-side origin

4. **Port Already in Use**
   - Find process: `lsof -i :5000`
   - Kill process: `kill -9 <PID>`

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm start

# Node.js inspect
node --inspect server.js
```

## Support

For deployment support:
- Check logs: `pm2 logs`
- Monitor resources: `htop`
- Test connectivity: `curl http://localhost:5000/api/health`

## Next Steps

After deployment:
1. Test all API endpoints
2. Configure domain and SSL
3. Set up monitoring
4. Configure email notifications
5. Enable automated backups
6. Document internal APIs
7. Train team members

---

**LocalDeals Hub Backend** - Production-ready API for local retail promotions.