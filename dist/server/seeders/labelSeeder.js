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
const { Label } = require('../models');
const INITIAL_LABELS = [
    {
        id: 'buildit-records',
        name: 'Build It Records',
        display_name: 'Build It Records',
        slug: 'buildit-records'
    },
    {
        id: 'buildit-tech',
        name: 'Build It Tech',
        display_name: 'Build It Tech',
        slug: 'buildit-tech'
    },
    {
        id: 'buildit-deep',
        name: 'Build It Deep',
        display_name: 'Build It Deep',
        slug: 'buildit-deep'
    }
];
const seedLabels = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Seeding labels...');
        yield Label.bulkCreate(INITIAL_LABELS, {
            updateOnDuplicate: ['name', 'display_name', 'updated_at']
        });
        console.log('Labels seeded successfully');
    }
    catch (error) {
        console.error('Error seeding labels:', error);
        throw error;
    }
});
module.exports = {
    seedLabels,
    INITIAL_LABELS
};
