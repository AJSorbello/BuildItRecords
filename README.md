# BuildIt Records

A modern web application for BuildIt Records music production studio with Spotify integration.

## Features

- Modern, responsive UI built with React and Material-UI
- Spotify integration for music management
- Label management system
- Artist and track organization
- Secure authentication system
- Cloud-based database with Supabase

## Technology Stack

### Frontend
- React 18
- Material-UI (MUI)
- TypeScript
- React Router DOM
- Framer Motion for animations
- Spotify Web API integration

### Backend
- Node.js with Express.js
- Supabase (PostgreSQL) for database
- Sequelize ORM
- RESTful API architecture
- JWT authentication
- Security middleware (helmet, cors, rate-limiting)

### Development Tools
- Nodemon for hot-reloading
- ESLint & Prettier for code formatting
- TypeScript for type safety
- Concurrently for running multiple scripts

## Project Structure
```
/
├── server/                 # Backend server code
│   ├── config/            # Configuration files
│   ├── models/            # Sequelize models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── seeders/           # Database seeders
├── src/                   # Frontend React code
├── public/               # Static files
└── package.json         # Project dependencies
```

## Getting Started

1. Install dependencies:
```bash
yarn install
```

2. Set up environment variables:
- Copy `.env.example` to `.env`
- Fill in required environment variables:
  - Supabase credentials
  - Spotify API credentials
  - JWT secret

3. Start development servers:
```bash
# Start both frontend and backend
yarn dev

# Start backend only
yarn server

# Start frontend only
yarn client
```

## Database Configuration

This project uses Supabase as the database provider. The following environment variables are required for database connection:

```env
POSTGRES_URL=your_supabase_postgres_url
POSTGRES_PRISMA_URL=your_supabase_prisma_url
SUPABASE_URL=your_supabase_project_url
POSTGRES_URL_NON_POOLING=your_non_pooling_url
SUPABASE_JWT_SECRET=your_jwt_secret
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DATABASE=your_database_name
POSTGRES_HOST=your_supabase_host
```

## Development

This project uses:
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Nodemon for automatic server restarting
- Concurrently to run multiple processes

## Environment Variables

Required environment variables:
- Supabase Configuration (see Database Configuration section)
- `SPOTIFY_CLIENT_ID`: Spotify API client ID
- `SPOTIFY_CLIENT_SECRET`: Spotify API client secret
- `JWT_SECRET`: Secret for JWT token generation
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)

## API Documentation

The backend provides RESTful APIs for:
- Label management
- Artist management
- Track management
- Spotify integration
- User authentication

## Security

- JWT-based authentication
- Rate limiting to prevent abuse
- CORS protection
- Secure headers with Helmet
- Environment variable protection
- Supabase security features
