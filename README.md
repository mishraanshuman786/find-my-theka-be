# Find My Theka - Express Backend

A RESTful API backend for the "Find My Theka" mobile application. This backend handles user authentication and proxies requests to the Mappls (MapmyIndia) API to find nearby liquor shops (thekas).

## Features

- **User Authentication** - JWT-based registration and login
- **Nearby Places Search** - Proxy to Mappls API for finding liquor shops
- **Search History** - Track user searches with PostgreSQL
- **Input Validation** - Express-validator for request validation
- **Security** - Helmet, CORS, and secure password hashing

## Project Structure

```
find-my-theka-backend/
├── server.js           # Express server entry point
├── db.js               # PostgreSQL database functions
├── package.json        # Dependencies
├── .env                # Environment variables
├── .env.example        # Environment variables template
├── middleware/
│   └── auth.js         # JWT authentication middleware
└── routes/
    ├── auth.js         # Authentication routes
    ├── places.js       # Places/nearby search routes
    └── health.js       # Health check route
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get user profile (protected) |

### Places
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/places/nearby` | Find nearby liquor shops |
| POST | `/api/places/search` | Search with specific parameters |
| GET | `/api/places/history` | Get search history (protected) |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

3. Start the server:
```bash
npm run dev     # Development (with nodemon)
npm start       # Production
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3001 |
| DATABASE_URL | PostgreSQL connection string | - |
| JWT_SECRET | Secret key for JWT tokens | findmytheka-secret-key-2024 |
| MAPPLS_ACCESS_TOKEN | Mappls API access token | - |
| DEFAULT_RADIUS | Default search radius in meters | 5000 |

## Example API Requests

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "password123"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}'
```

### Find Nearby Liquor Shops
```bash
curl "http://localhost:3001/api/places/nearby?lat=25.4359135&lng=82.8534563&radius=5000"
```

### Find Nearby (with auth token)
```bash
curl "http://localhost:3001/api/places/nearby?lat=25.4359135&lng=82.8534563" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Mappls API Integration

The backend proxies requests to the Mappls Places Nearby API:

```
https://search.mappls.com/search/places/nearby/json
  ?keywords=RTSWIN
  &refLocation={lat},{lng}
  &radius=5000
  &page=1
  &region=IND
  &sortBy=dist:asc
  &access_token={MAPPLS_ACCESS_TOKEN}
```

The `RTSWIN` keyword is used to find liquor/wine shops in India.

## License

MIT
