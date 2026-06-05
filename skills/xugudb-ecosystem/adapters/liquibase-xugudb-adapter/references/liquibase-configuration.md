# Liquibase 数据库迁移虚谷数据库配置指南

## 概述

本文档提供 Liquibase 数据库迁移工具适配虚谷数据库(XuguDB)的完整配置指南，包括依赖配置、变更日志编写、Spring Boot 集成、多环境配置等。

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

### 2.2 纯 Maven 项目依赖

```xml
<!-- Liquibase 核心 -->
<dependency>
    <groupId>org.liquibase</groupId>
    <artifactId>liquibase-core</artifactId>
    <version>4.25.0</version>
</dependency>

<!-- 虚谷JDBC驱动 -->
<dependency>
    <groupId>com.xugudb</groupId>
    <artifactId>xugu-jdbc</artifactId>
    <version>12.3.4</version>
</dependency>
```

## 三、变更日志配置

### 3.1 目录结构

```
src/main/resources/
└── db/
    └── changelog/
        ├── db.changelog-master.xml
        ├── V1__create_tables.xml
        ├── V2__create_indexes.xml
        └── V3__insert_initial_data.xml
```

### 3.2 主变更日志文件

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

### 3.3 变更集文件示例

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

### 4.2 关键配置项说明

| 配置项 | 说明 | 推荐值 |
|--------|------|--------|
| `spring.liquibase.enabled` | 是否启用 Liquibase | true |
| `spring.liquibase.change-log` | 主变更日志文件路径 | classpath:db/changelog/db.changelog-master.xml |
| `spring.liquibase.default-schema` | 默认 Schema | RY |
| `spring.liquibase.contexts` | 上下文（环境区分） | dev |
| `spring.liquibase.drop-first` | 是否先清除数据库 | false |
| `spring.liquibase.database-change-log-table` | 变更日志表名 | DATABASECHANGELOG |

## 五、多环境配置

### 5.1 使用上下文区分环境

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

### 5.2 不同环境的配置文件

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

## 六、高级配置

### 6.1 使用 SQL 变更集

```xml
<changeSet id="3" author="developer">
    <sql>
        CREATE OR REPLACE TRIGGER users_update_trigger
        BEFORE UPDATE ON users
        FOR EACH ROW
        BEGIN
            :NEW.updated_time := CURRENT_TIMESTAMP;
        END;
    </sql>
</changeSet>
```

### 6.2 使用自定义 Java 迁移

```java
package db.migration;

import liquibase.change.custom.CustomTaskChange;
import liquibase.database.Database;
import liquibase.exception.CustomChangeException;
import liquibase.exception.SetupException;
import liquibase.exception.ValidationErrors;
import liquibase.resource.ResourceAccessor;

public class V4__MigrateUserData implements CustomTaskChange {
    
    @Override
    public void execute(Database database) throws CustomChangeException {
        // 自定义迁移逻辑
        System.out.println("执行自定义迁移...");
    }
    
    @Override
    public String getConfirmationMessage() {
        return "自定义迁移完成";
    }
    
    @Override
    public void setUp() throws SetupException {
        // 初始化设置
    }
    
    @Override
    public void setFileOpener(ResourceAccessor resourceAccessor) {
        // 设置资源访问器
    }
    
    @Override
    public ValidationErrors validate(Database database) {
        return null;
    }
}
```

### 6.3 使用预条件

```xml
<changeSet id="5" author="developer">
    <preConditions onFail="MARK_RAN">
        <not>
            <tableExists tableName="users"/>
        </not>
    </preConditions>
    
    <createTable tableName="users">
        <column name="id" type="bigint">
            <constraints primaryKey="true" nullable="false"/>
        </column>
    </createTable>
</changeSet>
```

## 七、命令行操作

### 7.1 Maven 插件配置

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.liquibase</groupId>
            <artifactId>liquibase-maven-plugin</artifactId>
            <version>4.25.0</version>
            <configuration>
                <url>jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL</url>
                <username>SYSDBA</username>
                <password>SYSDBA</password>
                <changeLogFile>src/main/resources/db/changelog/db.changelog-master.xml</changeLogFile>
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
mvn liquibase:update

# 查看迁移状态
mvn liquibase:status

# 生成变更日志
mvn liquibase:generateChangeLog

# 回滚到指定版本
mvn liquibase:rollback -Dliquibase.rollbackCount=1

# 标记当前版本
mvn liquibase:tag -Dliquibase.tag=version1.0

# 验证变更日志
mvn liquibase:validate

# 清除数据库（慎用）
mvn liquibase:dropAll
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

## 九、最佳实践

### 1. 版本管理
- 使用语义化版本号（如 V1.0.0__description.xml）
- 每个版本只包含一个逻辑变更
- 保持变更集的原子性

### 2. 变更集编写
- 使用事务包装 DDL 语句
- 添加详细的注释
- 使用预条件确保幂等性

### 3. 测试策略
- 在测试环境先执行迁移
- 使用 Testcontainers 进行集成测试
- 定期备份数据库

### 4. 生产部署
- 在低峰期执行迁移
- 准备回滚方案
- 监控迁移过程

### 5. 团队协作
- 统一变更日志命名规范
- 使用版本控制管理变更日志
- 定期同步数据库结构

## 十、参考资源

### 10.1 官方文档
- [Liquibase 官方文档](https://docs.liquibase.com/)
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [Spring Boot Liquibase 文档](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#howto.data-initialization.migration-tool.liquibase)

### 10.2 示例项目
- [虚谷 Liquibase 示例](https://gitee.com/XuguDB/xugu-liquibase-demo)
- [Spring Boot Liquibase 示例](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-samples)

### 10.3 社区资源
- [虚谷数据库社区](https://www.xugudb.com/)
- [Liquibase 社区](https://www.liquibase.org/community)