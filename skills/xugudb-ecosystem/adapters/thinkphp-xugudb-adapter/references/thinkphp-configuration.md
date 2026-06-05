# ThinkPHP 虚谷数据库配置指南

## 概述

本文档提供 ThinkPHP 适配虚谷数据库(XuguDB)的完整配置流程。ThinkPHP 是一个面向对象，简易、快速的轻量级 PHP 开发框架，通过虚谷数据库专用的方言包，可以无缝集成 ThinkPHP 框架的各种功能，包括数据库操作、模型定义、查询构建等。

## 前置条件

1. 已安装 PHP 环境（推荐 PHP 7.2 或更高版本）
2. 已安装 Composer 依赖管理工具
3. 已部署虚谷数据库 v12.0.0 或更高版本
4. 已创建 ThinkPHP 项目（推荐 ThinkPHP 5.0.1 或更高版本）

## 第一步：安装依赖

### 安装 ThinkPHP

```bash
# 创建 ThinkPHP 项目
composer create-project topthink/think tp

# 或者使用 ThinkPHP 6
composer create-project topthink/think tp6
```

### 安装虚谷数据库驱动

1. **下载方言包** - 从虚谷数据库官方下载 ThinkPHP 方言压缩包
2. **解压方言包** - 解压压缩包获取方言文件
3. **放置方言文件** - 将方言文件放置到 ThinkPHP 项目的相应目录中：
   - 将 `builder` 文件夹下的 `Xugusql.php` 文件复制到 `vendor/topthink/think-orm/src/db/builder` 目录下
   - 将 `connector` 文件夹下的 `Xugusql.php` 文件复制到 `vendor/topthink/think-orm/src/db/connector` 目录下

### 验证驱动安装

```php
<?php
// 测试数据库连接
namespace app\controller;

use think\facade\Db;

class Index
{
    public function index()
    {
        try {
            // 测试连接
            $result = Db::query('SELECT 1');
            return json(['status' => 'success', 'message' => 'Database connection established']);
        } catch (\Exception $e) {
            return json(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}
```

## 第二步：配置连接

### 环境变量配置

在项目根目录创建 `.env` 文件配置数据库连接参数：

```ini
[APP]
DEBUG = true

[DATABASE]
TYPE = xugusql
HOSTNAME = 127.0.0.1
DATABASE = SYSTEM
USERNAME = SYSDBA
PASSWORD = SYSDBA
HOSTPORT = 5138
CHARSET = utf8
DEBUG = true
PREFIX = 
```

### 数据库配置文件

修改 `config/database.php` 配置文件：

```php
<?php
return [
    // 默认使用的数据库连接配置
    'default' => 'xugusql',
    
    // 自定义时间查询规则
    'time_query_rule' => [],
    
    // 自动写入时间戳字段
    'auto_timestamp' => false,
    
    // 时间字段取出后的默认时间格式
    'datetime_format' => false,
    
    // 数据库连接配置信息
    'connections' => [
        'xugusql' => [
            // 数据库类型
            'type' => 'xugusql',
            // 服务器地址
            'hostname' => env('database.hostname', '127.0.0.1'),
            // 数据库名
            'database' => env('database.database', 'SYSTEM'),
            // 用户名
            'username' => env('database.username', 'SYSDBA'),
            // 密码
            'password' => env('database.password', 'SYSDBA'),
            // 端口
            'hostport' => env('database.hostport', '5138'),
            // 数据库连接参数
            'params' => [],
            // 数据库编码默认采用utf8
            'charset' => env('database.charset', 'utf8'),
            // 数据库表前缀
            'prefix' => env('database.prefix', ''),
            // 数据库部署方式:0 集中式(单一服务器),1 分布式(主从服务器)
            'deploy' => 0,
            // 数据库读写是否分离 主从式有效
            'rw_separate' => false,
            // 读写分离后 主服务器数量
            'master_num' => 1,
            // 指定从服务器序号
            'slave_no' => '',
            // 是否严格检查字段是否存在
            'fields_strict' => true,
            // 是否需要断线重连
            'break_reconnect' => false,
            // 监听SQL
            'trigger_sql' => env('app_debug', true),
            // 开启字段缓存
            'fields_cache' => false,
        ],
    ],
];
```

### 连接参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| type | 数据库类型 | xugusql |
| hostname | 服务器地址 | 127.0.0.1 |
| database | 数据库名 | SYSTEM |
| username | 用户名 | SYSDBA |
| password | 密码 | - |
| hostport | 端口号 | 5138 |
| charset | 字符集 | utf8 |
| prefix | 表前缀 | - |
| deploy | 部署方式 | 0 |
| rw_separate | 读写分离 | false |
| master_num | 主服务器数量 | 1 |
| fields_strict | 严格字段检查 | true |
| break_reconnect | 断线重连 | false |
| trigger_sql | 监听SQL | true |
| fields_cache | 字段缓存 | false |

