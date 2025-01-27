import {
  Model,
  DataTypes,
  Sequelize,
  BelongsToMany,
  HasMany,
  Association
} from 'sequelize';
import { Track } from './Track';
import { Release } from './Release';
import { ArtistType } from '../../types/common';
import { SpotifyImage } from '../../types/spotify';

interface ArtistAttributes {
  id: string;
  name: string;
  type: ArtistType;
  uri: string;
  href: string;
  external_urls: Record<string, string>;
  images: SpotifyImage[];
  genres: string[];
  popularity: number;
  created_at?: Date;
  updated_at?: Date;
}

interface ArtistCreationAttributes extends Partial<ArtistAttributes> {
  id: string;
  name: string;
  type: ArtistType;
  uri: string;
}

export class Artist extends Model<ArtistAttributes, ArtistCreationAttributes> implements ArtistAttributes {
  public id!: string;
  public name!: string;
  public type!: ArtistType;
  public uri!: string;
  public href!: string;
  public external_urls!: Record<string, string>;
  public images!: SpotifyImage[];
  public genres!: string[];
  public popularity!: number;
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public readonly tracks?: Track[];
  public readonly releases?: Release[];
  public readonly remixes?: Track[];

  public static associations: {
    tracks: Association<Artist, Track>;
    releases: Association<Artist, Release>;
    remixes: Association<Artist, Track>;
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
          type: DataTypes.ENUM(...Object.values(ArtistType)),
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
        images: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        genres: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          defaultValue: [],
        },
        popularity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
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
        tableName: 'artists',
        timestamps: true,
        underscored: true,
      }
    );
  }

  public static associate() {
    this.belongsToMany(Track, {
      through: 'track_artists',
      as: 'tracks',
      foreignKey: 'artist_id',
      otherKey: 'track_id',
    });

    this.belongsToMany(Release, {
      through: 'release_artists',
      as: 'releases',
      foreignKey: 'artist_id',
      otherKey: 'release_id',
    });

    this.hasMany(Track, {
      foreignKey: 'remixer_id',
      as: 'remixes',
    });
  }
}
