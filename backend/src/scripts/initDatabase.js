// 加载环境变量
require('dotenv').config();

const { sequelize, User, Role, Institution, ExamProduct, Venue, Candidate, Schedule } = require('../models');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  try {
    console.log('🔗 正在连接数据库...');

    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    console.log('📊 正在创建表结构...');

    // 创建所有表（如果不存在）
    await sequelize.sync({ alter: true });
    console.log('✅ 表结构创建/更新完成');

    console.log('👥 正在插入初始数据...');

    // 创建默认角色
    const roles = [
      {
        name: '系统管理员',
        code: 'ADMIN',
        description: '系统超级管理员，拥有所有权限',
        permissions: [
          'user.create', 'user.read', 'user.update', 'user.delete',
          'role.create', 'role.read', 'role.update', 'role.delete',
          'institution.create', 'institution.read', 'institution.update', 'institution.delete',
          'product.create', 'product.read', 'product.update', 'product.delete',
          'venue.create', 'venue.read', 'venue.update', 'venue.delete',
          'candidate.create', 'candidate.read', 'candidate.update', 'candidate.delete',
          'schedule.create', 'schedule.read', 'schedule.update', 'schedule.delete',
          'statistics.read'
        ]
      },
      {
        name: '机构管理员',
        code: 'INSTITUTION_ADMIN',
        description: '机构管理员，管理本机构相关数据',
        permissions: [
          'user.read', 'user.update',
          'venue.create', 'venue.read', 'venue.update', 'venue.delete',
          'candidate.create', 'candidate.read', 'candidate.update', 'candidate.delete',
          'schedule.create', 'schedule.read', 'schedule.update', 'schedule.delete',
          'statistics.read'
        ]
      },
      {
        name: '考务员',
        code: 'PROCTOR',
        description: '考务员，负责考试监考和管理',
        permissions: [
          'candidate.read',
          'schedule.read', 'schedule.update',
          'statistics.read'
        ]
      }
    ];

    for (const roleData of roles) {
      await Role.findOrCreate({
        where: { code: roleData.code },
        defaults: roleData
      });
    }

    // 创建默认考试产品
    const products = [
      {
        name: '无人机驾驶员理论考试',
        code: 'DRONE_THEORY',
        category: '理论考试',
        description: '无人机驾驶员理论知识考试',
        duration: 90,
        max_candidates: 30,
        price: 200.00
      },
      {
        name: '无人机驾驶员实操考试',
        code: 'DRONE_PRACTICAL',
        category: '实操考试',
        description: '无人机驾驶员实际操作技能考试',
        duration: 60,
        max_candidates: 1,
        price: 500.00
      }
    ];

    for (const productData of products) {
      await ExamProduct.findOrCreate({
        where: { code: productData.code },
        defaults: productData
      });
    }

    // 创建示例机构
    const [institution] = await Institution.findOrCreate({
      where: { code: 'TEST_INSTITUTION' },
      defaults: {
        name: '测试考试机构',
        code: 'TEST_INSTITUTION',
        address: '北京市朝阳区测试路123号',
        phone: '010-12345678',
        contact_person: '张三',
        contact_phone: '13800138000',
        email: 'test@example.com',
        description: '这是一个测试机构'
      }
    });

    // 创建示例考场
    const venues = [
      {
        name: '理论考试室A',
        code: 'THEORY_A',
        institution_id: institution.id,
        address: '1楼101室',
        capacity: 30,
        equipment: ['电脑', '投影仪', '音响'],
        facilities: ['空调', '监控', '门禁']
      },
      {
        name: '实操考试场地B',
        code: 'PRACTICAL_B',
        institution_id: institution.id,
        address: '室外训练场',
        capacity: 1,
        equipment: ['无人机', '遥控器', '充电器'],
        facilities: ['围栏', '安全设备']
      }
    ];

    for (const venueData of venues) {
      await Venue.findOrCreate({
        where: {
          institution_id: venueData.institution_id,
          code: venueData.code
        },
        defaults: venueData
      });
    }

    // 创建管理员用户
    const [adminUser] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        password: 'admin123456',
        email: 'admin@example.com',
        phone: '13900139000',
        real_name: '系统管理员',
        institution_id: institution.id
      }
    });

    // 为管理员分配角色
    const adminRole = await Role.findOne({ where: { code: 'ADMIN' } });
    if (adminRole) {
      await adminUser.addRole(adminRole);
    }

    // 创建机构管理员用户
    const [institutionAdmin] = await User.findOrCreate({
      where: { username: 'institution_admin' },
      defaults: {
        username: 'institution_admin',
        password: 'admin123456',
        email: 'institution@example.com',
        phone: '13900139001',
        real_name: '机构管理员',
        institution_id: institution.id
      }
    });

    // 为机构管理员分配角色
    const institutionRole = await Role.findOne({ where: { code: 'INSTITUTION_ADMIN' } });
    if (institutionRole) {
      await institutionAdmin.addRole(institutionRole);
    }

    // 创建考务员用户
    const [proctor] = await User.findOrCreate({
      where: { username: 'proctor' },
      defaults: {
        username: 'proctor',
        password: 'proctor123456',
        email: 'proctor@example.com',
        phone: '13900139002',
        real_name: '考务员',
        institution_id: institution.id
      }
    });

    // 为考务员分配角色
    const proctorRole = await Role.findOne({ where: { code: 'PROCTOR' } });
    if (proctorRole) {
      await proctor.addRole(proctorRole);
    }

    // 创建示例考生
    const candidates = [
      {
        name: '李四',
        id_number: '110101199001011234',
        phone: '13800138001',
        email: 'lisi@example.com',
        gender: 'male',
        birth_date: '1990-01-01',
        address: '北京市西城区示例街道1号',
        institution_id: institution.id,
        registration_number: 'REG2024001'
      },
      {
        name: '王五',
        id_number: '110101199102022345',
        phone: '13800138002',
        email: 'wangwu@example.com',
        gender: 'female',
        birth_date: '1991-02-02',
        address: '北京市东城区示例街道2号',
        institution_id: institution.id,
        registration_number: 'REG2024002'
      },
      {
        name: '赵六',
        id_number: '110101199203033456',
        phone: '13800138003',
        email: 'zhaoliu@example.com',
        gender: 'male',
        birth_date: '1992-03-03',
        address: '北京市海淀区示例街道3号',
        institution_id: institution.id,
        registration_number: 'REG2024003'
      }
    ];

    for (const candidateData of candidates) {
      await Candidate.findOrCreate({
        where: { id_number: candidateData.id_number },
        defaults: candidateData
      });
    }

    console.log('🎯 正在验证数据完整性...');

    // 验证数据完整性
    const counts = {
      roles: await Role.count(),
      institutions: await Institution.count(),
      products: await ExamProduct.count(),
      venues: await Venue.count(),
      users: await User.count(),
      candidates: await Candidate.count(),
      schedules: await Schedule.count()
    };

    console.log('📈 数据统计:');
    console.log(`   角色: ${counts.roles} 个`);
    console.log(`   机构: ${counts.institutions} 个`);
    console.log(`   考试产品: ${counts.products} 个`);
    console.log(`   考场: ${counts.venues} 个`);
    console.log(`   用户: ${counts.users} 个`);
    console.log(`   考生: ${counts.candidates} 个`);
    console.log(`   排期: ${counts.schedules} 个`);

    console.log('✅ 数据库初始化完成!');
    console.log('');
    console.log('🔑 默认登录账户:');
    console.log('   系统管理员 - 用户名: admin, 密码: admin123456');
    console.log('   机构管理员 - 用户名: institution_admin, 密码: admin123456');
    console.log('   考务员 - 用户名: proctor, 密码: proctor123456');
    console.log('');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，执行初始化
if (require.main === module) {
  initDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('初始化过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = initDatabase;