## 第三步：定义模型

### 基本模型定义

创建 `app/model/User.php` 文件：

```php
<?php
namespace app\model;

use think\Model;

class User extends Model
{
    // 设置表名
    protected $name = 'users';
    
    // 设置主键
    protected $pk = 'id';
    
    // 自动写入时间戳
    protected $autoWriteTimestamp = true;
    
    // 定义时间戳字段名
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    
    // 软删除
    use \think\model\concern\SoftDelete;
    protected $deleteTime = 'deleted_at';
    
    // 模型属性
    protected $schema = [
        'id' => 'int',
        'username' => 'string',
        'email' => 'string',
        'age' => 'int',
        'status' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
    
    // 类型转换
    protected $type = [
        'id' => 'integer',
        'age' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
```

### 字段类型说明

| 字段类型 | 说明 | 示例 |
|----------|------|------|
| int | 整数 | `'id' => 'int'` |
| integer | 整数 | `'id' => 'integer' |
| float | 浮点数 | `'price' => 'float'` |
| boolean | 布尔值 | `'status' => 'boolean'` |
| string | 字符串 | `'name' => 'string'` |
| text | 文本 | `'content' => 'text'` |
| date | 日期 | `'birthday' => 'date'` |
| datetime | 日期时间 | `'created_at' => 'datetime'` |
| timestamp | 时间戳 | `'updated_at' => 'timestamp'` |
| json | JSON | `'meta' => 'json'` |

### 关联关系

创建 `app/model/Article.php` 文件：

```php
<?php
namespace app\model;

use think\Model;

class Article extends Model
{
    // 设置表名
    protected $name = 'articles';
    
    // 定义关联关系
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    
    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'article_tags', 'tag_id', 'article_id');
    }
}
```

创建 `app/model/Tag.php` 文件：

```php
<?php
namespace app\model;

use think\Model;

class Tag extends Model
{
    // 设置表名
    protected $name = 'tags';
    
    // 定义关联关系
    public function articles()
    {
        return $this->belongsToMany(Article::class, 'article_tags', 'article_id', 'tag_id');
    }
}
```

## 第四步：数据库迁移

### 创建迁移文件

```bash
# 创建迁移文件
php think migrate:create create_users_table
php think migrate:create create_articles_table
php think migrate:create create_tags_table
```

### 迁移文件示例

创建 `database/migrations/20240101000000_create_users_table.php` 文件：

```php
<?php

use think\migration\Migrator;
use think\migration\db\Column;

class CreateUsersTable extends Migrator
{
    public function change()
    {
        $table = $this->table('users', ['engine' => 'InnoDB']);
        $table->addColumn('username', 'string', ['limit' => 50, 'comment' => '用户名'])
              ->addColumn('email', 'string', ['limit' => 100, 'comment' => '邮箱'])
              ->addColumn('age', 'integer', ['default' => 0, 'comment' => '年龄'])
              ->addColumn('status', 'string', ['limit' => 20, 'default' => 'active', 'comment' => '状态'])
              ->addColumn('created_at', 'datetime', ['comment' => '创建时间'])
              ->addColumn('updated_at', 'datetime', ['comment' => '更新时间'])
              ->addColumn('deleted_at', 'datetime', ['null' => true, 'comment' => '删除时间'])
              ->addIndex(['username'], ['unique' => true])
              ->addIndex(['email'], ['unique' => true])
              ->addIndex(['status'])
              ->create();
    }
}
```

### 执行迁移

```bash
# 执行所有迁移
php think migrate:run

# 回滚迁移
php think migrate:rollback

# 回滚所有迁移
php think migrate:rollback -t 0
```

## 第五步：CRUD 操作

### 创建记录

```php
<?php
namespace app\controller;

use think\facade\Db;
use app\model\User;

class UserController
{
    // 创建单个记录
    public function create()
    {
        $user = new User();
        $user->username = 'john';
        $user->email = 'john@example.com';
        $user->age = 25;
        $user->save();
        
        return json(['status' => 'success', 'data' => $user]);
    }
    
    // 批量创建
    public function batchCreate()
    {
        $users = [
            ['username' => 'user1', 'email' => 'user1@example.com', 'age' => 20],
            ['username' => 'user2', 'email' => 'user2@example.com', 'age' => 25],
            ['username' => 'user3', 'email' => 'user3@example.com', 'age' => 30],
        ];
        
        $result = User::insertAll($users);
        
        return json(['status' => 'success', 'data' => $result]);
    }
}
```

### 查询记录

```php
<?php
namespace app\controller;

