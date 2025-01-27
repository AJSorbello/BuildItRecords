import {
  Model,
  DataTypes,
  Sequelize,
  BelongsToMany,
  HasMany,
  Association
} from 'sequelize';
import { Track } from './Track';
import { Artist } from './Artist';
import { ReleaseType, ReleaseStatus } from '../../types/release';
import { SpotifyImage } from '../../types/spotify';

interface ReleaseAttributes {
  id: string;
  name: string;
  type: ReleaseType;
  uri: string;
  href: string;
  external_urls: Record<string, string>;
  external_ids: Record<string, string>;
  images: SpotifyImage[];
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  total_tracks: number;
  genres: string[];
  popularity: number;
  label_id?: string;
  status: ReleaseStatus;
  created_at?: Date;
  updated_at?: Date;
}

interface ReleaseCreationAttributes extends Partial<ReleaseAttributes> {
  id: string;
  name: string;
  type: ReleaseType;
  uri: string;
  status: ReleaseStatus;
}

export class Release extends Model<ReleaseAttributes, ReleaseCreationAttributes> implements ReleaseAttributes {
  public id!: string;
  public name!: string;
  public type!: ReleaseType;
  public uri!: string;
  public href!: string;
  public external_urls!: Record<string, string>;
  public external_ids!: Record<string, string>;
  public images!: SpotifyImage[];
  public release_date!: string;
  public release_date_precision!: 'year' | 'month' | 'day';
  public total_tracks!: number;
  public genres!: string[];
  public popularity!: number;
  public label_id?: string;
  public status!: ReleaseStatus;
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public readonly tracks?: Track[];
  public readonly artists?: Artist[];

  public static associations: {
    tracks: Association<Release, Track>;
    artists: Association<Release, Artist>;
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
          type: DataTypes.ENUM(...Object.values(ReleaseType)),
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
        images: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        release_date: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        release_date_precision: {
          type: DataTypes.ENUM('year', 'month', 'day'),
          allowNull: false,
          defaultValue: 'day',
        },
        total_tracks: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
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
        label_id: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(ReleaseStatus)),
          allowNull: false,
          defaultValue: ReleaseStatus.DRAFT,
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
        tableName: 'releases',
        timestamps: true,
        underscored: true,
      }
    );
  }

  public static associate() {
    this.hasMany(Track, {
      foreignKey: 'release_id',
      as: 'tracks',
    });

    this.belongsToMany(Artist, {
      through: 'release_artists',
      as: 'artists',
      foreignKey: 'release_id',
      otherKey: 'artist_id',
    });
  }
}
