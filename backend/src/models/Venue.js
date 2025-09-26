const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Venue = sequelize.define('Venue', {
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
      validate: {
        len: [1, 20],
        notEmpty: true
      }
    },
    institution_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'institutions',
        key: 'id'
      }
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 500
      }
    },
    equipment: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '设备清单'
    },
    facilities: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '设施清单'
    },
    operating_hours: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: { start: '08:00', end: '18:00' },
        sunday: { start: '08:00', end: '18:00' }
      },
      comment: '营业时间'
    },
    contact_person: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[0-9+\-\s()]*$/
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
      defaultValue: 'active'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'venues',
    indexes: [
      {
        unique: true,
        fields: ['institution_id', 'code']
      }
    ]
  });

  // 类方法：根据机构获取考场
  Venue.findByInstitution = async function(institutionId) {
    return await this.findAll({
      where: {
        institution_id: institutionId,
        status: 'active'
      },
      order: [['name', 'ASC']]
    });
  };

  // 实例方法：检查是否在营业时间内
  Venue.prototype.isOperatingAt = function(dateTime) {
    if (!this.operating_hours || !dateTime) return false;

    const date = new Date(dateTime);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    const hours = this.operating_hours[dayOfWeek];

    if (!hours) return false;

    const timeString = date.toTimeString().substr(0, 5); // HH:MM format
    return timeString >= hours.start && timeString <= hours.end;
  };

  // 实例方法：获取指定日期的可用时段
  Venue.prototype.getAvailableSlots = async function(date, duration = 60) {
    const { Schedule } = require('./index');

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 获取当天已安排的考试
    const existingSchedules = await Schedule.findAll({
      where: {
        venue_id: this.id,
        scheduled_at: {
          [sequelize.Op.between]: [startOfDay, endOfDay]
        },
        status: {
          [sequelize.Op.notIn]: ['cancelled', 'no_show']
        }
      },
      order: [['scheduled_at', 'ASC']]
    });

    // 计算可用时段
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    const hours = this.operating_hours[dayOfWeek];

    if (!hours) return [];

    const availableSlots = [];
    const [startHour, startMinute] = hours.start.split(':').map(Number);
    const [endHour, endMinute] = hours.end.split(':').map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    // 简化算法：每30分钟一个时段
    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);

      // 检查是否与现有考试冲突
      const hasConflict = existingSchedules.some(schedule => {
        const scheduleStart = new Date(schedule.scheduled_at);
        const scheduleEnd = new Date(schedule.scheduled_at.getTime() + schedule.duration * 60000);

        return (currentTime < scheduleEnd && slotEnd > scheduleStart);
      });

      if (!hasConflict && slotEnd <= endTime) {
        availableSlots.push({
          start: new Date(currentTime),
          end: slotEnd,
          available_capacity: this.capacity
        });
      }

      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return availableSlots;
  };

  return Venue;
};