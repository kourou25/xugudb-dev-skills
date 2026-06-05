# Sequelize 虚谷数据库配置指南

## 概述

本文档提供 Sequelize 适配虚谷数据库(XuguDB)的完整配置流程。Sequelize 是一个基于 promise 的 Node.js ORM 框架，通过虚谷数据库专用的方言包 `xugu-dialect`，可以无缝集成 Sequelize 框架的各种功能，包括模型定义、CRUD 操作、事务处理、关联关系等。

## 前置条件

1. 已安装 Node.js 环境（推荐 Node.js 14.x 或更高版本）
2. 已部署虚谷数据库 v12.0.0 或更高版本
3. 已获取虚谷数据库 Node.js 驱动和 Sequelize 方言包

## 第一步：安装依赖

### 安装 Sequelize

```bash
# 安装 Sequelize 和相关依赖
npm install sequelize dotenv

# 或使用 yarn
yarn add sequelize dotenv
```

### 安装虚谷数据库驱动

1. **获取方言包** - 从虚谷数据库官方下载 Sequelize 方言压缩包（`xugu-dialect`）
2. **解压方言包** - 解压压缩包获取方言文件
3. **放置方言文件** - 将解压后的 `xugu-dialect` 目录移动到 Sequelize 的 dialects 目录中，通常路径为 `node_modules/sequelize/lib/dialects/`
4. **替换 MySQL 方言** - 将 `xugu-dialect` 目录重命名为 `mysql`
5. **备份原 MySQL 方言** - 为避免覆盖原有文件，建议将原 `mysql` 目录重命名为 `mysql-bak` 进行备份
6. **放置 Node.js 驱动** - 将 XuguDB 的 Node.js 驱动文件夹放置到 `node_modules/sequelize/lib/dialects/abstract/` 目录下

### 验证驱动安装

```javascript
// 测试 Sequelize 连接
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('SYSTEM', 'SYSDBA', 'SYSDBA', {
  host: '127.0.0.1',
  dialect: 'mysql',  // 使用 mysql dialect（已替换为 xugu-dialect）
  logging: false
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();
```

## 第二步：配置连接

### 环境变量配置

创建 `.env` 文件配置数据库连接参数：

```env
# 数据库配置
DB_NAME=SYSTEM
DB_USER=SYSDBA
DB_PASSWORD=SYSDBA
DB_HOST=127.0.0.1
DB_PORT=5138

# 应用配置
NODE_ENV=development
PORT=3000
```

### 数据库配置文件

创建 `config/database.js` 配置文件：

```javascript
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5138,
    dialect: 'mysql',  // 使用 mysql dialect（已替换为 xugu-dialect）
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 20,          // 最大连接数
      min: 5,           // 最小连接数
      acquire: 30000,   // 获取连接超时时间（毫秒）
      idle: 10000       // 连接空闲超时时间（毫秒）
    },
    define: {
      timestamps: true,  // 自动添加 createdAt 和 updatedAt 字段
      underscored: true, // 使用下划线命名法
      freezeTableName: true // 冻结表名，不自动复数化
    }
  }
);

module.exports = sequelize;
```

### 连接参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| host | 服务器地址 | 127.0.0.1 |
| port | 端口号 | 5138 |
| dialect | 数据库方言 | mysql（已替换为 xugu-dialect） |
| logging | 是否记录 SQL 日志 | false |
| pool.max | 最大连接数 | 20 |
| pool.min | 最小连接数 | 5 |
| pool.acquire | 获取连接超时时间（毫秒） | 30000 |
| pool.idle | 连接空闲超时时间（毫秒） | 10000 |
| define.timestamps | 是否自动添加时间戳字段 | true |
| define.underscored | 是否使用下划线命名法 | false |
| define.freezeTableName | 是否冻结表名 | false |

## 第三步：定义模型

### 基本模型定义

创建 `models/user.js` 文件：

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    },
    comment: '邮箱'
  },
  age: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 150
    },
    comment: '年龄'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否活跃'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '更新时间'
  }
}, {
  tableName: 'users', // 指定表名
  timestamps: true,   // 自动管理 createdAt 和 updatedAt 字段
  paranoid: true,     // 启用软删除（添加 deletedAt 字段）
  comment: '用户表'
});

