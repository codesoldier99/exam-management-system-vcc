const { Sequelize } = require('sequelize');
const path = require('path');

// 数据库配置
const isDevelopment = process.env.NODE_ENV === 'development';

const sequelize = isDevelopment
  ? new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: console.log,
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    })
  : new Sequelize({
      dialect: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || 'exam_management',
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      logging: false,
      timezone: '+08:00',
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

// 导入模型
const User = require('./User')(sequelize);
const Role = require('./Role')(sequelize);
const Institution = require('./Institution')(sequelize);
const ExamProduct = require('./ExamProduct')(sequelize);
const Venue = require('./Venue')(sequelize);
const Candidate = require('./Candidate')(sequelize);
const Schedule = require('./Schedule')(sequelize);

// 定义关联关系
const models = {
  User,
  Role,
  Institution,
  ExamProduct,
  Venue,
  Candidate,
  Schedule
};

// 用户和角色关联（多对多）
User.belongsToMany(Role, {
  through: 'user_roles',
  as: 'roles',
  foreignKey: 'user_id'
});
Role.belongsToMany(User, {
  through: 'user_roles',
  as: 'users',
  foreignKey: 'role_id'
});

// 机构和用户关联（一对多）
Institution.hasMany(User, {
  foreignKey: 'institution_id',
  as: 'users'
});
User.belongsTo(Institution, {
  foreignKey: 'institution_id',
  as: 'institution'
});

// 机构和考场关联（一对多）
Institution.hasMany(Venue, {
  foreignKey: 'institution_id',
  as: 'venues'
});
Venue.belongsTo(Institution, {
  foreignKey: 'institution_id',
  as: 'institution'
});

// 机构和考生关联（一对多）
Institution.hasMany(Candidate, {
  foreignKey: 'institution_id',
  as: 'candidates'
});
Candidate.belongsTo(Institution, {
  foreignKey: 'institution_id',
  as: 'institution'
});

// 考生和排期关联（一对多）
Candidate.hasMany(Schedule, {
  foreignKey: 'candidate_id',
  as: 'schedules'
});
Schedule.belongsTo(Candidate, {
  foreignKey: 'candidate_id',
  as: 'candidate'
});

// 考试产品和排期关联（一对多）
ExamProduct.hasMany(Schedule, {
  foreignKey: 'product_id',
  as: 'schedules'
});
Schedule.belongsTo(ExamProduct, {
  foreignKey: 'product_id',
  as: 'product'
});

// 考场和排期关联（一对多）
Venue.hasMany(Schedule, {
  foreignKey: 'venue_id',
  as: 'schedules'
});
Schedule.belongsTo(Venue, {
  foreignKey: 'venue_id',
  as: 'venue'
});

// 导出所有模型和 sequelize 实例
module.exports = {
  sequelize,
  ...models
};