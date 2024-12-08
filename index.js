const express = require('express');
const { resolve } = require('path');
let { employee } = require('./models/employee.model');
let { department } = require('./models/department.model');
let { role } = require('./models/role.model');
let { employeeDepartment } = require('./models/employeeDepartment.model');
let { employeeRole } = require('./models/employeeRole.model');
let { sequelize } = require('./lib/index');
let { Op } = require('@sequelize/core');
let cors = require('cors');

const app = express();
const port = 3010;

app.use(express.static('static'));
app.use(cors());

app.get('/', (req, res) => {
  res.sendFile(resolve(__dirname, 'pages/index.html'));
});

// Endpoint to seed database
app.get('/seed_db', async (req, res) => {
  await sequelize.sync({ force: true });
  console.log('going to insert depat');

  const departments = await department.bulkCreate([
    { name: 'Engineering' },
    { name: 'Marketing' },
  ]);
  console.log('going to insert role');

  const roles = await role.bulkCreate([
    { title: 'Software Engineer' },
    { title: 'Marketing Specialist' },
    { title: 'Product Manager' },
  ]);
  console.log('going to insert employee');

  const employees = await employee.bulkCreate([
    { name: 'Rahul Sharma', email: 'rahul.sharma@example.com' },
    { name: 'Priya Singh', email: 'priya.singh@example.com' },
    { name: 'Ankit Verma', email: 'ankit.verma@example.com' },
  ]);

  // Associate employees with departments and roles using create method on junction models

  await employeeDepartment.create({
    employeeId: employees[0].id,
    departmentId: departments[0].id,
  });
  await employeeRole.create({
    employeeId: employees[0].id,
    roleId: roles[0].id,
  });

  await employeeDepartment.create({
    employeeId: employees[1].id,
    departmentId: departments[1].id,
  });
  await employeeRole.create({
    employeeId: employees[1].id,
    roleId: roles[1].id,
  });

  await employeeDepartment.create({
    employeeId: employees[2].id,
    departmentId: departments[0].id,
  });
  await employeeRole.create({
    employeeId: employees[2].id,
    roleId: roles[2].id,
  });

  return res.json({ message: 'Database seeded!' });
});

async function getEmployeeDepartments(employeeId) {
  const employeeDepartments = await employeeDepartment.findAll({
    where: { employeeId },
  });

  let departmentData;
  for (let empDep of employeeDepartments) {
    departmentData = await department.findOne({
      where: { id: empDep.departmentId },
    });
  }

  return departmentData;
}

// Helper function to get employee's associated roles
async function getEmployeeRoles(employeeId) {
  const employeeRoles = await employeeRole.findAll({
    where: { employeeId },
  });

  let roleData;
  for (let empRole of employeeRoles) {
    roleData = await role.findOne({
      where: { id: empRole.roleId },
    });
  }

  return roleData;
}

// Helper function to get employee details with associated departments and roles
async function getEmployeeDetails(employeeData) {
  const department = await getEmployeeDepartments(employeeData.id);
  const role = await getEmployeeRoles(employeeData.id);

  return {
    ...employeeData.dataValues,
    department,
    role,
  };
}

async function addEmployee(empData) {
  let newEmployee = await employee.create(empData);
  return { newEmployee };
}

app.get('/employees', async (req, res) => {
  try {
    // Fetch all employees
    const employees = await employee.findAll();

    // Use Promise.all to fetch details for all employees concurrently
    const employeesWithDetails = await Promise.all(
      employees.map(async (employeeData) => {
        return await getEmployeeDetails(employeeData);
      })
    );

    res.json({ employees: employeesWithDetails });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      message: 'Error fetching employees',
      error: error.message,
    });
  }
});

app.get('/employees/details/:id', async (req, res) => {
  try {
    const employeeData = await employee.findOne({
      where: { id: req.params.id },
    });

    if (!employeeData) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const employeeWithDetails = await getEmployeeDetails(employeeData);
    res.json({ employee: employeeWithDetails });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching employee details',
      error: error.message,
    });
  }
});

