---
name: jooq-xugudb-adapter
description: jOOQ（Java Object Oriented Query）框架适配虚谷数据库（XuguDB）的完整指南。当用户需要将基于 jOOQ 的 Java 项目配置或适配到虚谷数据库时使用此技能，包括依赖配置、代码生成配置、数据库连接、查询构建、事务管理等。适用于从 MySQL/PostgreSQL 迁移或新建虚谷数据库项目。
---

# jOOQ 虚谷数据库适配指南

## 概述

本技能提供 jOOQ 框架适配虚谷数据库（XuguDB）的完整配置指南。jOOQ 是一个轻量级的 Java ORM 框架，通过代码生成的方式将数据库表映射为 Java 类，并提供类型安全的 SQL 构建 API。

**适用场景：**
- 从 MySQL/PostgreSQL 迁移现有 jOOQ 项目到虚谷数据库
- 新建基于 jOOQ 的虚谷数据库项目
- 需要类型安全的 SQL 构建能力
- 需要代码生成功能简化数据库操作

**核心特性：**
- 类型安全的 SQL 构建 API
- 自动代码生成，将数据库表映射为 Java 类
- 支持复杂的多表关联查询
- 与 Spring Boot 无缝集成
- 支持事务管理和批量操作

## 快速开始

### 1. 添加依赖

**Maven 配置：**

```xml
<!-- jOOQ 核心库 -->
<dependency>
    <groupId>org.jooq</groupId>
    <artifactId>jooq</artifactId>
    <version>3.18.7</version>
</dependency>

<!-- 虚谷数据库 JDBC 驱动 -->
<dependency>
    <groupId>com.xugudb</groupId>
    <artifactId>xugu-jdbc</artifactId>
    <version>12.3.4</version>
</dependency>

<!-- 数据库连接池（推荐） -->
<dependency>
    <groupId>com.zaxxer</groupId>
    <artifactId>HikariCP</artifactId>
    <version>5.0.1</version>
</dependency>
```

**Gradle 配置：**

```gradle
implementation 'org.jooq:jooq:3.18.7'
implementation 'com.xugudb:xugu-jdbc:12.3.4'
implementation 'com.zaxxer:HikariCP:5.0.1'
```

### 2. 配置数据库连接

**连接字符串格式：**

```
jdbc:xugu://host:port/database?current_schema=schema&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

**连接配置示例：**

```java
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.jooq.SQLDialect;
import java.sql.DriverManager;
import java.sql.Connection;

// 创建数据库连接
String url = "jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL";
String username = "SYSDBA";
String password = "SYSDBA";

try (Connection connection = DriverManager.getConnection(url, username, password)) {
    // 创建 jOOQ DSLContext，使用 MYSQL 方言
    DSLContext dsl = DSL.using(connection, SQLDialect.MYSQL);
    
    // 使用 jOOQ 执行查询
    var result = dsl.select()
                    .from("users")
                    .fetch();
}
```

### 3. 配置代码生成

**Maven 插件配置：**

```xml
<build>
    <plugins>
        <!-- jOOQ 代码生成插件 -->
        <plugin>
            <groupId>org.jooq</groupId>
            <artifactId>jooq-codegen-maven</artifactId>
            <version>3.18.7</version>
            
            <executions>
                <execution>
                    <id>generate-jooq-sources</id>
                    <phase>generate-sources</phase>
                    <goals>
                        <goal>generate</goal>
                    </goals>
                </execution>
            </executions>
            
            <configuration>
                <!-- JDBC 连接配置 -->
                <jdbc>
                    <driver>com.xugu.cloudjdbc.Driver</driver>
                    <url>jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL</url>
                    <user>SYSDBA</user>
                    <password>SYSDBA</password>
                </jdbc>
                
                <!-- 代码生成器配置 -->
                <generator>
                    <database>
                        <!-- 使用 MySQL 方言 -->
                        <name>org.jooq.meta.mysql.MYSQLDatabase</name>
                        
                        <!-- 输入模式 -->
                        <inputSchema>PUBLIC</inputSchema>
                        
                        <!-- 包含的表 -->
                        <includes>.*</includes>
                        
                        <!-- 排除的表 -->
                        <excludes>flyway_schema_history|schema_version</excludes>
                    </database>
                    
                    <generate>
                        <!-- 生成 Java 8 时间类型 -->
                        <javaTimeTypes>true</javaTimeTypes>
                        
                        <!-- 生成表注释 -->
                        <comments>true</comments>
                        
                        <!-- 生成列注释 -->
                        <commentsOnColumns>true</commentsOnColumns>
                    </generate>
                    
                    <target>
                        <!-- 生成代码的包名 -->
                        <packageName>com.example.jooq</packageName>
                        
                        <!-- 生成代码的目录 -->
                        <directory>src/main/java</directory>
                        
                        <!-- 清理目标目录 -->
                        <clean>true</clean>
                    </target>
                </generator>
            </configuration>
        </plugin>
    </plugins>
