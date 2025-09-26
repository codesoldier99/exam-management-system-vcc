const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExamProduct = sequelize.define('ExamProduct', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
        notEmpty: true
      }
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 20],
        notEmpty: true
      }
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [1, 50],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
      comment: '考试时长（分钟）',
      validate: {
        min: 1,
        max: 480
      }
    },
    max_candidates: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '最大考生数',
      validate: {
        min: 1,
        max: 100
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    requirements: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      comment: '考试要求和规则'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'archived'),
      defaultValue: 'active'
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
    tableName: 'exam_products'
  });

  // 类方法：根据代码查找产品
  ExamProduct.findByCode = async function(code) {
    return await this.findOne({
      where: { code, status: 'active' }
    });
  };

  // 类方法：根据分类获取产品
  ExamProduct.findByCategory = async function(category) {
    return await this.findAll({
      where: { category, status: 'active' },
      order: [['name', 'ASC']]
    });
  };

  // 类方法：获取所有活跃产品
  ExamProduct.getActiveProducts = async function() {
    return await this.findAll({
      where: { status: 'active' },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
  };

  // 实例方法：获取产品统计信息
  ExamProduct.prototype.getStatistics = async function() {
    const { Schedule } = require('./index');

    const totalSchedules = await Schedule.count({
      where: { product_id: this.id }
    });

    const completedSchedules = await Schedule.count({
      where: {
        product_id: this.id,
        status: 'completed'
      }
    });

    const passedSchedules = await Schedule.count({
      where: {
        product_id: this.id,
        status: 'completed',
        result: 'pass'
      }
    });

    return {
      total_schedules: totalSchedules,
      completed_schedules: completedSchedules,
      passed_schedules: passedSchedules,
      pass_rate: completedSchedules > 0 ? (passedSchedules / completedSchedules * 100).toFixed(2) : 0
    };
  };

  // 实例方法：检查时间冲突
  ExamProduct.prototype.hasTimeConflict = function(startTime, endTime, venueId) {
    // 这个方法可以用来检查考试时间是否与其他考试冲突
    // 具体实现需要结合 Schedule 模型
    return false;
  };

  return ExamProduct;
};