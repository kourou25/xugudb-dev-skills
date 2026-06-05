---
name: flyway-xugudb-adapter
description: Flyway 数据库迁移工具适配虚谷数据库(XuguDB)的完整指南。当用户需要将基于 Flyway 的 Java 项目配置或适配到虚谷数据库时使用此技能，包括依赖配置、迁移脚本编写、Spring Boot 集成、多环境配置等。适用于从 MySQL/Oracle 迁移或新建虚谷数据库项目。
---

# Flyway 虚谷数据库适配指南

## 概述

本技能提供 Flyway 数据库迁移工具适配虚谷数据库(XuguDB)的完整流程。虚谷数据库通过提供专用的 JDBC 驱动和配置支持，可以无缝集成 Flyway 框架的各种功能，包括数据库版本管理、增量迁移、多环境配置等。

## 适配流程

在开始适配前，按以下顺序检查和修改：

```
1. 依赖配置 → 2. 迁移脚本编写 → 3. Spring Boot 配置 → 4. 多环境配置 → 5. 测试验证 → 6. 生产部署
```

## 第一步：配置依赖

### Maven 依赖配置

添加 Flyway 和虚谷 JDBC 驱动依赖：

```xml
<!-- Spring Boot Flyway 依赖 -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>

<!-- 虚谷JDBC驱动 -->
<dependency>
    <groupId>com.xugudb</groupId>
    <artifactId>xugu-jdbc</artifactId>
    <version>12.3.4</version>
</dependency>

<!-- Druid 连接池 -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>1.2.6</version>
</dependency>
```

## 第二步：编写迁移脚本

### 脚本目录结构

```
src/main/resources/
└── db/
    └── migration/
        ├── V1__create_tables.sql
        ├── V2__create_indexes.sql
        ├── V3__insert_initial_data.sql
        └── ...
```

### 脚本命名规则

Flyway 迁移脚本遵循严格的命名规则：

| 类型 | 格式 | 示例 |
|------|------|------|
| 版本化迁移 | `V<版本号>__<描述>.sql` | `V1__create_users_table.sql` |
| 可重复迁移 | `R__<描述>.sql` | `R__create_views.sql` |
| 撤销迁移 | `U<版本号>__<描述>.sql` | `U1__drop_users_table.sql` |

**重要规则：**
- 版本号必须唯一，不可重复
- 已应用的脚本内容不能修改
- 使用双下划线 `__` 分隔版本号和描述
- 描述中的空格用单下划线 `_` 替换

### 虚谷数据库 SQL 脚本示例

```sql
-- V1__create_users_table.sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加注释
COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.id IS '用户ID';
COMMENT ON COLUMN users.username IS '用户名';
COMMENT ON COLUMN users.email IS '邮箱';
COMMENT ON COLUMN users.created_time IS '创建时间';
COMMENT ON COLUMN users.updated_time IS '更新时间';

-- 创建序列
CREATE SEQUENCE users_seq START WITH 1 INCREMENT BY 1;

-- 创建触发器（自动更新更新时间）
CREATE OR REPLACE TRIGGER users_update_trigger
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    :NEW.updated_time := CURRENT_TIMESTAMP;
END;
```

## 第三步：修改配置文件

### application.yml 配置

```yaml
spring:
  datasource:
    url: jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: SYSDBA
    password: SYSDBA
    driver-class-name: com.xugu.cloudjdbc.Driver
    type: com.alibaba.druid.pool.DruidDataSource
    druid:
      initialSize: 5
      minIdle: 10
      maxActive: 20
      maxWait: 60000
      validationQuery: SELECT 1
      testWhileIdle: true
      testOnBorrow: false
      testOnReturn: false

  flyway:
    # 启用 Flyway
    enabled: true
    # 迁移脚本位置
    locations: classpath:db/migration
    # 迁移历史表名
    table: flyway_schema_history
    # 基线迁移（适用于已有数据库）
    baseline-on-migrate: true
    # 基线版本
    baseline-version: 0
    # 迁移时验证脚本
    validate-on-migrate: true
    # 迁移时清理（慎用，生产环境禁用）
    clean-disabled: true
    # 连接重试次数
    connect-retries: 3
    # 连接重试间隔（秒）
    connect-retries-interval: 10
    # 编码
    encoding: UTF-8
    # 占位符替换
    placeholder-replacement: true
    placeholders:
      schema: RY
```

