const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Release extends Model {
    static associate(models) {
      Release.belongsTo(models.Label, {
        foreignKey: 'label_id',
        as: 'label'
      });

      Release.hasMany(models.Track, {
        foreignKey: 'release_id',
        as: 'tracks'
      });

      Release.belongsToMany(models.Artist, {
        through: models.ReleaseArtist,
        foreignKey: 'release_id',
        otherKey: 'artist_id',
        as: 'artists'
      });
    }
  }

  Release.init({
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    spotify_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    release_type: {
      type: DataTypes.ENUM('album', 'single', 'ep', 'compilation'),
      allowNull: false,
      defaultValue: 'single'
    },
    release_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    artwork_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    spotify_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    total_tracks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    label_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'labels',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'draft', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
      validate: {
        isIn: [['active', 'draft', 'archived']]
      }
    },
    popularity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Spotify popularity score (0-100)'
    }
  }, {
    sequelize,
    modelName: 'Release',
    tableName: 'releases',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Release;
};