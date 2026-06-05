---
name: shardingsphere-xugudb-adapter
description: ShardingSphere-JDBC 适配虚谷数据库(XuguDB)的完整指南。当用户需要将基于 ShardingSphere 的分布式数据库中间件配置或适配到虚谷数据库时使用此技能，包括依赖配置、分片策略配置、读写分离配置、数据脱敏配置等。适用于从 MySQL/Oracle 迁移或新建虚谷数据库项目。
---

# ShardingSphere 虚谷数据库适配指南

## 概述

本技能提供 ShardingSphere-JDBC 适配虚谷数据库(XuguDB)的完整流程。ShardingSphere 是一个分布式数据库中间件，支持分库分表、读写分离、数据脱敏等功能，通过适配虚谷数据库，可以实现分布式数据库架构。

## 适配流程

在开始适配前，按以下顺序检查和修改：

```
1. 依赖配置 → 2. 数据源配置 → 3. 分片策略配置 → 4. 读写分离配置 → 5. 功能验证 → 6. 性能优化
```

## 第一步：配置依赖

### 从源码编译安装

1. 从虚谷开放源代码仓库下载对应版本的 ShardingSphere 适配源码
2. 在项目根目录执行 `mvn clean install -DskipTests`
3. 环境要求：推荐使用 JDK 8 和 Maven 3.6.x

### Maven 依赖配置

```xml
<!-- ShardingSphere-JDBC -->
<dependency>
    <groupId>org.apache.shardingsphere</groupId>
    <artifactId>sharding-jdbc-spring-boot-starter</artifactId>
    <version>4.1.1</version>
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
    <artifactId>druid</artifactId>
    <version>1.2.6</version>
</dependency>
```

## 第二步：配置数据源

### 多数据源配置

```yaml
spring:
  shardingsphere:
    datasource:
      names: ds0, ds1, ds2
      ds0:
        driverClassName: com.xugu.cloudjdbc.Driver
        url: jdbc:xugu://127.0.0.1:5138/rdss0?compatiblemode=MYSQL
        username: SYSDBA
        password: SYSDBA
        type: com.alibaba.druid.pool.DruidDataSource
        validationQuery: SELECT 1 FROM DUAL
      ds1:
        driverClassName: com.xugu.cloudjdbc.Driver
        url: jdbc:xugu://127.0.0.1:5138/rdss1?compatiblemode=MYSQL
        username: SYSDBA
        password: SYSDBA
        type: com.alibaba.druid.pool.DruidDataSource
        validationQuery: SELECT 1 FROM DUAL
      ds2:
        driverClassName: com.xugu.cloudjdbc.Driver
        url: jdbc:xugu://127.0.0.1:5138/rdss2?compatiblemode=MYSQL
        username: SYSDBA
        password: SYSDBA
        type: com.alibaba.druid.pool.DruidDataSource
        validationQuery: SELECT 1 FROM DUAL
```

**关键配置说明：**
- `compatiblemode=MYSQL`：必须设置，启用 MySQL 兼容模式
- 数据源名称：使用逗号分隔多个数据源
- 连接池：推荐使用 Druid 连接池

## 第三步：配置分片策略

### 行表达式分片策略（Inline）

最常用，通过 Groovy 表达式直接定义分片逻辑：

```yaml
spring:
  shardingsphere:
    sharding:
      tables:
        orders:
          actual-data-nodes: ds$->{0..1}.orders_$->{1..5}
          keyGenerator:
            column: id
            type: SNOWFLAKE
          database-strategy:
            inline:
              shardingColumn: id
              algorithmExpression: ds$->{id % 2}
          table-strategy:
            inline:
              shardingColumn: id
              algorithmExpression: orders_$->{id % 5 + 1}
```

### 标准分片策略（Standard）

适用于复杂分片规则，需要用户自定义算法类：

```yaml
spring:
  shardingsphere:
    sharding:
      tables:
        user:
          actualDataNodes: ds2.user_$->{2024..2026}
          tableStrategy:
            standard:
              shardingColumn: create_time
              precise-algorithm-class-name: com.example...UserTableStandardPreciseAlgorithm
              rangeAlgorithmClassName: com.example...UserTableRangeShardingAlgorithm
```

### 广播表与绑定表

```yaml
spring:
  shardingsphere:
    sharding:
      broadcast-tables:
        - dict
      binding-tables:
        - orders, order_item
```

## 第四步：配置读写分离

### 主从数据源配置

```yaml
spring:
  shardingsphere:
    datasource:
      names: master, slave0, slave1
      master:
        driverClassName: com.xugu.cloudjdbc.Driver
        url: jdbc:xugu://127.0.0.1:5138/master_db?compatiblemode=MYSQL
        username: SYSDBA
        password: SYSDBA
        type: com.alibaba.druid.pool.DruidDataSource
      slave0:
        driverClassName: com.xugu.cloudjdbc.Driver
        url: jdbc:xugu://127.0.0.1:5138/slave_db0?compatiblemode=MYSQL
        username: SYSDBA
        password: SYSDBA
        type: com.alibaba.druid.pool.DruidDataSource
      slave1:
        driverClassName: com.xugu.cloudjdbc.Driver
        url: jdbc:xugu://127.0.0.1:5138/slave_db1?compatiblemode=MYSQL
        username: SYSDBA
        password: SYSDBA
        type: com.alibaba.druid.pool.DruidDataSource
```