use think\facade\Db;
use app\model\User;

class UserController
{
    // 查询所有记录
    public function index()
    {
        $users = User::select();
        return json(['status' => 'success', 'data' => $users]);
    }
    
    // 查询单个记录
    public function read($id)
    {
        $user = User::find($id);
        if ($user) {
            return json(['status' => 'success', 'data' => $user]);
        } else {
            return json(['status' => 'error', 'message' => 'User not found']);
        }
    }
    
    // 条件查询
    public function search()
    {
        $users = User::where('age', '>', 18)
                     ->where('status', 'active')
                     ->order('created_at', 'desc')
                     ->limit(10)
                     ->select();
        
        return json(['status' => 'success', 'data' => $users]);
    }
    
    // 复杂查询
    public function complexSearch()
    {
        $users = User::where('username', 'like', '%keyword%')
                     ->whereOr('email', 'like', '%keyword%')
                     ->field('id,username,email,age')
                     ->with(['articles'])
                     ->select();
        
        return json(['status' => 'success', 'data' => $users]);
    }
}
```

### 更新记录

```php
<?php
namespace app\controller;

use think\facade\Db;
use app\model\User;

class UserController
{
    // 更新单个记录
    public function update($id)
    {
        $user = User::find($id);
        if (!$user) {
            return json(['status' => 'error', 'message' => 'User not found']);
        }
        
        $user->age = 30;
        $user->save();
        
        return json(['status' => 'success', 'data' => $user]);
    }
    
    // 批量更新
    public function batchUpdate()
    {
        $result = User::where('age', '<', 18)
                      ->update(['status' => 'inactive']);
        
        return json(['status' => 'success', 'data' => $result]);
    }
}
```

### 删除记录

```php
<?php
namespace app\controller;

use think\facade\Db;
use app\model\User;

class UserController
{
    // 删除单个记录（软删除）
    public function delete($id)
    {
        $user = User::find($id);
        if (!$user) {
            return json(['status' => 'error', 'message' => 'User not found']);
        }
        
        $user->delete();
        
        return json(['status' => 'success', 'message' => 'User deleted']);
    }
    
    // 批量删除（软删除）
    public function batchDelete()
    {
        $result = User::where('status', 'inactive')->delete();
        
        return json(['status' => 'success', 'data' => $result]);
    }
    
    // 物理删除
    public function forceDelete($id)
    {
        $user = User::withTrashed()->find($id);
        if (!$user) {
            return json(['status' => 'error', 'message' => 'User not found']);
        }
        
        $user->force()->delete();
        
        return json(['status' => 'success', 'message' => 'User permanently deleted']);
    }
}
```

## 第六步：高级功能

### 事务处理

```php
<?php
namespace app\controller;

use think\facade\Db;

