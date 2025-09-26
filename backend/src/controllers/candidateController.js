const { Candidate, Institution, Schedule, ExamProduct } = require('../models');
const { validationResult } = require('express-validator');
const XLSX = require('xlsx');
const { Op } = require('sequelize');

class CandidateController {
  // 获取考生列表（支持分页、筛选、搜索）
  async getCandidates(req, res) {
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
        search = '',
        institution_id,
        status,
        start_date,
        end_date
      } = req.query;

      // 构建查询条件
      const whereCondition = {};

      // 如果不是系统管理员，只能查看自己机构的考生
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        whereCondition.institution_id = req.user.institution_id;
      } else if (institution_id) {
        whereCondition.institution_id = institution_id;
      }

      // 状态筛选
      if (status) {
        whereCondition.status = status;
      }

      // 搜索条件（姓名、身份证号、手机号、报名号）
      if (search) {
        whereCondition[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { id_number: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
          { registration_number: { [Op.like]: `%${search}%` } }
        ];
      }

      // 日期范围筛选
      if (start_date || end_date) {
        whereCondition.created_at = {};
        if (start_date) {
          whereCondition.created_at[Op.gte] = new Date(start_date);
        }
        if (end_date) {
          whereCondition.created_at[Op.lte] = new Date(end_date);
        }
      }

      // 分页计算
      const offset = (page - 1) * limit;

      // 查询考生列表
      const { count, rows: candidates } = await Candidate.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: Institution,
            as: 'institution',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      // 计算分页信息
      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        message: '获取考生列表成功',
        data: {
          candidates,
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
      console.error('获取考生列表错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 获取考生详情
  async getCandidateById(req, res) {
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

      const candidate = await Candidate.findByPk(id, {
        include: [
          {
            model: Institution,
            as: 'institution',
            attributes: ['id', 'name', 'code', 'address', 'contact_phone']
          },
          {
            model: Schedule,
            as: 'schedules',
            include: [
              {
                model: ExamProduct,
                as: 'exam_product',
                attributes: ['id', 'name', 'code']
              }
            ],
            order: [['scheduled_at', 'DESC']]
          }
        ]
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: '考生信息不存在'
        });
      }

      // 权限检查：非管理员只能查看自己机构的考生
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        if (candidate.institution_id !== req.user.institution_id) {
          return res.status(403).json({
            success: false,
            message: '无权访问该考生信息'
          });
        }
      }

      res.json({
        success: true,
        message: '获取考生详情成功',
        data: { candidate }
      });

    } catch (error) {
      console.error('获取考生详情错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 创建考生
  async createCandidate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }

      const candidateData = req.body;

      // 如果不是系统管理员，只能在自己机构下创建考生
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        candidateData.institution_id = req.user.institution_id;
      }

      // 检查身份证号是否已存在
      const existingCandidate = await Candidate.findOne({
        where: { id_number: candidateData.id_number }
      });

      if (existingCandidate) {
        return res.status(400).json({
          success: false,
          message: '该身份证号已存在'
        });
      }

      // 检查手机号是否已存在
      const existingPhone = await Candidate.findOne({
        where: { phone: candidateData.phone }
      });

      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: '该手机号已存在'
        });
      }

      // 创建考生
      const candidate = await Candidate.create(candidateData);

      // 获取完整的考生信息
      const newCandidate = await Candidate.findByPk(candidate.id, {
        include: [{
          model: Institution,
          as: 'institution',
          attributes: ['id', 'name', 'code']
        }]
      });

      res.status(201).json({
        success: true,
        message: '考生创建成功',
        data: { candidate: newCandidate }
      });

    } catch (error) {
      console.error('创建考生错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 更新考生信息
  async updateCandidate(req, res) {
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

      const candidate = await Candidate.findByPk(id);
      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: '考生信息不存在'
        });
      }

      // 权限检查：非管理员只能更新自己机构的考生
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        if (candidate.institution_id !== req.user.institution_id) {
          return res.status(403).json({
            success: false,
            message: '无权修改该考生信息'
          });
        }
        // 非管理员不能修改机构
        delete updateData.institution_id;
      }

      // 如果更新身份证号，检查是否已存在
      if (updateData.id_number && updateData.id_number !== candidate.id_number) {
        const existingIdNumber = await Candidate.findOne({
          where: {
            id_number: updateData.id_number,
            id: { [Op.ne]: id }
          }
        });

        if (existingIdNumber) {
          return res.status(400).json({
            success: false,
            message: '该身份证号已存在'
          });
        }
      }

      // 如果更新手机号，检查是否已存在
      if (updateData.phone && updateData.phone !== candidate.phone) {
        const existingPhone = await Candidate.findOne({
          where: {
            phone: updateData.phone,
            id: { [Op.ne]: id }
          }
        });

        if (existingPhone) {
          return res.status(400).json({
            success: false,
            message: '该手机号已存在'
          });
        }
      }

      // 更新考生信息
      await candidate.update(updateData);

      // 获取更新后的完整信息
      const updatedCandidate = await Candidate.findByPk(id, {
        include: [{
          model: Institution,
          as: 'institution',
          attributes: ['id', 'name', 'code']
        }]
      });

      res.json({
        success: true,
        message: '考生信息更新成功',
        data: { candidate: updatedCandidate }
      });

    } catch (error) {
      console.error('更新考生信息错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 删除考生
  async deleteCandidate(req, res) {
    try {
      const { id } = req.params;

      const candidate = await Candidate.findByPk(id);
      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: '考生信息不存在'
        });
      }

      // 权限检查
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        if (candidate.institution_id !== req.user.institution_id) {
          return res.status(403).json({
            success: false,
            message: '无权删除该考生信息'
          });
        }
      }

      // 检查是否有关联的考试排期
      const scheduleCount = await Schedule.count({
        where: { candidate_id: id }
      });

      if (scheduleCount > 0) {
        return res.status(400).json({
          success: false,
          message: '该考生存在考试排期记录，不能删除'
        });
      }

      await candidate.destroy();

      res.json({
        success: true,
        message: '考生删除成功'
      });

    } catch (error) {
      console.error('删除考生错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 批量Excel导入考生
  async importCandidates(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Excel文件不能为空'
        });
      }

      // 读取Excel文件
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Excel文件中没有数据'
        });
      }

      const successList = [];
      const errorList = [];
      const institution_id = req.user && !req.user.roles.some(role => role.code === 'ADMIN')
        ? req.user.institution_id
        : req.body.institution_id;

      if (!institution_id) {
        return res.status(400).json({
          success: false,
          message: '机构ID不能为空'
        });
      }

      // 验证机构是否存在
      const institution = await Institution.findByPk(institution_id);
      if (!institution) {
        return res.status(400).json({
          success: false,
          message: '机构不存在'
        });
      }

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowIndex = i + 2; // Excel行号（包含表头）

        try {
          // 数据映射和验证
          const candidateData = {
            name: row['姓名'] || row['name'],
            id_number: row['身份证号'] || row['id_number'],
            phone: row['手机号'] || row['phone'],
            email: row['邮箱'] || row['email'] || null,
            gender: row['性别'] || row['gender'] || null,
            birth_date: row['出生日期'] || row['birth_date'] || null,
            registration_number: row['报名号'] || row['registration_number'] || null,
            institution_id: institution_id
          };

          // 基本字段验证
          if (!candidateData.name) {
            throw new Error('姓名不能为空');
          }
          if (!candidateData.id_number) {
            throw new Error('身份证号不能为空');
          }
          if (!candidateData.phone) {
            throw new Error('手机号不能为空');
          }

          // 身份证号格式验证
          if (!/^[0-9X]{15,20}$/i.test(candidateData.id_number)) {
            throw new Error('身份证号格式不正确');
          }

          // 手机号格式验证
          if (!/^1[3-9]\d{9}$/.test(candidateData.phone)) {
            throw new Error('手机号格式不正确');
          }

          // 性别转换
          if (candidateData.gender) {
            const genderMap = { '男': 'male', '女': 'female' };
            candidateData.gender = genderMap[candidateData.gender] || candidateData.gender;
            if (!['male', 'female'].includes(candidateData.gender)) {
              candidateData.gender = null;
            }
          }

          // 检查身份证号是否已存在
          const existingIdNumber = await Candidate.findOne({
            where: { id_number: candidateData.id_number }
          });

          if (existingIdNumber) {
            throw new Error('身份证号已存在');
          }

          // 检查手机号是否已存在
          const existingPhone = await Candidate.findOne({
            where: { phone: candidateData.phone }
          });

          if (existingPhone) {
            throw new Error('手机号已存在');
          }

          // 创建考生
          const candidate = await Candidate.create(candidateData);
          successList.push({
            row: rowIndex,
            name: candidate.name,
            id_number: candidate.id_number,
            id: candidate.id
          });

        } catch (error) {
          errorList.push({
            row: rowIndex,
            name: row['姓名'] || row['name'] || '未知',
            id_number: row['身份证号'] || row['id_number'] || '未知',
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `导入完成，成功${successList.length}条，失败${errorList.length}条`,
        data: {
          success_count: successList.length,
          error_count: errorList.length,
          success_list: successList,
          error_list: errorList
        }
      });

    } catch (error) {
      console.error('批量导入考生错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 导出考生列表到Excel
  async exportCandidates(req, res) {
    try {
      const { institution_id, status } = req.query;

      const whereCondition = {};

      // 权限检查
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        whereCondition.institution_id = req.user.institution_id;
      } else if (institution_id) {
        whereCondition.institution_id = institution_id;
      }

      if (status) {
        whereCondition.status = status;
      }

      const candidates = await Candidate.findAll({
        where: whereCondition,
        include: [{
          model: Institution,
          as: 'institution',
          attributes: ['name']
        }],
        order: [['created_at', 'DESC']]
      });

      // 转换数据格式
      const exportData = candidates.map(candidate => ({
        '姓名': candidate.name,
        '身份证号': candidate.id_number,
        '手机号': candidate.phone,
        '邮箱': candidate.email || '',
        '性别': candidate.gender === 'male' ? '男' : candidate.gender === 'female' ? '女' : '',
        '出生日期': candidate.birth_date || '',
        '报名号': candidate.registration_number || '',
        '机构': candidate.institution ? candidate.institution.name : '',
        '状态': candidate.status === 'active' ? '正常' : candidate.status === 'inactive' ? '禁用' : candidate.status,
        '创建时间': candidate.created_at.toLocaleString('zh-CN')
      }));

      // 创建工作簿
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, '考生列表');

      // 设置响应头
      const filename = `考生列表_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);

      // 输出Excel文件
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.send(buffer);

    } catch (error) {
      console.error('导出考生列表错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 更新考生状态
  async updateCandidateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的状态值'
        });
      }

      const candidate = await Candidate.findByPk(id);
      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: '考生信息不存在'
        });
      }

      // 权限检查
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        if (candidate.institution_id !== req.user.institution_id) {
          return res.status(403).json({
            success: false,
            message: '无权修改该考生状态'
          });
        }
      }

      await candidate.update({ status });

      res.json({
        success: true,
        message: '考生状态更新成功',
        data: { candidate }
      });

    } catch (error) {
      console.error('更新考生状态错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 获取考生统计信息
  async getCandidateStats(req, res) {
    try {
      const whereCondition = {};

      // 权限检查
      if (req.user && !req.user.roles.some(role => role.code === 'ADMIN')) {
        whereCondition.institution_id = req.user.institution_id;
      }

      const stats = await Candidate.getStatistics(whereCondition);

      res.json({
        success: true,
        message: '获取考生统计成功',
        data: { stats }
      });

    } catch (error) {
      console.error('获取考生统计错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}

module.exports = new CandidateController();