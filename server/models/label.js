const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Label extends Model {
    static associate(models) {
      Label.hasMany(models.Release, {
        foreignKey: 'label_id',
        as: 'releases'
      });

      Label.hasMany(models.Artist, {
        foreignKey: 'label_id',
        as: 'artists'
      });
    }
  }

  Label.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    display_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    spotify_playlist_id: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Label',
    tableName: 'labels',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Label;
};
