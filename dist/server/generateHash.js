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
const bcrypt = require('bcryptjs');
// Set a simple password for testing
const password = 'admin123';
function generateHash() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const salt = yield bcrypt.genSalt(10);
            console.log('Salt generated:', salt);
            const hash = yield bcrypt.hash(password, salt);
            console.log('\nPassword:', password);
            console.log('Generated hash:', hash);
            // Verify the hash works
            const isValid = yield bcrypt.compare(password, hash);
            console.log('\nHash verification:', isValid ? 'SUCCESSFUL' : 'FAILED');
            console.log('\nAdd these to your .env file:');
            console.log('ADMIN_USERNAME=admin');
            console.log(`ADMIN_PASSWORD_HASH=${hash}`);
            console.log('JWT_SECRET=buildit_records_jwt_secret_key');
        }
        catch (error) {
            console.error('Error generating hash:', error);
        }
    });
}
generateHash();
