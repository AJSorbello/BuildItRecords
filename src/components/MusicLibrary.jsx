import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingAnimation from './LoadingAnimation';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const Input = styled.input`
  flex: 1;
  min-width: 300px;
  padding: 1rem;
  font-size: 1.1rem;
  border: 2px solid #eee;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #007AFF;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
  }
`;

const Select = styled.select`
  padding: 1rem;
  font-size: 1.1rem;
  border: 2px solid #eee;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const FilterInput = styled(Input)`
  max-width: 300px;
  flex: 0.5;
`;

const LabelsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const LabelSection = styled(motion.div)`
  background: ${props => props.theme[props.label]?.background || '#fff'};
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const LabelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  position: sticky;
  top: 0;
  background: inherit;
  padding: 0.5rem;
  z-index: 1;
`;

const LabelTitle = styled.h2`
  margin: 0;
  color: ${props => props.theme[props.label]?.text || '#000'};
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TrackCount = styled.span`
  background: ${props => props.theme[props.label]?.accent || '#eee'};
  color: ${props => props.theme[props.label]?.text || '#000'};
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.9rem;
`;

const TrackList = styled.div`
  display: grid;
  gap: 1rem;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 0.5rem;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
`;

const Track = styled(motion.div)`
  display: grid;
  grid-template-columns: 60px 1fr auto;
  gap: 1rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const AlbumArt = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
`;

const TrackInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const TrackName = styled.div`
  font-weight: 600;
  color: ${props => props.explicit ? '#e91e63' : 'inherit'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ExplicitBadge = styled.span`
  background: #e91e63;
  color: white;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: bold;
`;

const ArtistName = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const Duration = styled.div`
  color: #666;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
`;

const Popularity = styled.div`
  font-size: 0.8rem;
  color: #888;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const PopularityBar = styled.div`
  width: 50px;
  height: 4px;
  background: #eee;
  border-radius: 2px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    width: ${props => props.value}%;
    height: 100%;
    background: ${props => {
      if (props.value >= 70) return '#4caf50';
      if (props.value >= 40) return '#ff9800';
      return '#f44336';
    }};
  }
`;

const theme = {
  BUILD_IT_RECORDS: {
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    text: '#212529',
    accent: '#e9ecef'
  },
  BUILD_IT_TECH: {
    background: 'linear-gradient(135deg, #f1f8ff 0%, #def 100%)',
    text: '#0366d6',
    accent: '#def'
  },
  BUILD_IT_DEEP: {
    background: 'linear-gradient(135deg, #f6f8fa 0%, #eaecef 100%)',
    text: '#24292e',
    accent: '#eaecef'
  }
};

const formatDuration = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds.padStart(2, '0')}`;
};

const MusicLibrary = () => {
  const [url, setUrl] = useState('');
  const [tracks, setTracks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('release_date');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/process/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to process URL');
      }

      const data = await response.json();
      setTracks(data.tracks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackClick = (track) => {
    if (track.preview_url) {
      window.open(track.preview_url, '_blank');
    }
  };

  const filterAndSortTracks = (labelTracks) => {
    let filtered = labelTracks;
    
    if (filter) {
      const searchTerm = filter.toLowerCase();
      filtered = labelTracks.filter(track => 
        track.name.toLowerCase().includes(searchTerm) ||
        track.artists.some(artist => 
          artist.name.toLowerCase().includes(searchTerm)
        )
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'release_date':
          return new Date(b.album.release_date) - new Date(a.album.release_date);
        case 'popularity':
          return b.popularity - a.popularity;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'duration':
          return a.duration_ms - b.duration_ms;
        default:
          return 0;
      }
    });
  };

  return (
    <Container>
      <Header>
        <form onSubmit={handleSubmit}>
          <Controls>
            <Input
              type="text"
              placeholder="Paste Spotify URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <FilterInput
              type="text"
              placeholder="Filter tracks..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="release_date">Release Date</option>
              <option value="popularity">Popularity</option>
              <option value="name">Name</option>
              <option value="duration">Duration</option>
            </Select>
          </Controls>
        </form>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: 'red', marginTop: '0.5rem' }}
          >
            {error}
          </motion.div>
        )}
      </Header>

      {loading && <LoadingAnimation />}

      <AnimatePresence>
        {tracks && (
          <LabelsContainer>
            {Object.entries(tracks).map(([label, labelTracks]) => {
              const filteredTracks = filterAndSortTracks(labelTracks);
              return (
                <LabelSection
                  key={label}
                  label={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <LabelHeader>
                    <LabelTitle label={label}>
                      {label.replace('BUILD_IT_', '')}
                    </LabelTitle>
                    <TrackCount label={label}>
                      {filteredTracks.length} tracks
                    </TrackCount>
                  </LabelHeader>
                  <TrackList>
                    {filteredTracks.map((track) => (
                      <Track
                        key={track.id}
                        onClick={() => handleTrackClick(track)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <AlbumArt
                          src={track.album.images[0]?.url}
                          alt={track.album.name}
                        />
                        <TrackInfo>
                          <TrackName explicit={track.explicit}>
                            {track.name}
                            {track.explicit && (
                              <ExplicitBadge>E</ExplicitBadge>
                            )}
                          </TrackName>
                          <ArtistName>
                            {track.artists.map(a => a.name).join(', ')}
                          </ArtistName>
                        </TrackInfo>
                        <Duration>
                          {formatDuration(track.duration_ms)}
                          <Popularity>
                            <PopularityBar value={track.popularity} />
                          </Popularity>
                        </Duration>
                      </Track>
                    ))}
                  </TrackList>
                </LabelSection>
              );
            })}
          </LabelsContainer>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default MusicLibrary;
