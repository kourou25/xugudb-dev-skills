# Seata 分布式事务虚谷数据库配置指南

## 概述

本文档提供 Seata 分布式事务适配虚谷数据库(XuguDB)的完整配置指南，包括 Seata Server 配置、客户端配置、数据源代理配置、事务模式配置等。

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
- `current_schema`: 当前模式名（如seata）
- `CHAR_SET`: 字符集（推荐UTF8）
- `COMPATIBLE_MODE`: 兼容模式（MYSQL/ORACLE/POSTGRESQL）

### 1.3 示例 URL
```
jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=seata&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

## 二、Seata Server 配置

### 2.1 数据库初始化

首先在虚谷数据库中创建 Seata 所需的表结构：

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

### 2.2 Seata Server 配置文件

#### application.yml

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

### 2.3 Seata Server 启动

```bash
# 启动 Seata Server
sh seata-server.sh -p 7091 -h 127.0.0.1
```

## 三、客户端配置

### 3.1 Maven 依赖

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

### 3.2 客户端配置文件

#### application.yml

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

## 四、数据源代理配置

### 4.1 AT 模式数据源代理

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

### 4.2 使用 Seata 自动代理

在 `application.yml` 中配置自动代理：

```yaml
seata:
  enabled: true
  auto-proxy: true
```

## 五、事务模式配置

### 5.1 AT 模式（推荐）

AT 模式是一种无侵入的分布式事务解决方案，用户只需关注自己的业务 SQL。

#### 使用示例

```java
import io.seata.spring.annotation.GlobalTransactional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BusinessService {

    @GlobalTransactional(name = "create-order", timeoutMills = 60000)
    public void createOrder(Order order) {
        // 1. 创建订单
        orderMapper.insert(order);
        
        // 2. 扣减库存
        storageService.deduct(order.getProductId(), order.getCount());
        
        // 3. 扣减账户余额
        accountService.deduct(order.getUserId(), order.getTotalAmount());
    }
}
```

### 5.2 TCC 模式

TCC 模式需要用户实现 Try、Confirm、Cancel 三个接口。

#### TCC 接口定义

```java
import io.seata.rm.tcc.api.BusinessActionContext;
import io.seata.rm.tcc.api.BusinessActionContextParameter;
import io.seata.rm.tcc.api.LocalTCC;
import io.seata.rm.tcc.api.TwoPhaseBusinessAction;

@LocalTCC
public interface AccountService {

    @TwoPhaseBusinessAction(name = "deduct", commitMethod = "commit", rollbackMethod = "rollback")
    boolean deduct(BusinessActionContext context,
                   @BusinessActionContextParameter(paramName = "userId") String userId,
                   @BusinessActionContextParameter(paramName = "amount") BigDecimal amount);

    boolean commit(BusinessActionContext context);

    boolean rollback(BusinessActionContext context);
}
```

### 5.3 Saga 模式

Saga 模式适用于长事务场景，通过事件驱动实现事务补偿。

#### 状态机配置

```json
{
  "Name": "deduct",
  "Version": "1.0.0",
  "StartState": "Deduct",
  "States": {
    "Deduct": {
      "Type": "ServiceTask",
      "ServiceName": "accountService",
      "ServiceMethod": "deduct",
      "CompensateState": "CompensateDeduct",
      "Next": "Success"
    },
    "CompensateDeduct": {
      "Type": "ServiceTask",
      "ServiceName": "accountService",
      "ServiceMethod": "compensateDeduct",
      "Next": "Success"
    },
    "Success": {
      "Type": "Succeed"
    }
  }
}
```

## 六、Nacos 配置中心

### 6.1 Seata 配置推送到 Nacos

```bash
# 使用 Seata 配置脚本将配置推送到 Nacos
sh nacos-config.sh -h 127.0.0.1 -p 8848 -g SEATA_GROUP -t namespace
```

### 6.2 关键配置项

```properties
# 数据库类型
store.db.dbType=mysql
# 数据库驱动
store.db.driverClassName=com.xugu.cloudjdbc.Driver
# 数据库URL
store.db.url=jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=seata&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
# 数据库用户名
store.db.user=SYSDBA
# 数据库密码
store.db.password=SYSDBA
```

## 七、常见问题排查

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

## 八、最佳实践

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

## 九、参考资源

### 9.1 官方文档
- [Seata 官方文档](https://seata.apache.org/zh-cn/docs/overview/what-is-seata.html)
- [虚谷数据库官方文档](https://docs.xugudb.com/)

### 9.2 示例项目
- [Seata 示例项目](https://github.com/apache/incubator-seata-samples)
- [虚谷数据库示例](https://gitee.com/XuguDB)

### 9.3 社区资源
- [虚谷数据库社区](https://www.xugudb.com/)
- [Seata 社区](https://seata.apache.org/zh-cn/community/index.html)