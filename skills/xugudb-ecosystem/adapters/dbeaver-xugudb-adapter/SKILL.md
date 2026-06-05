---
name: dbeaver-xugudb-adapter
description: DBeaver 数据库工具适配虚谷数据库(XuguDB)的完整指南。当用户需要使用 DBeaver 连接和管理虚谷数据库时使用此技能，包括驱动安装、连接配置、SQL 编辑器使用、数据导入导出等。适用于数据库开发、管理和维护场景。
---

# DBeaver 虚谷数据库适配指南

## 概述

本技能提供 DBeaver 数据库工具适配虚谷数据库(XuguDB)的完整流程。DBeaver 是一款开源的通用数据库工具，通过配置虚谷 JDBC 驱动，可以无缝连接和管理虚谷数据库，包括 SQL 编辑、数据管理、结构设计等功能。

## 适配流程

在开始适配前，按以下顺序检查和修改：

```
1. 驱动安装 → 2. 连接配置 → 3. SQL 编辑器配置 → 4. 数据管理 → 5. 高级功能 → 6. 最佳实践
```

## 第一步：安装虚谷 JDBC 驱动

### 下载驱动

1. 访问虚谷数据库官网：https://www.xugudb.com/
2. 下载 JDBC 驱动包：`xugu-jdbc-12.3.4.jar`
3. 保存到本地目录，如 `C:\drivers\xugu-jdbc-12.3.4.jar`

### 在 DBeaver 中添加驱动

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

## 第二步：创建数据库连接

### 使用连接向导

1. 在数据库导航器中，右键点击 **连接** -> **创建** -> **连接**
2. 或点击工具栏的 **新建连接向导** 按钮
3. 在连接类型列表中选择 **XuguDB**（如果已配置驱动）
4. 或选择 **通用 JDBC 连接**

### 配置连接参数

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

### 测试连接

1. 点击 **测试连接** 按钮验证连接是否成功
2. 如果连接成功，点击 **完成** 保存连接
3. 如果连接失败，检查驱动配置和连接参数

## 第三步：使用 SQL 编辑器

### 打开 SQL 编辑器

1. 在数据库导航器中，右键点击连接或数据库
2. 选择 **SQL 编辑器** -> **新建 SQL 编辑器**
3. 或使用快捷键 `Ctrl+Shift+Enter`

### 执行 SQL 语句

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

### 使用代码补全

1. 在 SQL 编辑器中输入表名或列名的前几个字符
2. 按 `Ctrl+Space` 触发代码补全
3. 从列表中选择正确的选项

### 执行计划分析

1. 在 SQL 编辑器中输入查询语句
2. 点击工具栏的 **执行计划** 按钮（或按 `Ctrl+Shift+E`）
3. 查看查询执行计划

## 第四步：数据管理

### 数据查看

1. 在数据库导航器中，展开表节点
2. 双击表名查看数据
3. 或右键点击表 -> **查看数据**

### 数据编辑

1. 在数据查看界面中，直接编辑单元格
2. 点击 **保存** 按钮提交更改
3. 或使用 `Ctrl+S` 快捷键

### 数据导入

1. 右键点击表 -> **导入数据**
2. 选择导入格式（CSV、Excel、JSON 等）
3. 配置导入选项
4. 执行导入

### 数据导出

1. 在数据查看界面中，点击 **导出数据** 按钮
2. 选择导出格式（CSV、Excel、JSON、SQL 等）
3. 配置导出选项
4. 执行导出

## 第五步：高级功能

### ER 图生成

1. 在数据库导航器中，选择数据库或模式
2. 右键点击 -> **查看图表** -> **ER 图**
3. 自动生成实体关系图

### 数据对比

1. 在数据库导航器中，选择两个表或数据库
2. 右键点击 -> **比较/迁移** -> **数据对比**
3. 配置对比选项并执行

### 数据生成

1. 在数据库导航器中，选择表
2. 右键点击 -> **工具** -> **生成测试数据**
3. 配置生成选项并执行

### 查询构建器

1. 在 SQL 编辑器中，点击 **查询构建器** 按钮
2. 使用可视化界面构建查询
3. 自动生成 SQL 语句

## 第六步：最佳实践

### 连接管理
- 使用有意义的连接名称
- 按环境分类连接（开发、测试、生产）
- 定期清理无用连接

### SQL 编辑
- 使用代码补全提高效率
- 保存常用 SQL 脚本
- 使用事务管理数据修改

### 数据安全
- 定期备份重要数据
- 使用只读连接进行查询
- 避免在生产环境直接修改数据

### 性能优化
- 使用执行计划分析查询
- 创建合适的索引
- 避免全表扫描

### 团队协作
- 共享连接配置（通过导出/导入）
- 统一 SQL 编码规范
- 使用版本控制管理 SQL 脚本

## 常见问题排查

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

## 参考文档

详细的配置和使用说明请参考：
- [DBeaver 配置详解](references/dbeaver-configuration.md)
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [DBeaver 官方文档](https://dbeaver.com/docs/dbeaver/)
