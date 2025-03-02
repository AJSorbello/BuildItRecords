export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string
          name: string
          bio: string | null
          profile_image_url: string | null
          profile_image_small_url: string | null
          profile_image_large_url: string | null
          spotify_url: string | null
          label_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          bio?: string | null
          profile_image_url?: string | null
          profile_image_small_url?: string | null
          profile_image_large_url?: string | null
          spotify_url?: string | null
          label_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          bio?: string | null
          profile_image_url?: string | null
          profile_image_small_url?: string | null
          profile_image_large_url?: string | null
          spotify_url?: string | null
          label_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      import_logs: {
        Row: {
          id: number
          label_id: string | null
          status: string
          message: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          label_id?: string | null
          status: string
          message?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          label_id?: string | null
          status?: string
          message?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      labels: {
        Row: {
          id: string
          name: string
          display_name: string
          slug: string
          playlist_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          display_name: string
          slug: string
          playlist_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          slug?: string
          playlist_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      release_artists: {
        Row: {
          release_id: string
          artist_id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          release_id: string
          artist_id: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          release_id?: string
          artist_id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      releases: {
        Row: {
          id: string
          title: string
          release_date: string | null
          artwork_url: string | null
          spotify_url: string | null
          label_id: string | null
          primary_artist_id: string | null
          created_at: string
          updated_at: string
          status: string | null
        }
        Insert: {
          id: string
          title: string
          release_date?: string | null
          artwork_url?: string | null
          spotify_url?: string | null
          label_id?: string | null
          primary_artist_id?: string | null
          created_at?: string
          updated_at?: string
          status?: string | null
        }
        Update: {
          id?: string
          title?: string
          release_date?: string | null
          artwork_url?: string | null
          spotify_url?: string | null
          label_id?: string | null
          primary_artist_id?: string | null
          created_at?: string
          updated_at?: string
          status?: string | null
        }
      }
      track_artists: {
        Row: {
          track_id: string
          artist_id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          track_id: string
          artist_id: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          track_id?: string
          artist_id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      tracks: {
        Row: {
          id: string
          title: string
          duration: number
          track_number: number | null
          disc_number: number | null
          isrc: string | null
          preview_url: string | null
          spotify_url: string | null
          release_id: string | null
          label_id: string | null
          created_at: string
          updated_at: string
          status: string | null
        }
        Insert: {
          id: string
          title: string
          duration: number
          track_number?: number | null
          disc_number?: number | null
          isrc?: string | null
          preview_url?: string | null
          spotify_url?: string | null
          release_id?: string | null
          label_id?: string | null
          created_at?: string
          updated_at?: string
          status?: string | null
        }
        Update: {
          id?: string
          title?: string
          duration?: number
          track_number?: number | null
          disc_number?: number | null
          isrc?: string | null
          preview_url?: string | null
          spotify_url?: string | null
          release_id?: string | null
          label_id?: string | null
          created_at?: string
          updated_at?: string
          status?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
