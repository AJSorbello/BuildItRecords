# Product Requirements Document (PRD)

## **Project Overview**
This document outlines the requirements and functionality for a React application using TypeScript to interact with Spotify's SDK for data retrieval and PostgreSQL as the database. The application uses the Spotify SDK to fetch music data (artists and releases) and stores the data in a PostgreSQL database. The frontend displays this data, and an Admin Dashboard allows management by label.

## **Key Components**

### **1. Database Schema**

#### **Labels Table**
```sql
CREATE TABLE labels (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Artists Table**
```sql
CREATE TABLE artists (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    label_id VARCHAR(255) REFERENCES labels(id),
    spotify_url VARCHAR(255),
    images JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Releases Table**
```sql
CREATE TABLE releases (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist_id VARCHAR(255) REFERENCES artists(id),
    label_id VARCHAR(255) REFERENCES labels(id),
    release_date DATE,
    images JSONB DEFAULT '[]',
    spotify_url VARCHAR(255),
    external_urls JSONB DEFAULT '{}',
    external_ids JSONB DEFAULT '{}',
    popularity INTEGER,
    total_tracks INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Tracks Table**
```sql
CREATE TABLE tracks (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist_id VARCHAR(255) REFERENCES artists(id),
    release_id VARCHAR(255) REFERENCES releases(id),
    label_id VARCHAR(255) REFERENCES labels(id),
    duration_ms INTEGER,
    preview_url VARCHAR(255),
    spotify_url VARCHAR(255),
    external_urls JSONB DEFAULT '{}',
    uri VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **2. Label Configuration**
The application manages three distinct labels:
- Build It Records (ID: buildit-records)
- Build It Deep (ID: buildit-deep)
- Build It Tech (ID: buildit-tech)

### **3. API Endpoints**

#### Labels
- GET /api/labels - Get all labels
- GET /api/labels/:id - Get label by ID
- GET /api/labels/:id/artists - Get artists for a label
- GET /api/labels/:id/releases - Get releases for a label

#### Artists
- GET /api/artists - Get all artists
- GET /api/artists/:id - Get artist by ID
- GET /api/artists/:id/releases - Get releases for an artist
- POST /api/artists - Create new artist
- PUT /api/artists/:id - Update artist
- DELETE /api/artists/:id - Delete artist

#### Releases
- GET /api/releases - Get all releases
- GET /api/releases/:id - Get release by ID
- GET /api/releases/:id/tracks - Get tracks for a release
- POST /api/releases - Create new release
- PUT /api/releases/:id - Update release
- DELETE /api/releases/:id - Delete release

#### Tracks
- GET /api/tracks - Get all tracks
- GET /api/tracks/:id - Get track by ID
- POST /api/tracks - Create new track
- PUT /api/tracks/:id - Update track
- DELETE /api/tracks/:id - Delete track

### **4. CORS Configuration**

#### Development Environment
```javascript
{
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}
```

#### Production Environment
```javascript
{
  origin: 'https://builditrecords.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}
```

#### Content Security Policy
```javascript
{
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline'",
  'connect-src': "'self' http://localhost:3000 http://localhost:3001 https://api.spotify.com https://accounts.spotify.com",
  'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src': "'self' https://fonts.gstatic.com",
  'img-src': "'self' data: https:",
  'frame-src': "'self' https://accounts.spotify.com",
  'form-action': "'self'"
}
```

### **5. Environment Variables**
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=builditrecords
DB_HOST=localhost
DB_PORT=5432

# Spotify Configuration
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

### **6. Frontend Routes**
- / - Home page
- /admin - Admin dashboard
- /labels/:id - Label page
- /artists/:id - Artist page
- /releases/:id - Release page
- /callback - Spotify OAuth callback

### **7. Error Handling**
All API endpoints should return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

### **8. Data Flow**
1. Admin authenticates with Spotify
2. Admin selects label to import data
3. Backend searches Spotify for artists
4. Backend retrieves releases for each artist
5. Data is stored in PostgreSQL
6. Frontend fetches and displays data from PostgreSQL

### **9. Security Considerations**
- Use environment variables for sensitive data
- Implement rate limiting
- Validate all user input
- Use CORS protection
- Implement proper error handling
- Log security-related events

### **10. Performance Requirements**
- API response time < 500ms
- Database queries optimized with proper indexes
- Frontend initial load time < 2s
- Caching implementation for frequently accessed data

### **11. Testing Requirements**
- Unit tests for all API endpoints
- Integration tests for database operations
- End-to-end tests for critical user flows
- Frontend component testing
- Performance testing for data imports

### **11. Admin Dashboard Features**
#### Label Management
- View all labels
- Select label to manage releases
- Import releases from Spotify
- View total number of releases per label

#### Release Management
- View all releases for selected label
- Paginated display (10 releases per page)
- Sort releases by release date
- Display release artwork
- Show artist information
- Show preview player for tracks

#### Import Process
- One-click import from Spotify
- Automatic pagination through Spotify results
- Save to PostgreSQL database
- Display import progress
- Error handling and recovery
- Automatic refresh after import

#### UI/UX Features
- Loading states for:
  - Fetching releases
  - Importing from Spotify
- Error messages for:
  - Failed imports
  - Failed data fetches
  - Authentication issues
- Pagination controls with:
  - First/Last page buttons
  - Page numbers
  - Current page indicator

### **12. Data Models**

#### Artist-Release Associations
```sql
CREATE TABLE release_artists (
    release_id VARCHAR(255) REFERENCES releases(id),
    artist_id VARCHAR(255) REFERENCES artists(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (release_id, artist_id)
);
```

#### Track-Artist Associations
```sql
CREATE TABLE track_artists (
    track_id VARCHAR(255) REFERENCES tracks(id),
    artist_id VARCHAR(255) REFERENCES artists(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (track_id, artist_id)
);
```

### **13. Spotify Integration**
#### Search Parameters
- Label-based search
- Pagination with 50 items per request
- Rate limiting protection
- Error handling for:
  - API limits
  - Authentication issues
  - Network errors

#### Data Mapping
- Release data:
  - Name
  - Release date
  - Artwork URL
  - Spotify URL
  - Total tracks
- Artist data:
  - Name
  - Profile image
  - Spotify URL
- Track data:
  - Name
  - Duration
  - Preview URL
  - Track number

### **14. Performance Optimizations**
- Database indexing on:
  - Label IDs
  - Release dates
  - Artist names
- Pagination implementation:
  - Server-side pagination
  - Limit of 10 items per page
  - Total count tracking
- Caching strategy:
  - Database-first approach
  - Import only when requested
  - Reuse existing data

### **15. Future Enhancements**
- Bulk import/export functionality
- Advanced search and filtering
- Release statistics and analytics
- Artist profile management
- Track preview player
- Release scheduling
- User authentication levels
- Activity logging
- Data backup system

## **Development Guidelines**

### **1. Code Style**
- Use ESLint for JavaScript/TypeScript linting
- Follow Prettier code formatting
- Use TypeScript for type safety
- Document all functions and components
- Follow React best practices

### **2. Git Workflow**
- Feature branches for new development
- Pull requests for code review
- Semantic versioning
- Conventional commits

### **3. Documentation**
- API documentation using OpenAPI/Swagger
- README files for setup instructions
- Code comments for complex logic
- Change log for version history

### **4. Deployment**
- Docker containers for consistent environments
- CI/CD pipeline for automated testing and deployment
- Backup strategy for database
- Monitoring and logging setup