// Endpoint to get employees by department
app.get('/employees/department/:departmentId', async (req, res) => {
  try {
    const departmentId = parseInt(req.params.departmentId);

    // Find all employeeDepartment records matching the departmentId
    const employeeDepartments = await employeeDepartment.findAll({
      where: { departmentId: departmentId },
    });

    // Array to store employee details
    const employeesWithDetails = [];

    // Loop through employeeDepartment records to find employee details
    for (let empDep of employeeDepartments) {
      // Find employee data
      const employeeData = await employee.findOne({
        where: { id: empDep.employeeId },
      });
      const employeeWithDetails = await getEmployeeDetails(employeeData);
      if (employeeData) {
        employeesWithDetails.push(employeeWithDetails);
      }
    }

    // If no employees found for the department
    if (employeesWithDetails.length === 0) {
      return res.status(404).json({
        message: `No employees found for department ID ${departmentId}`,
      });
    }

    res.json({ employees: employeesWithDetails });
  } catch (error) {
    console.error('Error fetching employees by department:', error);
    res.status(500).json({
      message: 'Error fetching employees by department',
      error: error.message,
    });
  }
});

// Endpoint to get employees by role
app.get('/employees/role/:roleId', async (req, res) => {
  try {
    const roleId = parseInt(req.params.roleId);

    // Find all employeeRole records matching the roleId
    const employeeRoles = await employeeRole.findAll({
      where: { roleId: roleId },
    });

    // Array to store employee details
    const employeesWithDetails = [];

    // Loop through employeeDepartment records to find employee details
    for (let empRole of employeeRoles) {
      // Find employee data
      const employeeData = await employee.findOne({
        where: { id: empRole.employeeId },
      });
      const employeeWithDetails = await getEmployeeDetails(employeeData);
      if (employeeData) {
        employeesWithDetails.push(employeeWithDetails);
      }
    }

    // If no employees found for the role
    if (employeesWithDetails.length === 0) {
      return res.status(404).json({
        message: `No employees found for role ID ${departmentId}`,
      });
    }

    res.json({ employees: employeesWithDetails });
  } catch (error) {
    console.error('Error fetching employees by role:', error);
    res.status(500).json({
      message: 'Error fetching employees by role',
      error: error.message,
    });
  }
});

// Endpoint to get employees and sort
app.get('/employees/sort-by-name', async (req, res) => {
  try {
    console.log('hi');
    const sortOrder = req.query.order || 'asc';
    console.log(sortOrder);
    // Fetch all employees
    const employees = await employee.findAll();

    // Use Promise.all to fetch details for all employees concurrently
    let employeesWithDetails = await Promise.all(
      employees.map(async (employeeData) => {
        return await getEmployeeDetails(employeeData);
      })
    );

    employeesWithDetails.sort((a, b) => {
      if (a['name'] < b['name']) return sortOrder === 'asc' ? -1 : 1;
      if (a['name'] > b['name']) return sortOrder === 'asc' ? 1 : -1;
      return 0; // Equal values
    });

    res.json({ employees: employeesWithDetails });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      message: 'Error fetching employees',
      error: error.message,
    });
  }
});

app.post('/employees/new', async (req, res) => {
  try {
    let empData = { name: req.body.name, email: req.body.email };
    let depId = req.body.departmentId;
    let roleId = req.body.roleId;

    let newEmployee = await addEmployee(empData);
    await employeeDepartment.create({
      employeeId: newEmployee.id,
      departmentId: depId,
    });
    await employeeRole.create({
      employeeId: newEmployee.id,
      roleId: roleId,
    });

    const employeeDetail = await getEmployeeDetails(newEmployee);
    res.json(employeeDetail);
  } catch (error) {
    console.error('Error creating employees:', error);
    res.status(500).json({
      message: 'Error creating employees',
      error: error.message,
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
