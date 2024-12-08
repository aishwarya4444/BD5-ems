let { DataTypes, sequelize } = require('../lib/');
let { employee } = require('./employee.model');
let { role } = require('./role.model');

let employeeRole = sequelize.define('employeeRole', {
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employees', // Use table name, not the model
      key: 'id',
    },
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles', // Use table name, not the model
      key: 'id',
    },
  },
});

employee.belongsToMany(role, {
  through: employeeRole,
  foreignKey: 'employeeId',
  otherKey: 'roleId',
});

role.belongsToMany(employee, {
  through: employeeRole,
  foreignKey: 'roleId',
  otherKey: 'employeeId',
});

module.exports = { employeeRole };
