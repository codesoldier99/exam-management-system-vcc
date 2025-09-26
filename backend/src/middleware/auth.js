const jwt = require('jsonwebtoken');
const { User, Candidate } = require('../models');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 根据token类型加载用户或考生信息
    if (decoded.type === 'candidate') {
      const candidate = await Candidate.findByPk(decoded.candidate_id, {
        include: ['institution']
      });

      if (!candidate) {
        return res.status(401).json({
          success: false,
          message: '考生信息不存在'
        });
      }

      if (candidate.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: '考生账户已被禁用'
        });
      }

      req.candidate = candidate;
      req.token_data = decoded;
    } else {
      const user = await User.findByPk(decoded.user_id, {
        include: ['roles', 'institution']
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户信息不存在'
        });
      }

      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: '用户账户已被禁用'
        });
      }

      req.user = user;
      req.token_data = decoded;
    }

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '访问令牌无效'
      });
    }

    console.error('认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 权限检查中间件
const requirePermissions = (permissions) => {
  return (req, res, next) => {
    try {
      // 考生没有权限系统
      if (req.candidate) {
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }

      const user = req.user;
      if (!user || !user.roles) {
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }

      // 检查用户是否拥有所需权限
      const userPermissions = [];
      user.roles.forEach(role => {
        if (role.permissions && Array.isArray(role.permissions)) {
          userPermissions.push(...role.permissions);
        }
      });

      const hasPermission = permissions.some(permission =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }

      next();

    } catch (error) {
      console.error('权限检查错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  };
};

// 角色检查中间件
const requireRoles = (roleCodes) => {
  return (req, res, next) => {
    try {
      // 考生没有角色系统
      if (req.candidate) {
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }

      const user = req.user;
      if (!user || !user.roles) {
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }

      const userRoles = user.roles.map(role => role.code);
      const hasRole = roleCodes.some(role => userRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }

      next();

    } catch (error) {
      console.error('角色检查错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  };
};

// 机构权限检查中间件（确保用户只能操作自己机构的数据）
const requireSameInstitution = (req, res, next) => {
  try {
    const user = req.user;
    const candidate = req.candidate;

    if (!user && !candidate) {
      return res.status(401).json({
        success: false,
        message: '未授权访问'
      });
    }

    // 系统管理员可以访问所有机构数据
    if (user && user.roles && user.roles.some(role => role.code === 'ADMIN')) {
      return next();
    }

    // 获取要访问的机构ID（从路径参数或查询参数中）
    const targetInstitutionId = req.params.institutionId ||
                               req.query.institutionId ||
                               req.body.institution_id;

    if (targetInstitutionId) {
      const userInstitutionId = user ? user.institution_id : candidate.institution_id;

      if (parseInt(targetInstitutionId) !== parseInt(userInstitutionId)) {
        return res.status(403).json({
          success: false,
          message: '无权访问其他机构的数据'
        });
      }
    }

    next();

  } catch (error) {
    console.error('机构权限检查错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 只允许考生访问
const candidateOnly = (req, res, next) => {
  if (!req.candidate) {
    return res.status(403).json({
      success: false,
      message: '此接口仅限考生访问'
    });
  }
  next();
};

// 只允许用户访问（非考生）
const userOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: '此接口仅限用户访问'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requirePermissions,
  requireRoles,
  requireSameInstitution,
  candidateOnly,
  userOnly
};