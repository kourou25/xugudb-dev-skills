---
name: seata-xugudb-adapter
description: Seata 分布式事务适配虚谷数据库(XuguDB)的完整指南。当用户需要将基于 Seata 的分布式事务解决方案配置或适配到虚谷数据库时使用此技能，包括 Seata Server 配置、客户端配置、数据源代理配置、事务模式配置等。适用于从 MySQL/Oracle 迁移或新建虚谷数据库项目。
---

# Seata 分布式事务虚谷数据库适配指南

## 概述

本技能提供 Seata 分布式事务适配虚谷数据库(XuguDB)的完整流程。Seata 是阿里巴巴开源的分布式事务解决方案，支持 AT、TCC、Saga 和 XA 事务模式，通过适配虚谷数据库，可以实现微服务架构中的分布式事务管理。

## 适配流程

在开始适配前，按以下顺序检查和修改：

```
1. 依赖配置 → 2. 数据库初始化 → 3. Seata Server 配置 → 4. 客户端配置 → 5. 功能验证 → 6. 性能优化
```

## 第一步：配置依赖

### Maven 依赖配置

```xml
<!-- Seata Spring Boot Starter -->
<dependency>
    <groupId>io.seata</groupId>
    <artifactId>seata-spring-boot-starter</artifactId>
    <version>1.7.0</version>
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

## 第二步：数据库初始化

### 创建 Seata 所需的表结构

在虚谷数据库中执行以下 SQL 创建 Seata 所需的表：

```sql
-- 创建 Seata 全局事务表
CREATE TABLE global_table (
    xid VARCHAR(128) NOT NULL,
    transaction_id BIGINT,
    status TINYINT NOT NULL,
    application_id VARCHAR(32),
    transaction_service_group VARCHAR(32),
    transaction_name VARCHAR(128),
    timeout INT,
    begin_time BIGINT,
    application_data VARCHAR(2000),
    gmt_create DATETIME,
    gmt_modified DATETIME,
    PRIMARY KEY (xid),
    INDEX idx_gmt_modified_status (gmt_modified, status),
    INDEX idx_transaction_id (transaction_id)
);

-- 创建 Seata 分支事务表
CREATE TABLE branch_table (
    branch_id BIGINT NOT NULL,
    xid VARCHAR(128) NOT NULL,
    transaction_id BIGINT,
    resource_group_id VARCHAR(32),
    resource_id VARCHAR(256),
    branch_type VARCHAR(8),
    status TINYINT,
    client_id VARCHAR(64),
    application_data VARCHAR(2000),
    gmt_create DATETIME,
    gmt_modified DATETIME,
    PRIMARY KEY (branch_id),
    INDEX idx_xid (xid)
);

-- 创建 Seata 全局锁表
CREATE TABLE lock_table (
    row_key VARCHAR(128) NOT NULL,
    xid VARCHAR(128),
    transaction_id BIGINT,
    branch_id BIGINT NOT NULL,
    resource_id VARCHAR(256),
    table_name VARCHAR(32),
    pk VARCHAR(36),
    gmt_create DATETIME,
    gmt_modified DATETIME,
    PRIMARY KEY (row_key),
    INDEX idx_branch_id (branch_id)
);
```

## 第三步：配置 Seata Server

### application.yml 配置

```yaml
server:
  port: 7091

spring:
  application:
    name: seata-server
  datasource:
    driver-class-name: com.xugu.cloudjdbc.Driver
    url: jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=seata&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: SYSDBA
    password: SYSDBA
    type: com.alibaba.druid.pool.DruidDataSource

seata:
  config:
    type: nacos
    nacos:
      server-addr: 127.0.0.1:8848
      namespace:
      group: SEATA_GROUP
      username: nacos
      password: nacos
  registry:
    type: nacos
    nacos:
      application: seata-server
      server-addr: 127.0.0.1:8848
      group: SEATA_GROUP
      namespace:
      username: nacos
      password: nacos
  store:
    mode: db
    db:
      datasource: druid
      db-type: mysql
      driver-class-name: com.xugu.cloudjdbc.Driver
      url: jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=seata&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
      username: SYSDBA
      password: SYSDBA
      min-conn: 5
      max-conn: 30
      global-table: global_table
      branch-table: branch_table
      lock-table: lock_table
      distributed-lock-table: distributed_lock
      query-limit: 100
```

### 启动 Seata Server

```bash
# 启动 Seata Server
sh seata-server.sh -p 7091 -h 127.0.0.1
```

## 第四步：配置客户端

### 客户端配置文件

```yaml
spring:
  datasource:
    driver-class-name: com.xugu.cloudjdbc.Driver
    url: jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=ry&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: SYSDBA
    password: SYSDBA
    type: com.alibaba.druid.pool.DruidDataSource

