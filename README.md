# LocalDeals Hub Backend API

A comprehensive Node.js/Express backend for the LocalDeals Hub platform, providing RESTful APIs for managing local retail deals, stores, users, and analytics.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Store Management**: Complete CRUD operations for retail stores with geospatial queries
- **Deal Management**: Advanced deal creation, filtering, and tracking with countdown timers
- **User Management**: User profiles, preferences, saved deals, and redemption tracking
- **Analytics System**: Comprehensive analytics for stores, deals, and user behavior
- **Admin Dashboard**: Admin-only endpoints for managing the platform
- **Security**: Rate limiting, input validation, and security middleware
- **Email Integration**: Ready for email notifications and marketing campaigns

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, bcryptjs, express-rate-limit
- **Image Upload**: Multer, Cloudinary integration ready
- **Payments**: Stripe integration ready
- **Email**: Nodemailer integration ready
- **Geospatial**: MongoDB 2dsphere indexes with Leaflet/MapBox integration

## Project Structure

```
backend/
├── models/           # Database models
├── routes/           # API route handlers
├── middleware/       # Custom middleware
├── controllers/      # Business logic (future expansion)
├── utils/            # Utility functions
├── scripts/          # Database scripts
├── .env.example      # Environment variables template
├── package.json      # Dependencies
├── server.js         # Main server file
└── README.md         # Documentation
```

## Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   - MongoDB connection string
   - JWT secret
   - Email credentials
   - Stripe keys (for payments)
   - Cloudinary credentials (for images)

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on port 5000 (or PORT environment variable).

## Sample Data

After running the seed script, you'll have sample data with these login credentials:

- **Customer**: `customer@example.com` / `Customer123`
- **Store Owner**: `owner@example.com` / `Owner123`
- **Admin**: `admin@example.com` / `Admin123`

## API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phone": "+1234567890",
  "role": "customer" // or "store_owner"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

#### Get Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Stores

#### Get All Stores
```http
GET /api/stores?page=1&limit=10&category=clothing&sort=rating
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `category`: Filter by category
- `city`: Filter by city
- `search`: Text search
- `lat`, `lng`, `radius`: Geospatial search
- `sort`: Sort by 'rating', 'name', 'newest', 'popular'

#### Get Store by ID
```http
GET /api/stores/:id
```

#### Create Store (Store Owner/Admin only)
```http
POST /api/stores
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Store",
  "description": "Store description...",
  "category": "clothing",
  "contact": {
    "email": "store@example.com",
    "phone": "+1234567890"
  },
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  },
  "hours": {
    "mon": "9AM-6PM",
    "tue": "9AM-6PM"
  },
  "features": ["Free WiFi", "Parking"]
}
```

#### Update Store
```http
PUT /api/stores/:id
Authorization: Bearer <token>
Content-Type: application/json
```

#### Get Store Deals
```http
GET /api/stores/:id/deals
```

#### Get Nearby Stores
```http
GET /api/stores/nearby?lat=40.7128&lng=-74.0060&radius=5&limit=10
```

### Deals

#### Get All Deals
```http
GET /api/deals?page=1&limit=10&category=electronics&sort=ending&status=active
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `category`: Filter by category
- `store`: Filter by store ID
- `type`: Filter by deal type
- `status`: 'active', 'upcoming', 'expired'
- `search`: Text search
- `featured`: true/false
- `sort`: 'ending', 'newest', 'popular', 'discount'

#### Get Deal by ID
```http
GET /api/deals/:id
```

#### Create Deal (Store Owner/Admin only)
```http
POST /api/deals
Authorization: Bearer <token>
Content-Type: application/json

{
  "store": "store_id",
  "title": "Amazing Deal",
  "description": "Deal description...",
  "category": "electronics",
  "type": "percentage",
  "discount": {
    "percentage": 25
  },
  "pricing": {
    "originalPrice": 100,
    "salePrice": 75
  },
  "schedule": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.000Z"
  },
  "images": {
    "main": "deal-image-url"
  },
  "tags": ["electronics", "sale"]
}
```