### 主从规则配置

```yaml
spring:
  shardingsphere:
    sharding:
      master-slave-rules:
        ms0:
          master-data-source-name: master
          slave-data-source-names: slave0, slave1
          load-balance-algorithm-type: round_robin
```

## 第五步：功能验证

### 验证基本功能

1. **连接测试**：确保应用能成功连接到所有数据源
2. **分片查询**：测试分库分表功能是否正常
3. **分布式主键**：测试雪花算法等主键生成策略
4. **关联查询**：测试绑定表关联查询
5. **广播表**：测试广播表数据同步

### 验证高级功能

1. **读写分离**：测试主从数据源读写分离
2. **数据脱敏**：测试数据加密和脱敏功能
3. **分布式事务**：测试跨数据源事务
4. **强制路由**：测试 Hint 强制路由功能
5. **监控管理**：测试监控和管理功能

## 第六步：性能优化

### 分片策略优化

1. **选择合适的分片键**：选择查询频率高、数据分布均匀的字段
2. **合理设置分片数量**：根据数据量和查询压力设置分片数量
3. **使用绑定表**：优化关联查询性能
4. **避免跨库查询**：尽量让相关数据在同一个数据源

### 连接池优化

```yaml
spring:
  shardingsphere:
    datasource:
      ds0:
        # Druid 连接池配置
        initialSize: 5
        minIdle: 10
        maxActive: 20
        maxWait: 60000
        timeBetweenEvictionRunsMillis: 60000
        minEvictableIdleTimeMillis: 300000
```

### 查询优化

1. **使用索引**：为分片键和常用查询字段创建索引
2. **避免全表扫描**：确保查询条件包含分片键
3. **合理使用缓存**：配置二级缓存减少数据库访问
4. **批量操作优化**：使用批量插入和更新

## 常见问题排查

### 1. 驱动类找不到

**现象：** 启动时报错 `Driver class not found`

**原因：** JDBC 驱动未正确引入

**解决：** 确保 `xugu-jdbc` 依赖已正确配置

### 2. 连接 URL 错误

**现象：** 连接时报错 `Invalid connection URL`

**原因：** URL 参数错误

**解决：** 确保使用正确的 URL 格式，并包含 `compatiblemode=MYSQL`

### 3. 分片规则不生效

**现象：** 分片规则配置后查询仍然路由到所有数据源

**原因：** 分片规则配置错误或分片键不正确

**解决：** 
- 检查分片键是否正确
- 检查分片算法表达式是否正确
- 检查数据源名称是否匹配

### 4. 表名大小写问题

**现象：** 查询时报"表不存在"错误

**原因：** 虚谷数据库默认创建大写表名，ShardingSphere 配置中表名大小写不一致

**解决：** 
- 确保分片规则中的表名与数据库中的表名大小写一致
- 或者在 ShardingSphere 配置中设置 `props.sql.show: true` 查看实际执行的 SQL

### 5. 分布式事务问题

**现象：** 跨数据源事务不生效

**原因：** 分布式事务配置不正确

**解决：** 
- 使用 ShardingSphere 的分布式事务管理器
- 配置 `spring.shardingsphere.props.proxy.transaction.enabled: true`

### 6. 读写分离不生效

**现象：** 所有查询都路由到主库

**原因：** 读写分离配置不正确

**解决：** 
- 检查主从数据源配置
- 检查主从规则配置
- 确保从库数据源可用

## 最佳实践

### 1. 版本管理
- 始终保持 ShardingSphere 版本与虚谷数据库版本兼容
- 定期检查虚谷官方发布的适配更新

### 2. 配置管理
- 使用外部化配置（如 application.yml）
- 为不同环境使用不同配置
- 敏感信息使用环境变量或加密存储

### 3. 性能优化
- 合理配置连接池参数
- 使用绑定表优化关联查询
- 合理设置分片键和分片算法
- 使用广播表减少跨库查询

### 4. 安全性
- 使用最小权限原则配置数据库用户
- 定期更换数据库密码
- 启用数据脱敏保护敏感信息

### 5. 监控与日志
- 启用 SQL 日志（开发环境）
- 配置监控告警
- 定期检查慢查询日志

## 参考文档

详细的配置指南和故障排除请参考：
- [ShardingSphere 虚谷数据库配置指南](references/shardingsphere-configuration.md)
- [ShardingSphere 官方文档](https://shardingsphere.apache.org/document/current/cn/overview/)
- [虚谷数据库官方文档](https://docs.xugudb.com/)