seata:
  enabled: true
  application-id: ${spring.application.name}
  tx-service-group: my_tx_group
  service:
    vgroup-mapping:
      my_tx_group: default
    grouplist:
      default: 127.0.0.1:8091
  config:
    type: nacos
    nacos:
      server-addr: 127.0.0.1:8848
      group: SEATA_GROUP
      username: nacos
      password: nacos
  registry:
    type: nacos
    nacos:
      application: seata-server
      server-addr: 127.0.0.1:8848
      group: SEATA_GROUP
      username: nacos
      password: nacos
```

### 数据源代理配置

```java
import io.seata.rm.datasource.DataSourceProxy;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties dataSourceProperties) {
        DataSource dataSource = dataSourceProperties.initializeDataSourceBuilder().build();
        return new DataSourceProxy(dataSource);
    }
}
```

## 第五步：功能验证

### 验证基本功能

1. **全局事务**：测试 `@GlobalTransactional` 注解功能
2. **分支事务**：测试分支事务注册和提交
3. **事务回滚**：测试事务回滚功能
4. **事务超时**：测试事务超时处理
5. **并发事务**：测试并发事务处理

### 验证高级功能

1. **AT 模式**：测试 AT 模式分布式事务
2. **TCC 模式**：测试 TCC 模式分布式事务
3. **Saga 模式**：测试 Saga 模式分布式事务
4. **XA 模式**：测试 XA 模式分布式事务
5. **高可用**：测试 Seata Server 集群

## 第六步：性能优化

### 事务配置优化

```yaml
seata:
  client:
    rm:
      report-success-enable: false
      sql-parser-type: druid
    tm:
      commit-retry-count: 5
      rollback-retry-count: 5
  service:
    vgroup-mapping:
      my_tx_group: default
    grouplist:
      default: 127.0.0.1:8091
  transport:
    shutdown:
      wait: 3
    thread-factory:
      boss-thread-prefix: NettyBoss
      worker-thread-prefix: NettyServerNIOWorker
      server-executor-thread-prefix: NettyServerBizHandler
      share-boss-worker: false
      client-selector-thread-prefix: NettyClientSelector
      client-selector-thread-size: 1
      client-worker-thread-prefix: NettyClientWorkerThread
      boss-thread-size: 1
      worker-thread-size: 8
```

### 数据库优化

1. **索引优化**：为全局事务表和分支事务表创建合适的索引
2. **连接池优化**：合理配置数据库连接池参数
3. **SQL 优化**：优化事务相关 SQL 语句
4. **定期清理**：定期清理已完成的事务记录

## 常见问题排查

### 1. 驱动类找不到

**现象：** 启动时报错 `Driver class not found`

**原因：** JDBC 驱动未正确引入

**解决：** 确保 `xugu-jdbc` 依赖已正确配置

### 2. 连接 URL 错误

**现象：** 连接时报错 `Invalid connection URL`

**原因：** URL 参数错误

**解决：** 确保使用正确的 URL 格式，并包含 `current_schema=模式名`

### 3. 全局事务表不存在

**现象：** 启动时报错 `Table 'global_table' doesn't exist`

**原因：** Seata 数据库表未初始化

**解决：** 执行 Seata 数据库初始化脚本

### 4. 分支事务注册失败

**现象：** 分支事务注册失败

**原因：** 数据源代理配置不正确

**解决：** 
- 确保使用 `DataSourceProxy` 包装数据源
- 检查 `@GlobalTransactional` 注解是否正确使用

### 5. 全局锁获取失败

**现象：** 获取全局锁失败

**原因：** 并发冲突或锁表数据异常

**解决：** 
- 检查 `lock_table` 表数据
- 调整事务超时时间
- 优化业务逻辑减少锁冲突

### 6. 事务回滚失败

**现象：** 事务回滚失败

**原因：** 回滚逻辑执行异常

**解决：** 
- 检查回滚 SQL 是否正确
- 检查数据库连接是否正常
- 查看 Seata Server 日志

## 最佳实践

### 1. 版本管理
- 始终保持 Seata 版本与虚谷数据库版本兼容
- 定期检查 Seata 官方发布的更新

### 2. 配置管理
- 使用 Nacos 作为配置中心
- 为不同环境使用不同配置
- 敏感信息使用环境变量或加密存储

### 3. 性能优化
- 合理配置事务超时时间
- 使用异步提交提高性能
- 避免长事务
- 优化 SQL 减少锁冲突

### 4. 安全性
- 使用最小权限原则配置数据库用户
- 定期更换数据库密码
- 启用 SSL 加密连接

### 5. 监控与日志
- 启用 Seata 监控
- 配置日志级别
- 定期检查日志文件
- 监控全局事务状态

## 参考文档

详细的配置指南和故障排除请参考：
- [Seata 分布式事务虚谷数据库配置指南](references/seata-configuration.md)
- [Seata 官方文档](https://seata.apache.org/zh-cn/docs/overview/what-is-seata.html)
- [虚谷数据库官方文档](https://docs.xugudb.com/)