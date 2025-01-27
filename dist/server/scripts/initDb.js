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
const { sequelize } = require('../models');
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Sync all models with the database
            yield sequelize.sync({ force: true });
            console.log('Database synchronized successfully');
            // Create default labels
            const labels = [
                {
                    name: 'Build It Records',
                    slug: 'records',
                    description: 'House Music Label',
                },
                {
                    name: 'Build It Tech',
                    slug: 'tech',
                    description: 'Techno & Tech House Label',
                },
                {
                    name: 'Build It Deep',
                    slug: 'deep',
                    description: 'Deep House Label',
                },
            ];
            yield sequelize.models.Label.bulkCreate(labels);
            console.log('Default labels created');
            console.log('Database initialization completed');
        }
        catch (error) {
            console.error('Error initializing database:', error);
            process.exit(1);
        }
    });
}
initializeDatabase();
