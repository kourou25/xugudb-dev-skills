---
name: mybatis-pagehelper-xugudb-adapter
description: MyBatis PageHelper 分页插件适配虚谷数据库（XuguDB）的完整指南。当用户需要将基于 MyBatis PageHelper 的分页查询配置或适配到虚谷数据库时使用此技能，包括依赖配置、分页配置、查询优化、性能调优等。适用于需要分页查询的 MyBatis 项目。
---

# MyBatis PageHelper 分页插件虚谷数据库适配指南

## 概述

本技能提供 MyBatis PageHelper 分页插件适配虚谷数据库（XuguDB）的完整配置指南。PageHelper 是一个 MyBatis 的物理分页插件，支持多种数据库，现在可以通过配置支持虚谷数据库。

**适用场景：**
- MyBatis 项目分页查询
- 列表数据分页展示
- 大数据量分页处理
- 复杂查询分页优化

**核心特性：**
- 物理分页，内存占用小
- 支持多种数据库
- 支持多种分页方式
- 支持排序和聚合查询
- 支持自定义方言
- 支持 RowBounds 分页
- 支持 PageHelper 自动 Count 查询

## 快速开始

### 1. 添加依赖

**Maven 配置：**
```xml
<dependencies>
    <!-- MyBatis -->
    <dependency>
        <groupId>org.mybatis</groupId>
        <artifactId>mybatis</artifactId>
        <version>3.5.13</version>
    </dependency>
    
    <!-- MyBatis-Spring -->
    <dependency>
        <groupId>org.mybatis</groupId>
        <artifactId>mybatis-spring</artifactId>
        <version>2.1.1</version>
    </dependency>
    
    <!-- PageHelper -->
    <dependency>
        <groupId>com.github.pagehelper</groupId>
        <artifactId>pagehelper</artifactId>
        <version>5.3.2</version>
    </dependency>
    
    <!-- 虚谷数据库 JDBC 驱动 -->
    <dependency>
        <groupId>com.xugu</groupId>
        <artifactId>xugu-jdbc</artifactId>
        <version>12.0.0</version>
    </dependency>
    
    <!-- Spring Boot Starter（可选） -->
    <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
        <version>2.3.1</version>
    </dependency>
    
    <!-- PageHelper Spring Boot Starter（可选） -->
    <dependency>
        <groupId>com.github.pagehelper</groupId>
        <artifactId>pagehelper-spring-boot-starter</artifactId>
        <version>1.4.6</version>
    </dependency>
</dependencies>
```

**Gradle 配置：**
```gradle
dependencies {
    implementation 'org.mybatis:mybatis:3.5.13'
    implementation 'org.mybatis:mybatis-spring:2.1.1'
    implementation 'com.github.pagehelper:pagehelper:5.3.2'
    implementation 'com.xugu:xugu-jdbc:12.0.0'
    implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:2.3.1'
    implementation 'com.github.pagehelper:pagehelper-spring-boot-starter:1.4.6'
}
```

### 2. 配置 PageHelper

**MyBatis 配置文件 `mybatis-config.xml`：**
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <plugins>
        <plugin interceptor="com.github.pagehelper.PageInterceptor">
            <!-- 数据库方言 -->
            <property name="helperDialect" value="xugudb"/>
            <!-- 分页合理化 -->
            <property name="reasonable" value="true"/>
            <!-- 是否支持接口参数来传递分页参数 -->
            <property name="supportMethodsArguments" value="true"/>
            <!-- 为了支持startPage(Object params)方法 -->
            <property name="params" valuepageNum=pageNum;pageSize=pageSize;count=countSql;reasonable=reasonable;pageSizeZero=pageSizeZero"/>
            <!-- 是否 count 调用使用嵌套查询 -->
            <property name="useRowBoundsWithPage" value="false"/>
        </plugin>
    </plugins>