class TransactionController
{
    // 使用事务
    public function transfer()
    {
        Db::startTrans();
        try {
            // 从发送方扣款
            Db::table('users')
                ->where('id', 1)
                ->dec('balance', 100)
                ->update();
            
            // 向接收方加款
            Db::table('users')
                ->where('id', 2)
                ->inc('balance', 100)
                ->update();
            
            // 提交事务
            Db::commit();
            
            return json(['status' => 'success', 'message' => 'Transfer successful']);
        } catch (\Exception $e) {
            // 回滚事务
            Db::rollback();
            
            return json(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}
```

### 原生 SQL

```php
<?php
namespace app\controller;

use think\facade\Db;

class SqlController
{
    // 执行原生 SQL 查询
    public function query()
    {
        $users = Db::query('SELECT * FROM users WHERE age > ?', [18]);
        
        return json(['status' => 'success', 'data' => $users]);
    }
    
    // 执行原生 SQL 更新
    public function execute()
    {
        $result = Db::execute('UPDATE users SET age = ? WHERE id = ?', [30, 1]);
        
        return json(['status' => 'success', 'data' => $result]);
    }
}
```

### 查询构建器

```php
<?php
namespace app\controller;

use think\facade\Db;

class QueryController
{
    // 使用查询构建器
    public function buildQuery()
    {
        $users = Db::table('users')
                    ->where('age', '>', 18)
                    ->where('status', 'active')
                    ->field('id,username,email,age')
                    ->order('age', 'desc')
                    ->limit(10)
                    ->select();
        
        return json(['status' => 'success', 'data' => $users]);
    }
    
    // 聚合查询
    public function aggregate()
    {
        $count = Db::table('users')->where('age', '>', 18)->count();
        $max = Db::table('users')->max('age');
        $min = Db::table('users')->min('age');
        $avg = Db::table('users')->avg('age');
        $sum = Db::table('users')->sum('age');
        
        return json([
            'status' => 'success',
            'data' => [
                'count' => $count,
                'max' => $max,
                'min' => $min,
                'avg' => $avg,
                'sum' => $sum,
            ]
        ]);
    }
}
```

## 第七步：性能优化

### 批量操作

```php
<?php
namespace app\controller;

use think\facade\Db;
use app\model\User;

class PerformanceController
{
    // 批量插入
    public function bulkInsert()
    {
        $users = [];
        for ($i = 0; $i < 1000; $i++) {
            $users[] = [
                'username' => "user{$i}",
                'email' => "user{$i}@example.com",
                'age' => 20 + ($i % 50),
                'status' => 'active',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];
        }
        
        // 分批插入，每批 100 条
        $batchSize = 100;
        for ($i = 0; $i < count($users); $i += $batchSize) {
            $batch = array_slice($users, $i, $batchSize);
            User::insertAll($batch);
        }
        
        return json(['status' => 'success', 'message' => 'Bulk insert completed']);
    }
}
```

### 查询优化

```php
<?php
namespace app\controller;

use think\facade\Db;
use app\model\User;

class QueryOptimizationController
{
    // 使用索引
    public function useIndex()
    {
        $users = User::where('username', 'john')
                     ->index('idx_username')
                     ->select();
        
        return json(['status' => 'success', 'data' => $users]);
    }
    
    // 使用特定字段
    public function useFields()
    {
        $users = User::field('id,username,email')
                     ->select();
        
        return json(['status' => 'success', 'data' => $users]);
    }
    
    // 使用关联查询优化
    public function useWith()
    {
        $users = User::with(['articles' => function ($query) {
                        $query->field('id,title,user_id')->limit(5);
                    }])
                    ->limit(10)
                    ->select();
        
        return json(['status' => 'success', 'data' => $users]);
    }
}
```

## 第八步：测试验证

### 运行测试

```bash
# 运行所有测试
php think test

# 运行特定测试
php think test --filter UserController
```

### 验证数据库连接

```php
<?php
namespace app\controller;

use think\facade\Db;

class TestController
{
    // 验证数据库连接
    public function testConnection()
    {
        try {
            $result = Db::query('SELECT 1');
            return json(['status' => 'success', 'message' => 'Database connection established']);
        } catch (\Exception $e) {
            return json(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
    
    // 验证表结构
    public function testTableStructure()
    {
        try {
            $tableInfo = Db::query('DESCRIBE users');
            return json(['status' => 'success', 'data' => $tableInfo]);
        } catch (\Exception $e) {
            return json(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}
```

## 常见问题排查

### 1. 数据库配置未定义

**现象：** `数据库配置未定义:XXX`

**解决：** 检查 `.env` 文件和 `config/database.php` 文件中的配置项是否正确

### 2. 驱动不支持

**现象：** `DRIVER [THINK] NOT SUPPORTED`

**解决：** 确保已安装模板引擎依赖，并使用小写的 `think` 作为模板引擎

### 3. 路由修改未生效

**现象：** 路由修改后未生效

**解决：** 执行命令 `php think clear:route` 清理缓存

### 4. 控制器方法冲突

**现象：** 一直跳转控制器的 INDEX 方法

**解决：** 检查路由列表中是否存在冲突定义，如 `Route::get('user', 'User/index')`，需要检查并删除

### 5. 连接失败

**现象：** 无法连接到虚谷数据库

**解决：**
- 检查 `.env` 文件中的连接参数是否正确
- 确保虚谷数据库服务已启动
- 检查网络连接和防火墙设置
- 验证用户名和密码是否正确

### 6. 迁移失败

**现象：** 数据库迁移失败

**解决：**
- 检查迁移文件中的 SQL 语法是否正确
- 检查数据库权限
- 检查表名是否已存在
- 尝试回滚迁移后重新执行

### 7. 性能问题

**现象：** 查询响应缓慢

**解决：**
- 创建合适的索引
- 使用 `field` 限制查询字段
- 使用 `with` 优化关联查询
- 使用分页查询
- 配置连接池参数

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
- 使用 `field` 限制查询字段
- 使用 `with` 优化关联查询
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

- [ThinkPHP 官方文档](https://doc.thinkphp.cn/)
- [虚谷数据库 ThinkPHP 适配文档](https://docs.xugudb.com/content/ecosystem/orm/php/thinkphp)
- [虚谷数据库 PHP 驱动文档](https://help.xugudb.com/content/development/php/setup)