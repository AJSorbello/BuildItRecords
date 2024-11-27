/**
 * Custom hook for handling demo submission form state and validation
 * @module useFormSubmission
 */

import { useState, useCallback } from 'react';
import { Artist, Track, validateDemoSubmission } from '../utils/validation';
import axios from 'axios';

interface FormState {
  artists: Artist[];
  tracks: Track[];
}

interface SubmissionError {
  field: string;
  message: string;
}

interface UseFormSubmissionReturn {
  formState: FormState;
  errors: SubmissionError[];
  isSubmitting: boolean;
  handleArtistChange: (index: number, field: keyof Artist, value: string) => void;
  handleTrackChange: (index: number, field: keyof Track, value: string) => void;
  addArtist: () => void;
  removeArtist: (index: number) => void;
  addTrack: () => void;
  removeTrack: (index: number) => void;
  handleSubmit: (event: React.FormEvent) => Promise<void>;
}

const INITIAL_ARTIST: Artist = {
  name: '',
  fullName: '',
  email: '',
  country: '',
  province: '',
  facebook: '',
  twitter: '',
  instagram: '',
  soundcloud: '',
  spotify: '',
  appleMusic: ''
};

const INITIAL_TRACK: Track = {
  title: '',
  soundCloudLink: '',
  genre: 'house'
};

/**
 * Custom hook for managing demo submission form state and validation
 * @param onSuccess - Callback function to execute on successful submission
 * @returns Form state and handlers
 */
export const useFormSubmission = (
  onSuccess?: () => void
): UseFormSubmissionReturn => {
  const [formState, setFormState] = useState<FormState>({
    artists: [{ ...INITIAL_ARTIST }],
    tracks: [{ ...INITIAL_TRACK }]
  });
  const [errors, setErrors] = useState<SubmissionError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleArtistChange = useCallback((index: number, field: keyof Artist, value: string) => {
    setFormState(prev => ({
      ...prev,
      artists: prev.artists.map((artist, i) =>
        i === index ? { ...artist, [field]: value } : artist
      )
    }));
    // Clear any existing errors for this field
    setErrors(prev => prev.filter(error => !error.field.includes(`artists.${index}.${field}`)));
  }, []);

  const handleTrackChange = useCallback((index: number, field: keyof Track, value: string) => {
    setFormState(prev => ({
      ...prev,
      tracks: prev.tracks.map((track, i) =>
        i === index ? { ...track, [field]: value } : track
      )
    }));
    // Clear any existing errors for this field
    setErrors(prev => prev.filter(error => !error.field.includes(`tracks.${index}.${field}`)));
  }, []);

  const addArtist = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      artists: [...prev.artists, { ...INITIAL_ARTIST }]
    }));
  }, []);

  const removeArtist = useCallback((index: number) => {
    if (formState.artists.length > 1) {
      setFormState(prev => ({
        ...prev,
        artists: prev.artists.filter((_, i) => i !== index)
      }));
    }
  }, [formState.artists.length]);

  const addTrack = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      tracks: [...prev.tracks, { ...INITIAL_TRACK }]
    }));
  }, []);

  const removeTrack = useCallback((index: number) => {
    if (formState.tracks.length > 1) {
      setFormState(prev => ({
        ...prev,
        tracks: prev.tracks.filter((_, i) => i !== index)
      }));
    }
  }, [formState.tracks.length]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors([]);

    try {
      const validationResult = await validateDemoSubmission(formState);

      if (!validationResult.success) {
        const newErrors = validationResult.errors!.errors.map(error => ({
          field: error.path.join('.'),
          message: error.message
        }));
        setErrors(newErrors);
        return;
      }

      // Submit to your API endpoint
      await axios.post('/api/submit-demo', validationResult.data);
      
      // Clear form and show success
      setFormState({
        artists: [{ ...INITIAL_ARTIST }],
        tracks: [{ ...INITIAL_TRACK }]
      });
      onSuccess?.();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrors([{
          field: 'submit',
          message: error.response?.data?.message || 'Failed to submit demo. Please try again.'
        }]);
      } else {
        setErrors([{
          field: 'submit',
          message: 'An unexpected error occurred. Please try again.'
        }]);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, onSuccess]);

  return {
    formState,
    errors,
    isSubmitting,
    handleArtistChange,
    handleTrackChange,
    addArtist,
    removeArtist,
    addTrack,
    removeTrack,
    handleSubmit
  };
};
