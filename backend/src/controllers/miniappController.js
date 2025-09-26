const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { Candidate, User, Schedule, ExamProduct, Venue, Institution } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

class MiniappController {
  // 考生身份证登录（小程序专用）
  async candidateLogin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }

      const { id_number, phone } = req.body;

      // 查找考生
      const candidate = await Candidate.findOne({
        where: { id_number },
        include: [{
          model: Institution,
          as: 'institution',
          attributes: ['id', 'name', 'code', 'address']
        }]
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: '考生信息不存在，请联系考试机构确认'
        });
      }

      // 验证手机号
      if (candidate.phone !== phone) {
        return res.status(401).json({
          success: false,
          message: '身份证号和手机号不匹配'
        });
      }

      // 验证考生状态
      if (candidate.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: '考生账户状态异常，请联系考试机构'
        });
      }

      // 生成小程序专用token
      const token = this.generateMiniappToken(candidate);

      // 获取考生今日排期
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaySchedules = await Schedule.findAll({
        where: {
          candidate_id: candidate.id,
          scheduled_at: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        },
        include: [
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
        ],
        order: [['scheduled_at', 'ASC']]
      });

      const candidateInfo = {
        id: candidate.id,
        name: candidate.name,
        id_number: candidate.id_number,
        phone: candidate.phone,
        email: candidate.email,
        gender: candidate.gender,
        registration_number: candidate.registration_number,
        institution: candidate.institution,
        status: candidate.status,
        today_schedules: todaySchedules
      };

      res.json({
        success: true,
        message: '登录成功',
        data: {
          candidate: candidateInfo,
          token,
          expires_in: process.env.JWT_EXPIRES_IN || '7d'
        }
      });

    } catch (error) {
      console.error('小程序考生登录错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 考务人员登录（小程序专用）
  async staffLogin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }

      const { username, password } = req.body;

      // 查找用户
      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      // 验证用户状态
      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: '用户账户已被禁用'
        });
      }

      // 验证密码
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      // 验证角色权限（只允许PROCTOR和机构管理员使用小程序）
      const allowedRoles = ['PROCTOR', 'INSTITUTION_ADMIN'];
      const hasValidRole = user.roles && user.roles.some(role =>
        allowedRoles.includes(role.code)
      );

      if (!hasValidRole) {
        return res.status(403).json({
          success: false,
          message: '您没有权限使用小程序'
        });
      }

      // 生成小程序专用token
      const token = this.generateMiniappUserToken(user);

      const userInfo = {
        id: user.id,
        username: user.username,
        real_name: user.real_name,
        roles: user.roles || [],
        institution: user.institution || null
      };

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: userInfo,
          token,
          expires_in: process.env.JWT_EXPIRES_IN || '7d'
        }
      });

    } catch (error) {
      console.error('小程序考务人员登录错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 获取考生个人信息和日程
  async getCandidateProfile(req, res) {
    try {
      const candidate = req.candidate;
      if (!candidate) {
        return res.status(401).json({
          success: false,
          message: '请先登录'
        });
      }

      // 获取考生的所有排期
      const schedules = await Schedule.findAll({
        where: { candidate_id: candidate.id },
        include: [
          {
            model: ExamProduct,
            as: 'exam_product',
            attributes: ['id', 'name', 'code', 'duration']
          },
          {
            model: Venue,
            as: 'venue',
            attributes: ['id', 'name', 'address', 'contact_phone']
          }
        ],
        order: [['scheduled_at', 'DESC']]
      });

      // 统计信息
      const stats = {
        total_exams: schedules.length,
        scheduled: schedules.filter(s => s.status === 'scheduled').length,
        completed: schedules.filter(s => s.status === 'completed').length,
        passed: schedules.filter(s => s.status === 'completed' && s.result === 'pass').length
      };

      const candidateInfo = {
        id: candidate.id,
        name: candidate.name,
        id_number: candidate.id_number,
        phone: candidate.phone,
        email: candidate.email,
        gender: candidate.gender,
        registration_number: candidate.registration_number,
        institution: candidate.institution,
        status: candidate.status,
        schedules,
        stats
      };

      res.json({
        success: true,
        message: '获取个人信息成功',
        data: { candidate: candidateInfo }
      });

    } catch (error) {
      console.error('获取考生个人信息错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 生成考生专用动态二维码
  async generateCandidateQR(req, res) {
    try {
      const candidate = req.candidate;
      if (!candidate) {
        return res.status(401).json({
          success: false,
          message: '请先登录'
        });
      }

      const { schedule_id } = req.query;

      // 如果指定了排期ID，验证排期是否属于该考生
      if (schedule_id) {
        const schedule = await Schedule.findOne({
          where: {
            id: schedule_id,
            candidate_id: candidate.id
          }
        });

        if (!schedule) {
          return res.status(404).json({
            success: false,
            message: '排期信息不存在'
          });
        }

        // 只有scheduled和checked_in状态才能生成二维码
        if (!['scheduled', 'checked_in'].includes(schedule.status)) {
          return res.status(400).json({
            success: false,
            message: '该排期状态无法生成二维码'
          });
        }
      }

      // 生成二维码数据
      const timestamp = Date.now();
      const qrData = {
        type: 'candidate_checkin',
        candidate_id: candidate.id,
        schedule_id: schedule_id || null,
        timestamp,
        signature: this.generateQRSignature({
          candidate_id: candidate.id,
          schedule_id,
          timestamp
        })
      };

      const qrString = JSON.stringify(qrData);

      // 生成二维码图片
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.json({
        success: true,
        message: '二维码生成成功',
        data: {
          qr_code: qrCodeDataURL,
          qr_data: qrString,
          expires_at: new Date(timestamp + 5 * 60 * 1000), // 5分钟后过期
          candidate_name: candidate.name,
          schedule_id: schedule_id || null
        }
      });

    } catch (error) {
      console.error('生成考生二维码错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 考务人员扫码签到
  async scanCheckin(req, res) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '请先登录'
        });
      }

      const { qr_data } = req.body;

      if (!qr_data) {
        return res.status(400).json({
          success: false,
          message: '二维码数据不能为空'
        });
      }

      // 解析二维码数据
      let qrInfo;
      try {
        qrInfo = JSON.parse(qr_data);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: '二维码格式错误'
        });
      }

      // 验证二维码类型
      if (qrInfo.type !== 'candidate_checkin') {
        return res.status(400).json({
          success: false,
          message: '无效的二维码类型'
        });
      }

      // 验证二维码是否过期（5分钟）
      const now = Date.now();
      if (now - qrInfo.timestamp > 5 * 60 * 1000) {
        return res.status(400).json({
          success: false,
          message: '二维码已过期，请重新生成'
        });
      }

      // 验证签名
      const expectedSignature = this.generateQRSignature({
        candidate_id: qrInfo.candidate_id,
        schedule_id: qrInfo.schedule_id,
        timestamp: qrInfo.timestamp
      });

      if (qrInfo.signature !== expectedSignature) {
        return res.status(400).json({
          success: false,
          message: '二维码签名验证失败'
        });
      }

      // 查找考生
      const candidate = await Candidate.findByPk(qrInfo.candidate_id, {
        include: [{
          model: Institution,
          as: 'institution',
          attributes: ['id', 'name']
        }]
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: '考生信息不存在'
        });
      }

      // 权限检查：非管理员只能签到自己机构的考生
      if (!user.roles.some(role => role.code === 'ADMIN')) {
        if (candidate.institution_id !== user.institution_id) {
          return res.status(403).json({
            success: false,
            message: '无权签到该考生'
          });
        }
      }

      let schedule = null;

      // 如果有指定排期ID，使用指定的排期
      if (qrInfo.schedule_id) {
        schedule = await Schedule.findOne({
          where: {
            id: qrInfo.schedule_id,
            candidate_id: qrInfo.candidate_id
          },
          include: [
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
      } else {
        // 否则查找今日的排期
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        schedule = await Schedule.findOne({
          where: {
            candidate_id: qrInfo.candidate_id,
            status: 'scheduled',
            scheduled_at: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          },
          include: [
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
          ],
          order: [['scheduled_at', 'ASC']]
        });
      }

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: '未找到可签到的排期'
        });
      }

      // 执行签到
      await schedule.checkIn();

      res.json({
        success: true,
        message: '签到成功',
        data: {
          candidate: {
            id: candidate.id,
            name: candidate.name,
            id_number: candidate.id_number,
            institution: candidate.institution
          },
          schedule: {
            id: schedule.id,
            exam_product: schedule.exam_product,
            venue: schedule.venue,
            scheduled_at: schedule.scheduled_at,
            status: schedule.status,
            checked_in_at: schedule.checked_in_at
          },
          operator: {
            id: user.id,
            name: user.real_name
          }
        }
      });

    } catch (error) {
      console.error('扫码签到错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 公共考场看板数据
  async getPublicBoard(req, res) {
    try {
      const { venue_id, date } = req.query;

      // 构建查询条件
      const whereCondition = {};

      if (venue_id) {
        whereCondition.venue_id = venue_id;
      }

      // 日期筛选，默认今日
      const targetDate = date ? new Date(date) : new Date();
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      whereCondition.scheduled_at = {
        [Op.gte]: targetDate,
        [Op.lt]: nextDay
      };

      // 获取当日排期
      const schedules = await Schedule.findAll({
        where: whereCondition,
        include: [
          {
            model: Candidate,
            as: 'candidate',
            attributes: ['id', 'name', 'registration_number']
          },
          {
            model: ExamProduct,
            as: 'exam_product',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Venue,
            as: 'venue',
            attributes: ['id', 'name', 'address', 'capacity']
          }
        ],
        order: [['scheduled_at', 'ASC']]
      });

      // 统计数据
      const stats = {
        total: schedules.length,
        scheduled: schedules.filter(s => s.status === 'scheduled').length,
        checked_in: schedules.filter(s => s.status === 'checked_in').length,
        in_progress: schedules.filter(s => s.status === 'in_progress').length,
        completed: schedules.filter(s => s.status === 'completed').length,
        cancelled: schedules.filter(s => s.status === 'cancelled').length
      };

      // 按时间段分组
      const timeSlots = [];
      const slotMap = new Map();

      schedules.forEach(schedule => {
        const hour = new Date(schedule.scheduled_at).getHours();
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;

        if (!slotMap.has(timeSlot)) {
          slotMap.set(timeSlot, {
            time: timeSlot,
            schedules: []
          });
        }

        slotMap.get(timeSlot).schedules.push(schedule);
      });

      Array.from(slotMap.values())
        .sort((a, b) => a.time.localeCompare(b.time))
        .forEach(slot => timeSlots.push(slot));

      // 获取考场信息
      const venues = await Venue.findAll({
        where: venue_id ? { id: venue_id } : {},
        attributes: ['id', 'name', 'address', 'capacity']
      });

      res.json({
        success: true,
        message: '获取考场看板成功',
        data: {
          date: targetDate.toISOString().split('T')[0],
          venues,
          stats,
          time_slots: timeSlots,
          schedules,
          last_updated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('获取考场看板错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 获取考生今日日程
  async getTodaySchedules(req, res) {
    try {
      const candidate = req.candidate;
      if (!candidate) {
        return res.status(401).json({
          success: false,
          message: '请先登录'
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const schedules = await Schedule.findAll({
        where: {
          candidate_id: candidate.id,
          scheduled_at: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        },
        include: [
          {
            model: ExamProduct,
            as: 'exam_product',
            attributes: ['id', 'name', 'code', 'duration']
          },
          {
            model: Venue,
            as: 'venue',
            attributes: ['id', 'name', 'address', 'contact_phone']
          }
        ],
        order: [['scheduled_at', 'ASC']]
      });

      res.json({
        success: true,
        message: '获取今日日程成功',
        data: {
          date: today.toISOString().split('T')[0],
          schedules,
          total: schedules.length
        }
      });

    } catch (error) {
      console.error('获取今日日程错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 生成小程序考生token
  generateMiniappToken(candidate) {
    return jwt.sign(
      {
        candidate_id: candidate.id,
        name: candidate.name,
        id_number: candidate.id_number,
        institution_id: candidate.institution_id,
        type: 'miniapp_candidate',
        platform: 'miniapp'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // 生成小程序用户token
  generateMiniappUserToken(user) {
    return jwt.sign(
      {
        user_id: user.id,
        username: user.username,
        real_name: user.real_name,
        institution_id: user.institution_id,
        type: 'miniapp_user',
        platform: 'miniapp'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // 生成二维码签名
  generateQRSignature(data) {
    const crypto = require('crypto');
    const secret = process.env.QR_SECRET || process.env.JWT_SECRET;
    const signData = `${data.candidate_id}-${data.schedule_id || ''}-${data.timestamp}`;
    return crypto.createHmac('sha256', secret).update(signData).digest('hex');
  }
}

module.exports = new MiniappController();