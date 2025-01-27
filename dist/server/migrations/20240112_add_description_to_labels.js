'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
module.exports = {
    up: (queryInterface, Sequelize) => __awaiter(void 0, void 0, void 0, function* () {
        yield queryInterface.addColumn('labels', 'description', {
            type: Sequelize.TEXT,
            allowNull: true
        });
        // Add descriptions for existing labels
        yield queryInterface.bulkUpdate('labels', { description: 'The main label for Build It Records, featuring a diverse range of electronic music.' }, { id: 'buildit-records' });
        yield queryInterface.bulkUpdate('labels', { description: 'Our techno-focused sublabel, delivering cutting-edge underground sounds.' }, { id: 'buildit-tech' });
        yield queryInterface.bulkUpdate('labels', { description: 'Deep and melodic electronic music from emerging and established artists.' }, { id: 'buildit-deep' });
    }),
    down: (queryInterface, Sequelize) => __awaiter(void 0, void 0, void 0, function* () {
        yield queryInterface.removeColumn('labels', 'description');
    })
};
