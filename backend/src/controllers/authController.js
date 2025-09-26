const jwt = require('jsonwebtoken');
const { User, Role, Candidate, Institution } = require('../models');
const { validationResult } = require('express-validator');

class AuthController {

  // 用户登录（管理员、机构管理员、考务员）
  async login(req, res) {
    try {
      // 验证输入
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

      // 更新最后登录时间
      await user.updateLastLogin();

      // 生成JWT token
      const token = generateToken(user);

      // 准备返回的用户信息
      const userInfo = {
        id: user.id,
        username: user.username,
        real_name: user.real_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        roles: user.roles || [],
        institution: user.institution || null,
        last_login_at: user.last_login_at
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
      console.error('登录错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 考生身份证登录（小程序使用）
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
      const candidate = await Candidate.findByIdNumber(id_number);
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

      // 生成考生专用token
      const token = generateCandidateToken(candidate);

      // 准备返回的考生信息
      const candidateInfo = {
        id: candidate.id,
        name: candidate.name,
        id_number: candidate.id_number,
        phone: candidate.phone,
        email: candidate.email,
        gender: candidate.gender,
        registration_number: candidate.registration_number,
        institution: candidate.institution || null,
        qr_code: candidate.qr_code,
        status: candidate.status
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
      console.error('考生登录错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 用户注册（仅限系统管理员）
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }

      const { username, password, email, phone, real_name, institution_id, role_codes } = req.body;

      // 检查用户名是否已存在
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        });
      }

      // 创建用户
      const user = await User.create({
        username,
        password,
        email,
        phone,
        real_name,
        institution_id: institution_id || null
      });

      // 分配角色
      if (role_codes && role_codes.length > 0) {
        const roles = await Role.findAll({
          where: {
            code: role_codes,
            status: 'active'
          }
        });
        await user.addRoles(roles);
      }

      // 获取完整用户信息
      const newUser = await User.findByPk(user.id, {
        include: ['roles', 'institution']
      });

      const userInfo = {
        id: newUser.id,
        username: newUser.username,
        real_name: newUser.real_name,
        email: newUser.email,
        phone: newUser.phone,
        status: newUser.status,
        roles: newUser.roles || [],
        institution: newUser.institution || null
      };

      res.status(201).json({
        success: true,
        message: '用户创建成功',
        data: { user: userInfo }
      });

    } catch (error) {
      console.error('注册错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 登出
  async logout(req, res) {
    try {
      // 前端需要删除本地存储的token
      res.json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      console.error('登出错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 刷新token
  async refreshToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token不能为空'
        });
      }

      // 验证旧token（允许过期）
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          // token过期，尝试解码不验证过期时间
          decoded = jwt.decode(token);
        } else {
          return res.status(401).json({
            success: false,
            message: 'Token无效'
          });
        }
      }

      if (!decoded || !decoded.user_id) {
        return res.status(401).json({
          success: false,
          message: 'Token格式错误'
        });
      }

      // 根据token类型获取用户或考生信息
      let newToken;
      if (decoded.type === 'candidate') {
        const candidate = await Candidate.findByPk(decoded.candidate_id, {
          include: ['institution']
        });

        if (!candidate || candidate.status !== 'active') {
          return res.status(401).json({
            success: false,
            message: '考生信息无效'
          });
        }

        newToken = generateCandidateToken(candidate);
      } else {
        const user = await User.findByPk(decoded.user_id, {
          include: ['roles', 'institution']
        });

        if (!user || user.status !== 'active') {
          return res.status(401).json({
            success: false,
            message: '用户信息无效'
          });
        }

        newToken = generateToken(user);
      }

      res.json({
        success: true,
        message: 'Token刷新成功',
        data: {
          token: newToken,
          expires_in: process.env.JWT_EXPIRES_IN || '7d'
        }
      });

    } catch (error) {
      console.error('刷新Token错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 获取当前用户信息
  async getCurrentUser(req, res) {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '未授权访问'
        });
      }

      // 如果是考生
      if (req.candidate) {
        const candidate = req.candidate;
        const candidateInfo = {
          id: candidate.id,
          name: candidate.name,
          id_number: candidate.id_number,
          phone: candidate.phone,
          email: candidate.email,
          gender: candidate.gender,
          registration_number: candidate.registration_number,
          institution: candidate.institution || null,
          qr_code: candidate.qr_code,
          status: candidate.status
        };

        return res.json({
          success: true,
          message: '获取考生信息成功',
          data: { candidate: candidateInfo }
        });
      }

      // 如果是普通用户
      const userInfo = {
        id: user.id,
        username: user.username,
        real_name: user.real_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        roles: user.roles || [],
        institution: user.institution || null,
        last_login_at: user.last_login_at
      };

      res.json({
        success: true,
        message: '获取用户信息成功',
        data: { user: userInfo }
      });

    } catch (error) {
      console.error('获取用户信息错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  // 修改密码
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }

      const { old_password, new_password } = req.body;
      const user = req.user;

      // 验证旧密码
      const isValidOldPassword = await user.validatePassword(old_password);
      if (!isValidOldPassword) {
        return res.status(400).json({
          success: false,
          message: '原密码错误'
        });
      }

      // 更新密码
      user.password = new_password;
      await user.save();

      res.json({
        success: true,
        message: '密码修改成功'
      });

    } catch (error) {
      console.error('修改密码错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

}

// 生成用户JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.id,
      username: user.username,
      real_name: user.real_name,
      institution_id: user.institution_id,
      type: 'user'
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 生成考生JWT token
const generateCandidateToken = (candidate) => {
  return jwt.sign(
    {
      candidate_id: candidate.id,
      name: candidate.name,
      id_number: candidate.id_number,
      institution_id: candidate.institution_id,
      type: 'candidate'
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = new AuthController();