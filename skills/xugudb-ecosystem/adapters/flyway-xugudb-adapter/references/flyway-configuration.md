# Flyway 数据库迁移虚谷数据库配置指南

## 概述

本文档提供 Flyway 数据库迁移工具适配虚谷数据库(XuguDB)的完整配置指南，包括依赖配置、迁移脚本编写、Spring Boot 集成、多环境配置等。

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

## 二、Maven 依赖配置

### 2.1 Spring Boot 项目依赖

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

### 2.2 纯 Maven 项目依赖

```xml
<!-- Flyway 核心 -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
    <version>9.22.3</version>
</dependency>

<!-- 虚谷JDBC驱动 -->
<dependency>
    <groupId>com.xugudb</groupId>
    <artifactId>xugu-jdbc</artifactId>
    <version>12.3.4</version>
</dependency>
```

## 三、迁移脚本配置

### 3.1 脚本目录结构

```
src/main/resources/
└── db/
    └── migration/
        ├── V1__create_tables.sql
        ├── V2__create_indexes.sql
        ├── V3__insert_initial_data.sql
        └── ...
```

### 3.2 脚本命名规则

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

### 3.3 虚谷数据库 SQL 脚本示例

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

## 四、Spring Boot 配置

### 4.1 application.yml 配置

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

### 4.2 关键配置项说明

| 配置项 | 说明 | 推荐值 |
|--------|------|--------|
| `spring.flyway.enabled` | 是否启用 Flyway | true |
| `spring.flyway.locations` | 迁移脚本位置 | classpath:db/migration |
| `spring.flyway.table` | 迁移历史表名 | flyway_schema_history |
| `spring.flyway.baseline-on-migrate` | 是否基线迁移 | true（适用于已有数据库） |
| `spring.flyway.validate-on-migrate` | 是否验证脚本 | true |
| `spring.flyway.clean-disabled` | 是否禁用清理 | true（生产环境） |
| `spring.flyway.encoding` | 脚本编码 | UTF-8 |

## 五、多环境配置

### 5.1 不同环境的配置文件

```
src/main/resources/
├── application.yml
├── application-dev.yml
├── application-test.yml
└── application-prod.yml
```

### 5.2 开发环境配置

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

### 5.3 生产环境配置

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

## 六、高级配置

### 6.1 占位符配置

在迁移脚本中使用占位符：

```sql
-- V2__create_schema.sql
CREATE SCHEMA IF NOT EXISTS ${schema};

-- V3__create_table_in_schema.sql
CREATE TABLE ${schema}.users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) NOT NULL
);
```

配置文件中定义占位符：

```yaml
spring:
  flyway:
    placeholder-replacement: true
    placeholders:
      schema: RY
      table_prefix: t_
```

### 6.2 基于 Java 的迁移

对于复杂的迁移逻辑，可以使用 Java 代码：

```java
package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.jdbc.core.JdbcTemplate;

public class V4__MigrateUserData extends BaseJavaMigration {
    
    @Override
    public void migrate(Context context) throws Exception {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(context.getConnection());
        
        // 复杂的数据迁移逻辑
        jdbcTemplate.execute("INSERT INTO new_table SELECT * FROM old_table");
        
        // 数据转换
        jdbcTemplate.update("UPDATE users SET email = LOWER(email)");
    }
}
```

### 6.3 回调机制

Flyway 支持在迁移前后执行回调：

```java
package db.migration;

import org.flywaydb.core.api.callback.Callback;
import org.flywaydb.core.api.callback.Event;
import org.flywaydb.core.api.callback.Context;

public class BeforeMigrateCallback implements Callback {
    
    @Override
    public boolean supports(Event event, Context context) {
        return event == Event.BEFORE_MIGRATE;
    }
    
    @Override
    public boolean canHandleInTransaction(Event event, Context context) {
        return true;
    }
    
    @Override
    public void handle(Event event, Context context) {
        // 迁移前的准备工作
        System.out.println("开始数据库迁移...");
    }
    
    @Override
    public String getCallbackName() {
        return "BeforeMigrateCallback";
    }
}
```

## 七、命令行操作

### 7.1 Maven 插件配置

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-maven-plugin</artifactId>
            <version>9.22.3</version>
            <configuration>
                <url>jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL</url>
                <user>SYSDBA</user>
                <password>SYSDBA</password>
                <locations>
                    <location>classpath:db/migration</location>
                </locations>
            </configuration>
            <dependencies>
                <dependency>
                    <groupId>com.xugudb</groupId>
                    <artifactId>xugu-jdbc</artifactId>
                    <version>12.3.4</version>
                </dependency>
            </dependencies>
        </plugin>
    </plugins>
</build>
```

### 7.2 常用 Maven 命令

```bash
# 执行迁移
mvn flyway:migrate

# 查看迁移状态
mvn flyway:info

# 验证迁移脚本
mvn flyway:validate

# 修复迁移历史表
mvn flyway:repair

# 清理数据库（慎用）
mvn flyway:clean
```

## 八、常见问题排查

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

## 九、最佳实践

### 1. 版本管理
- 使用语义化版本号（如 V1.0.0__description.sql）
- 每个版本只包含一个逻辑变更
- 保持脚本的原子性

### 2. 脚本编写
- 使用事务包装 DDL 语句
- 添加详细的注释
- 使用占位符提高可维护性

### 3. 测试策略
- 在测试环境先执行迁移
- 使用 Testcontainers 进行集成测试
- 定期备份数据库

### 4. 生产部署
- 在低峰期执行迁移
- 准备回滚方案
- 监控迁移过程

### 5. 团队协作
- 统一脚本命名规范
- 使用版本控制管理脚本
- 定期同步数据库结构

## 十、参考资源

### 10.1 官方文档
- [Flyway 官方文档](https://flywaydb.org/documentation/)
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [Spring Boot Flyway 文档](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#howto.data-initialization.migration-tool.flyway)

### 10.2 示例项目
- [虚谷 Flyway 示例](https://gitee.com/XuguDB/xugu-flyway-demo)
- [Spring Boot Flyway 示例](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-samples)

### 10.3 社区资源
- [虚谷数据库社区](https://www.xugudb.com/)
- [Flyway 社区](https://flywaydb.org/community)