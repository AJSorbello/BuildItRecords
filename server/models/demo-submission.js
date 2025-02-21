const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DemoSubmission extends Model {
    static associate(models) {
      // define associations here if needed in the future
    }
  }

  DemoSubmission.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    artist_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false
    },
    province: {
      type: DataTypes.STRING,
      allowNull: true
    },
    facebook_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    twitter_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    instagram_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    soundcloud_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    apple_music_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    track_title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    track_url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    genre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'accepted', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'DemoSubmission',
    tableName: 'demo_submissions',
    underscored: true,
    timestamps: true
  });

  return DemoSubmission;
};
