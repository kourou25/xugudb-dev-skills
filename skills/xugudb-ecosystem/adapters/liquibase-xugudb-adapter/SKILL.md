---
name: liquibase-xugudb-adapter
description: Liquibase 数据库迁移工具适配虚谷数据库(XuguDB)的完整指南。当用户需要将基于 Liquibase 的 Java 项目配置或适配到虚谷数据库时使用此技能，包括依赖配置、变更日志编写、Spring Boot 集成、多环境配置等。适用于从 MySQL/Oracle 迁移或新建虚谷数据库项目。
---

# Liquibase 虚谷数据库适配指南

## 概述

本技能提供 Liquibase 数据库迁移工具适配虚谷数据库(XuguDB)的完整流程。虚谷数据库通过提供专用的 JDBC 驱动和配置支持，可以无缝集成 Liquibase 框架的各种功能，包括数据库版本管理、增量迁移、多环境配置等。

## 适配流程

在开始适配前，按以下顺序检查和修改：

```
1. 依赖配置 → 2. 变更日志编写 → 3. Spring Boot 配置 → 4. 多环境配置 → 5. 测试验证 → 6. 生产部署
```

## 第一步：配置依赖

### Maven 依赖配置

添加 Liquibase 和虚谷 JDBC 驱动依赖：

```xml
<!-- Spring Boot Liquibase 依赖 -->
<dependency>
    <groupId>org.liquibase</groupId>
    <artifactId>liquibase-core</artifactId>
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

## 第二步：编写变更日志

### 目录结构

```
src/main/resources/
└── db/
    └── changelog/
        ├── db.changelog-master.xml
        ├── V1__create_tables.xml
        ├── V2__create_indexes.xml
        └── V3__insert_initial_data.xml
```

### 主变更日志文件

```xml
<!-- db.changelog-master.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.25.xsd">

    <include file="classpath:db/changelog/V1__create_tables.xml"/>
    <include file="classpath:db/changelog/V2__create_indexes.xml"/>
    <include file="classpath:db/changelog/V3__insert_initial_data.xml"/>
</databaseChangeLog>
```

### 变更集文件示例

```xml
<!-- V1__create_tables.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.25.xsd">

    <changeSet id="1" author="developer">
        <createTable tableName="users">
            <column name="id" type="bigint">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="username" type="varchar(50)">
                <constraints nullable="false"/>
            </column>
            <column name="email" type="varchar(100)"/>
            <column name="created_time" type="timestamp" defaultValueComputed="CURRENT_TIMESTAMP"/>
            <column name="updated_time" type="timestamp" defaultValueComputed="CURRENT_TIMESTAMP"/>
        </createTable>

        <addRemarks tableName="users" remarks="用户表"/>
        <addRemarks tableName="users" columnName="id" remarks="用户ID"/>
        <addRemarks tableName="users" columnName="username" remarks="用户名"/>
        <addRemarks tableName="users" columnName="email" remarks="邮箱"/>
        <addRemarks tableName="users" columnName="created_time" remarks="创建时间"/>
        <addRemarks tableName="users" columnName="updated_time" remarks="更新时间"/>
    </changeSet>

    <changeSet id="2" author="developer">
        <createSequence sequenceName="users_seq" startValue="1" incrementBy="1"/>
    </changeSet>
</databaseChangeLog>
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

  liquibase:
    # 启用 Liquibase
    enabled: true
    # 主变更日志文件路径
    change-log: classpath:db/changelog/db.changelog-master.xml
    # 默认 Schema
    default-schema: RY
    # 上下文（用于环境区分）
    contexts: dev
    # 标签
    labels: ""
    # 迁移时是否清除数据库（慎用）
    drop-first: false
    # 是否测试模式
    test-rollback-on-update: false
    # 数据库变更日志表名
    database-change-log-table: DATABASECHANGELOG
    # 数据库变更日志锁表名
    database-change-log-lock-table: DATABASECHANGELOGLOCK
    # 参数
    parameters:
      schema: RY
```

### 关键配置项说明

| 配置项 | 说明 | 推荐值 |
|--------|------|--------|
| `spring.liquibase.enabled` | 是否启用 Liquibase | true |
| `spring.liquibase.change-log` | 主变更日志文件路径 | classpath:db/changelog/db.changelog-master.xml |
| `spring.liquibase.default-schema` | 默认 Schema | RY |
| `spring.liquibase.contexts` | 上下文（环境区分） | dev |
| `spring.liquibase.drop-first` | 是否先清除数据库 | false |
| `spring.liquibase.database-change-log-table` | 变更日志表名 | DATABASECHANGELOG |

## 第四步：多环境配置

### 使用上下文区分环境

```xml
<!-- V1__create_tables.xml -->
<changeSet id="1" author="developer" context="dev">
    <!-- 开发环境数据 -->
    <insert tableName="users">
        <column name="id" value="1"/>
        <column name="username" value="testuser"/>
        <column name="email" value="test@example.com"/>
    </insert>
</changeSet>

<changeSet id="2" author="developer" context="prod">
    <!-- 生产环境数据 -->
    <insert tableName="users">
        <column name="id" value="1"/>
        <column name="username" value="admin"/>
        <column name="email" value="admin@example.com"/>
    </insert>
</changeSet>
```

### 不同环境的配置文件

```yaml
# application-dev.yml
spring:
  liquibase:
    contexts: dev
    drop-first: true  # 开发环境可以先清除
  datasource:
    url: jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=RY_DEV&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: SYSDBA
    password: SYSDBA

# application-prod.yml
spring:
  liquibase:
    contexts: prod
    drop-first: false  # 生产环境禁止清除
    test-rollback-on-update: false
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
# 执行迁移
mvn liquibase:update

# 查看迁移状态
mvn liquibase:status

# 验证变更日志
mvn liquibase:validate
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
mvn liquibase:update
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

### 3. 变更日志文件找不到

**现象：** 启动时报错 `FileNotFoundException`

**原因：** 变更日志文件路径错误

**解决：** 
- 检查 `spring.liquibase.change-log` 配置
- 确保文件存在于正确位置

### 4. 变更集执行失败

**现象：** 迁移失败，报 SQL 语法错误

**原因：** 虚谷数据库与标准 SQL 语法有差异

**解决：** 
- 检查虚谷数据库 SQL 语法
- 使用虚谷数据库兼容的函数和语法
- 参考虚谷数据库 SQL 语法文档

### 5. 权限不足

**现象：** 迁移失败，报权限错误

**原因：** 数据库用户权限不足

**解决：** 
- 确保用户有创建表、序列、触发器等权限
- 使用 DBA 权限用户执行迁移

### 6. 变更日志表不存在

**现象：** 启动时报错 `DATABASECHANGELOG` 表不存在

**原因：** 首次运行时需要创建变更日志表

**解决：** 
- Liquibase 会自动创建变更日志表
- 如果失败，手动创建表结构

## 参考文档

详细的配置和使用说明请参考：
- [Liquibase 配置详解](references/liquibase-configuration.md)
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [Liquibase 官方文档](https://docs.liquibase.com/)