</configuration>
```

**Spring Boot 配置 `application.yml`：**
```yaml
# PageHelper 配置
pagehelper:
  helper-dialect: xugudb
  reasonable: true
  support-methods-arguments: true
  params: count=countSql
  page-size-zero: false
  auto-runtime-dialect: true
  auto-dialect: true
  close-conn: true
  count-suffix: _COUNT

# MyBatis 配置
mybatis:
  config-location: classpath:mybatis-config.xml
  mapper-locations: classpath:mapper/**/*.xml
  type-aliases-package: com.example.entity
  configuration:
    map-underscore-to-camel-case: true
    cache-enabled: true
    lazy-loading-enabled: true
    aggressive-lazy-loading: false
```

### 3. 创建实体类

```java
package com.example.entity;

import java.time.LocalDateTime;

public class User {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
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
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

### 4. 创建 Mapper 接口

```java
package com.example.mapper;

import com.example.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface UserMapper {
    
    // 查询所有用户
    @Select("SELECT * FROM users")
    List<User> findAll();
    
    // 根据状态查询用户
    @Select("SELECT * FROM users WHERE status = #{status}")
    List<User> findByStatus(@Param("status") Integer status);
    
    // 根据名称模糊查询
    @Select("SELECT * FROM users WHERE name LIKE CONCAT('%', #{name}, '%')")
    List<User> findByNameLike(@Param("name") String name);
    
    // 复杂查询
    @Select("SELECT * FROM users WHERE status = #{status} AND name LIKE CONCAT('%', #{name}, '%') ORDER BY created_at DESC")
    List<User> findByStatusAndNameLike(@Param("status") Integer status, @Param("name") String name);
    
    // 聚合查询
    @Select("SELECT COUNT(*) FROM users WHERE status = #{status}")
    long countByStatus(@Param("status") Integer status);
}
```

### 5. 创建 Mapper XML 文件

**`UserMapper.xml`：**
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.mapper.UserMapper">
    
    <!-- 结果映射 -->
    <resultMap id="UserResultMap" type="com.example.entity.User">
        <id property="id" column="id"/>
        <result property="name" column="name"/>
        <result property="email" column="email"/>
        <result property="phone" column="phone"/>
        <result property="status" column="status"/>
        <result property="createdAt" column="created_at"/>
        <result property="updatedAt" column="updated_at"/>
    </resultMap>
    
    <!-- 查询所有用户 -->
    <select id="findAll" resultMap="UserResultMap">
        SELECT * FROM users
    </select>
    
    <!-- 根据状态查询用户 -->
    <select id="findByStatus" resultMap="UserResultMap">
        SELECT * FROM users WHERE status = #{status}
    </select>
    
