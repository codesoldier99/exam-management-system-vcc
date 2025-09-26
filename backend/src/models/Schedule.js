const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Schedule = sequelize.define('Schedule', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    candidate_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'candidates',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'exam_products',
        key: 'id'
      }
    },
    venue_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'venues',
        key: 'id'
      }
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '考试时间'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
      comment: '考试时长（分钟）'
    },
    status: {
      type: DataTypes.ENUM(
        'scheduled',    // 已安排
        'checked_in',   // 已签到
        'in_progress',  // 进行中
        'completed',    // 已完成
        'cancelled',    // 已取消
        'no_show',      // 缺考
        'postponed'     // 延期
      ),
      defaultValue: 'scheduled'
    },
    result: {
      type: DataTypes.ENUM('pass', 'fail', 'pending'),
      allowNull: true,
      comment: '考试结果'
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '考试分数',
      validate: {
        min: 0,
        max: 100
      }
    },
    max_score: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 100,
      comment: '满分'
    },
    check_in_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '签到时间'
    },
    start_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '开始时间'
    },
    end_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '结束时间'
    },
    proctor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: '监考员ID'
    },
    exam_data: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      comment: '考试相关数据'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
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
    tableName: 'schedules',
    indexes: [
      {
        fields: ['candidate_id']
      },
      {
        fields: ['scheduled_at']
      },
      {
        fields: ['venue_id', 'scheduled_at']
      },
      {
        fields: ['status']
      }
    ]
  });

  // 类方法：根据考生获取排期
  Schedule.findByCandidate = async function(candidateId, options = {}) {
    const { status, startDate, endDate } = options;

    const where = { candidate_id: candidateId };

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.scheduled_at = {
        [sequelize.Op.between]: [startDate, endDate]
      };
    }

    return await this.findAll({
      where,
      include: ['candidate', 'product', 'venue'],
      order: [['scheduled_at', 'ASC']]
    });
  };

  // 类方法：根据考场和日期获取排期
  Schedule.findByVenueAndDate = async function(venueId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.findAll({
      where: {
        venue_id: venueId,
        scheduled_at: {
          [sequelize.Op.between]: [startOfDay, endOfDay]
        }
      },
      include: ['candidate', 'product', 'venue'],
      order: [['scheduled_at', 'ASC']]
    });
  };

  // 类方法：获取今日考试
  Schedule.getTodayExams = async function(institutionId = null) {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const where = {
      scheduled_at: {
        [sequelize.Op.between]: [startOfDay, endOfDay]
      }
    };

    const include = ['candidate', 'product', 'venue'];

    if (institutionId) {
      include.push({
        model: this.sequelize.models.Candidate,
        where: { institution_id: institutionId }
      });
    }

    return await this.findAll({
      where,
      include,
      order: [['scheduled_at', 'ASC']]
    });
  };

  // 实例方法：签到
  Schedule.prototype.checkIn = async function(proctorId = null) {
    if (this.status !== 'scheduled') {
      throw new Error('只有已安排状态的考试才能签到');
    }

    this.status = 'checked_in';
    this.check_in_at = new Date();
    if (proctorId) {
      this.proctor_id = proctorId;
    }

    await this.save();
    return this;
  };

  // 实例方法：开始考试
  Schedule.prototype.startExam = async function() {
    if (this.status !== 'checked_in') {
      throw new Error('只有已签到的考试才能开始');
    }

    this.status = 'in_progress';
    this.start_at = new Date();
    await this.save();
    return this;
  };

  // 实例方法：完成考试
  Schedule.prototype.completeExam = async function(score = null, result = null) {
    if (this.status !== 'in_progress') {
      throw new Error('只有进行中的考试才能完成');
    }

    this.status = 'completed';
    this.end_at = new Date();

    if (score !== null) {
      this.score = score;
    }

    if (result !== null) {
      this.result = result;
    } else if (score !== null) {
      // 根据分数自动判断结果（60分及格）
      this.result = score >= 60 ? 'pass' : 'fail';
    }

    await this.save();
    return this;
  };

  // 实例方法：取消考试
  Schedule.prototype.cancelExam = async function(reason = null) {
    if (['completed', 'cancelled'].includes(this.status)) {
      throw new Error('已完成或已取消的考试无法再次取消');
    }

    this.status = 'cancelled';
    if (reason) {
      this.notes = this.notes ? `${this.notes}\n取消原因：${reason}` : `取消原因：${reason}`;
    }

    await this.save();
    return this;
  };

  // 实例方法：标记缺考
  Schedule.prototype.markNoShow = async function() {
    const now = new Date();
    const scheduledTime = new Date(this.scheduled_at);

    // 只有过了考试时间且未签到的考试才能标记缺考
    if (now <= scheduledTime || this.status !== 'scheduled') {
      throw new Error('只有过期且未签到的考试才能标记缺考');
    }

    this.status = 'no_show';
    await this.save();
    return this;
  };

  // 实例方法：延期考试
  Schedule.prototype.postpone = async function(newScheduledAt, reason = null) {
    if (['completed', 'cancelled'].includes(this.status)) {
      throw new Error('已完成或已取消的考试无法延期');
    }

    this.scheduled_at = new Date(newScheduledAt);
    this.status = 'scheduled';
    this.check_in_at = null;
    this.start_at = null;
    this.end_at = null;

    if (reason) {
      this.notes = this.notes ? `${this.notes}\n延期原因：${reason}` : `延期原因：${reason}`;
    }

    await this.save();
    return this;
  };

  // 实例方法：获取考试持续时间
  Schedule.prototype.getActualDuration = function() {
    if (!this.start_at || !this.end_at) return null;

    const startTime = new Date(this.start_at);
    const endTime = new Date(this.end_at);
    return Math.round((endTime - startTime) / 60000); // 返回分钟数
  };

  // 实例方法：检查是否可以签到
  Schedule.prototype.canCheckIn = function() {
    const now = new Date();
    const scheduledTime = new Date(this.scheduled_at);
    const earliestCheckIn = new Date(scheduledTime.getTime() - 30 * 60000); // 提前30分钟可签到

    return (
      this.status === 'scheduled' &&
      now >= earliestCheckIn &&
      now <= scheduledTime
    );
  };

  return Schedule;
};