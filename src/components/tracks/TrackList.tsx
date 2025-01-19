import React from 'react';
import { List, Avatar, Spin, Space, Tag } from 'antd';
import type { Track } from '../../types/track';
import { formatDuration } from '../../utils/trackUtils';
import './TrackList.css';

interface TrackListProps {
  tracks: Track[];
  loading: boolean;
  onTrackSelect: (track: Track) => void;
  selectedTrack: Track | null;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  loading,
  onTrackSelect,
  selectedTrack
}) => {
  return (
    <div className="track-list">
      <Spin spinning={loading}>
        <List
          itemLayout="horizontal"
          dataSource={tracks}
          renderItem={(track) => (
            <List.Item
              key={track.id}
              onClick={() => onTrackSelect(track)}
              className={`track-list__item ${selectedTrack?.id === track.id ? 'track-list__item--selected' : ''}`}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    shape="square"
                    size={64}
                    src={track.images[0]?.url || '/default-album-art.png'}
                    alt={track.title}
                  />
                }
                title={
                  <div className="track-list__item-title">
                    <Space>
                      <span>{track.title}</span>
                      {track.explicit && <Tag color="red">Explicit</Tag>}
                    </Space>
                  </div>
                }
                description={
                  <div className="track-list__item-details">
                    <span>{track.artists.map(artist => artist.name).join(', ')}</span>
                    <span>•</span>
                    <span>{track.album.name}</span>
                    <span>•</span>
                    <span>{formatDuration(track.duration_ms)}</span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Spin>
    </div>
  );
};
