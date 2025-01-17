"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const express = require('express');
const router = express.Router();
// Import route handlers
const tracksRouter = require('./tracks');
const artistsRouter = require('./artists');
const releasesRouter = require('./releases');
const { router: adminRouter, verifyToken } = require('./admin');
const { router: labelsRouter, importTracksForLabel } = require('./labels');
// Mount import route first
router.post('/labels/:labelId/import', verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Import route hit:', {
        method: req.method,
        url: req.url,
        params: req.params,
        labelId: req.params.labelId,
        token: req.headers.authorization ? 'present' : 'missing'
    });
    try {
        const result = yield importTracksForLabel(req.params.labelId);
        res.json(result);
    }
    catch (error) {
        console.error('Error in import route:', error);
        res.status(500).json({ error: error.message });
    }
}));
// Mount other routes
router.use('/labels', labelsRouter);
router.use('/artists', artistsRouter);
router.use('/releases', releasesRouter);
router.use('/tracks', tracksRouter);
router.use('/admin', adminRouter);
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
module.exports = router;