</build>
```

**执行代码生成：**

```bash
mvn clean generate-sources
```

## 核心功能

### 1. 基础 CRUD 操作

**查询所有记录：**

```java
import static com.example.jooq.Tables.USERS;
import com.example.jooq.tables.records.UsersRecord;
import java.util.List;

public List<UsersRecord> findAll() {
    return dsl.selectFrom(USERS)
              .fetch();
}
```

**条件查询：**

```java
public Optional<UsersRecord> findById(Long id) {
    return dsl.selectFrom(USERS)
              .where(USERS.ID.eq(id))
              .fetchOptional();
}

public List<UsersRecord> findByNameLike(String name) {
    return dsl.selectFrom(USERS)
              .where(USERS.NAME.like("%" + name + "%"))
              .fetch();
}
```

**插入记录：**

```java
public UsersRecord insert(String name, String email) {
    return dsl.insertInto(USERS)
              .set(USERS.NAME, name)
              .set(USERS.EMAIL, email)
              .returning(USERS.ID, USERS.NAME, USERS.EMAIL)
              .fetchOne();
}
```

**更新记录：**

```java
public int update(Long id, String name, String email) {
    return dsl.update(USERS)
              .set(USERS.NAME, name)
              .set(USERS.EMAIL, email)
              .where(USERS.ID.eq(id))
              .execute();
}
```

**删除记录：**

```java
public int delete(Long id) {
    return dsl.deleteFrom(USERS)
              .where(USERS.ID.eq(id))
              .execute();
}
```

### 2. 多表关联查询

**内连接查询：**

```java
import static com.example.jooq.Tables.USERS;
import static com.example.jooq.Tables.ORDERS;
import static com.example.jooq.Tables.PRODUCTS;

var result = dsl.select(
                    USERS.NAME,
                    ORDERS.ORDER_DATE,
                    PRODUCTS.NAME.as("product_name")
                )
                .from(USERS)
                .join(ORDERS).on(USERS.ID.eq(ORDERS.USER_ID))
                .join(PRODUCTS).on(ORDERS.PRODUCT_ID.eq(PRODUCTS.ID))
                .where(USERS.ACTIVE.eq(true))
                .fetch();
```

**左连接查询：**

```java
var leftJoinResult = dsl.select(
                            USERS.NAME,
                            DSL.count(ORDERS.ID).as("order_count")
                        )
                        .from(USERS)
                        .leftOuterJoin(ORDERS).on(USERS.ID.eq(ORDERS.USER_ID))
                        .groupBy(USERS.NAME)
                        .fetch();
```

### 3. 聚合查询

```java
var aggregation = dsl.select(
                        USERS.DEPT_ID,
                        DSL.count().as("user_count"),
                        DSL.avg(USERS.SALARY).as("avg_salary"),
                        DSL.max(USERS.SALARY).as("max_salary"),
                        DSL.min(USERS.SALARY).as("min_salary")
                    )
                    .from(USERS)
                    .groupBy(USERS.DEPT_ID)
                    .having(DSL.count().gt(5))
                    .orderBy(USERS.DEPT_ID)
                    .fetch();
```

### 4. 子查询

```java
// 子查询示例
var subquery = dsl.select(ORDERS.USER_ID)
                  .from(ORDERS)
                  .where(ORDERS.STATUS.eq("COMPLETED"));

var result = dsl.selectFrom(USERS)
                .where(USERS.ID.in(subquery))
                .fetch();
```

### 5. 分页查询

```java
public List<UsersRecord> findWithPagination(int page, int size) {
    return dsl.selectFrom(USERS)
              .orderBy(USERS.ID.asc())
              .limit(size)
              .offset((page - 1) * size)
              .fetch();
}
```

## Spring Boot 集成

### 1. 配置文件

**application.yml：**

```yaml
spring:
  datasource:
    url: jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: SYSDBA
    password: SYSDBA
    driver-class-name: com.xugu.cloudjdbc.Driver
    
    # HikariCP 连接池配置
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      connection-timeout: 20000

# jOOQ 配置
jooq:
  sql-dialect: MYSQL
```

### 2. 自动配置类

```java
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.jooq.SQLDialect;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import javax.sql.DataSource;

@Configuration
public class JooqConfiguration {
    
    @Bean
    public DSLContext dslContext(DataSource dataSource) {
        return DSL.using(dataSource, SQLDialect.MYSQL);
    }
}
```

### 3. Repository 示例

```java
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import static com.example.jooq.Tables.USERS;
import com.example.jooq.tables.records.UsersRecord;
import java.util.List;
import java.util.Optional;