#### Track Deal Click
```http
POST /api/deals/:id/click
```

#### Save Deal
```http
POST /api/deals/:id/save
Authorization: Bearer <token>
```

#### Generate QR Code
```http
GET /api/deals/:id/qrcode
Authorization: Bearer <token>
```

#### Get Featured Deals
```http
GET /api/deals/featured/list?limit=10
```

#### Get Popular Deals
```http
GET /api/deals/popular/list?limit=10
```

### User Profile

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "preferences": {
    "categories": ["electronics", "clothing"],
    "notifications": {
      "email": true,
      "sms": false
    }
  }
}
```

#### Get Saved Deals
```http
GET /api/users/saved-deals
Authorization: Bearer <token>
```

#### Get Redemptions
```http
GET /api/users/redemptions?status=active
Authorization: Bearer <token>
```

#### Add Favorite Store
```http
POST /api/users/favorite-stores/:storeId
Authorization: Bearer <token>
```

### Analytics (Store Owners/Admin)

#### Get Store Analytics
```http
GET /api/analytics/store/:storeId?period=7d
Authorization: Bearer <token>
```

#### Get Deal Analytics
```http
GET /api/analytics/deal/:dealId?period=7d
Authorization: Bearer <token>
```

### Admin (Admin only)

#### Get Admin Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer <token>
```

#### Get Pending Stores
```http
GET /api/admin/stores/pending
Authorization: Bearer <token>
```

#### Verify Store
```http
PUT /api/admin/stores/:id/verify
Authorization: Bearer <token>
```

#### Get Pending Deals
```http
GET /api/admin/deals/pending
Authorization: Bearer <token>
```

#### Approve Deal
```http
PUT /api/admin/deals/:id/approve
Authorization: Bearer <token>
```

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

Error Response Format:
```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message",
      "value": "submitted value"
    }
  ]
}
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 100 requests per 15 minutes per IP address
- Authenticated users may have higher limits

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Tokens**: Secure authentication with configurable expiration
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Configured for cross-origin requests
- **Helmet**: Security headers middleware
- **MongoDB Injection Protection**: Using Mongoose parameterized queries

## Database Schema

### User
- Authentication credentials
- Profile information
- Preferences and settings
- Saved deals and favorite stores
- Location data for local recommendations

### Store
- Business information
- Contact details
- Address with geospatial coordinates
- Operating hours
- Images and branding
- Subscription status
- Analytics tracking

### Deal
- Product/service information
- Pricing and discounts
- Scheduling (start/end dates)
- Inventory tracking
- Visibility settings
- Analytics tracking
- QR code generation

### Subscription
- Plan details and features
- Billing information
- Payment method tokens
- Usage tracking
- Status management

### Analytics
- Event tracking (views, clicks, saves, redemptions)
- User behavior data
- Location-based analytics
- Device and browser information

### Redemption
- Deal usage tracking
- QR code validation
- Customer verification
- Usage limits and expiration

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/localdeals` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `EMAIL_HOST` | SMTP server host | - |
| `EMAIL_PORT` | SMTP server port | `587` |
| `EMAIL_USER` | SMTP username | - |
| `EMAIL_PASS` | SMTP password | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |
| `REDIS_URL` | Redis connection URL | - |

## Development

### Running in Development
```bash
npm run dev
```

Uses nodemon for automatic server restart on file changes.

### Testing
```bash
npm test
```

### Database Seeding
```bash
npm run seed
```

## Production Deployment

1. Set environment variables
2. Install production dependencies: `npm install --production`
3. Build frontend if applicable
4. Start server: `npm start`

Recommended hosting platforms:
- Heroku
- AWS EC2
- DigitalOcean
- Vercel (for serverless)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

---

**LocalDeals Hub Backend API** - Connecting local businesses with customers through amazing deals and promotions.