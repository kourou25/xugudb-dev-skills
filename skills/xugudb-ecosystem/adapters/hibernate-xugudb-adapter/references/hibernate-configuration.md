# Hibernate 虚谷数据库配置指南

## 概述

本文档提供 Hibernate 框架适配虚谷数据库(XuguDB)的完整配置指南，包括方言配置、数据源配置、连接池配置等。

## 一、核心配置信息

### 1.1 方言类名
```
com.xugudb.hibernate.dialect.XuguDialect
```

### 1.2 JDBC 驱动类
```
com.xugu.cloudjdbc.Driver
```

### 1.3 连接 URL 格式
```
jdbc:xugu://<host>:<port>/<database>?current_schema=<schema>&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

**参数说明：**
- `<host>`: 数据库服务器地址
- `<port>`: 数据库端口（默认5138）
- `<database>`: 数据库名（如SYSTEM）
- `current_schema`: 当前模式名（如RY）
- `CHAR_SET`: 字符集（推荐UTF8）
- `COMPATIBLE_MODE`: 兼容模式（MYSQL/ORACLE/POSTGRESQL）

### 1.4 示例 URL
```
jdbc:xugu://localhost:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

## 二、依赖配置

### 2.1 Maven 依赖

#### 方言包依赖
```xml
<!-- 虚谷方言包 -->
<dependency>
    <groupId>com.xugudb</groupId>
    <artifactId>xugu-dialect</artifactId>
    <version>6.6.1</version> <!-- 请根据实际使用的Hibernate版本选择匹配的方言版本 -->
</dependency>
```

#### JDBC 驱动依赖
```xml
<!-- 虚谷JDBC驱动 -->
<dependency>
    <groupId>com.xugudb</groupId>
    <artifactId>xugu-jdbc</artifactId>
    <version>12.3.4</version>
</dependency>
```

#### Hibernate 核心依赖
```xml
<!-- Hibernate核心 -->
<dependency>
    <groupId>org.hibernate.orm</groupId>
    <artifactId>hibernate-core</artifactId>
    <version>6.6.1.Final</version>
</dependency>
```

### 2.2 本地 JAR 包依赖（可选）

如果无法使用 Maven 仓库，可以使用本地 JAR 包：

```xml
<dependency>
    <groupId>com.xugudb</groupId>
    <artifactId>xugu-dialect</artifactId>
    <version>6.6.1</version>
    <systemPath>${project.basedir}/src/main/resources/lib/xugu-dialect-6.6.1.jar</systemPath>
    <scope>system</scope>
</dependency>
```

## 三、Hibernate 配置

### 3.1 hibernate.cfg.xml 配置示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-configuration PUBLIC
    "-//Hibernate/Hibernate Configuration DTD 3.0//EN"
    "http://www.hibernate.org/dtd/hibernate-configuration-3.0.dtd">

<hibernate-configuration>
  <session-factory>
    <!-- JDBC 连接配置 -->
    <property name="hibernate.connection.driver_class">com.xugu.cloudjdbc.Driver</property>
    <property name="hibernate.connection.url">jdbc:xugu://localhost:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL</property>
    <property name="hibernate.connection.username">SYSDBA</property>
    <property name="hibernate.connection.password">SYSDBA</property>

    <!-- 虚谷方言配置 -->
    <property name="hibernate.dialect">com.xugudb.hibernate.dialect.XuguDialect</property>

    <!-- 其他推荐配置 -->
    <property name="hibernate.hbm2ddl.auto">validate</property>
    <property name="hibernate.jdbc.batch_size">25</property>
    <property name="hibernate.show_sql">true</property>
    <property name="hibernate.format_sql">true</property>

    <!-- 映射实体类 -->
    <mapping resource="mapper/User.hbm.xml"/>
    <!-- 或使用注解扫描 -->
    <!-- <mapping class="com.example.entity.User"/> -->
  </session-factory>
</hibernate-configuration>
```

### 3.2 application.properties 配置示例（Spring Boot）

```properties
# 数据源配置
spring.datasource.driver-class-name=com.xugu.cloudjdbc.Driver
spring.datasource.url=jdbc:xugu://localhost:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
spring.datasource.username=SYSDBA
spring.datasource.password=SYSDBA

# Hibernate 配置
spring.jpa.database-platform=com.xugudb.hibernate.dialect.XuguDialect
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.jdbc.batch_size=25
spring.jpa.properties.hibernate.format_sql=true
```

### 3.3 application.yml 配置示例（Spring Boot）

```yaml
spring:
  datasource:
    driver-class-name: com.xugu.cloudjdbc.Driver
    url: jdbc:xugu://localhost:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: SYSDBA
    password: SYSDBA
  jpa:
    database-platform: com.xugudb.hibernate.dialect.XuguDialect
    hibernate:
      ddl-auto: validate
    show-sql: true
    properties:
      hibernate:
        jdbc:
          batch_size: 25
        format_sql: true
