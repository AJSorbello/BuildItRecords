const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Label extends Model {}

Label.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  display_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    },
    set(value) {
      // If display_name is not provided, use the name field
      this.setDataValue('display_name', value || this.getDataValue('name'));
    }
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    },
    set(value) {
      // If slug is not provided, generate from name
      const slugValue = value || this.getDataValue('name')?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      this.setDataValue('slug', slugValue);
    }
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'label',
  tableName: 'labels',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeValidate: (label) => {
      // Ensure slug and display_name are set based on name if not provided
      if (!label.display_name) {
        label.display_name = label.name;
      }
      if (!label.slug) {
        label.slug = label.name?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
    }
  }
});

// Export model
module.exports = Label;