@Repository
public class UserRepository {
    
    private final DSLContext dsl;
    
    public UserRepository(DSLContext dsl) {
        this.dsl = dsl;
    }
    
    public List<UsersRecord> findAll() {
        return dsl.selectFrom(USERS)
                  .fetch();
    }
    
    public Optional<UsersRecord> findById(Long id) {
        return dsl.selectFrom(USERS)
                  .where(USERS.ID.eq(id))
                  .fetchOptional();
    }
    
    public UsersRecord insert(String name, String email) {
        return dsl.insertInto(USERS)
                  .set(USERS.NAME, name)
                  .set(USERS.EMAIL, email)
                  .returning(USERS.ID, USERS.NAME, USERS.EMAIL)
                  .fetchOne();
    }
    
    public int update(Long id, String name, String email) {
        return dsl.update(USERS)
                  .set(USERS.NAME, name)
                  .set(USERS.EMAIL, email)
                  .where(USERS.ID.eq(id))
                  .execute();
    }
    
    public int delete(Long id) {
        return dsl.deleteFrom(USERS)
                  .where(USERS.ID.eq(id))
                  .execute();
    }
}
```

## 事务管理

### 1. 编程式事务

```java
import org.jooq.DSLContext;
import org.jooq.impl.DSL;

public class TransactionExample {
    
    private final DSLContext dsl;
    
    public TransactionExample(DSLContext dsl) {
        this.dsl = dsl;
    }
    
    public void executeInTransaction() {
        dsl.transaction(configuration -> {
            DSLContext txDsl = DSL.using(configuration);
            
            // 在事务中执行多个操作
            txDsl.insertInto(USERS)
                 .set(USERS.NAME, "张三")
                 .set(USERS.EMAIL, "zhangsan@example.com")
                 .execute();
            
            txDsl.update(USERS)
                 .set(USERS.ACTIVE, true)
                 .where(USERS.NAME.eq("张三"))
                 .execute();
        });
    }
    
    // 带返回值的事务
    public UsersRecord insertAndReturn() {
        return dsl.transactionResult(configuration -> {
            DSLContext txDsl = DSL.using(configuration);
            
            return txDsl.insertInto(USERS)
                        .set(USERS.NAME, "李四")
                        .set(USERS.EMAIL, "lisi@example.com")
                        .returning(USERS.ID, USERS.NAME, USERS.EMAIL)
                        .fetchOne();
        });
    }
}
```

### 2. Spring 声明式事务

```java
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.jooq.DSLContext;

@Service
public class UserService {
    
    private final DSLContext dsl;
    
    public UserService(DSLContext dsl) {
        this.dsl = dsl;
    }
    
    @Transactional
    public void createUserWithOrders(UserDto userDto, List<OrderDto> orders) {
        // 创建用户
        UsersRecord user = dsl.insertInto(USERS)
                              .set(USERS.NAME, userDto.getName())
                              .set(USERS.EMAIL, userDto.getEmail())
                              .returning(USERS.ID, USERS.NAME, USERS.EMAIL)
                              .fetchOne();
        
        // 创建订单
        for (OrderDto orderDto : orders) {
            dsl.insertInto(ORDERS)
               .set(ORDERS.USER_ID, user.getId())
               .set(ORDERS.PRODUCT_ID, orderDto.getProductId())
               .set(ORDERS.AMOUNT, orderDto.getAmount())
               .execute();
        }
    }
    
    @Transactional(readOnly = true)
    public List<UsersRecord> findAllUsers() {
        return dsl.selectFrom(USERS)
                  .fetch();
    }
}
```

## 批量操作

### 1. 批量插入

```java
import org.jooq.impl.DSL;
import java.util.Arrays;
import java.util.List;

public void batchInsert(List<UserDto> users) {
    dsl.batch(
        dsl.insertInto(USERS, USERS.NAME, USERS.EMAIL)
           .values((String) null, (String) null)
    ).bind(users.stream()
                .map(u -> new Object[] { u.getName(), u.getEmail() })
                .toArray(Object[][]::new))
     .execute();
}