```

## 四、连接池配置

### 4.1 Druid 连接池配置

```yaml
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    driver-class-name: com.xugu.cloudjdbc.Driver
    url: jdbc:xugu://localhost:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: SYSDBA
    password: SYSDBA
    druid:
      initial-size: 5
      min-idle: 10
      max-active: 20
      max-wait: 60000
      validation-query: SELECT 1
      test-while-idle: true
      test-on-borrow: false
      test-on-return: false
```

### 4.2 HikariCP 连接池配置

```yaml
spring:
  datasource:
    hikari:
      driver-class-name: com.xugu.cloudjdbc.Driver
      jdbc-url: jdbc:xugu://localhost:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
      username: SYSDBA
      password: SYSDBA
      minimum-idle: 5
      maximum-pool-size: 20
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      connection-test-query: SELECT 1
```

## 五、方言支持的功能特性

虚谷方言包支持以下 Hibernate 功能：

### 5.1 分页与排序
- 支持 `LIMIT` 和 `OFFSET` 分页
- 支持 `FOR UPDATE` 行级锁定
- 支持空值排序（`NULLS FIRST` / `NULLS LAST`）

### 5.2 序列与自增列
- 支持 `CREATE SEQUENCE` 序列
- 支持 `IDENTITY(1,1)` 自增列
- 支持 `SELECT uuid()` 获取 UUID

### 5.3 事务与锁
- 支持事务管理
- 支持行级锁定（`FOR UPDATE`）
- 支持乐观锁（`VERSION` 字段）

### 5.4 模式与表操作
- 支持创建/删除数据库
- 支持创建/删除/修改表
- 支持创建/删除索引

### 5.5 外键与约束
- 支持外键约束
- 支持唯一键约束
- 支持检查约束

### 5.6 注释
- 支持表注释（`COMMENT ON TABLE`）
- 支持列注释（`COMMENT ON COLUMN`）

### 5.7 临时表
- 支持创建本地临时表
- 支持临时表数据操作

### 5.8 其他功能
- 支持日期时间字面量
- 支持查询序列信息
- 支持批量操作优化

## 六、常见问题排查

### 6.1 方言版本不匹配

**现象：** 启动时报错 `Dialect class not found` 或 `UnsupportedOperationException`

**原因：** 方言版本与 Hibernate 版本不匹配

**解决：** 确保 `xugu-dialect` 版本与 `hibernate-core` 版本一致

### 6.2 驱动类找不到

**现象：** 启动时报错 `Driver class not found`

**原因：** JDBC 驱动未正确引入

**解决：** 确保 `xugu-jdbc` 依赖已正确配置

### 6.3 连接 URL 错误

**现象：** 连接时报错 `Invalid connection URL` 或 `Schema not found`

**原因：** URL 参数错误，特别是 `current_schema` 参数

**解决：** 确保使用 `current_schema=模式名` 而不是 `schema=模式名`

### 6.4 分页查询异常

**现象：** 分页查询报错或结果不正确

**原因：** 方言配置错误或 SQL 语法问题

**解决：** 确保使用正确的方言类，并检查 SQL 语法兼容性

### 6.5 主键生成策略问题

**现象：** 主键生成失败或值重复

**原因：** 主键生成策略配置不当

**解决：** 
- 使用 `@GeneratedValue(strategy = GenerationType.IDENTITY)` 配合自增列
- 使用 `@GeneratedValue(strategy = GenerationType.SEQUENCE)` 配合序列

### 6.6 批量操作性能问题

**现象：** 批量插入/更新性能差

**原因：** 批量操作未正确配置

**解决：** 
- 设置 `hibernate.jdbc.batch_size=25`
- 使用 `StatelessSession` 进行批量操作
- 确保实体 ID 使用数据库生成策略

## 七、最佳实践

### 7.1 版本管理
- 始终保持方言版本与 Hibernate 版本一致
- 定期检查虚谷官方发布的方言更新

### 7.2 配置管理
- 使用外部化配置（如 application.yml）
- 为不同环境（开发/测试/生产）使用不同配置
- 敏感信息（如密码）使用环境变量或加密存储

### 7.3 性能优化
- 合理配置连接池参数
- 启用批量操作
- 使用二级缓存（如 Ehcache、Redis）
- 避免 N+1 查询问题

### 7.4 安全性
- 使用最小权限原则配置数据库用户
- 定期更换数据库密码
- 启用 SSL 加密连接（生产环境）

## 八、参考资源

### 8.1 官方文档
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [Hibernate 官方文档](https://hibernate.org/orm/documentation/)

### 8.2 示例项目
- [虚谷方言源码](https://gitee.com/xugucloud/xugu-dialect)
- [虚谷方言示例](https://gitee.com/xugucloud/xugu-dialect-demo)
- [Hibernate 示例项目](https://github.com/hibernate/hibernate-orm)

### 8.3 社区资源
- [虚谷数据库社区](https://www.xugudb.com/)
- [Hibernate 社区](https://discourse.hibernate.org/)