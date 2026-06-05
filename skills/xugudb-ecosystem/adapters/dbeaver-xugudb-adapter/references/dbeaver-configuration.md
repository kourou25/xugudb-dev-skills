# DBeaver 数据库工具虚谷数据库配置指南

## 概述

本文档提供 DBeaver 数据库工具适配虚谷数据库(XuguDB)的完整配置指南，包括驱动安装、连接配置、SQL 编辑器使用、数据导入导出等。

## 一、核心配置信息

### 1.1 JDBC 驱动类
```
com.xugu.cloudjdbc.Driver
```

### 1.2 连接 URL 格式
```
jdbc:xugu://<host>:<port>/<database>?current_schema=<schema>&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

**参数说明：**
- `<host>`: 数据库服务器地址
- `<port>`: 数据库端口（默认5138）
- `<database>`: 数据库名（如SYSTEM）
- `<schema>`: 模式名（如RY）
- `CHAR_SET=UTF8`: 字符集配置
- `COMPATIBLE_MODE=MYSQL`: MySQL兼容模式

### 1.3 示例 URL
```
jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

## 二、DBeaver 安装配置

### 2.1 下载安装

1. 访问 DBeaver 官网：https://dbeaver.io/download/
2. 下载适合操作系统的版本（Windows/Mac/Linux）
3. 运行安装程序，按照向导完成安装

### 2.2 启动 DBeaver

1. 启动 DBeaver 应用程序
2. 首次启动会显示欢迎界面
3. 选择工作空间目录

## 三、虚谷数据库驱动配置

### 3.1 下载虚谷 JDBC 驱动

1. 访问虚谷数据库官网：https://www.xugudb.com/
2. 下载 JDBC 驱动包：`xugu-jdbc-12.3.4.jar`
3. 保存到本地目录，如 `C:\drivers\xugu-jdbc-12.3.4.jar`

### 3.2 在 DBeaver 中添加驱动

1. 打开 DBeaver，点击菜单 **数据库** -> **驱动管理器**
2. 点击 **新建** 按钮
3. 填写驱动信息：
   - **驱动名称**: XuguDB
   - **驱动类型**: Generic
   - **类名**: `com.xugu.cloudjdbc.Driver`
   - **URL 模板**: `jdbc:xugu://{host}:{port}/{database}`
   - **默认端口**: 5138
4. 在 **库** 选项卡中，点击 **添加文件**，选择下载的 `xugu-jdbc-12.3.4.jar`
5. 点击 **确定** 保存驱动配置

### 3.3 驱动属性配置

在驱动管理器中，可以配置以下属性：

| 属性 | 说明 | 推荐值 |
|------|------|--------|
| `connectTimeout` | 连接超时时间（毫秒） | 30000 |
| `socketTimeout` | 套接字超时时间（毫秒） | 60000 |
| `useSSL` | 是否使用 SSL | false |
| `characterEncoding` | 字符编码 | UTF-8 |

## 四、创建数据库连接

### 4.1 使用连接向导

1. 在数据库导航器中，右键点击 **连接** -> **创建** -> **连接**
2. 或点击工具栏的 **新建连接向导** 按钮
3. 在连接类型列表中选择 **XuguDB**（如果已配置驱动）
4. 或选择 **通用 JDBC 连接**

### 4.2 配置连接参数

#### 基本配置

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| **主机** | 数据库服务器地址 | 127.0.0.1 |
| **端口** | 数据库端口 | 5138 |
| **数据库** | 数据库名 | SYSTEM |
| **用户名** | 数据库用户名 | SYSDBA |
| **密码** | 数据库密码 | SYSDBA |

#### JDBC URL 配置

```
jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

**参数说明：**
- `current_schema=RY`: 指定当前模式名
- `CHAR_SET=UTF8`: 字符集配置
- `COMPATIBLE_MODE=MYSQL`: MySQL兼容模式

### 4.3 高级配置

#### 连接详情

| 配置项 | 说明 | 推荐值 |
|--------|------|--------|
| **连接名称** | 连接显示名称 | XuguDB-RY |
| **连接类型** | 连接环境类型 | 开发 |
| **描述** | 连接描述信息 | 虚谷数据库开发连接 |

#### 连接初始化设置

```sql
-- 每次连接时执行的 SQL
SET CURRENT_SCHEMA = RY;
SET CHAR_SET = UTF8;
```

#### 网络设置（可选）

- **SSH 隧道**: 如果需要通过 SSH 连接
- **代理设置**: 如果需要通过代理连接
- **SSL 加密**: 如果需要加密连接

## 五、SQL 编辑器使用

### 5.1 打开 SQL 编辑器

1. 在数据库导航器中，右键点击连接或数据库
2. 选择 **SQL 编辑器** -> **新建 SQL 编辑器**
3. 或使用快捷键 `Ctrl+Shift+Enter`

### 5.2 执行 SQL 语句

```sql
-- 查询表结构
SELECT table_name, comments 
FROM all_tables 
WHERE schema_id = (SELECT schema_id FROM all_schemas WHERE schema_name = 'RY');

-- 查询列信息
SELECT col_name, type_name, comments 
FROM ALL_COLUMNS 
WHERE table_id = (SELECT table_id FROM all_tables WHERE table_name = 'USERS');

