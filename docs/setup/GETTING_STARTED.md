# Getting Started with Build It Records

## Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/BuildItRecords.git
cd BuildItRecords
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

4. **Start development server**
```bash
npm run dev
```

## Prerequisites

- Node.js 16+
- npm or yarn
- PostgreSQL 13+
- Spotify Developer Account

## Environment Setup

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/buildit

# Spotify API
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# Auth
JWT_SECRET=your_jwt_secret
```

## Development Workflow

1. Make changes in a feature branch
2. Run tests: `npm test`
3. Format code: `npm run format`
4. Submit PR for review
