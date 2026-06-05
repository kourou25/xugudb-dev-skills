---
name: eclipselink-xugudb-adapter
description: EclipseLink 框架适配虚谷数据库（XuguDB）的完整指南。当用户需要将基于 EclipseLink 的 Java 项目配置或适配到虚谷数据库时使用此技能，包括 JPA 配置、实体管理、查询构建、缓存配置、性能优化等。适用于从 Oracle/MySQL 迁移或新建虚谷数据库项目。
---

# EclipseLink 虚谷数据库适配指南

## 概述

本技能提供 EclipseLink 框架适配虚谷数据库（XuguDB）的完整配置指南。EclipseLink 是一个成熟的 Java ORM 框架，是 JPA（Java Persistence API）的参考实现，支持多种数据库，现在可以通过虚谷数据库驱动支持虚谷数据库。

**适用场景：**
- Java 企业级应用开发
- JPA 标准应用开发
- 从 Oracle/MySQL 迁移到虚谷数据库
- 需要高性能缓存的应用
- 需要复杂查询和事务管理的应用

**核心特性：**
- 完整的 JPA 2.2 规范支持
- 高级缓存机制（L1/L2 缓存、分布式缓存）
- 动态查询和 Criteria API
- 支持多种继承策略
- 支持复杂关系映射
- 支持数据库迁移和版本控制
- 支持多租户架构

## 快速开始

### 1. 添加依赖

**Maven 配置：**
```xml
<dependencies>
    <!-- EclipseLink -->
    <dependency>
        <groupId>org.eclipse.persistence</groupId>
        <artifactId>eclipselink</artifactId>
        <version>2.7.12</version>
    </dependency>
    
    <!-- JPA API -->
    <dependency>
        <groupId>javax.persistence</groupId>
        <artifactId>javax.persistence-api</artifactId>
        <version>2.2</version>
    </dependency>
    
    <!-- 虚谷数据库 JDBC 驱动 -->
    <dependency>
        <groupId>com.xugu</groupId>
        <artifactId>xugu-jdbc</artifactId>
        <version>12.0.0</version>
    </dependency>
    
    <!-- 连接池（可选） -->
    <dependency>
        <groupId>com.zaxxer</groupId>
        <artifactId>HikariCP</artifactId>
        <version>5.0.1</version>
    </dependency>
</dependencies>
```

**Gradle 配置：**
```gradle
dependencies {
    implementation 'org.eclipse.persistence:eclipselink:2.7.12'
    implementation 'javax.persistence:javax.persistence-api:2.2'
    implementation 'com.xugu:xugu-jdbc:12.0.0'
    implementation 'com.zaxxer:HikariCP:5.0.1'
}
```

### 2. 配置 persistence.xml

在 `src/main/resources/META-INF/persistence.xml` 中配置：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<persistence version="2.2"
             xmlns="http://xmlns.jcp.org/xml/ns/persistence"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/persistence
             http://xmlns.jcp.org/xml/ns/persistence/persistence_2_2.xsd">
    
    <persistence-unit name="XuguDB_PU" transaction-type="RESOURCE_LOCAL">
        <provider>org.eclipse.persistence.jpa.PersistenceProvider</provider>
        
        <!-- 实体类 -->
        <class>com.example.entity.User</class>
        <class>com.example.entity.Order</class>
        
        <!-- 数据库连接属性 -->
        <properties>
            <!-- 基础连接配置 -->
            <property name="javax.persistence.jdbc.driver" value="com.xugu.cloudjdbc.Driver"/>
            <property name="javax.persistence.jdbc.url" value="jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=SYSDBA&amp;CHAR_SET=UTF8"/>
            <property name="javax.persistence.jdbc.user" value="SYSDBA"/>
            <property name="javax.persistence.jdbc.password" value="SYSDBA"/>
            
            <!-- EclipseLink 特定配置 -->
            <property name="eclipselink.ddl-generation" value="create-or-extend-tables"/>
            <property name="eclipselink.ddl-generation.output-mode" value="database"/>
            <property name="eclipselink.logging.level" value="INFO"/>
            <property name="eclipselink.logging.parameters" value="true"/>
            
            <!-- 缓存配置 -->
            <property name="eclipselink.cache.shared.default" value="true"/>
            <property name="eclipselink.cache.size.default" value="1000"/>
            <property name="eclipselink.cache.type.default" value="SOFT"/>
            
            <!-- 连接池配置 -->
            <property name="eclipselink.connection-pool.default.initial" value="5"/>
            <property name="eclipselink.connection-pool.default.min" value="5"/>
            <property name="eclipselink.connection-pool.default.max" value="50"/>
        </properties>
    </persistence-unit>