-- 创建表
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加注释
COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.id IS '用户ID';
```

### 5.3 使用代码补全

1. 在 SQL 编辑器中输入表名或列名的前几个字符
2. 按 `Ctrl+Space` 触发代码补全
3. 从列表中选择正确的选项

### 5.4 执行计划分析

1. 在 SQL 编辑器中输入查询语句
2. 点击工具栏的 **执行计划** 按钮（或按 `Ctrl+Shift+E`）
3. 查看查询执行计划

## 六、数据管理

### 6.1 数据查看

1. 在数据库导航器中，展开表节点
2. 双击表名查看数据
3. 或右键点击表 -> **查看数据**

### 6.2 数据编辑

1. 在数据查看界面中，直接编辑单元格
2. 点击 **保存** 按钮提交更改
3. 或使用 `Ctrl+S` 快捷键

### 6.3 数据导入

1. 右键点击表 -> **导入数据**
2. 选择导入格式（CSV、Excel、JSON 等）
3. 配置导入选项
4. 执行导入

### 6.4 数据导出

1. 在数据查看界面中，点击 **导出数据** 按钮
2. 选择导出格式（CSV、Excel、JSON、SQL 等）
3. 配置导出选项
4. 执行导出

## 七、数据库管理

### 7.1 表结构管理

1. 在数据库导航器中，展开表节点
2. 右键点击表 -> **查看/编辑** -> **结构**
3. 可以查看和修改表结构

### 7.2 索引管理

1. 在表结构视图中，切换到 **索引** 选项卡
2. 可以查看、创建、修改和删除索引

### 7.3 约束管理

1. 在表结构视图中，切换到 **约束** 选项卡
2. 可以查看、创建、修改和删除约束

### 7.4 序列管理

1. 在数据库导航器中，展开 **序列** 节点
2. 右键点击序列 -> **查看/编辑**
3. 可以查看和修改序列属性

## 八、高级功能

### 8.1 ER 图生成

1. 在数据库导航器中，选择数据库或模式
2. 右键点击 -> **查看图表** -> **ER 图**
3. 自动生成实体关系图

### 8.2 数据对比

1. 在数据库导航器中，选择两个表或数据库
2. 右键点击 -> **比较/迁移** -> **数据对比**
3. 配置对比选项并执行

### 8.3 数据生成

1. 在数据库导航器中，选择表
2. 右键点击 -> **工具** -> **生成测试数据**
3. 配置生成选项并执行

### 8.4 查询构建器

1. 在 SQL 编辑器中，点击 **查询构建器** 按钮
2. 使用可视化界面构建查询
3. 自动生成 SQL 语句

## 九、常见问题排查

### 1. 驱动类找不到

**现象：** 连接时报错 `Driver class not found`

**原因：** JDBC 驱动未正确配置

**解决：** 
- 检查驱动管理器中是否添加了虚谷 JDBC 驱动
- 确保驱动 JAR 文件路径正确

### 2. 连接 URL 错误

**现象：** 连接时报错 `Invalid connection URL`

**原因：** URL 参数错误

**解决：** 确保使用正确的 URL 格式

```
jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

### 3. 认证失败

**现象：** 连接时报错 `Authentication failed`

**原因：** 用户名或密码错误

**解决：** 
- 检查用户名和密码是否正确
- 确保用户有连接权限

### 4. 表不存在

**现象：** 查询时报错 `Table not found`

**原因：** 模式名未正确设置

**解决：** 
- 在连接 URL 中添加 `current_schema=RY`
- 或在连接后执行 `SET CURRENT_SCHEMA = RY`

### 5. 字符编码问题

**现象：** 数据显示乱码

**原因：** 字符编码不匹配

**解决：** 
- 在连接 URL 中添加 `CHAR_SET=UTF8`
- 检查 DBeaver 的字符编码设置

### 6. 权限不足

**现象：** 操作时报错 `Permission denied`

**原因：** 用户权限不足

**解决：** 
- 确保用户有相应权限
- 使用 DBA 权限用户连接

### 7. 性能问题

**现象：** 查询响应缓慢

**原因：** 查询优化不足

**解决：** 
- 使用执行计划分析查询
- 创建合适的索引
- 优化 SQL 语句

## 十、最佳实践

### 1. 连接管理
- 使用有意义的连接名称
- 按环境分类连接（开发、测试、生产）
- 定期清理无用连接

### 2. SQL 编辑
- 使用代码补全提高效率
- 保存常用 SQL 脚本
- 使用事务管理数据修改

### 3. 数据安全
- 定期备份重要数据
- 使用只读连接进行查询
- 避免在生产环境直接修改数据

### 4. 性能优化
- 使用执行计划分析查询
- 创建合适的索引
- 避免全表扫描

### 5. 团队协作
- 共享连接配置（通过导出/导入）
- 统一 SQL 编码规范
- 使用版本控制管理 SQL 脚本

## 十一、参考资源

### 11.1 官方文档
- [DBeaver 官方文档](https://dbeaver.com/docs/dbeaver/)
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [虚谷数据库 JDBC 驱动文档](https://docs.xugudb.com/content/reference/jdbc)

### 11.2 示例项目
- [虚谷 DBeaver 示例](https://gitee.com/XuguDB/xugu-dbeaver-demo)
- [DBeaver 示例项目](https://github.com/dbeaver/dbeaver)

### 11.3 社区资源
- [虚谷数据库社区](https://www.xugudb.com/)
- [DBeaver 社区](https://dbeaver.io/community/)