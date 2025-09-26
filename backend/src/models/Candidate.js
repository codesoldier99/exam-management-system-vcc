const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Candidate = sequelize.define('Candidate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [1, 50],
        notEmpty: true
      }
    },
    id_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        len: [15, 20],
        notEmpty: true,
        is: /^[0-9X]{15,20}$/i
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        is: /^1[3-9]\d{9}$/
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: true
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    institution_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'institutions',
        key: 'id'
      }
    },
    registration_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '报名号'
    },
    photo_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '照片URL'
    },
    emergency_contact: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      comment: '紧急联系人信息'
    },
    medical_info: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      comment: '健康信息'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'graduated', 'suspended'),
      defaultValue: 'active'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    qr_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      comment: '二维码标识'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'candidates',
    hooks: {
      // 创建时生成二维码标识
      beforeCreate: async (candidate) => {
        if (!candidate.qr_code) {
          candidate.qr_code = crypto.randomUUID();
        }
      }
    }
  });

  // 类方法：根据身份证号查找考生
  Candidate.findByIdNumber = async function(idNumber) {
    return await this.findOne({
      where: { id_number: idNumber },
      include: ['institution']
    });
  };

  // 类方法：根据手机号查找考生
  Candidate.findByPhone = async function(phone) {
    return await this.findOne({
      where: { phone },
      include: ['institution']
    });
  };

  // 类方法：根据机构查找考生
  Candidate.findByInstitution = async function(institutionId, options = {}) {
    const { page = 1, limit = 20, search = '' } = options;

    const where = { institution_id: institutionId };

    if (search) {
      where[sequelize.Op.or] = [
        { name: { [sequelize.Op.like]: `%${search}%` } },
        { id_number: { [sequelize.Op.like]: `%${search}%` } },
        { phone: { [sequelize.Op.like]: `%${search}%` } },
        { registration_number: { [sequelize.Op.like]: `%${search}%` } }
      ];
    }

    return await this.findAndCountAll({
      where,
      include: ['institution'],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });
  };

  // 类方法：根据二维码标识查找考生
  Candidate.findByQRCode = async function(qrCode) {
    return await this.findOne({
      where: { qr_code: qrCode },
      include: ['institution', 'schedules']
    });
  };

  // 实例方法：计算年龄
  Candidate.prototype.getAge = function() {
    if (!this.birth_date) return null;

    const today = new Date();
    const birthDate = new Date(this.birth_date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // 实例方法：获取考生的考试统计
  Candidate.prototype.getExamStatistics = async function() {
    const { Schedule } = require('./index');

    const totalExams = await Schedule.count({
      where: { candidate_id: this.id }
    });

    const completedExams = await Schedule.count({
      where: {
        candidate_id: this.id,
        status: 'completed'
      }
    });

    const passedExams = await Schedule.count({
      where: {
        candidate_id: this.id,
        status: 'completed',
        result: 'pass'
      }
    });

    const upcomingExams = await Schedule.count({
      where: {
        candidate_id: this.id,
        status: 'scheduled',
        scheduled_at: {
          [sequelize.Op.gte]: new Date()
        }
      }
    });

    return {
      total: totalExams,
      completed: completedExams,
      passed: passedExams,
      upcoming: upcomingExams,
      pass_rate: completedExams > 0 ? ((passedExams / completedExams) * 100).toFixed(2) : 0
    };
  };

  // 实例方法：生成新的二维码标识
  Candidate.prototype.generateQRCode = async function() {
    this.qr_code = crypto.randomUUID();
    await this.save();
    return this.qr_code;
  };

  // 实例方法：验证身份证号码
  Candidate.prototype.validateIdNumber = function() {
    const idNumber = this.id_number;
    if (!idNumber || idNumber.length !== 18) return false;

    // 身份证号码验证算法
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idNumber.charAt(i)) * weights[i];
    }

    const checkCode = checkCodes[sum % 11];
    return checkCode === idNumber.charAt(17).toUpperCase();
  };

  return Candidate;
};