</persistence>
```

### 3. 创建实体类

```java
package com.example.entity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@NamedQuery(name = "User.findByEmail", query = "SELECT u FROM User u WHERE u.email = :email")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "name", length = 100, nullable = false)
    private String name;
    
    @Column(name = "email", length = 200, unique = true, nullable = false)
    private String email;
    
    @Column(name = "phone", length = 20)
    private String phone;
    
    @Column(name = "status", columnDefinition = "SMALLINT DEFAULT 1")
    private Integer status = 1;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Order> orders;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    
    public List<Order> getOrders() { return orders; }
    public void setOrders(List<Order> orders) { this.orders = orders; }
}
```

### 4. 创建 DAO 层

```java
package com.example.dao;

import com.example.entity.User;
import javax.persistence.*;
import java.util.List;
import java.util.Optional;

public class UserRepository {
    
    private EntityManagerFactory emf;
    private EntityManager em;
    
    public UserRepository() {
        emf = Persistence.createEntityManagerFactory("XuguDB_PU");
        em = emf.createEntityManager();
    }
    
    // 保存用户
    public User save(User user) {
        em.getTransaction().begin();
        try {
            if (user.getId() == null) {
                em.persist(user);
            } else {
                user = em.merge(user);
            }
            em.getTransaction().commit();
            return user;
        } catch (Exception e) {
            em.getTransaction().rollback();
            throw e;
        }
    }
    
    // 根据ID查找用户
    public Optional<User> findById(Long id) {
        User user = em.find(User.class, id);
        return Optional.ofNullable(user);
    }
    
    // 查找所有用户
    public List<User> findAll() {
        TypedQuery<User> query = em.createQuery("SELECT u FROM User u", User.class);
        return query.getResultList();
    }
    
    // 根据邮箱查找用户
    public Optional<User> findByEmail(String email) {
        TypedQuery<User> query = em.createNamedQuery("User.findByEmail", User.class);
        query.setParameter("email", email);
        List<User> results = query.getResultList();
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }
    
    // 分页查询
    public List<User> findAll(int page, int size) {
        TypedQuery<User> query = em.createQuery("SELECT u FROM User u ORDER BY u.id", User.class);
        query.setFirstResult((page - 1) * size);
        query.setMaxResults(size);
        return query.getResultList();
    }
    
    // 条件查询
    public List<User> findByStatus(Integer status) {
        TypedQuery<User> query = em.createQuery(
            "SELECT u FROM User u WHERE u.status = :status", User.class);
        query.setParameter("status", status);
        return query.getResultList();
    }
    
    // 删除用户
    public void delete(Long id) {
        em.getTransaction().begin();
        try {
            User user = em.find(User.class, id);
            if (user != null) {
                em.remove(user);
            }
            em.getTransaction().commit();
        } catch (Exception e) {
            em.getTransaction().rollback();
            throw e;
        }
    }
    
    // 关闭资源
    public void close() {
        if (em != null && em.isOpen()) {
            em.close();
        }
        if (emf != null && emf.isOpen()) {
            emf.close();
        }
    }
}
```

## JPA 查询语言 (JPQL)

### 基础查询

```java
// 简单查询
TypedQuery<User> query = em.createQuery("SELECT u FROM User u", User.class);
List<User> users = query.getResultList();

