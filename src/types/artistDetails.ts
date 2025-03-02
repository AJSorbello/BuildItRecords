import { Artist } from './artist';
import { SocialLink } from './social';

export interface ArtistWithDetails extends Artist {
  banner_image_url?: string;
  bio?: string;
  social_links?: SocialLink[];
}

export interface SocialLink {
  url: string;
  platform: string;
}
