# UNCP Navigate - Frontend Integration Guide

This document outlines how the frontend integrates with the backend API for the UNCP campus navigation system.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── services/           # API integration layer
│   │   ├── api.ts         # Base API client with auth
│   │   ├── auth.service.ts    # Authentication endpoints
│   │   ├── places.service.ts  # Places/locations endpoints
│   │   ├── routes.service.ts  # Routing/navigation endpoints
│   │   ├── reports.service.ts # Campus reporting endpoints
│   │   └── index.ts       # Service exports
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts       # All API types matching backend
│   ├── components/        # React components
│   ├── pages/            # Route pages
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Utility functions
├── package.json          # Dependencies & scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite build configuration
└── README.md           # This file
```

## 🔌 API Integration

### Base Configuration

The frontend is configured to connect to your backend API:

- **Development**: `http://localhost:5000/api`
- **Production**: Set `VITE_API_URL` environment variable

### Authentication Flow

```typescript
import { AuthService } from "@/services"

// Login
const response = await AuthService.login({
  email: "user@example.com",
  password: "password123",
})

// Token is automatically stored and used for subsequent requests
const profile = await AuthService.getProfile()
```

### API Services

Each service class corresponds to your backend route groups:

1. **AuthService** → `/api/auth/*` routes
2. **PlacesService** → `/api/places/*` routes
3. **RoutesService** → `/api/routes/*` routes
4. **ReportsService** → `/api/reports/*` routes

## 🎯 Key Integration Points

### 1. Type Safety

All TypeScript types match your backend API exactly:

- `User`, `Place`, `Route`, `Report` interfaces
- Request/response types for all endpoints
- Ensures compile-time API contract validation

### 2. Authentication

- JWT token automatically included in requests
- Token stored securely in HTTP-only cookies
- Auto-redirect to login on 401 responses

### 3. Error Handling

- Centralized error handling in API client
- Consistent error response format
- Network timeout and retry logic

### 4. API Methods

#### Places Integration

```typescript
// Search campus locations
const places = await PlacesService.searchPlaces({
  query: "library",
  type: "academic",
  accessibility: true,
})

// Get nearby places
const nearby = await PlacesService.getNearbyPlaces({
  lat: 34.2104,
  lng: -79.0,
  radius: 500,
})
```

#### Routing Integration

```typescript
// Calculate route between points
const route = await RoutesService.getDirections({
  origin: { lat: 34.2104, lng: -79.0 },
  destination: { lat: 34.2204, lng: -79.01 },
  mode: "walking",
  accessibility: false,
})

// Get campus tours
const tours = await RoutesService.getCampusTours({
  duration: 60,
  interests: "academic,history",
})
```

#### Reports Integration

```typescript
// Submit campus report
const report = await ReportsService.createReport({
  type: "maintenance",
  title: "Broken elevator",
  description: "Elevator in Building A is not working",
  location: {
    building: "Building A",
    floor: "2",
    description: "Near the main entrance",
  },
  severity: "high",
})

// Get reports with filtering
const reports = await ReportsService.getReports(
  {
    status: "open",
    type: "safety",
  },
  {
    page: 1,
    limit: 20,
  }
)
```

## 🚀 Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on port 5000

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create `.env.local`:

```
VITE_API_URL=http://localhost:5000/api
VITE_MAP_API_KEY=your_map_api_key
```

### Development Server

```bash
npm run dev
# Runs on http://localhost:3000
# API requests proxied to backend
```

### Build for Production

```bash
npm run build
npm run preview
```

## 🔧 Configuration

### API Client Configuration

```typescript
// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

// Automatic token management
// Request/response interceptors
// Error handling
```

### Proxy Setup

Vite dev server proxies API requests:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

## 📡 Real-time Features

The frontend is prepared for real-time features:

- WebSocket connection setup
- Live location tracking
- Real-time notifications
- Live route updates

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Coverage report
npm run test:coverage
```

## 📱 Mobile Responsiveness

- Responsive design for all screen sizes
- Touch-friendly navigation
- Mobile-optimized map interactions
- PWA capabilities

## 🔒 Security

- HTTPS in production
- Secure cookie storage
- XSS protection
- CSRF protection
- Input validation

## 🚀 Deployment

The frontend can be deployed to:

- Vercel
- Netlify
- AWS S3 + CloudFront
- Docker container

Build output in `dist/` directory is ready for static hosting.

## 🤝 Team Integration

### For Another Developer Taking Over:

1. **API Contract**: All endpoints are documented in service files
2. **Type Definitions**: Complete TypeScript types ensure API compatibility
3. **Service Layer**: Clean separation between UI and API logic
4. **Authentication**: Token management handled automatically
5. **Error Handling**: Consistent error handling patterns
6. **Development Tools**: Hot reload, TypeScript checking, linting

### Key Files to Understand:

- `src/services/api.ts` - Base API client
- `src/types/index.ts` - All API types
- `src/services/*.service.ts` - Endpoint implementations
- `vite.config.ts` - Build and dev configuration

The frontend structure provides a solid foundation that matches your backend exactly, making integration seamless for any developer continuing the work.
