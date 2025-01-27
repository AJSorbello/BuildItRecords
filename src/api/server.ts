import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_CONFIG } from '../config';

import releasesRouter from './routes/releases';
import tracksRouter from './routes/tracks';
import artistsRouter from './routes/artists';
import albumsRouter from './routes/albums';
import { errorHandler } from './middleware/error';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.windowMs,
  max: RATE_LIMIT_CONFIG.maxRequests
});
app.use(limiter);

// Routes
app.use('/api/releases', releasesRouter);
app.use('/api/tracks', tracksRouter);
app.use('/api/artists', artistsRouter);
app.use('/api/albums', albumsRouter);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
