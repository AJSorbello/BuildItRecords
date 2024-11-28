// Function to generate a random string for the state parameter
export const generateRandomString = (length: number): string => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

// Function to generate code challenge from verifier
export const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  
  // Convert ArrayBuffer to string using Uint8Array
  const base64 = btoa(
    Array.from(new Uint8Array(digest))
      .map(byte => String.fromCharCode(byte))
      .join('')
  );
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Spotify authentication configuration
export const spotifyConfig = {
  clientId: process.env.REACT_APP_SPOTIFY_CLIENT_ID as string,
  redirectUri: 'http://localhost:3000/callback',
  authEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
  scopes: [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative'
  ]
};

// Function to initiate Spotify login
export const initiateSpotifyLogin = async () => {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(16);

  // Store code verifier and state in localStorage for later verification
  localStorage.setItem('code_verifier', codeVerifier);
  localStorage.setItem('state', state);

  const params = new URLSearchParams({
    client_id: spotifyConfig.clientId,
    response_type: 'code',
    redirect_uri: spotifyConfig.redirectUri,
    state: state,
    scope: spotifyConfig.scopes.join(' '),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  });

  window.location.href = `${spotifyConfig.authEndpoint}?${params.toString()}`;
};

// Function to exchange code for access token
export const getAccessToken = async (code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> => {
  const verifier = localStorage.getItem('code_verifier');
  
  const params = new URLSearchParams({
    client_id: spotifyConfig.clientId,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: spotifyConfig.redirectUri,
    code_verifier: verifier!
  });

  const response = await fetch(spotifyConfig.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!response.ok) {
    throw new Error('Failed to get access token');
  }

  const data = await response.json();
  return data;
};

// Function to refresh access token
export const refreshAccessToken = async (refresh_token: string): Promise<{
  access_token: string;
  expires_in: number;
}> => {
  const params = new URLSearchParams({
    client_id: spotifyConfig.clientId,
    grant_type: 'refresh_token',
    refresh_token: refresh_token
  });

  const response = await fetch(spotifyConfig.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  return data;
};
