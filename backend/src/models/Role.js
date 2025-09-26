const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50],
        notEmpty: true
      }
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 20],
        notEmpty: true,
        is: /^[A-Z_]+$/
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
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
    tableName: 'roles'
  });

  // 类方法：根据角色代码查找角色
  Role.findByCode = async function(code) {
    return await this.findOne({
      where: { code, status: 'active' }
    });
  };

  // 类方法：获取所有活跃角色
  Role.getActiveRoles = async function() {
    return await this.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']]
    });
  };

  // 实例方法：检查权限
  Role.prototype.hasPermission = function(permission) {
    return Array.isArray(this.permissions) && this.permissions.includes(permission);
  };

  // 实例方法：添加权限
  Role.prototype.addPermission = function(permission) {
    if (!this.permissions) this.permissions = [];
    if (!this.permissions.includes(permission)) {
      this.permissions.push(permission);
    }
  };

  // 实例方法：移除权限
  Role.prototype.removePermission = function(permission) {
    if (this.permissions) {
      this.permissions = this.permissions.filter(p => p !== permission);
    }
  };

  return Role;
};