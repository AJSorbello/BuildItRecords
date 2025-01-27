import express from 'express';
import tracksRouter from './tracks';
import albumsRouter from './albums';

const router = express.Router();

router.use('/tracks', tracksRouter);
router.use('/albums', albumsRouter);

export default router;