module.exports = User;
```

### 字段类型说明

| 字段类型 | 说明 | 示例 |
|----------|------|------|
| DataTypes.INTEGER | 整数 | `DataTypes.INTEGER` |
| DataTypes.BIGINT | 大整数 | `DataTypes.BIGINT` |
| DataTypes.STRING | 字符串 | `DataTypes.STRING(100)` |
| DataTypes.TEXT | 文本 | `DataTypes.TEXT` |
| DataTypes.FLOAT | 浮点数 | `DataTypes.FLOAT` |
| DataTypes.DOUBLE | 双精度浮点数 | `DataTypes.DOUBLE` |
| DataTypes.DECIMAL | 十进制数 | `DataTypes.DECIMAL(10, 2)` |
| DataTypes.BOOLEAN | 布尔值 | `DataTypes.BOOLEAN` |
| DataTypes.DATE | 日期时间 | `DataTypes.DATE` |
| DataTypes.DATEONLY | 日期 | `DataTypes.DATEONLY` |
| DataTypes.TIME | 时间 | `DataTypes.TIME` |
| DataTypes.UUID | UUID | `DataTypes.UUID` |
| DataTypes.JSON | JSON | `DataTypes.JSON` |
| DataTypes.BLOB | 二进制大对象 | `DataTypes.BLOB` |

### 关联关系

创建 `models/article.js` 文件：

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '文章ID'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '标题'
  },
  content: {
    type: DataTypes.TEXT,
    comment: '内容'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '作者ID'
  }
}, {
  tableName: 'articles',
  timestamps: true,
  comment: '文章表'
});

// 定义关联关系
Article.belongsTo(User, { foreignKey: 'userId', as: 'author' });
User.hasMany(Article, { foreignKey: 'userId', as: 'articles' });

module.exports = Article;
```

创建 `models/tag.js` 文件：

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Article = require('./article');

const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '标签ID'
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '标签名'
  }
}, {
  tableName: 'tags',
  timestamps: true,
  comment: '标签表'
});

// 定义多对多关系
const ArticleTag = sequelize.define('ArticleTag', {
  articleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '文章ID'
  },
  tagId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '标签ID'
  }
}, {
  tableName: 'article_tags',
  timestamps: false,
  comment: '文章标签关联表'
});

Article.belongsToMany(Tag, { through: ArticleTag, foreignKey: 'articleId', as: 'tags' });
Tag.belongsToMany(Article, { through: ArticleTag, foreignKey: 'tagId', as: 'articles' });

module.exports = { Tag, ArticleTag };
```

## 第四步：数据库迁移

### 创建迁移文件

```bash
# 初始化 Sequelize CLI
npx sequelize-cli init

# 创建迁移文件
npx sequelize-cli migration:generate --name create-users
npx sequelize-cli migration:generate --name create-articles
npx sequelize-cli migration:generate --name create-tags
```

### 迁移文件示例

创建 `migrations/xxxx-create-users.js` 文件：

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      age: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE
      }
    });

    // 添加索引
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
```

### 执行迁移

```bash
# 执行所有迁移
npx sequelize-cli db:migrate

# 回滚迁移
npx sequelize-cli db:migrate:undo

# 回滚所有迁移
npx sequelize-cli db:migrate:undo:all
```

## 第五步：CRUD 操作

### 创建记录

```javascript
const User = require('./models/user');

// 创建单个记录
async function createUser(userData) {
  try {
    const user = await User.create(userData);
    console.log('Created user:', user.toJSON());
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// 批量创建
async function createUsers(usersData) {
  try {
    const users = await User.bulkCreate(usersData);
    console.log('Created users:', users.map(u => u.toJSON()));
    return users;
  } catch (error) {
    console.error('Error creating users:', error);
    throw error;
  }
}

// 使用示例
createUser({
  username: 'john',
  email: 'john@example.com',
  age: 25
});

createUsers([
  { username: 'user1', email: 'user1@example.com', age: 20 },
  { username: 'user2', email: 'user2@example.com', age: 25 },
  { username: 'user3', email: 'user3@example.com', age: 30 }
]);
```

### 查询记录

```javascript
// 查询所有记录
async function getAllUsers() {
  try {
    const users = await User.findAll();
    console.log('All users:', users.map(u => u.toJSON()));
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// 查询单个记录
async function getUserById(id) {
  try {
    const user = await User.findByPk(id);
    if (user) {
      console.log('User found:', user.toJSON());
    } else {
      console.log('User not found');
    }
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// 条件查询
async function getUsersByAge(age) {
  try {
    const users = await User.findAll({
      where: {
        age: age,
        isActive: true
      },
      order: [['createdAt', 'DESC']],
      limit: 10,
      offset: 0
    });
    console.log('Users found:', users.map(u => u.toJSON()));
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// 复杂查询
async function searchUsers(keyword) {
  try {
    const { Op } = require('sequelize');
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } }
        ]
      },
      attributes: ['id', 'username', 'email', 'age'],
      include: [{
        model: Article,
        as: 'articles',
        attributes: ['id', 'title']
      }]
    });
    console.log('Search results:', users.map(u => u.toJSON()));
    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}
```

