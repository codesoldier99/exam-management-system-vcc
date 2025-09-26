const { Schedule, Candidate, ExamProduct, Venue, Institution } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const sequelize = require('../models').sequelize;

class ScheduleController {
  // 获取考试排期列表（支持分页、筛选）
  async getSchedules(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }

      const {
        page = 1,
        limit = 20,
        status,
        venue_id,
        product_id,
        start_date,
        end_date,
        search = ''
      } = req.query;

      // 构建查询条件
      const whereCondition = {};

      // 权限检查：非管理员只能查看自己机构的排期
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        whereCondition['$candidate.institution_id$'] = req.user.institution_id;
      }

      // 状态筛选
      if (status) {
        whereCondition.status = status;
      }

      // 考场筛选
      if (venue_id) {
        whereCondition.venue_id = venue_id;
      }

      // 考试产品筛选
      if (product_id) {
        whereCondition.product_id = product_id;
      }

      // 时间范围筛选
      if (start_date || end_date) {
        whereCondition.scheduled_at = {};
        if (start_date) {
          whereCondition.scheduled_at[Op.gte] = new Date(start_date);
        }
        if (end_date) {
          whereCondition.scheduled_at[Op.lte] = new Date(end_date);
        }
      }

      // 搜索条件（考生姓名、身份证号、报名号）
      const searchConditions = [];
      if (search) {
        searchConditions.push(
          { '$candidate.name$': { [Op.like]: `%${search}%` } },
          { '$candidate.id_number$': { [Op.like]: `%${search}%` } },
          { '$candidate.registration_number$': { [Op.like]: `%${search}%` } }
        );
      }

      if (searchConditions.length > 0) {
        whereCondition[Op.or] = searchConditions;
      }

      // 分页计算
      const offset = (page - 1) * limit;

      // 查询排期列表
      const { count, rows: schedules } = await Schedule.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: Candidate,
            as: 'candidate',
            attributes: ['id', 'name', 'id_number', 'phone', 'registration_number'],
            include: [{
              model: Institution,
              as: 'institution',
              attributes: ['id', 'name']
            }]
          },
          {
            model: ExamProduct,
            as: 'exam_product',
            attributes: ['id', 'name', 'code', 'duration']
          },
          {
            model: Venue,
            as: 'venue',
            attributes: ['id', 'name', 'address', 'capacity']
          }
        ],
        order: [['scheduled_at', 'ASC']],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      // 计算分页信息
      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        message: '获取排期列表成功',
        data: {
          schedules,
          pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total: count,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('获取排期列表错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 获取排期详情
  async getScheduleById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }

      const { id } = req.params;

      const schedule = await Schedule.findByPk(id, {
        include: [
          {
            model: Candidate,
            as: 'candidate',
            include: [{
              model: Institution,
              as: 'institution',
              attributes: ['id', 'name', 'code']
            }]
          },
          {
            model: ExamProduct,
            as: 'exam_product'
          },
          {
            model: Venue,
            as: 'venue'
          }
        ]
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: '排期信息不存在'
        });
      }

      // 权限检查：非管理员只能查看自己机构的排期
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        if (schedule.candidate.institution_id !== req.user.institution_id) {
          return res.status(403).json({
            success: false,
            message: '无权访问该排期信息'
          });
        }
      }

      res.json({
        success: true,
        message: '获取排期详情成功',
        data: { schedule }
      });

    } catch (error) {
      console.error('获取排期详情错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 创建单个排期
  async createSchedule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }

      const { candidate_id, product_id, venue_id, scheduled_at, duration } = req.body;

      // 验证考生是否存在
      const candidate = await Candidate.findByPk(candidate_id);
      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: '考生不存在'
        });
      }

      // 权限检查：非管理员只能为自己机构的考生创建排期
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        if (candidate.institution_id !== req.user.institution_id) {
          return res.status(403).json({
            success: false,
            message: '无权为该考生创建排期'
          });
        }
      }

      // 验证考试产品是否存在
      const product = await ExamProduct.findByPk(product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: '考试产品不存在'
        });
      }

      // 验证考场是否存在
      const venue = await Venue.findByPk(venue_id);
      if (!venue) {
        return res.status(404).json({
          success: false,
          message: '考场不存在'
        });
      }

      // 检查考生是否已有相同产品的有效排期
      const existingSchedule = await Schedule.findOne({
        where: {
          candidate_id,
          product_id,
          status: { [Op.in]: ['scheduled', 'in_progress'] }
        }
      });

      if (existingSchedule) {
        return res.status(400).json({
          success: false,
          message: '该考生已有此产品的有效排期'
        });
      }

      // 检查时间冲突
      const scheduleTime = new Date(scheduled_at);
      const examDuration = duration || product.duration || 120;
      const endTime = new Date(scheduleTime.getTime() + examDuration * 60000);

      const conflictingSchedule = await Schedule.findOne({
        where: {
          venue_id,
          status: { [Op.in]: ['scheduled', 'in_progress'] },
          [Op.or]: [
            {
              scheduled_at: {
                [Op.between]: [scheduleTime, endTime]
              }
            },
            {
              [Op.and]: [
                { scheduled_at: { [Op.lte]: scheduleTime } },
                sequelize.literal(`DATE_ADD(scheduled_at, INTERVAL COALESCE(duration, (SELECT duration FROM exam_products WHERE id = Schedule.product_id), 120) MINUTE) > '${scheduleTime.toISOString().slice(0, 19).replace('T', ' ')}'`)
              ]
            }
          ]
        }
      });

      if (conflictingSchedule) {
        return res.status(400).json({
          success: false,
          message: '该时间段考场已被占用'
        });
      }

      // 创建排期
      const schedule = await Schedule.create({
        candidate_id,
        product_id,
        venue_id,
        scheduled_at: scheduleTime,
        duration: examDuration
      });

      // 获取完整的排期信息
      const newSchedule = await Schedule.findByPk(schedule.id, {
        include: [
          {
            model: Candidate,
            as: 'candidate',
            attributes: ['id', 'name', 'id_number', 'phone'],
            include: [{
              model: Institution,
              as: 'institution',
              attributes: ['id', 'name']
            }]
          },
          {
            model: ExamProduct,
            as: 'exam_product',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Venue,
            as: 'venue',
            attributes: ['id', 'name', 'address']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: '排期创建成功',
        data: { schedule: newSchedule }
      });

    } catch (error) {
      console.error('创建排期错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 批量创建排期
  async createBatchSchedules(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }

      const { candidate_ids, product_id, venue_id, start_date, end_date } = req.body;

      // 验证考试产品
      const product = await ExamProduct.findByPk(product_id);
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: '考试产品不存在'
        });
      }

      // 验证考场
      const venue = await Venue.findByPk(venue_id);
      if (!venue) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: '考场不存在'
        });
      }

      // 验证所有考生是否存在
      const candidates = await Candidate.findAll({
        where: { id: candidate_ids },
        include: [{
          model: Institution,
          as: 'institution',
          attributes: ['id', 'name']
        }]
      });

      if (candidates.length !== candidate_ids.length) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: '部分考生不存在'
        });
      }

      // 权限检查：非管理员只能为自己机构的考生创建排期
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        const invalidCandidates = candidates.filter(c => c.institution_id !== req.user.institution_id);
        if (invalidCandidates.length > 0) {
          await transaction.rollback();
          return res.status(403).json({
            success: false,
            message: '无权为其他机构的考生创建排期'
          });
        }
      }

      // 检查考生是否已有相同产品的有效排期
      const existingSchedules = await Schedule.findAll({
        where: {
          candidate_id: { [Op.in]: candidate_ids },
          product_id,
          status: { [Op.in]: ['scheduled', 'in_progress'] }
        }
      });

      if (existingSchedules.length > 0) {
        await transaction.rollback();
        const conflictCandidates = existingSchedules.map(s => s.candidate_id);
        return res.status(400).json({
          success: false,
          message: `考生ID ${conflictCandidates.join(', ')} 已有此产品的有效排期`
        });
      }

      // 生成时间段
      const startDateTime = new Date(start_date);
      const endDateTime = new Date(end_date);
      const examDuration = product.duration || 120;
      const intervalMinutes = examDuration + 30; // 考试时间 + 30分钟间隔

      const timeSlots = [];
      let currentTime = new Date(startDateTime);

      // 生成工作时间段（9:00-17:00）
      while (currentTime <= endDateTime) {
        const dayStart = new Date(currentTime);
        dayStart.setHours(9, 0, 0, 0);
        const dayEnd = new Date(currentTime);
        dayEnd.setHours(17, 0, 0, 0);

        let slotTime = new Date(dayStart);
        while (slotTime <= dayEnd) {
          const slotEndTime = new Date(slotTime.getTime() + examDuration * 60000);
          if (slotEndTime <= dayEnd) {
            timeSlots.push(new Date(slotTime));
          }
          slotTime = new Date(slotTime.getTime() + intervalMinutes * 60000);
        }

        currentTime.setDate(currentTime.getDate() + 1);
      }

      if (timeSlots.length < candidate_ids.length) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: '时间段不足以安排所有考生'
        });
      }

      // 创建排期
      const schedules = [];
      const successList = [];
      const errorList = [];

      for (let i = 0; i < candidate_ids.length; i++) {
        try {
          const candidateId = candidate_ids[i];
          const timeSlot = timeSlots[i];

          // 检查该时间段是否可用
          const conflictCheck = await Schedule.findOne({
            where: {
              venue_id,
              scheduled_at: timeSlot,
              status: { [Op.in]: ['scheduled', 'in_progress'] }
            }
          }, { transaction });

          if (conflictCheck) {
            // 寻找下一个可用时间段
            let nextSlotIndex = i + 1;
            let foundSlot = false;

            while (nextSlotIndex < timeSlots.length && !foundSlot) {
              const nextConflictCheck = await Schedule.findOne({
                where: {
                  venue_id,
                  scheduled_at: timeSlots[nextSlotIndex],
                  status: { [Op.in]: ['scheduled', 'in_progress'] }
                }
              }, { transaction });

              if (!nextConflictCheck) {
                timeSlots[i] = timeSlots[nextSlotIndex];
                foundSlot = true;
              }
              nextSlotIndex++;
            }

            if (!foundSlot) {
              throw new Error('无可用时间段');
            }
          }

          const schedule = await Schedule.create({
            candidate_id: candidateId,
            product_id,
            venue_id,
            scheduled_at: timeSlots[i],
            duration: examDuration
          }, { transaction });

          schedules.push(schedule);

          const candidate = candidates.find(c => c.id === candidateId);
          successList.push({
            candidate_id: candidateId,
            candidate_name: candidate ? candidate.name : '未知',
            scheduled_at: timeSlots[i].toISOString(),
            schedule_id: schedule.id
          });

        } catch (error) {
          const candidate = candidates.find(c => c.id === candidate_ids[i]);
          errorList.push({
            candidate_id: candidate_ids[i],
            candidate_name: candidate ? candidate.name : '未知',
            error: error.message
          });
        }
      }

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: `批量排期完成，成功${successList.length}个，失败${errorList.length}个`,
        data: {
          success_count: successList.length,
          error_count: errorList.length,
          success_list: successList,
          error_list: errorList
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('批量创建排期错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 更新排期
  async updateSchedule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const schedule = await Schedule.findByPk(id, {
        include: [{
          model: Candidate,
          as: 'candidate'
        }]
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: '排期不存在'
        });
      }

      // 权限检查
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        if (schedule.candidate.institution_id !== req.user.institution_id) {
          return res.status(403).json({
            success: false,
            message: '无权修改该排期'
          });
        }
      }

      // 只有scheduled状态的排期才能修改
      if (schedule.status !== 'scheduled') {
        return res.status(400).json({
          success: false,
          message: '只有待考试状态的排期才能修改'
        });
      }

      // 如果修改时间，检查时间冲突
      if (updateData.scheduled_at) {
        const newTime = new Date(updateData.scheduled_at);
        const duration = updateData.duration || schedule.duration;
        const endTime = new Date(newTime.getTime() + duration * 60000);

        const conflictingSchedule = await Schedule.findOne({
          where: {
            id: { [Op.ne]: id },
            venue_id: updateData.venue_id || schedule.venue_id,
            status: { [Op.in]: ['scheduled', 'in_progress'] },
            [Op.or]: [
              {
                scheduled_at: {
                  [Op.between]: [newTime, endTime]
                }
              },
              {
                [Op.and]: [
                  { scheduled_at: { [Op.lte]: newTime } },
                  sequelize.literal(`DATE_ADD(scheduled_at, INTERVAL COALESCE(duration, 120) MINUTE) > '${newTime.toISOString().slice(0, 19).replace('T', ' ')}'`)
                ]
              }
            ]
          }
        });

        if (conflictingSchedule) {
          return res.status(400).json({
            success: false,
            message: '该时间段考场已被占用'
          });
        }
      }

      // 更新排期
      await schedule.update(updateData);

      // 获取更新后的完整信息
      const updatedSchedule = await Schedule.findByPk(id, {
        include: [
          {
            model: Candidate,
            as: 'candidate',
            attributes: ['id', 'name', 'id_number']
          },
          {
            model: ExamProduct,
            as: 'exam_product',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Venue,
            as: 'venue',
            attributes: ['id', 'name', 'address']
          }
        ]
      });

      res.json({
        success: true,
        message: '排期更新成功',
        data: { schedule: updatedSchedule }
      });

    } catch (error) {
      console.error('更新排期错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 取消排期
  async cancelSchedule(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const schedule = await Schedule.findByPk(id, {
        include: [{
          model: Candidate,
          as: 'candidate'
        }]
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: '排期不存在'
        });
      }

      // 权限检查
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        if (schedule.candidate.institution_id !== req.user.institution_id) {
          return res.status(403).json({
            success: false,
            message: '无权取消该排期'
          });
        }
      }

      // 只有scheduled和checked_in状态的排期才能取消
      if (!['scheduled', 'checked_in'].includes(schedule.status)) {
        return res.status(400).json({
          success: false,
          message: '该排期状态不允许取消'
        });
      }

      // 使用模型方法取消排期
      await schedule.cancel(reason);

      res.json({
        success: true,
        message: '排期取消成功',
        data: { schedule }
      });

    } catch (error) {
      console.error('取消排期错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 考生签到
  async checkIn(req, res) {
    try {
      const { id } = req.params;

      const schedule = await Schedule.findByPk(id, {
        include: [{
          model: Candidate,
          as: 'candidate'
        }]
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: '排期不存在'
        });
      }

      // 权限检查
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        if (schedule.candidate.institution_id !== req.user.institution_id) {
          return res.status(403).json({
            success: false,
            message: '无权操作该排期'
          });
        }
      }

      // 使用模型方法签到
      await schedule.checkIn();

      res.json({
        success: true,
        message: '签到成功',
        data: { schedule }
      });

    } catch (error) {
      console.error('签到错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 开始考试
  async startExam(req, res) {
    try {
      const { id } = req.params;

      const schedule = await Schedule.findByPk(id, {
        include: [{
          model: Candidate,
          as: 'candidate'
        }]
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: '排期不存在'
        });
      }

      // 权限检查
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        if (schedule.candidate.institution_id !== req.user.institution_id) {
          return res.status(403).json({
            success: false,
            message: '无权操作该排期'
          });
        }
      }

      // 使用模型方法开始考试
      await schedule.startExam();

      res.json({
        success: true,
        message: '考试开始',
        data: { schedule }
      });

    } catch (error) {
      console.error('开始考试错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 完成考试
  async completeExam(req, res) {
    try {
      const { id } = req.params;
      const { score, result, notes } = req.body;

      const schedule = await Schedule.findByPk(id, {
        include: [{
          model: Candidate,
          as: 'candidate'
        }]
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: '排期不存在'
        });
      }

      // 权限检查
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        if (schedule.candidate.institution_id !== req.user.institution_id) {
          return res.status(403).json({
            success: false,
            message: '无权操作该排期'
          });
        }
      }

      // 使用模型方法完成考试
      await schedule.completeExam(score, result, notes);

      res.json({
        success: true,
        message: '考试完成',
        data: { schedule }
      });

    } catch (error) {
      console.error('完成考试错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 获取排期统计信息
  async getScheduleStats(req, res) {
    try {
      const { venue_id, start_date, end_date } = req.query;

      const whereCondition = {};

      // 权限检查
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        whereCondition['$candidate.institution_id$'] = req.user.institution_id;
      }

      if (venue_id) {
        whereCondition.venue_id = venue_id;
      }

      if (start_date || end_date) {
        whereCondition.scheduled_at = {};
        if (start_date) {
          whereCondition.scheduled_at[Op.gte] = new Date(start_date);
        }
        if (end_date) {
          whereCondition.scheduled_at[Op.lte] = new Date(end_date);
        }
      }

      // 按状态统计
      const statusStats = await Schedule.findAll({
        where: whereCondition,
        include: [{
          model: Candidate,
          as: 'candidate',
          attributes: []
        }],
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('Schedule.id')), 'count']
        ],
        group: ['status']
      });

      // 按日期统计
      const dateStats = await Schedule.findAll({
        where: whereCondition,
        include: [{
          model: Candidate,
          as: 'candidate',
          attributes: []
        }],
        attributes: [
          [sequelize.fn('DATE', sequelize.col('scheduled_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('Schedule.id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('scheduled_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('scheduled_at')), 'ASC']]
      });

      res.json({
        success: true,
        message: '获取排期统计成功',
        data: {
          status_stats: statusStats,
          date_stats: dateStats
        }
      });

    } catch (error) {
      console.error('获取排期统计错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}

module.exports = new ScheduleController();