### 关键配置项说明

| 配置项 | 说明 | 推荐值 |
|--------|------|--------|
| `spring.flyway.enabled` | 是否启用 Flyway | true |
| `spring.flyway.locations` | 迁移脚本位置 | classpath:db/migration |
| `spring.flyway.table` | 迁移历史表名 | flyway_schema_history |
| `spring.flyway.baseline-on-migrate` | 是否基线迁移 | true（适用于已有数据库） |
| `spring.flyway.validate-on-migrate` | 是否验证脚本 | true |
| `spring.flyway.clean-disabled` | 是否禁用清理 | true（生产环境） |
| `spring.flyway.encoding` | 脚本编码 | UTF-8 |

## 第四步：多环境配置

### 开发环境配置

```yaml
# application-dev.yml
spring:
  flyway:
    enabled: true
    clean-disabled: false  # 开发环境允许清理
    clean-on-validation-error: true
  datasource:
    url: jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=RY_DEV&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: SYSDBA
    password: SYSDBA
```

### 生产环境配置

```yaml
# application-prod.yml
spring:
  flyway:
    enabled: true
    clean-disabled: true  # 生产环境禁用清理
    validate-on-migrate: true
    out-of-order: false  # 生产环境禁止乱序迁移
  datasource:
    url: jdbc:xugu://prod-server:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

## 第五步：测试验证

### 编译打包

```bash
# 设置JAVA_HOME（虚谷JDBC驱动需要Java 17+）
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

# 编译打包
mvn clean package -DskipTests
```

### 启动应用

```bash
java -jar ruoyi-admin/target/ruoyi-admin.jar
```

### 验证迁移

```bash
# 查看迁移状态
mvn flyway:info

# 验证迁移脚本
mvn flyway:validate

# 执行迁移
mvn flyway:migrate
```

## 第六步：生产部署

### 部署前检查

1. **备份数据库**：生产环境迁移前必须备份
2. **测试环境验证**：先在测试环境执行迁移
3. **低峰期执行**：选择业务低峰期执行迁移
4. **监控准备**：准备监控和告警机制

### 部署步骤

```bash
# 1. 备份数据库
# 2. 停止应用服务
# 3. 执行迁移
mvn flyway:migrate
# 4. 启动应用服务
# 5. 验证应用功能
```

## 常见问题排查

### 1. 驱动类找不到

**现象：** 启动时报错 `Driver class not found`

**原因：** JDBC 驱动未正确引入

**解决：** 确保 `xugu-jdbc` 依赖已正确配置

### 2. 连接 URL 错误

**现象：** 连接时报错 `Invalid connection URL`

**原因：** URL 参数错误

**解决：** 确保使用正确的 URL 格式

```yaml
url: jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

### 3. 迁移脚本语法错误

**现象：** 迁移失败，报 SQL 语法错误

**原因：** 虚谷数据库与标准 SQL 语法有差异

**解决：** 
- 检查虚谷数据库 SQL 语法
- 使用虚谷数据库兼容的函数和语法
- 参考虚谷数据库 SQL 语法文档

### 4. 迁移历史表不存在

**现象：** 启动时报错 `flyway_schema_history` 表不存在

**原因：** 首次运行时需要创建历史表

**解决：** 
- 设置 `spring.flyway.baseline-on-migrate: true`
- 或手动创建历史表

### 5. 脚本校验失败

**现象：** 迁移失败，报脚本校验错误

**原因：** 已应用的脚本内容被修改

**解决：** 
- 不要修改已应用的脚本
- 使用 `mvn flyway:repair` 修复历史表
- 创建新的迁移脚本进行修改

### 6. 权限不足

**现象：** 迁移失败，报权限错误

**原因：** 数据库用户权限不足

**解决：** 
- 确保用户有创建表、序列、触发器等权限
- 使用 DBA 权限用户执行迁移

### 7. 占位符替换失败

**现象：** 迁移失败，报占位符未定义

**原因：** 占位符配置错误

**解决：** 
- 检查 `spring.flyway.placeholder-replacement` 配置
- 确保占位符在 `spring.flyway.placeholders` 中定义

## 参考文档

详细的配置和使用说明请参考：
- [Flyway 配置详解](references/flyway-configuration.md)
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [Flyway 官方文档](https://flywaydb.org/documentation/)
