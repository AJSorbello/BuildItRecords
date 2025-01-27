import {
  Model,
  DataTypes,
  Sequelize,
  BelongsToMany,
  BelongsTo,
  HasMany,
  Association
} from 'sequelize';
import { Artist } from './Artist';
import { Release } from './Release';
import { TrackType, TrackStatus } from '../../types/common';

interface TrackAttributes {
  id: string;
  name: string;
  type: TrackType;
  duration_ms: number;
  uri: string;
  href: string;
  external_urls: Record<string, string>;
  external_ids: Record<string, string>;
  preview_url?: string | null;
  popularity?: number;
  track_number?: number;
  disc_number?: number;
  isrc?: string;
  label_id?: string;
  status: TrackStatus;
  created_at?: Date;
  updated_at?: Date;
}

interface TrackCreationAttributes extends Partial<TrackAttributes> {
  id: string;
  name: string;
  type: TrackType;
  duration_ms: number;
  uri: string;
  status: TrackStatus;
}

export class Track extends Model<TrackAttributes, TrackCreationAttributes> implements TrackAttributes {
  public id!: string;
  public name!: string;
  public type!: TrackType;
  public duration_ms!: number;
  public uri!: string;
  public href!: string;
  public external_urls!: Record<string, string>;
  public external_ids!: Record<string, string>;
  public preview_url?: string | null;
  public popularity?: number;
  public track_number?: number;
  public disc_number?: number;
  public isrc?: string;
  public label_id?: string;
  public status!: TrackStatus;
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public readonly artists?: Artist[];
  public readonly release?: Release;
  public readonly remixer?: Artist;

  public static associations: {
    artists: Association<Track, Artist>;
    release: Association<Track, Release>;
    remixer: Association<Track, Artist>;
  };

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        id: {
          type: DataTypes.STRING,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM(...Object.values(TrackType)),
          allowNull: false,
        },
        duration_ms: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        uri: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        href: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        external_urls: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        external_ids: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        preview_url: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        popularity: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        track_number: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        disc_number: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        isrc: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        label_id: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(TrackStatus)),
          allowNull: false,
          defaultValue: TrackStatus.DRAFT,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'tracks',
        timestamps: true,
        underscored: true,
      }
    );
  }

  public static associate() {
    this.belongsToMany(Artist, {
      through: 'track_artists',
      as: 'artists',
      foreignKey: 'track_id',
      otherKey: 'artist_id',
    });

    this.belongsTo(Release, {
      foreignKey: 'release_id',
      as: 'release',
    });

    this.belongsTo(Artist, {
      foreignKey: 'remixer_id',
      as: 'remixer',
    });
  }
}
