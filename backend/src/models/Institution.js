const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Institution = sequelize.define('Institution', {
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
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[0-9+\-\s()]*$/
      }
    },
    contact_person: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [0, 50]
      }
    },
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[0-9+\-\s()]*$/
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
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
    tableName: 'institutions'
  });

  // 类方法：根据代码查找机构
  Institution.findByCode = async function(code) {
    return await this.findOne({
      where: { code, status: 'active' }
    });
  };

  // 类方法：获取所有活跃机构
  Institution.getActiveInstitutions = async function() {
    return await this.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']]
    });
  };

  // 实例方法：获取机构统计信息
  Institution.prototype.getStatistics = async function() {
    const { Candidate, Schedule, Venue } = require('./index');

    const [candidateCount, scheduleCount, venueCount] = await Promise.all([
      Candidate.count({ where: { institution_id: this.id } }),
      Schedule.count({
        include: [{
          model: Candidate,
          where: { institution_id: this.id }
        }]
      }),
      Venue.count({ where: { institution_id: this.id } })
    ]);

    return {
      candidates: candidateCount,
      schedules: scheduleCount,
      venues: venueCount
    };
  };

  // 实例方法：更新设置
  Institution.prototype.updateSettings = function(newSettings) {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
  };

  return Institution;
};