### 更新记录

```javascript
// 更新单个记录
async function updateUser(id, updateData) {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      console.log('User not found');
      return null;
    }
    
    await user.update(updateData);
    console.log('Updated user:', user.toJSON());
    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// 批量更新
async function updateUsersAge(age, newAge) {
  try {
    const [affectedCount] = await User.update(
      { age: newAge },
      {
        where: {
          age: age,
          isActive: true
        }
      }
    );
    console.log('Updated users count:', affectedCount);
    return affectedCount;
  } catch (error) {
    console.error('Error updating users:', error);
    throw error;
  }
}
```

### 删除记录

```javascript
// 删除单个记录（软删除）
async function deleteUser(id) {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      console.log('User not found');
      return false;
    }
    
    await user.destroy();
    console.log('Deleted user:', user.toJSON());
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// 批量删除（软删除）
async function deleteInactiveUsers() {
  try {
    const affectedCount = await User.destroy({
      where: {
        isActive: false
      }
    });
    console.log('Deleted users count:', affectedCount);
    return affectedCount;
  } catch (error) {
    console.error('Error deleting users:', error);
    throw error;
  }
}

// 物理删除
async function permanentDeleteUser(id) {
  try {
    const user = await User.findByPk(id, { paranoid: false });
    if (!user) {
      console.log('User not found');
      return false;
    }
    
    await user.destroy({ force: true });
    console.log('Permanently deleted user:', user.toJSON());
    return true;
  } catch (error) {
    console.error('Error permanently deleting user:', error);
    throw error;
  }
}
```

## 第六步：事务处理

### 基本事务

```javascript
async function transferMoney(fromUserId, toUserId, amount) {
  const transaction = await sequelize.transaction();
  
  try {
    // 从发送方扣款
    const fromUser = await User.findByPk(fromUserId, { transaction });
    if (!fromUser || fromUser.balance < amount) {
      throw new Error('Insufficient balance');
    }
    
    await fromUser.update(
      { balance: fromUser.balance - amount },
      { transaction }
    );
    
    // 向接收方加款
    const toUser = await User.findByPk(toUserId, { transaction });
    if (!toUser) {
      throw new Error('Recipient not found');
    }
    
    await toUser.update(
      { balance: toUser.balance + amount },
      { transaction }
    );
    
    // 提交事务
    await transaction.commit();
    console.log('Transfer successful');
    return true;
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    console.error('Transfer failed:', error);
    throw error;
  }
}
```

### 自动事务

```javascript
async function createUserWithProfile(userData, profileData) {
  try {
    const result = await sequelize.transaction(async (t) => {
      // 创建用户
      const user = await User.create(userData, { transaction: t });
      
      // 创建用户资料
      const profile = await Profile.create({
        ...profileData,
        userId: user.id
      }, { transaction: t });
      
      return { user, profile };
    });
    
    console.log('Created user with profile:', result);
    return result;
  } catch (error) {
    console.error('Error creating user with profile:', error);
    throw error;
  }
}
```

## 第七步：性能优化

### 批量操作

```javascript
// 批量插入
async function bulkCreateUsers(usersData) {
  try {
    const users = await User.bulkCreate(usersData, {
      validate: true,
      ignoreDuplicates: true
    });
    console.log('Bulk created users:', users.length);
    return users;
  } catch (error) {
    console.error('Error bulk creating users:', error);
    throw error;
  }
}

// 分批插入
async function bulkCreateUsersInBatches(usersData, batchSize = 100) {
  try {
    const results = [];
    for (let i = 0; i < usersData.length; i += batchSize) {
      const batch = usersData.slice(i, i + batchSize);
      const users = await User.bulkCreate(batch, {
        validate: true,
        ignoreDuplicates: true
      });
      results.push(...users);
      console.log(`Batch ${Math.floor(i / batchSize) + 1} created:`, users.length);
    }
    console.log('Total users created:', results.length);
    return results;
  } catch (error) {
    console.error('Error bulk creating users in batches:', error);
    throw error;
  }
}
```

### 查询优化

