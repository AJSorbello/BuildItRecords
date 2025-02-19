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
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    spotify_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    release_type: {
      type: DataTypes.ENUM('album', 'single', 'compilation'),
      allowNull: false,
      defaultValue: 'single'
    },
    release_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    artwork_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    spotify_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    total_tracks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    label_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Labels',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'published', 'archived']]
      }
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