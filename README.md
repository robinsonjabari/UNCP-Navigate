# UNCP Navigate

A comprehensive campus navigation system for the University of North Carolina at Pembroke.

## Project Overview

UNCP Navigate is a full-stack web application designed to help students, faculty, and visitors navigate the UNCP campus with ease. The system provides interactive maps, route planning, and location-based services.

## Features

- 🗺️ Interactive campus map
- 📍 Real-time location tracking
- 🚶 Walking directions between buildings
- 🏢 Building and room information
- 🔐 User authentication
- 📱 Mobile-responsive design

## Tech Stack

### Backend

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **API Documentation**: Swagger/OpenAPI

### DevOps

- **Containerization**: Docker & Docker Compose
- **Development**: Hot reload, auto-restart
- **Database**: PostgreSQL with migrations

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd uncp-navigate
```

2. Set up environment variables:

```bash
# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Start the development environment:

```bash
docker-compose up --build
```

### Available Services

- **Backend API**: http://localhost:3000
- **Frontend App**: http://localhost:3001
- **PostgreSQL**: localhost:5432

## Project Structure

```
uncp-navigate/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── app.ts          # Main application entry
│   │   ├── routes/         # API route definitions
│   │   ├── controllers/    # Business logic controllers
│   │   ├── services/       # Business services
│   │   ├── db/            # Database configuration
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript type definitions
│   ├── package.json
│   ├── tsconfig.json
│   └── dockerfile
├── frontend/               # React application
├── docker-compose.yml     # Development environment
└── README.md
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Places

- `GET /api/places` - Get all campus locations
- `GET /api/places/:id` - Get specific location
- `POST /api/places` - Create new location (admin)

### Routing

- `POST /api/routes/directions` - Get directions between points
- `GET /api/routes/optimize` - Optimize route for multiple stops

### Reports

- `GET /api/reports/usage` - Usage analytics
- `POST /api/reports/feedback` - Submit user feedback

## Development

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
npm start
```

### Database Management

```bash
# Run migrations
npm run migrate

# Seed database
npm run seed

# Reset database
npm run db:reset
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- **Project Team**: UNCP Advanced Software Project
- **Institution**: University of North Carolina at Pembroke
- **Course**: Advanced Software Development

## Acknowledgments

- UNCP IT Department for campus data access
- Open source mapping libraries
- Course instructors and teaching assistants
