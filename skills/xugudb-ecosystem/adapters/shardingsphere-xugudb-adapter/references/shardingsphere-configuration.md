# ShardingSphere 虚谷数据库配置指南

## 概述

本文档提供 ShardingSphere-JDBC 适配虚谷数据库(XuguDB)的完整配置指南，包括依赖配置、分片策略配置、读写分离配置、数据脱敏配置等。

## 一、核心配置信息

### 1.1 JDBC 驱动类
```
com.xugu.cloudjdbc.Driver
```

### 1.2 连接 URL 格式
```
jdbc:xugu://<host>:<port>/<database>?compatiblemode=MYSQL
```

**参数说明：**
- `<host>`: 数据库服务器地址
- `<port>`: 数据库端口（默认5138）
- `<database>`: 数据库名（如SYSTEM）
- `compatiblemode`: 兼容模式（必须设置为MYSQL）

### 1.3 示例 URL
```
jdbc:xugu://127.0.0.1:5138/rdss0?compatiblemode=MYSQL
```

## 二、依赖配置

### 2.1 从源码编译安装

1. 从虚谷开放源代码仓库下载对应版本的 ShardingSphere 适配源码
2. 在项目根目录执行 `mvn clean install -DskipTests`
3. 环境要求：推荐使用 JDK 8 和 Maven 3.6.x

### 2.2 手动安装 JAR 包

如果使用示例项目 `xugu-shardingsphere-demo`，需要先将其提供的特定 JAR 包安装到本地仓库：

```shell
mvn install:install-file -Dfile=./lib/shardingsphere-common-4.1.1.jar -DgroupId=org.apache.shardingsphere -DartifactId=shardingsphere-common -Dversion=4.1.1 -Dpackaging=jar
mvn install:install-file -Dfile=./lib/shardingsphere-sql-parser-binder-4.1.1.jar -DgroupId=org.apache.shardingsphere -DartifactId=shardingsphere-sql-parser-binder -Dversion=4.1.1 -Dpackaging=jar
```

### 2.3 Maven 依赖

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

## 三、数据源配置

### 3.1 多数据源配置

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

## 四、分片策略配置

### 4.1 行表达式分片策略（Inline）

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

### 4.2 标准分片策略（Standard）

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

**自定义算法类示例：**

```java
import org.apache.shardingsphere.api.sharding.standard.PreciseShardingAlgorithm;
import org.apache.shardingsphere.api.sharding.standard.PreciseShardingValue;
import java.util.Collection;

public class UserTableStandardPreciseAlgorithm implements PreciseShardingAlgorithm<String> {
    
    @Override
    public String doSharding(Collection<String> availableTargetNames, PreciseShardingValue<String> shardingValue) {
        // 实现精确分片逻辑
        String value = shardingValue.getValue();
        // 根据分片键值计算目标表
        return "user_" + value.substring(0, 4);
    }
}
```

### 4.3 强制分片策略（Hint）

通过编程方式强制路由到指定数据源或表：

```java
import org.apache.shardingsphere.api.hint.HintManager;

// 强制路由到指定数据源
try (HintManager hintManager = HintManager.getInstance()) {
    hintManager.setDatabaseShardingValue(0); // 强制路由到 ds0
    // 执行查询
    List<Order> orders = orderMapper.selectAll();
}
```

### 4.4 广播表与绑定表

```yaml
spring:
  shardingsphere:
    sharding:
      broadcast-tables:
        - dict
      binding-tables:
        - orders, order_item
```

**广播表：** 每个库都存完整数据，适合字典表
**绑定表：** 分片规则相同的表关联查询时可优化性能

## 五、读写分离配置

### 5.1 主从数据源配置

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

### 5.2 主从规则配置

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

### 5.3 读写分离与分片结合

```yaml
spring:
  shardingsphere:
    sharding:
      tables:
        orders:
          actual-data-nodes: ms0.orders_$->{1..5}
          table-strategy:
            inline:
              shardingColumn: id
              algorithmExpression: orders_$->{id % 5 + 1}
      master-slave-rules:
        ms0:
          master-data-source-name: master
          slave-data-source-names: slave0, slave1
```

## 六、数据脱敏配置

### 6.1 加密规则配置

```yaml
spring:
  shardingsphere:
    encryptRule:
      tables:
        user:
          columns:
            pwd:
              cipherColumn: pwd_cipher
              encryptor: my_aes
      encryptors:
        my_aes:
          type: aes
          props:
            aes.key.value: 123123pwd
        my_md5:
          type: md5
```

### 6.2 加密器类型

| 加密器类型 | 说明 | 配置参数 |
|-----------|------|---------|
| `aes` | AES 加密 | `aes.key.value`: 加密密钥 |
| `md5` | MD5 摘要 | 无 |
| `rc4` | RC4 加密 | `rc4.key.value`: 加密密钥 |

## 七、分布式主键配置

### 7.1 雪花算法

```yaml
spring:
  shardingsphere:
    sharding:
      tables:
        orders:
          keyGenerator:
            column: id
            type: SNOWFLAKE
            props:
              worker.id: 1
```

### 7.2 UUID 算法

```yaml
spring:
  shardingsphere:
    sharding:
      tables:
        orders:
          keyGenerator:
            column: id
            type: UUID
```

### 7.3 自定义主键算法

```java
import org.apache.shardingsphere.spi.keygen.ShardingKeyGenerator;
import java.util.Properties;

public class CustomKeyGenerator implements ShardingKeyGenerator {
    
    @Override
    public Comparable<?> generateKey() {
        // 实现自定义主键生成逻辑
        return System.currentTimeMillis();
    }
    
    @Override
    public String getType() {
        return "CUSTOM";
    }
    
    @Override
    public Properties getProperties() {
        return new Properties();
    }
    
    @Override
    public void setProperties(Properties properties) {
        // 设置属性
    }
}
```

## 八、常见问题排查

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

## 九、最佳实践

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

## 十、参考资源

### 10.1 官方文档
- [ShardingSphere 官方文档](https://shardingsphere.apache.org/document/current/cn/overview/)
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [虚谷数据库 ShardingSphere 示例](https://help.xugudb.com/content/ecosystem/orm/java/shardingsphere)

### 10.2 示例项目
- [虚谷 ShardingSphere 示例](https://gitee.com/XuguDB/xugu-shardingsphere-demo)
- [ShardingSphere 示例项目](https://github.com/apache/shardingsphere-example)

### 10.3 社区资源
- [虚谷数据库社区](https://www.xugudb.com/)
- [ShardingSphere 社区](https://shardingsphere.apache.org/community/cn/contribute/)