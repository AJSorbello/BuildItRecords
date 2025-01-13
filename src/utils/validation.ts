/**
 * Validation utilities for form inputs
 * @module validation
 */

import { z } from 'zod';

/**
 * Schema for validating artist information
 */
export const artistSchema = z.object({
  name: z.string().min(2, 'Artist name must be at least 2 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  province: z.string().min(2, 'Province/State must be at least 2 characters'),
  facebook: z.string()
    .url('Invalid Facebook URL')
    .refine((url: string) => url.includes('facebook.com'), 'Must be a Facebook URL')
    .optional()
    .or(z.literal('')),
  twitter: z.string()
    .url('Invalid Twitter URL')
    .refine((url: string) => url.includes('twitter.com'), 'Must be a Twitter URL')
    .optional()
    .or(z.literal('')),
  instagram: z.string()
    .url('Invalid Instagram URL')
    .refine((url: string) => url.includes('instagram.com'), 'Must be an Instagram URL')
    .optional()
    .or(z.literal('')),
  soundcloud: z.string()
    .url('Invalid SoundCloud URL')
    .refine((url: string) => url.includes('soundcloud.com'), 'Must be a SoundCloud URL')
    .optional()
    .or(z.literal('')),
  spotify: z.string()
    .url('Invalid Spotify URL')
    .refine((url: string) => url.includes('spotify.com'), 'Must be a Spotify URL')
    .optional()
    .or(z.literal('')),
  appleMusic: z.string()
    .url('Invalid Apple Music URL')
    .refine((url: string) => url.includes('music.apple.com'), 'Must be an Apple Music URL')
    .optional()
    .or(z.literal(''))
});

/**
 * Schema for validating track information
 */
export const trackSchema = z.object({
  title: z.string().min(2, 'Track title must be at least 2 characters'),
  soundCloudLink: z.string()
    .url('Invalid SoundCloud URL')
    .refine((url: string) => url.includes('soundcloud.com'), 'Must be a SoundCloud URL'),
  genre: z.enum(['house', 'techno', 'deep-house', 'tech-house'], {
    errorMap: () => ({ message: 'Please select a valid genre' })
  })
});

/**
 * Schema for validating the complete demo submission form
 */
export const demoSubmissionSchema = z.object({
  artists: z.array(artistSchema).min(1, 'At least one artist is required'),
  tracks: z.array(trackSchema).min(1, 'At least one track is required')
});

/**
 * Type definitions for form data
 */
export type Artist = z.infer<typeof artistSchema>;
export type Track = z.infer<typeof trackSchema>;
export type DemoSubmission = z.infer<typeof demoSubmissionSchema>;

/**
 * Validates form data and returns validation errors if any
 * @param data - The form data to validate
 * @returns Object containing validation result and any errors
 */
export const validateDemoSubmission = async (data: unknown): Promise<{
  success: boolean;
  errors?: z.ZodError;
  data?: DemoSubmission;
}> => {
  try {
    const validatedData = await demoSubmissionSchema.parseAsync(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};
