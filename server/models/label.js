const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Label extends Model {}

Label.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  sequelize,
  modelName: 'Label',
  tableName: 'labels',
  timestamps: true
});

module.exports = Label;