    <!-- 根据名称模糊查询 -->
    <select id="findByNameLike" resultMap="UserResultMap">
        SELECT * FROM users WHERE name LIKE CONCAT('%', #{name}, '%')
    </select>
    
    <!-- 复杂查询 -->
    <select id="findByStatusAndNameLike" resultMap="UserResultMap">
        SELECT * FROM users 
        WHERE status = #{status} 
        AND name LIKE CONCAT('%', #{name}, '%') 
        ORDER BY created_at DESC
    </select>
    
    <!-- 聚合查询 -->
    <select id="countByStatus" resultType="long">
        SELECT COUNT(*) FROM users WHERE status = #{status}
    </select>
    
</mapper>
```

## 分页查询

### 1. 基础分页查询

**使用 PageHelper.startPage()：**
```java
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.example.mapper.UserMapper;
import com.example.entity.User;
import java.util.List;

public class UserService {
    
    private UserMapper userMapper;
    
    /**
     * 分页查询用户
     * @param pageNum 页码（从1开始）
     * @param pageSize 每页大小
     * @return 分页结果
     */
    public PageInfo<User> getUsersByPage(int pageNum, int pageSize) {
        // 设置分页参数
        PageHelper.startPage(pageNum, pageSize);
        
        // 执行查询（会被自动分页）
        List<User> users = userMapper.findAll();
        
        // 获取分页信息
        PageInfo<User> pageInfo = new PageInfo<>(users);
        
        return pageInfo;
    }
    
    /**
     * 带条件的分页查询
     * @param status 状态
     * @param name 名称
     * @param pageNum 页码
     * @param pageSize 每页大小
     * @return 分页结果
     */
    public PageInfo<User> getUsersByCondition(Integer status, String name, int pageNum, int pageSize) {
        // 设置分页参数
        PageHelper.startPage(pageNum, pageSize);
        
        // 执行查询
        List<User> users = userMapper.findByStatusAndNameLike(status, name);
        
        // 获取分页信息
        PageInfo<User> pageInfo = new PageInfo<>(users);
        
        return pageInfo;
    }
}
```

### 2. 使用 PageInfo 获取分页信息

```java
public void printPageInfo(PageInfo<User> pageInfo) {
    System.out.println("当前页: " + pageInfo.getPageNum());
    System.out.println("每页大小: " + pageInfo.getPageSize());
    System.out.println("总记录数: " + pageInfo.getTotal());
    System.out.println("总页数: " + pageInfo.getPages());
    System.out.println("是否有上一页: " + pageInfo.isHasPreviousPage());
    System.out.println("是否有下一页: " + pageInfo.isHasNextPage());
    System.out.println("上一页页码: " + pageInfo.getPrePage());
    System.out.println("下一页页码: " + pageInfo.getNextPage());
    System.out.println("是否第一页: " + pageInfo.isIsFirstPage());
    System.out.println("是否最后一页: " + pageInfo.isIsLastPage());
    System.out.navigatepageNums: " + java.util.Arrays.toString(pageInfo.getNavigatepageNums()));
    
    // 获取数据列表
    List<User> users = pageInfo.getList();
    for (User user : users) {
        System.out.println("用户: " + user.getName());
    }
}
```

### 3. 使用 RowBounds 分页

```java
import org.apache.ibatis.session.RowBounds;
import java.util.List;

public List<User> getUsersByRowBounds(int offset, int limit) {
    RowBounds rowBounds = new RowBounds(offset, limit);
    return userMapper.findAllWithRowBounds(rowBounds);
}
```

### 4. 使用 Lambda 表达式

```java
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import java.util.List;

public PageInfo<User> getUsersByLambda(int pageNum, int pageSize) {
    // 使用 Lambda 表达式
    return PageHelper.startPage(pageNum, pageSize)
        .doSelectPageInfo(() -> userMapper.findAll());
}

// 或者使用更简洁的方式
public PageInfo<User> getUsersByLambda2(int pageNum, int pageSize) {
    return PageHelper.startPage(pageNum, pageSize)
        .doSelectPageInfo(() -> userMapper.findByStatus(1));
}
```

## 高级配置

### 1. 自定义虚谷数据库方言

**创建自定义方言类：**
```java
package com.example.dialect;

import com.github.pagehelper.dialect.helper.AbstractHelperDialect;
import org.apache.ibatis.cache.CacheKey;

public class XuguDBDialect extends AbstractHelperDialect {
    
    @Override
    public String getPageSql(String sql, Page page, CacheKey pageKey) {
        StringBuilder sqlBuilder = new StringBuilder(sql.length() + 14);
        sqlBuilder.append(sql);
        
        if (page.getStartRow() == 0) {
            sqlBuilder.append(" LIMIT ");
            sqlBuilder.append(page.getPageSize());
        } else {
            sqlBuilder.append(" LIMIT ");
            sqlBuilder.append(page.getStartRow());
            sqlBuilder.append(", ");
            sqlBuilder.append(page.getPageSize());
        }
        
        return sqlBuilder.toString();
    }
    
    @Override
    public Object processPageParameter(Mapped ms, Object parameterObject, RowBounds rowBounds, CacheKey pageKey) {
        pageKey.update(rowBounds.getOffset());
        pageKey.update(rowBounds.getLimit());
        return parameterObject;
    }
}
```

**注册自定义方言：**
```xml
<!-- 在 mybatis-config.xml 中配置 -->
<plugins>
    <plugin interceptor="com.github.pagehelper.PageInterceptor">
        <property name="helperDialect" value="com.example.dialect.XuguDBDialect"/>
        <property name="reasonable" value="true"/>
        <property name="supportMethodsArguments" value="true"/>
        <property name="params" value="pageNum=pageNum;pageSize=pageSize;count=countSql;reasonable=reasonable;pageSizeZero=pageSizeZero"/>
    </plugin>
</plugins>
```

### 2. 分页合理化配置

```java
// 启用分页合理化
PageHelper.startPage(pageNum, pageSize, true);

// 或者在配置中设置
// reasonable=true 时，如果 pageNum <= 0，查询第一页
// 如果 pageNum > 总页数，查询最后一页
```

### 3. 全局配置

**Spring Boot 配置：**
```yaml
pagehelper:
  # 数据库方言
  helper-dialect: xugudb
  # 分页合理化
  reasonable: true
  # 是否支持接口参数来传递分页参数
  support-methods-arguments: true
  # 为了支持startPage(Object params)方法
  params: count=countSql
  # 当页数为0时是否查询全部
  page-size-zero: false
  # 是否自动识别数据库方言
  auto-runtime-dialect: true
  # 是否自动检测数据库类型
  auto-dialect: true
  # 关闭连接
  close-conn: true
  # count 查询后缀
  count-suffix: _COUNT
```

### 4. 多数据源配置

```java
import com.github.pagehelper.PageInterceptor;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSourceConfig {
    
    @Bean
    public PageInterceptor pageInterceptor() {
        PageInterceptor pageInterceptor = new PageInterceptor();
        Properties properties = new Properties();
        properties.setProperty("helperDialect", "xugudb");
        properties.setProperty("reasonable", "true");
        properties.setProperty("supportMethodsArguments", "true");
        pageInterceptor.setProperties(properties);
        return pageInterceptor;
    }
    
    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource, PageInterceptor pageInterceptor) throws Exception {
        SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
        sessionFactory.setDataSource(dataSource);
        sessionFactory.setPlugins(pageInterceptor);
        return sessionFactory.getObject();
    }
}
```

## 查询优化

### 1. 避免全表扫描

**问题**：分页查询时，如果 ORDER BY 字段没有索引，会导致全表扫描。

**解决方案**：
```sql
-- 为排序字段创建索引
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_status ON users(status);

-- 使用覆盖索引
CREATE INDEX idx_users_covering ON users(status, created_at, name, email);
```

### 2. 优化 COUNT 查询

**问题**：复杂的 COUNT 查询可能很慢。

**解决方案**：
```java
// 使用简化的 COUNT 查询
public long countUsers(Integer status) {
    // 使用 @Select 注解的简化查询
    return userMapper.countByStatus(status);
}

// 或者使用缓存
@Cacheable(value = "userCount", key = "#status")
public long countUsersWithCache(Integer status) {
    return userMapper.countByStatus(status);
}
```

### 3. 使用子查询优化

**问题**：大数据量分页时，LIMIT offset, limit 性能差。

**解决方案**：
```xml
<!-- 使用子查询优化 -->
<select id="findUsersByPage" resultMap="UserResultMap">
    SELECT u.* FROM users u
    INNER JOIN (
        SELECT id FROM users 
        WHERE status = #{status}
        ORDER BY created_at DESC
        LIMIT #{offset}, #{limit}
    ) t ON u.id = t.id
</select>
```

### 4. 使用游标分页

**问题**：传统分页在深页时性能差。

**解决方案**：
```java
// 使用游标分页（基于上一页最后一条记录）
public PageInfo<User> getUsersByCursor(Long lastId, int pageSize) {
    PageHelper.startPage(1, pageSize);
    
    List<User> users = userMapper.findUsersAfterId(lastId);
    
    return new PageInfo<>(users);
}

// Mapper 方法
@Select("SELECT * FROM users WHERE id > #{lastId} ORDER BY id ASC LIMIT #{limit}")
List<User> findUsersAfterId(@Param("lastId") Long lastId);
```

## 性能测试

### 1. 测试脚本

**创建性能测试类：**
```java
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.util.List;

@SpringBootTest
public class PageHelperPerformanceTest {
    
    @Autowired
    private UserMapper userMapper;
    
    @Test
    public void testPaginationPerformance() {
        int[] pageSizes = {10, 20, 50, 100};
        int[] pageNumbers = {1, 10, 100, 1000};
        
        for (int pageSize : pageSizes) {
            for (int pageNum : pageNumbers) {
                long startTime = System.currentTimeMillis();
                
                PageHelper.startPage(pageNum, pageSize);
                List<User> users = userMapper.findAll();
                PageInfo<User> pageInfo = new PageInfo<>(users);
                
                long endTime = System.currentTimeMillis();
                long duration = endTime - startTime;
                
                System.out.printf("页码: %d, 每页大小: %d, 耗时: %d ms, 总记录数: %d%n",
                    pageNum, pageSize, duration, pageInfo.getTotal());
            }
        }
    }
    
    @Test
    public void testCountPerformance() {
        long startTime = System.currentTimeMillis();
        
        long count = userMapper.countByStatus(1);
        
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        
        System.out.printf("COUNT 查询耗时: %d ms, 结果: %d%n", duration, count);
    }
}
```

### 2. 性能监控

**添加性能监控：**
```java
import com.github.pagehelper.PageInterceptor;
import org.apache.ibatis.plugin.Interceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MyBatisConfig {
    
    @Bean
    public Interceptor pageInterceptor() {
        PageInterceptor pageInterceptor = new PageInterceptor();
        Properties properties = new Properties();
        properties.setProperty("helperDialect", "xugudb");
        properties.setProperty("reasonable", "true");
        properties.setProperty("supportMethodsArguments", "true");
        
        // 启用性能监控
        properties.setProperty("countSuffix", "_COUNT");
        properties.setProperty("autoRuntimeDialect", "true");
        
        pageInterceptor.setProperties(properties);
        return pageInterceptor;
    }
}
```

## 集成测试

### 1. 单元测试

```java
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Arrays;
import java.util.List;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {
    
    @Mock
    private UserMapper userMapper;
    
    @InjectMocks
    private UserService userService;
    
    private List<User> mockUsers;
    
    @BeforeEach
    void setUp() {
        mockUsers = Arrays.asList(
            createUser(1L, "张三", "zhangsan@example.com"),
            createUser(2L, "李四", "lisi@example.com"),
            createUser(3L, "王五", "wangwu@example.com")
        );
    }
    
    @Test
    void testGetUsersByPage() {
        // 模拟 Mapper 返回
        when(userMapper.findAll()).thenReturn(mockUsers);
        
        // 执行分页查询
        PageInfo<User> pageInfo = userService.getUsersByPage(1, 10);
        
        // 验证结果
        assertNotNull(pageInfo);
        assertEquals(3, pageInfo.getList().size());
        assertEquals(1, pageInfo.getPageNum());
        assertEquals(10, pageInfo.getPageSize());
    }
    
    private User createUser(Long id, String name, String email) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setEmail(email);
        return user;
    }
}
```

### 2. 集成测试

```java
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@SpringBootTest
@Transactional
public class UserServiceIntegrationTest {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserMapper userMapper;
    
