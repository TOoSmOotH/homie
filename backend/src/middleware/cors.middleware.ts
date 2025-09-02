import cors from 'cors';

// Apply permissive CORS on API routes only. The app serves the SPA and API on the
// same host in production; external TLS/proxy is expected to provide origin controls.
export const corsMiddleware = cors({
  origin: true, // reflect request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});