// 带参数查询
TypedQuery<User> query = em.createQuery(
    "SELECT u FROM User u WHERE u.status = :status", User.class);
query.setParameter("status", 1);
List<User> activeUsers = query.getResultList();

// 模糊查询
TypedQuery<User> query = em.createQuery(
    "SELECT u FROM User u WHERE u.name LIKE :name", User.class);
query.setParameter("name", "%张%");
List<User> users = query.getResultList();
```

### 关联查询

```java
// 一对一查询
TypedQuery<User> query = em.createQuery(
    "SELECT u FROM User u JOIN u.profile p WHERE p.bio IS NOT NULL", User.class);

// 一对多查询
TypedQuery<User> query = em.createQuery(
    "SELECT u FROM User u JOIN u.orders o WHERE o.amount > 100", User.class);

// 多对多查询
TypedQuery<User> query = em.createQuery(
    "SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName", User.class);
query.setParameter("roleName", "ADMIN");
```

### 聚合查询

```java
// 统计查询
TypedQuery<Long> countQuery = em.createQuery(
    "SELECT COUNT(u) FROM User u WHERE u.status = :status", Long.class);
countQuery.setParameter("status", 1);
Long count = countQuery.getSingleResult();

// 分组查询
TypedQuery<Object[]> groupQuery = em.createQuery(
    "SELECT u.status, COUNT(u) FROM User u GROUP BY u.status", Object[].class);
List<Object[]> results = groupQuery.getResultList();

// 联合查询
TypedQuery<Object[]> aggregateQuery = em.createQuery(
    "SELECT COUNT(u), AVG(u.age), MAX(u.createdAt) FROM User u", Object[].class);
Object[] result = aggregateQuery.getSingleResult();
```

## Criteria API

### 动态查询构建

```java
import javax.persistence.criteria.*;

public List<User> findUsersByCriteria(String name, Integer status, int page, int size) {
    CriteriaBuilder cb = em.getCriteriaBuilder();
    CriteriaQuery<User> cq = cb.createQuery(User.class);
    Root<User> root = cq.from(User.class);
    
    // 构建查询条件
    List<Predicate> predicates = new ArrayList<>();
    
    if (name != null && !name.isEmpty()) {
        predicates.add(cb.like(root.get("name"), "%" + name + "%"));
    }
    
    if (status != null) {
        predicates.add(cb.equal(root.get("status"), status));
    }
    
    // 组合条件
    if (!predicates.isEmpty()) {
        cq.where(cb.and(predicates.toArray(new Predicate[0])));
    }
    
    // 排序
    cq.orderBy(cb.desc(root.get("createdAt")));
    
    // 执行查询
    TypedQuery<User> query = em.createQuery(cq);
    query.setFirstResult((page - 1) * size);
    query.setMaxResults(size);
    
    return query.getResultList();
}
```

### 复杂 Criteria 查询

```java
public List<UserDTO> findUserDTOsByCriteria() {
    CriteriaBuilder cb = em.getCriteriaBuilder();
    CriteriaQuery<UserDTO> cq = cb.createQuery(UserDTO.class);
    Root<User> root = cq.from(User.class);
    
    // 投影查询
    cq.select(cb.construct(UserDTO.class,
        root.get("id"),
        root.get("name"),
        root.get("email"),
        cb.count(root.get("orders"))
    ));
    
    // 分组
    cq.groupBy(root.get("id"), root.get("name"), root.get("email"));
    
    // 条件
    cq.having(cb.greaterThan(cb.count(root.get("orders")), 0L));
    
    return em.createQuery(cq).getResultList();
}
```

## 事务管理

### 编程式事务

```java
public void transferMoney(Long fromAccountId, Long toAccountId, BigDecimal amount) {
    EntityManager em = emf.createEntityManager();
    EntityTransaction tx = em.getTransaction();
    
    try {
        tx.begin();
        
        Account fromAccount = em.find(Account.class, fromAccountId);
        Account toAccount = em.find(Account.class, toAccountId);
        
        if (fromAccount.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("余额不足");
        }
        
        fromAccount.setBalance(fromAccount.getBalance().subtract(amount));
        toAccount.setBalance(toAccount.getBalance().add(amount));
        
        em.merge(fromAccount);
        em.merge(toAccount);
        
        tx.commit();
    } catch (Exception e) {
        if (tx.isActive()) {
            tx.rollback();
        }
        throw e;
    } finally {
        em.close();
    }
}
```

### 声明式事务（Spring 集成）

```java
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    
    @PersistenceContext
    private EntityManager em;
    
    @Transactional
    public User createUser(User user) {
        em.persist(user);
        return user;
    }
    
    @Transactional(readOnly = true)
    public User findById(Long id) {
        return em.find(User.class, id);
    }
    
    @Transactional
    public User updateUser(Long id, UserUpdateDTO updateDTO) {
        User user = em.find(User.class, id);
        if (user == null) {
            throw new EntityNotFoundException("User not found: " + id);
        }
        
        user.setName(updateDTO.getName());
        user.setEmail(updateDTO.getEmail());
        
        return em.merge(user);
    }
    
    @Transactional
    public void deleteUser(Long id) {
        User user = em.find(User.class, id);
        if (user != null) {
            em.remove(user);
        }
    }
}
```

## 缓存配置

### L1 缓存（EntityManager 级别）

```java
// L1 缓存是 EntityManager 的默认缓存
EntityManager em = emf.createEntityManager();

