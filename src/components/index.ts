// Common Components
export { TrackList } from './common/TrackList';

// Admin Components
import ReleaseFormComponent from './admin/ReleaseForm';
export { TrackManager } from './admin/TrackManager';
export { UpdateTracksHelper } from './admin/UpdateTracksHelper';
export const ReleaseForm = ReleaseFormComponent;

// Dialog Components
import EditTrackDialogComponent from './dialogs/EditTrackDialog';
export const EditTrackDialog = EditTrackDialogComponent;

// Feature Components
export { ArtistCard } from './ArtistCard';
export { ArtistProfile } from './ArtistProfile';
export { ErrorBoundary } from './ErrorBoundary';
import FeaturedReleaseComponent from './FeaturedRelease';
export const FeaturedRelease = FeaturedReleaseComponent;
export { Layout } from './Layout';
import LoadingSpinnerComponent from './LoadingSpinner';
export const LoadingSpinner = LoadingSpinnerComponent;
export { MultiArtistDisplay } from './MultiArtistDisplay';
export { ReleaseCard } from './ReleaseCard';
import ReleasesGridComponent from './ReleasesGrid';
export const ReleasesGrid = ReleasesGridComponent;
export { SearchResults } from './SearchResults';
import TopReleasesComponent from './TopReleases';
export const TopReleases = TopReleasesComponent;
export { TrackDetails } from './TrackDetails';
import ErrorMessageComponent from './ErrorMessage';
export const ErrorMessage = ErrorMessageComponent;

// Layout Components
import PageLayoutComponent from './PageLayout';
export const PageLayout = PageLayoutComponent;
import NavigationComponent from './Navigation';
export const Navigation = NavigationComponent;
import TopNavigationComponent from './TopNavigation';
export const TopNavigation = TopNavigationComponent;
import DeepSidebarComponent from './DeepSidebar';
export const DeepSidebar = DeepSidebarComponent;
import RecordsSidebarComponent from './RecordsSidebar';
export const RecordsSidebar = RecordsSidebarComponent;
import TechSidebarComponent from './TechSidebar';
export const TechSidebar = TechSidebarComponent;

// UI Components
import LoadingAnimationComponent from './LoadingAnimation';
export const LoadingAnimation = LoadingAnimationComponent;
export { TabBarContainer } from './TabBarContainer';
import PlayButtonComponent from './PlayButton';
export const PlayButton = PlayButtonComponent;