# Database Migrations

This directory contains all database migrations for the Build It Records project.

## Available Migrations

### 20250206_add_audio_features_to_tracks.js
Adds support for storing Spotify audio features (danceability, energy, etc.) as a JSONB column.
This migration is currently **not applied** as we don't need audio features yet.

To apply this migration when needed:
```bash
npx sequelize-cli db:migrate
```

To revert this migration:
```bash
npx sequelize-cli db:migrate:undo
```

## Notes
- Audio features are only available from Spotify's "Get Audio Features" endpoint
- They are not part of the standard track object
- Only apply this migration if you plan to use audio features in your application