// 使用 loadInto 批量插入（适用于大量数据）
public void bulkInsert(List<UserDto> users) {
    dsl.loadInto(USERS)
       .onDuplicateKeyIgnore()
       .loadArrays(users.stream()
                        .map(u -> new Object[] { u.getName(), u.getEmail() })
                        .toArray(Object[][]::new))
       .fields(USERS.NAME, USERS.EMAIL)
       .execute();
}
```

### 2. 批量更新

```java
public void batchUpdate(List<UserDto> users) {
    dsl.batch(
        dsl.update(USERS)
           .set(USERS.NAME, (String) null)
           .set(USERS.EMAIL, (String) null)
           .where(USERS.ID.eq((Long) null))
    ).bind(users.stream()
                .map(u -> new Object[] { u.getName(), u.getEmail(), u.getId() })
                .toArray(Object[][]::new))
     .execute();
}
```

## 性能优化

### 1. 索引优化

```sql
-- 为常用查询字段创建索引
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 复合索引
CREATE INDEX idx_users_dept_active ON users(dept_id, active);
```

### 2. 查询优化

```java
// 使用 fetchLazy 进行流式处理（适用于大数据量）
public void processLargeData() {
    try (Cursor<UsersRecord> cursor = dsl.selectFrom(USERS)
                                         .fetchLazy()) {
        while (cursor.hasNext()) {
            UsersRecord record = cursor.fetchOne();
            // 处理每条记录
            processRecord(record);
        }
    }
}

// 使用 fetchSize 控制每次获取的记录数
public List<UsersRecord> fetchWithSize(int fetchSize) {
    return dsl.selectFrom(USERS)
              .fetchSize(fetchSize)
              .fetch();
}
```

### 3. 连接池优化

```java
// HikariCP 连接池优化配置
HikariConfig config = new HikariConfig();
config.setMaximumPoolSize(20);           // 最大连接数
config.setMinimumIdle(5);               // 最小空闲连接数
config.setIdleTimeout(300000);          // 空闲超时时间（5分钟）
config.setConnectionTimeout(20000);     // 连接超时时间（20秒）
config.setMaxLifetime(1800000);         // 连接最大生命周期（30分钟）
config.setLeakDetectionThreshold(60000); // 泄漏检测阈值（1分钟）
```

## 测试配置

### 1. 单元测试

```java
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.jooq.SQLDialect;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.sql.DriverManager;
import java.sql.Connection;

class UserRepositoryTest {
    
    private DSLContext dsl;
    private UserRepository repository;
    
    @BeforeEach
    void setUp() throws Exception {
        // 使用测试数据库连接
        String url = "jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL";
        Connection connection = DriverManager.getConnection(url, "SYSDBA", "SYSDBA");
        dsl = DSL.using(connection, SQLDialect.MYSQL);
        repository = new UserRepository(dsl);
    }
    
    @Test
    void testFindAll() {
        var users = repository.findAll();
        assertNotNull(users);
    }
    
    @Test
    void testInsert() {
        var user = repository.insert("测试用户", "test@example.com");
        assertNotNull(user);
        assertEquals("测试用户", user.getName());
    }
}
```

### 2. 集成测试（Spring Boot）

```java
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserRepositoryIntegrationTest {
    
    @Autowired
    private UserRepository repository;
    
    @Test
    void testFindById() {
        var user = repository.findById(1L);
        assertTrue(user.isPresent());
    }
}
```

## 常见问题与解决方案

### 1. 方言不匹配

**问题**：jOOQ 生成的 SQL 语法与虚谷数据库不兼容。

**解决方案**：
- 使用 `SQLDialect.MYSQL` 作为方言
- 确保虚谷数据库连接字符串中包含 `COMPATIBLE_MODE=MYSQL`

### 2. 数据类型映射

**问题**：某些数据类型映射不正确。

**解决方案**：
- 在代码生成配置中使用 `forcedTypes` 进行类型转换
- 检查虚谷数据库的数据类型文档

### 3. 性能问题

**问题**：查询性能不佳。

**解决方案**：
- 为常用查询字段创建索引
- 使用连接池并优化连接池参数
- 使用 `fetchLazy` 进行流式处理大数据量
- 避免 N+1 查询问题

### 4. 事务问题

**问题**：事务不生效或行为异常。

**解决方案**：
- 确保使用正确的事务管理方式（编程式或声明式）
- 检查数据库连接的自动提交设置
- 使用 Spring 的 `@Transactional` 注解管理事务

## 最佳实践

1. **使用代码生成**：充分利用 jOOQ 的代码生成器，获得类型安全的 SQL 构建能力
2. **连接池管理**：始终使用连接池管理数据库连接
3. **事务管理**：对于多步操作，使用事务确保数据一致性
4. **性能优化**：为常用查询创建索引，使用批量操作减少数据库往返
5. **测试覆盖**：编写单元测试和集成测试，确保代码质量
6. **日志配置**：在开发环境开启 SQL 日志，便于调试
7. **版本管理**：使用数据库迁移工具（如 Flyway）管理 schema 变更

## 相关资源

- [jOOQ 官方文档](https://www.jooq.org/doc/latest/)
- [jOOQ GitHub 仓库](https://github.com/jOOQ/jOOQ)
- [虚谷数据库官方文档](https://www.xugudb.com)
- [Spring Boot jOOQ 集成文档](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#data.sql.jooq)

## 参考文档

详细配置信息请参考：`references/jooq-configuration.md`
