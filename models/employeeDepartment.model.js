let { DataTypes, sequelize } = require('../lib/');
let { employee } = require('./employee.model');
let { department } = require('./department.model');

let employeeDepartment = sequelize.define('employeeDepartment', {
  employeeId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: employee,
      key: 'id',
    },
  },
  departmentId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: department,
      key: 'id',
    },
  },
});

employee.belongsToMany(department, {
  through: employeeDepartment,
  foreignKey: 'employeeId',
  otherKey: 'departmentId',
});

department.belongsToMany(employee, {
  through: employeeDepartment,
  foreignKey: 'departmentId',
  otherKey: 'employeeId',
});

module.exports = { employeeDepartment };