    @Test
    void testGetUsersByPage() {
        // 执行分页查询
        PageInfo<User> pageInfo = userService.getUsersByPage(1, 10);
        
        // 验证结果
        assertNotNull(pageInfo);
        assertTrue(pageInfo.getList().size() <= 10);
        assertEquals(1, pageInfo.getPageNum());
        assertEquals(10, pageInfo.getPageSize());
    }
    
    @Test
    void testGetUsersByCondition() {
        // 执行带条件的分页查询
        PageInfo<User> pageInfo = userService.getUsersByCondition(1, "张", 1, 10);
        
        // 验证结果
        assertNotNull(pageInfo);
        for (User user : pageInfo.getList()) {
            assertEquals(1, user.getStatus());
            assertTrue(user.getName().contains("张"));
        }
    }
}
```

## 常见问题与解决方案

### 1. 分页不生效

**问题**：PageHelper.startPage() 后查询没有分页。

**解决方案**：
```java
// 确保 startPage() 在查询之前调用
PageHelper.startPage(pageNum, pageSize);
List<User> users = userMapper.findAll(); // 这行必须紧跟 startPage()

// 错误示例
PageHelper.startPage(pageNum, pageSize);
System.out.println("这里不能有其他查询"); // 这里不能有其他查询操作
List<User> users = userMapper.findAll(); // 分页会失效
```

### 2. COUNT 查询慢

**问题**：COUNT 查询执行时间很长。

**解决方案**：
```java
// 使用简化的 COUNT 查询
@Select("SELECT COUNT(*) FROM users WHERE status = #{status}")
long countByStatus(@Param("status") Integer status);

// 或者使用缓存
@Cacheable(value = "userCount", key = "#status")
public long countUsersWithCache(Integer status) {
    return userMapper.countByStatus(status);
}
```

### 3. 排序问题

**问题**：分页查询结果顺序不稳定。

**解决方案**：
```xml
<!-- 确保 ORDER BY 字段有索引 -->
<select id="findAll" resultMap="UserResultMap">
    SELECT * FROM users ORDER BY id ASC
</select>

<!-- 创建索引 -->
CREATE INDEX idx_users_id ON users(id);
```

### 4. 内存溢出

**问题**：查询大量数据导致内存溢出。

**解决方案**：
```java
// 使用流式查询
@Select("SELECT * FROM users")
@Options(resultSetType = ResultSetType.FORWARD_ONLY, fetchSize = Integer.MIN_VALUE)
void findAllStream(Consumer<User> consumer);

// 或者使用分批查询
public List<User> findAllInBatches(int batchSize) {
    List<User> allUsers = new ArrayList<>();
    int pageNum = 1;
    while (true) {
        PageHelper.startPage(pageNum, batchSize);
        List<User> users = userMapper.findAll();
        if (users.isEmpty()) {
            break;
        }
        allUsers.addAll(users);
        pageNum++;
    }
    return allUsers;
}
```

## 最佳实践

### 1. 分页参数校验
- 校验页码和每页大小
- 设置最大每页大小
- 处理异常参数

```java
public PageInfo<User> getUsersByPage(int pageNum, int pageSize) {
    // 参数校验
    if (pageNum <= 0) {
        pageNum = 1;
    }
    if (pageSize <= 0) {
        pageSize = 10;
    }
    if (pageSize > 100) {
        pageSize = 100;
    }
    
    PageHelper.startPage(pageNum, pageSize);
    List<User> users = userMapper.findAll();
    return new PageInfo<>(users);
}
```

### 2. 查询优化
- 为常用查询字段创建索引
- 避免 SELECT *
- 使用覆盖索引
- 优化 ORDER BY 字段

### 3. 性能监控
- 监控查询执行时间
- 记录慢查询
- 分析性能瓶颈
- 定期优化数据库

### 4. 缓存策略
- 缓存 COUNT 查询结果
- 缓存热点数据
- 设置合理的缓存过期时间
- 处理缓存一致性

### 5. 异常处理
- 捕获数据库异常
- 记录错误日志
- 提供友好的错误信息
- 实现重试机制

## 相关资源

- [PageHelper 官方文档](https://pagehelper.github.io/)
- [PageHelper GitHub 仓库](https://github.com/pagehelper/Mybatis-PageHelper)
- [MyBatis 官方文档](https://mybatis.org/mybatis-3/)
- [虚谷数据库官方文档](https://www.xugudb.com)

## 参考文档

详细配置信息请参考：`references/pagehelper-configuration.md`