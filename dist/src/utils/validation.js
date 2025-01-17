"use strict";
/**
 * Validation utilities for form inputs
 * @module validation
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDemoSubmission = exports.demoSubmissionSchema = exports.trackSchema = exports.artistSchema = void 0;
const zod_1 = require("zod");
/**
 * Schema for validating artist information
 */
exports.artistSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Artist name must be at least 2 characters'),
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    country: zod_1.z.string().min(2, 'Country must be at least 2 characters'),
    province: zod_1.z.string().min(2, 'Province/State must be at least 2 characters'),
    facebook: zod_1.z.string()
        .url('Invalid Facebook URL')
        .refine((url) => url.includes('facebook.com'), 'Must be a Facebook URL')
        .optional()
        .or(zod_1.z.literal('')),
    twitter: zod_1.z.string()
        .url('Invalid Twitter URL')
        .refine((url) => url.includes('twitter.com'), 'Must be a Twitter URL')
        .optional()
        .or(zod_1.z.literal('')),
    instagram: zod_1.z.string()
        .url('Invalid Instagram URL')
        .refine((url) => url.includes('instagram.com'), 'Must be an Instagram URL')
        .optional()
        .or(zod_1.z.literal('')),
    soundcloud: zod_1.z.string()
        .url('Invalid SoundCloud URL')
        .refine((url) => url.includes('soundcloud.com'), 'Must be a SoundCloud URL')
        .optional()
        .or(zod_1.z.literal('')),
    spotify: zod_1.z.string()
        .url('Invalid Spotify URL')
        .refine((url) => url.includes('spotify.com'), 'Must be a Spotify URL')
        .optional()
        .or(zod_1.z.literal('')),
    appleMusic: zod_1.z.string()
        .url('Invalid Apple Music URL')
        .refine((url) => url.includes('music.apple.com'), 'Must be an Apple Music URL')
        .optional()
        .or(zod_1.z.literal(''))
});
/**
 * Schema for validating track information
 */
exports.trackSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Track title must be at least 2 characters'),
    soundCloudLink: zod_1.z.string()
        .url('Invalid SoundCloud URL')
        .refine((url) => url.includes('soundcloud.com'), 'Must be a SoundCloud URL'),
    genre: zod_1.z.enum(['house', 'techno', 'deep-house', 'tech-house'], {
        errorMap: () => ({ message: 'Please select a valid genre' })
    })
});
/**
 * Schema for validating the complete demo submission form
 */
exports.demoSubmissionSchema = zod_1.z.object({
    artists: zod_1.z.array(exports.artistSchema).min(1, 'At least one artist is required'),
    tracks: zod_1.z.array(exports.trackSchema).min(1, 'At least one track is required')
});
/**
 * Validates form data and returns validation errors if any
 * @param data - The form data to validate
 * @returns Object containing validation result and any errors
 */
const validateDemoSubmission = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validatedData = yield exports.demoSubmissionSchema.parseAsync(data);
        return { success: true, data: validatedData };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return { success: false, errors: error };
        }
        throw error;
    }
});
exports.validateDemoSubmission = validateDemoSubmission;
