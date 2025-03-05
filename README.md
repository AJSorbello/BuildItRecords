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

## Spotify Integration

### Configuration
The application maintains a list of Spotify artist IDs for each label in `server/config/spotify.js`. This is necessary for:
1. Displaying artists on each label's page
2. Ensuring we can show the complete artist roster for each label
3. Maintaining relationships between artists and their releases

### Data Import
The application imports two types of data from Spotify:
1. **Artists**: Using the configured Spotify artist IDs for each label
2. **Releases**: By searching for releases from each label name on Spotify

To import data:
```bash
# Import artists and releases for Build It Tech
node server/scripts/importReleases.js
```

### Finding Spotify Artist IDs
To find an artist's Spotify ID:
1. Open the artist's Spotify page
2. Click "Share" and "Copy Spotify URI"
3. The ID is the string after "spotify:artist:"
4. Add this ID to the appropriate label's artist list in `server/config/spotify.js`

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

## Deployment

### Vercel Deployment

The application is configured for deployment on Vercel with serverless API functions.

#### API Structure for Vercel

The serverless API is organized in the `/api` directory:
- `/api/artists` - Artist endpoints
- `/api/releases` - Release endpoints 
- `/api/db-diagnostic` - Database diagnostic tools
- `/api/utils` - Shared utilities and database connection helpers

All API endpoints include CORS headers to allow cross-origin requests.

#### Manual Deployment

To deploy manually to Vercel:

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy the application:
```bash
vercel --prod
```

#### GitHub Actions Automated Deployment

The repository includes a GitHub Actions workflow for automated deployments to Vercel:

1. The workflow is defined in `.github/workflows/vercel-deploy.yml`
2. It triggers automatically on pushes to the `main` branch
3. Required secrets:
   - `VERCEL_TOKEN`: Your Vercel API token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

#### Verifying the Deployment

Run the verification script to check if API endpoints are working:

```bash
node verify-production-api.js
```

This script tests all API endpoints and returns diagnostic information about their response.

### API Endpoints

The following API endpoints are available:

#### Diagnostic
- `GET /api/diagnostic` - Provides comprehensive database information including schema details, table counts, and data relationships

#### Artists
- `GET /api/artists` - Get all artists (with optional pagination)
- `GET /api/artists?label=buildit-records` - Get artists for a specific label
- `GET /api/artists/{id}` - Get a specific artist by ID

#### Releases
- `GET /api/releases` - Get all releases (with optional pagination)
- `GET /api/releases?label=buildit-records` - Get releases for a specific label
- `GET /api/releases/{id}` - Get a specific release by ID

#### Labels
- All label IDs:
  - `buildit-records` - BuildIt Records
  - `buildit-tech` - BuildIt Tech
  - `buildit-deep` - BuildIt Deep

All API endpoints return JSON responses and include proper error handling and CORS headers.