// 第一次查询 - 从数据库加载
User user1 = em.find(User.class, 1L);

// 第二次查询 - 从 L1 缓存获取
User user2 = em.find(User.class, 1L);

// user1 和 user2 是同一个对象实例
System.out.println(user1 == user2); // true
```

### L2 缓存（EntityManagerFactory 级别）

```java
// 在实体类上配置 L2 缓存
@Entity
@Table(name = "users")
@Cacheable
@Cache(
    type = CacheType.SOFT,
    size = 1000,
    expiry = 3600000, // 1小时
    coordinationType = CacheCoordinationType.SEND_OBJECT_CHANGES
)
public class User {
    // 实体定义
}
```

### 缓存管理

```java
import org.eclipse.persistence.sessions.server.ServerSession;
import org.eclipse.persistence.internal.sessions.UnitOfWorkImpl;

// 获取缓存管理器
ServerSession session = em.unwrap(ServerSession.class);
org.eclipse.persistence.sessions.Project project = session.getProject();

// 清除特定实体的缓存
session.getIdentityMapAccessor().invalidateClass(User.class);

// 清除所有缓存
session.getIdentityMapAccessor().invalidateAllClasses();

// 获取缓存统计信息
org.eclipse.persistence.tools.profiler.PerformanceProfiler profiler = 
    (PerformanceProfiler) session.getProfiler();
```

## 性能优化

### 批量操作

```java
public void batchInsertUsers(List<User> users) {
    EntityManager em = emf.createEntityManager();
    EntityTransaction tx = em.getTransaction();
    
    try {
        tx.begin();
        
        int batchSize = 1000;
        for (int i = 0; i < users.size(); i++) {
            em.persist(users.get(i));
            
            if (i > 0 && i % batchSize == 0) {
                em.flush();
                em.clear();
            }
        }
        
        tx.commit();
    } catch (Exception e) {
        if (tx.isActive()) {
            tx.rollback();
        }
        throw e;
    } finally {
        em.close();
    }
}
```

### 查询优化

```java
// 使用 JOIN FETCH 避免 N+1 问题
TypedQuery<User> query = em.createQuery(
    "SELECT u FROM User u JOIN FETCH u.orders WHERE u.status = :status", User.class);
query.setParameter("status", 1);
List<User> users = query.getResultList();

// 使用投影查询减少数据传输
TypedQuery<Object[]> query = em.createQuery(
    "SELECT u.id, u.name, u.email FROM User u WHERE u.status = :status", Object[].class);
query.setParameter("status", 1);
List<Object[]> results = query.getResultList();

