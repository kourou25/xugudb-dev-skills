---
name: hibernate-xugudb-adapter
description: Hibernate 框架适配虚谷数据库(XuguDB)的完整指南。当用户需要将基于 Hibernate 的 Java 项目配置或适配到虚谷数据库时使用此技能，包括方言配置、数据源配置、连接池配置、SQL 语法适配等。适用于从 MySQL/Oracle 迁移或新建虚谷数据库项目。
---

# Hibernate 虚谷数据库适配指南

## 概述

本技能提供 Hibernate 框架适配虚谷数据库(XuguDB)的完整流程。虚谷数据库通过提供专用的 Hibernate 方言包，支持 Hibernate 框架的各种功能，包括分页、序列、事务、锁机制等。

## 适配流程

在开始适配前，按以下顺序检查和修改：

```
1. 依赖配置 → 2. 方言配置 → 3. 数据源配置 → 4. 连接池配置 → 5. 功能验证 → 6. 性能优化
```

## 第一步：配置依赖

### Maven 依赖配置

添加虚谷方言包和 JDBC 驱动依赖：

```xml
<!-- 虚谷方言包 -->
<dependency>
    <groupId>com.xugudb</groupId>
    <artifactId>xugu-dialect</artifactId>
    <version>6.6.1</version> <!-- 请根据实际使用的Hibernate版本选择匹配的方言版本 -->
</dependency>

<!-- 虚谷JDBC驱动 -->
<dependency>
    <groupId>com.xugudb</groupId>
    <artifactId>xugu-jdbc</artifactId>
    <version>12.3.4</version>
</dependency>

<!-- Hibernate核心 -->
<dependency>
    <groupId>org.hibernate.orm</groupId>
    <artifactId>hibernate-core</artifactId>
    <version>6.6.1.Final</version>
</dependency>
```

**重要：** 方言版本必须与 Hibernate 版本一致。

## 第二步：配置方言

### hibernate.cfg.xml 配置

```xml
<hibernate-configuration>
  <session-factory>
    <!-- 虚谷方言配置 -->
    <property name="hibernate.dialect">com.xugudb.hibernate.dialect.XuguDialect</property>
    
    <!-- 其他配置 -->
    <property name="hibernate.connection.driver_class">com.xugu.cloudjdbc.Driver</property>
    <property name="hibernate.connection.url">jdbc:xugu://localhost:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL</property>
    <property name="hibernate.connection.username">SYSDBA</property>
    <property name="hibernate.connection.password">SYSDBA</property>
  </session-factory>
</hibernate-configuration>
```

### Spring Boot 配置

```yaml
spring:
  jpa:
    database-platform: com.xugudb.hibernate.dialect.XuguDialect
```

或

```properties
spring.jpa.database-platform=com.xugudb.hibernate.dialect.XuguDialect
```

## 第三步：配置数据源

### 数据源配置示例

```yaml
spring:
  datasource:
    driver-class-name: com.xugu.cloudjdbc.Driver
    url: jdbc:xugu://localhost:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: SYSDBA
    password: SYSDBA
```

**关键配置说明：**
- `current_schema`：指定当前模式名（不是数据库名）
- `CHAR_SET=UTF8`：字符集配置
- `COMPATIBLE_MODE=MYSQL`：MySQL兼容模式（可选：ORACLE、POSTGRESQL）

## 第四步：配置连接池

### Druid 连接池配置

```yaml
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
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

### HikariCP 连接池配置

```yaml
spring:
  datasource:
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      connection-test-query: SELECT 1
```

## 第五步：功能验证

### 验证基本功能

1. **连接测试**：确保应用能成功连接到虚谷数据库
2. **CRUD 操作**：测试基本的增删改查操作
3. **分页查询**：测试分页功能是否正常
4. **事务管理**：测试事务提交和回滚
5. **关联查询**：测试一对一、一对多、多对多关联

### 验证高级功能

1. **序列生成**：测试序列主键生成策略
2. **自增列**：测试自增列主键生成策略
3. **批量操作**：测试批量插入和更新性能
4. **缓存机制**：测试一级和二级缓存
5. **锁机制**：测试乐观锁和悲观锁

## 第六步：性能优化

### 批量操作优化

```yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 25
        order_inserts: true
        order_updates: true
```

### 查询优化

1. **避免 N+1 查询**：使用 `JOIN FETCH` 或 `@BatchSize`
2. **使用投影查询**：只查询需要的字段
3. **合理使用缓存**：配置二级缓存（如 Ehcache）
4. **索引优化**：为常用查询字段创建索引

### 连接池优化

```yaml
spring:
  datasource:
    druid:
      # 启用监控
      stat-view-servlet:
        enabled: true
      # 启用过滤器
      filters: stat,wall
```

## 常见问题排查

### 1. 方言类找不到

**现象：** 启动时报错 `Dialect class not found`

**原因：** 方言依赖未正确引入或版本不匹配

**解决：** 
- 确保 `xugu-dialect` 依赖已正确配置
- 确保方言版本与 Hibernate 版本一致

### 2. 连接 URL 错误

**现象：** 连接时报错 `Invalid connection URL`

**原因：** URL 参数错误

**解决：** 确保使用正确的 URL 格式：
```
jdbc:xugu://host:port/database?current_schema=schema&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

### 3. 分页查询异常

**现象：** 分页查询报错或结果不正确

**原因：** 方言配置错误或 SQL 语法问题

**解决：** 
- 确保使用正确的方言类
- 检查 SQL 语法兼容性
- 验证分页参数

### 4. 主键生成失败

**现象：** 主键生成失败或值重复

**原因：** 主键生成策略配置不当

**解决：**
- 使用 `GenerationType.IDENTITY` 配合自增列
- 使用 `GenerationType.SEQUENCE` 配合序列
- 确保数据库表结构支持相应的主键策略

### 5. 批量操作性能差

**现象：** 批量插入/更新性能差

**原因：** 批量操作未正确配置

**解决：**
- 设置 `hibernate.jdbc.batch_size=25`
- 启用 `order_inserts` 和 `order_updates`
- 使用 `StatelessSession` 进行大批量操作

### 6. 字符编码问题

**现象：** 中文字符乱码或存储异常

**原因：** 字符集配置不正确

**解决：** 确保 URL 中包含 `CHAR_SET=UTF8`

## 最佳实践

### 1. 版本管理
- 始终保持方言版本与 Hibernate 版本一致
- 定期检查虚谷官方发布的方言更新

### 2. 配置管理
- 使用外部化配置（如 application.yml）
- 为不同环境使用不同配置
- 敏感信息使用环境变量或加密存储

### 3. 性能优化
- 合理配置连接池参数
- 启用批量操作
- 使用二级缓存
- 避免 N+1 查询问题

### 4. 安全性
- 使用最小权限原则配置数据库用户
- 定期更换数据库密码
- 启用 SSL 加密连接（生产环境）

### 5. 监控与日志
- 启用 Hibernate SQL 日志（开发环境）
- 配置连接池监控
- 定期检查慢查询日志

## 参考文档

详细的配置指南和故障排除请参考：
- [Hibernate 虚谷数据库配置指南](references/hibernate-configuration.md)
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [Hibernate 官方文档](https://hibernate.org/orm/documentation/)