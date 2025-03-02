declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    API_URL?: string;
    SPOTIFY_CLIENT_ID?: string;
    SPOTIFY_CLIENT_SECRET?: string;
    SPOTIFY_REDIRECT_URI?: string;
    SPOTIFY_API_BASE_URL?: string;
    SPOTIFY_ACCOUNTS_URL?: string;
    SPOTIFY_SCOPES?: string;
    DATABASE_PATH?: string;
    API_KEY?: string;
  }
}
