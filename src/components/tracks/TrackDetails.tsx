import React from 'react';
import { Card, Typography, Space, Tag, Button } from 'antd';
import { PlayCircleOutlined, LinkOutlined } from '@ant-design/icons';
import type { Track } from '../../types/track';
import { formatDuration } from '../../utils/trackUtils';
import './TrackDetails.css';

const { Title, Text } = Typography;

interface TrackDetailsProps {
  track: Track;
}

export const TrackDetails: React.FC<TrackDetailsProps> = ({ track }) => {
  const handlePreviewPlay = () => {
    if (track.preview_url) {
      window.open(track.preview_url, '_blank');
    }
  };

  const handleSpotifyOpen = () => {
    window.open(track.external_urls.spotify, '_blank');
  };

  return (
    <Card className="track-details">
      <div className="track-details__header">
        <img
          src={track.images[0]?.url}
          alt={track.title}
          className="track-details__image"
        />
        <div className="track-details__info">
          <Title level={3}>{track.title}</Title>
          <Space direction="vertical" size="small">
            <Text>
              By {track.artists.map(artist => artist.name).join(', ')}
            </Text>
            <Text type="secondary">
              From {track.album.name}
            </Text>
            <Space size="middle">
              <Text type="secondary">
                {formatDuration(track.duration_ms)}
              </Text>
              {track.explicit && (
                <Tag color="red">Explicit</Tag>
              )}
              <Tag color="blue">
                {track.popularity}% Popular
              </Tag>
            </Space>
          </Space>
        </div>
      </div>

      <div className="track-details__actions">
        {track.preview_url && (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handlePreviewPlay}
          >
            Play Preview
          </Button>
        )}
        <Button
          icon={<LinkOutlined />}
          onClick={handleSpotifyOpen}
        >
          Open in Spotify
        </Button>
      </div>

      <div className="track-details__metadata">
        <Space direction="vertical" size="small">
          {track.album.release_date && (
            <Text type="secondary">
              Released: {new Date(track.album.release_date).toLocaleDateString()}
            </Text>
          )}
          <Text type="secondary">
            Popularity: {track.popularity}/100
          </Text>
          {track.isrc && (
            <Text type="secondary">
              ISRC: {track.isrc}
            </Text>
          )}
          {track.label && (
            <Text type="secondary">
              Label: {track.label}
            </Text>
          )}
          {track.available_markets.length > 0 && (
            <Text type="secondary">
              Available in {track.available_markets.length} markets
            </Text>
          )}
        </Space>
      </div>
    </Card>
  );
};