// 使用分页查询
TypedQuery<User> query = em.createQuery("SELECT u FROM User u ORDER BY u.id", User.class);
query.setFirstResult(0);
query.setMaxResults(10);
List<User> users = query.getResultList();
```

### 索引优化

```java
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email", unique = true),
    @Index(name = "idx_users_status", columnList = "status"),
    @Index(name = "idx_users_created_at", columnList = "created_at DESC")
})
public class User {
    // 实体定义
}
```

## 高级特性

### 继承映射

```java
// 单表继承
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "type", discriminatorType = DiscriminatorType.STRING)
public abstract class Person {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String email;
}

@Entity
@DiscriminatorValue("EMPLOYEE")
public class Employee extends Person {
    private String department;
    private BigDecimal salary;
}

@Entity
@DiscriminatorValue("CUSTOMER")
public class Customer extends Person {
    private String customerType;
    private BigDecimal creditLimit;
}
```

### 多租户支持

```java
@Entity
@Table(name = "users")
@Multitenant(MultitenantType.TABLE_PER_TENANT)
@TenantTableDiscriminator(type = TenantTableDiscriminatorType.PREFIX, contextProperty = "tenant.id")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String email;
}

// 使用多租户
EntityManager em = emf.createEntityManager();
em.setProperty("tenant.id", "tenant_001");
List<User> users = em.createQuery("SELECT u FROM User u", User.class).getResultList();
```

### 数据库迁移

```java
import org.eclipse.persistence.sessions.factories.SessionManager;
import org.eclipse.persistence.tools.schemaframework.SchemaManager;

// 自动创建表结构
SchemaManager schemaManager = new SchemaManager(session);
schemaManager.createDefaultTables(true);

// 手动执行 DDL
schemaManager.createTable("users");
schemaManager.addColumn("users", "new_column", String.class, 100);

// 生成 DDL 脚本
schemaManager.outputCreateDDLToWriter(writer);
```

## Spring Boot 集成

### 配置 application.yml

```yaml
spring:
  datasource:
    driver-class-name: com.xugu.cloudjdbc.Driver
    url: jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=SYSDBA&CHAR_SET=UTF8
    username: SYSDBA
    password: SYSDBA
    
  jpa:
    database-platform: org.eclipse.persistence.platform.database.DatabasePlatform
    properties:
      eclipselink:
        ddl-generation: create-or-extend-tables
        ddl-generation-output-mode: database
        logging:
          level: INFO
          parameters: true
        cache:
          shared:
            default: true
          size:
            default: 1000
          type:
            default: SOFT
        connection-pool:
          default:
            initial: 5
            min: 5
            max: 50
```

### 配置类

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.EclipseLinkJpaVendorAdapter;
import javax.sql.DataSource;

@Configuration
public class JpaConfig {
    
    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.example.entity");
        em.setJpaVendorAdapter(new EclipseLinkJpaVendorAdapter());
        em.setJpaProperties(additionalProperties());
        return em;
    }
    
    private Properties additionalProperties() {
        Properties properties = new Properties();
        properties.setProperty("eclipselink.ddl-generation", "create-or-extend-tables");
        properties.setProperty("eclipselink.logging.level", "INFO");
        properties.setProperty("eclipselink.cache.shared.default", "true");
        return properties;
    }
}
```

## 测试配置

### 单元测试

```java
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import javax.persistence.*;
import static org.junit.jupiter.api.Assertions.*;

class UserRepositoryTest {
    
    private EntityManagerFactory emf;
    private EntityManager em;
    private UserRepository userRepository;
    
    @BeforeEach
    void setUp() {
        emf = Persistence.createEntityManagerFactory("TestPU");
        em = emf.createEntityManager();
        userRepository = new UserRepository(em);
    }
    
    @Test
    void testSaveUser() {
        User user = new User();
        user.setName("测试用户");
        user.setEmail("test@example.com");
        
        User savedUser = userRepository.save(user);
        
        assertNotNull(savedUser.getId());
        assertEquals("测试用户", savedUser.getName());
    }
    
    @Test
    void testFindByEmail() {
        User user = new User();
        user.setName("测试用户");
        user.setEmail("test@example.com");
        userRepository.save(user);
        
        Optional<User> found = userRepository.findByEmail("test@example.com");
        
        assertTrue(found.isPresent());
        assertEquals("测试用户", found.get().getName());
    }
}
```

