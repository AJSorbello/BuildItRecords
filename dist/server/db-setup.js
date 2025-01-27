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
const { models, sequelize } = require('./utils/db');
const { logger } = require('../src/utils/logger');
function setupDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Sync all models with the database
            yield sequelize.sync({ force: true });
            logger.info('Database schema created successfully');
        }
        catch (error) {
            logger.error('Error setting up database:', error);
            process.exit(1);
        }
    });
}
// Run the setup
setupDatabase().then(() => {
    logger.info('Database setup complete');
    process.exit(0);
});