```javascript
// 使用索引
async function findUsersByAge(age) {
  try {
    const users = await User.findAll({
      where: { age },
      attributes: ['id', 'username', 'email'], // 只查询需要的字段
      raw: true // 返回原始数据，不包装为模型实例
    });
    return users;
  } catch (error) {
    console.error('Error finding users:', error);
    throw error;
  }
}

// 使用关联查询优化
async function findUsersWithArticles() {
  try {
    const users = await User.findAll({
      include: [{
        model: Article,
        as: 'articles',
        attributes: ['id', 'title'],
        limit: 5
      }],
      limit: 10
    });
    return users;
  } catch (error) {
    console.error('Error finding users with articles:', error);
    throw error;
  }
}
```

## 第八步：测试验证

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- --grep "User"
```

### 测试模型

```javascript
// tests/user.test.js
const { expect } = require('chai');
const User = require('../models/user');

describe('User Model', () => {
  beforeEach(async () => {
    await User.destroy({ where: {}, force: true });
  });
  
  it('should create a user', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      age: 25
    });
    
    expect(user).to.have.property('id');
    expect(user.username).to.equal('testuser');
    expect(user.email).to.equal('test@example.com');
    expect(user.age).to.equal(25);
  });
  
  it('should find a user by id', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      age: 25
    });
    
    const foundUser = await User.findByPk(user.id);
    expect(foundUser).to.not.be.null;
    expect(foundUser.username).to.equal('testuser');
  });
  
  it('should update a user', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      age: 25
    });
    
    await user.update({ age: 26 });
    expect(user.age).to.equal(26);
  });
  
  it('should delete a user', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      age: 25
    });
    
    await user.destroy();
    const foundUser = await User.findByPk(user.id);
    expect(foundUser).to.be.null;
  });
});
```

### 验证数据库连接

```javascript
// 验证数据库连接
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
}

// 验证表结构
async function testTableStructure() {
  try {
    const tableInfo = await sequelize.getQueryInterface().describeTable('users');
    console.log('Table structure:', tableInfo);
    return tableInfo;
  } catch (error) {
    console.error('Error describing table:', error);
    throw error;
  }
}
```

## 常见问题排查

### 1. Node.js 版本不兼容

**现象：** `WAS COMPILED AGAINST A DIFFERENT NODE.JS VERSION`

**解决：** 更换与当前 Node.js 版本兼容的 XuguDB 驱动

### 2. 方言不支持

**现象：** `ERROR: THE DIALECT UNKNOWN_DIALECT IS NOT SUPPORTED`

**解决：** 确保方言目录已正确重命名为 `mysql`，并且配置文件中的 `dialect` 选项为 `'mysql'`

### 3. 连接失败

**现象：** 无法连接到虚谷数据库

**解决：**
- 检查 `.env` 文件中的连接参数是否正确
- 确保虚谷数据库服务已启动
- 检查网络连接和防火墙设置
- 验证用户名和密码是否正确

### 4. 迁移失败

**现象：** 数据库迁移失败

**解决：**
- 检查迁移文件中的 SQL 语法是否正确
- 检查数据库权限
- 检查表名是否已存在
- 尝试回滚迁移后重新执行

### 5. 性能问题

**现象：** 查询响应缓慢

**解决：**
- 创建合适的索引
- 使用 `attributes` 限制查询字段
- 使用 `raw: true` 返回原始数据
- 使用分页查询
- 配置连接池参数

### 6. 事务问题

**现象：** 事务提交失败

**解决：**
- 确保事务正确提交或回滚
- 检查事务隔离级别
- 避免长事务
- 使用事务超时设置

## 最佳实践

### 1. 模型设计
- 使用有意义的表名和字段名
- 合理使用索引
- 避免过度关联
- 使用软删除

### 2. 连接管理
- 使用环境变量管理敏感信息
- 配置连接池参数
- 启用连接健康检查
- 使用连接超时设置

### 3. 查询优化
- 使用 `attributes` 限制查询字段
- 使用 `include` 优化关联查询
- 使用分页查询
- 避免 N+1 查询问题

### 4. 事务处理
- 使用事务保证数据一致性
- 避免长事务
- 合理设置事务隔离级别
- 使用事务超时设置

### 5. 错误处理
- 检查所有数据库操作的错误
- 记录错误日志
- 使用事务回滚
- 实现重试机制

## 参考资料

- [Sequelize 官方文档](https://sequelize.org/)
- [Sequelize 中文文档](https://sequelize.nodejs.cn/)
- [虚谷数据库 Sequelize 适配文档](https://help.xugudb.com/content/ecosystem/orm/nodejs/sequelize)
- [虚谷数据库 Node.js 驱动文档](https://help.xugudb.com/content/development/nodejs)