### 集成测试

```java
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.transaction.annotation.Transactional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@SpringJUnitConfig
@Transactional
class UserServiceIntegrationTest {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserRepository userRepository;
    
    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }
    
    @Test
    void testCreateUser() {
        User user = new User();
        user.setName("集成测试用户");
        user.setEmail("integration@example.com");
        
        User createdUser = userService.createUser(user);
        
        assertNotNull(createdUser.getId());
        assertEquals("集成测试用户", createdUser.getName());
        
        // 验证数据库中的数据
        Optional<User> foundUser = userRepository.findById(createdUser.getId());
        assertTrue(foundUser.isPresent());
        assertEquals("integration@example.com", foundUser.get().getEmail());
    }
}
```

## 常见问题与解决方案

### 1. 连接失败

**问题**：无法连接到虚谷数据库。

**解决方案**：
- 检查数据库服务是否启动
- 验证连接 URL 格式：`jdbc:xugu://host:port/database?current_schema=schema&CHAR_SET=UTF8`
- 确认驱动类名：`com.xugu.cloudjdbc.Driver`
- 检查用户名和密码是否正确
- 验证网络连接和防火墙设置

### 2. 实体映射错误

**问题**：实体类与数据库表映射失败。

**解决方案**：
- 检查 `@Table` 注解的表名是否正确
- 验证 `@Column` 注解的列名和数据类型
- 确保主键生成策略与数据库兼容
- 检查关系映射的外键配置

### 3. 缓存不一致

**问题**：更新数据后缓存未刷新。

**解决方案**：
- 配置合适的缓存过期时间
- 使用 `@CacheInvalidation` 注解
- 手动清除缓存：`session.getIdentityMapAccessor().invalidateClass(User.class)`
- 配置缓存协调机制

### 4. 性能问题

**问题**：查询速度慢。

**解决方案**：
- 使用 JOIN FETCH 避免 N+1 问题
- 为常用查询字段创建索引
- 使用投影查询减少数据传输
- 启用查询缓存
- 使用批量操作

### 5. 事务问题

**问题**：事务不生效或回滚失败。

**解决方案**：
- 确保使用 `EntityTransaction` 管理事务
- 检查数据库连接的自动提交设置
- 在事务中避免长时间操作
- 正确处理异常和回滚

## 最佳实践

### 1. 实体设计
- 使用 JPA 标准注解
- 为常用查询字段添加索引
- 使用枚举类型定义状态字段
- 添加创建时间和更新时间字段
- 合理使用懒加载和急切加载

### 2. 查询优化
- 使用 JPQL 或 Criteria API 构建查询
- 避免 N+1 查询问题
- 使用分页查询处理大数据集
- 启用查询缓存

### 3. 事务管理
- 使用声明式事务（Spring 集成）
- 保持事务短小
- 避免在事务中进行远程调用
- 正确处理异常和回滚

### 4. 缓存策略
- 合理配置 L1/L2 缓存
- 设置合适的缓存过期时间
- 监控缓存命中率
- 处理缓存一致性

### 5. 性能优化
- 使用批量操作
- 优化数据库连接池
- 监控慢查询
- 定期分析性能瓶颈

## 相关资源

- [EclipseLink 官方文档](https://www.eclipse.org/eclipselink/)
- [EclipseLink GitHub 仓库](https://github.com/eclipse-ee4j/eclipselink)
- [JPA 规范](https://jakarta.ee/specifications/persistence/3.0/)
- [虚谷数据库官方文档](https://www.xugudb.com)

## 参考文档

详细配置信息请参考：`references/eclipselink-configuration.md`