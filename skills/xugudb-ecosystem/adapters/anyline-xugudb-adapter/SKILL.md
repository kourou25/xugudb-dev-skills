---
name: anyline-xugudb-adapter
description: AnyLine 动态数据源框架适配虚谷数据库（XuguDB）的完整指南。当用户需要将基于 AnyLine 的 Java 项目配置或适配到虚谷数据库时使用此技能，包括动态数据源注册、切换、元数据操作、DDL/DML 自动生成等。适用于数据中台、低代码平台、异构数据库迁移等场景。
---

# AnyLine 动态数据源适配虚谷数据库指南

## 概述

本技能提供 AnyLine 动态数据源框架适配虚谷数据库（XuguDB）的完整配置指南。AnyLine 是一个面向运行时的元数据动态关系映射框架，支持运行时动态注册切换数据源、自动生成 SQL（DDL/DML/DQL）、读写元数据、对比数据库结构差异。

**适用场景：**
- 数据中台和数据仓库项目
- 低代码平台和动态表单系统
- 异构数据库迁移和同步
- 多数据源管理和切换
- 物联网和车联网数据处理
- 运行时自定义报表和查询条件

**核心特性：**
- 运行时动态注册和切换数据源
- 自动生成 DDL/DML/DQL 语句
- 读写数据库元数据（表结构、索引、约束等）
- 跨数据库结构对比和迁移
- 支持 100+ 种关系型/非关系型数据库
- 与 Spring Boot、Vert.x、Solon 等框架无缝集成

## 快速开始

### 1. 添加依赖

**Maven 配置：**

```xml
<!-- AnyLine 核心依赖 -->
<dependency>
    <groupId>org.anyline</groupId>
    <artifactId>anyline-core</artifactId>
    <version>8.7.3</version>
</dependency>

<!-- AnyLine JDBC 数据源管理 -->
<dependency>
    <groupId>org.anyline</groupId>
    <artifactId>anyline-data-jdbc</artifactId>
    <version>8.7.3</version>
</dependency>

<!-- 虚谷数据库 JDBC 驱动 -->
<dependency>
    <groupId>com.xugudb</groupId>
    <artifactId>xugu-jdbc</artifactId>
    <version>12.3.4</version>
</dependency>

<!-- 数据库连接池（推荐使用 Druid） -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>1.2.20</version>
</dependency>
```

**Gradle 配置：**

```gradle
implementation 'org.anyline:anyline-core:8.7.3'
implementation 'org.anyline:anyline-data-jdbc:8.7.3'
implementation 'com.xugudb:xugu-jdbc:12.3.4'
implementation 'com.alibaba:druid-spring-boot-starter:1.2.20'
```

### 2. 配置数据源

**application.yml 配置：**

```yaml
# AnyLine 数据源配置
anyline:
  # 默认数据源
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    driver-class-name: com.xugu.cloudjdbc.Driver
    url: jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: SYSDBA
    password: SYSDBA
    
    # Druid 连接池配置
    initial-size: 5
    min-idle: 5
    max-active: 20
    max-wait: 60000
    time-between-eviction-runs-millis: 60000
    min-evictable-idle-time-millis: 300000
    validation-query: SELECT 1
    test-while-idle: true
    test-on-borrow: false
    test-on-return: false
    
    # 监控统计
    filters: stat,wall,log4j
    pool-prepared-statements: true
    max-pool-prepared-statement-per-connection-size: 20
    use-global-data-source-stat: true
    connection-properties: druid.stat.mergeSql=true;druid.stat.slowSqlMillis=5000
  
  # 多数据源列表
  datasource-list: xugu-main, xugu-report
  
  # 数据源1：主数据源
  datasource.xugu-main:
    type: com.alibaba.druid.pool.DruidDataSource
    driver-class-name: com.xugu.cloudjdbc.Driver
    url: jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: SYSDBA
    password: SYSDBA
  
  # 数据源2：报表数据源
  datasource.xugu-report:
    type: com.alibaba.druid.pool.DruidDataSource
    driver-class-name: com.xugu.cloudjdbc.Driver
    url: jdbc:xugu://127.0.0.1:5138/REPORT_DB?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: SYSDBA
    password: SYSDBA
```

### 3. 动态注册数据源

```java
import org.anyline.data.datasource.DataSourceHolder;
import com.alibaba.druid.pool.DruidDataSource;
import javax.sql.DataSource;

public class DynamicDataSourceConfig {
    
    /**
     * 动态注册虚谷数据库数据源
     */
    public void registerXuguDataSource() {
        // 创建 Druid 数据源
        DruidDataSource dataSource = new DruidDataSource();
        dataSource.setDriverClassName("com.xugu.cloudjdbc.Driver");
        dataSource.setUrl("jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL");
        dataSource.setUsername("SYSDBA");
        dataSource.setPassword("SYSDBA");
        
        // 连接池配置
        dataSource.setInitialSize(5);
        dataSource.setMinIdle(5);
        dataSource.setMaxActive(20);
        dataSource.setMaxWait(60000);
        dataSource.setTimeBetweenEvictionRunsMillis(60000);
        dataSource.setMinEvictableIdleTimeMillis(300000);
        dataSource.setValidationQuery("SELECT 1");
        dataSource.setTestWhileIdle(true);
        dataSource.setTestOnBorrow(false);
        dataSource.setTestOnReturn(false);
        
        // 注册数据源
        DataSourceHolder.reg("xugu-main", dataSource);
    }
    
    /**
     * 通过连接参数动态注册
     */
    public void registerByParams() {
        DataSourceHolder.reg("xugu-report", 
            "druid",           // 连接池类型
            "com.xugu.cloudjdbc.Driver",  // 驱动类名
            "jdbc:xugu://127.0.0.1:5138/REPORT_DB?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL",  // URL
            "SYSDBA",          // 用户名
            "SYSDBA"           // 密码
        );
    }
    
    /**
     * 通过 Map 参数注册
     */
    public void registerByMap() {
        Map<String, Object> params = new HashMap<>();
        params.put("driver", "com.xugu.cloudjdbc.Driver");
        params.put("url", "jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL");
        params.put("user", "SYSDBA");
        params.put("password", "SYSDBA");
        
        DataSourceHolder.reg("xugu-custom", params);
    }
    
    /**
     * 切换数据源
     */
    public void switchDataSource() {
        // 切换到指定数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 执行业务操作...
        
        // 切换回默认数据源
        DataSourceHolder.switcher("default");
    }
}
```

## 核心功能

### 1. 数据操作（DML）

**查询数据：**

```java
import org.anyline.data.service.AnylineService;
import org.anyline.data.DataRow;
import org.anyline.data.DataSet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    
    @Autowired
    private AnylineService service;
    
    /**
     * 查询用户列表
     */
    public DataSet<DataRow> queryUsers(String name, String email) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 构建查询条件
        // 条件格式: "字段:参数", "字段:[参数]"表示IN查询
        DataSet<DataRow> dataSet = service.queries("SSO_USER", 
            condition(true, "NAME:%name%", "EMAIL:%email%"));
        
        return dataSet;
    }
    
    /**
     * 分页查询
     */
    public DataSet<DataRow> queryUsersWithPage(int page, int size, String name) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 构建分页配置
        ConfigStore configs = new ConfigStore();
        configs.setPage(page);
        configs.setRows(size);
        
        // 添加查询条件
        if (name != null && !name.isEmpty()) {
            configs.addCondition("NAME", "like", "%" + name + "%");
        }
        
        // 执行查询
        DataSet<DataRow> dataSet = service.select("SSO_USER", configs);
        
        return dataSet;
    }
    
    /**
     * 插入用户
     */
    public int insertUser(String name, String email, String phone) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 构建数据行
        DataRow row = new DataRow();
        row.put("NAME", name);
        row.put("EMAIL", email);
        row.put("PHONE", phone);
        row.put("CREATE_TIME", new java.util.Date());
        
        // 执行插入
        return service.insert("SSO_USER", row);
    }
    
    /**
     * 更新用户
     */
    public int updateUser(Long id, String name, String email) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 构建更新数据
        DataRow row = new DataRow();
        row.put("NAME", name);
        row.put("EMAIL", email);
        row.put("UPDATE_TIME", new java.util.Date());
        
        // 构建条件
        Condition condition = new Condition();
        condition.eq("ID", id);
        
        // 执行更新
        return service.update("SSO_USER", row, condition);
    }
    
    /**
     * 删除用户
     */
    public int deleteUser(Long id) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 构建条件
        Condition condition = new Condition();
        condition.eq("ID", id);
        
        // 执行删除
        return service.delete("SSO_USER", condition);
    }
}
```

### 2. 元数据操作

**读取表结构：**

```java
import org.anyline.data.metadata.Table;
import org.anyline.data.metadata.Column;
import org.anyline.data.metadata.Constraint;
import java.util.LinkedHashMap;
import java.util.List;

public class MetadataService {
    
    @Autowired
    private AnylineService service;
    
    /**
     * 获取表结构信息
     */
    public Table getTableStructure(String tableName) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 获取表元数据
        Table table = service.metadata().table(tableName);
        
        // 获取所有列
        LinkedHashMap<String, Column> columns = table.getColumns();
        for (Map.Entry<String, Column> entry : columns.entrySet()) {
            Column column = entry.getValue();
            System.out.println("列名: " + column.getName());
            System.out.println("类型: " + column.getType());
            System.out.println("长度: " + column.getLength());
            System.out.println("注释: " + column.getComment());
            System.out.println("是否主键: " + column.isPrimary());
            System.out.println("是否自增: " + column.isAutoIncrement());
            System.out.println("---");
        }
        
        // 获取约束
        LinkedHashMap<String, Constraint> constraints = table.getConstraints();
        for (Map.Entry<String, Constraint> entry : constraints.entrySet()) {
            Constraint constraint = entry.getValue();
            System.out.println("约束名: " + constraint.getName());
            System.out.println("类型: " + constraint.getType());
            System.out.println("列: " + constraint.getColumns());
            System.out.println("---");
        }
        
        // 获取建表 DDL
        List<String> ddls = table.getDdls();
        for (String ddl : ddls) {
            System.out.println("DDL: " + ddl);
        }
        
        return table;
    }
    
    /**
     * 获取所有表名
     */
    public List<String> getAllTables() {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 获取所有表
        List<Table> tables = service.metadata().tables();
        
        return tables.stream()
                     .map(Table::getName)
                     .collect(Collectors.toList());
    }
}
```

### 3. DDL 操作

**创建表：**

```java
import org.anyline.data.metadata.Table;
import org.anyline.data.metadata.Column;

public class DDLService {
    
    @Autowired
    private AnylineService service;
    
    /**
     * 创建新表
     */
    public void createTable() {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 创建表对象
        Table table = new Table("NEW_TABLE");
        
        // 添加列
        table.addColumn("ID", "BIGINT")
             .autoIncrement(true)
             .setPrimary(true)
             .setComment("主键ID");
        
        table.addColumn("CODE", "VARCHAR(20)")
             .setNotNull(true)
             .setComment("编码");
        
        table.addColumn("NAME", "VARCHAR(100)")
             .setComment("名称");
        
        table.addColumn("DESCRIPTION", "VARCHAR(500)")
             .setComment("描述");
        
        table.addColumn("STATUS", "TINYINT")
             .setDefaultValue("1")
             .setComment("状态：1-启用，0-禁用");
        
        table.addColumn("CREATE_TIME", "TIMESTAMP")
             .setDefaultValue("CURRENT_TIMESTAMP")
             .setComment("创建时间");
        
        table.addColumn("UPDATE_TIME", "TIMESTAMP")
             .setDefaultValue("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
             .setComment("更新时间");
        
        // 设置表注释
        table.setComment("新表");
        
        // 执行创建
        service.ddl().create(table);
    }
    
    /**
     * 修改表结构
     */
    public void alterTable() {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 获取现有表结构
        Table table = service.metadata().table("EXISTING_TABLE");
        
        // 添加新列
        table.addColumn("NEW_COLUMN", "VARCHAR(50)")
             .setComment("新列");
        
        // 修改列
        table.getColumn("EXISTING_COLUMN")
             .setType("VARCHAR(200)")
             .setComment("修改后的列");
        
        // 执行修改
        service.ddl().alter(table);
    }
    
    /**
     * 删除表
     */
    public void dropTable(String tableName) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 执行删除
        service.ddl().drop(tableName);
    }
    
    /**
     * 智能保存表结构（自动判断差异）
     */
    public void saveTable(Table table) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 智能保存：自动判断需要 ADD 或 ALTER 的列
        service.ddl().save(table);
    }
}
```

### 4. 事务管理

**编程式事务：**

```java
import org.anyline.data.transaction.TransactionProxy;
import org.anyline.data.transaction.TransactionState;

public class TransactionService {
    
    @Autowired
    private AnylineService service;
    
    /**
     * 编程式事务示例
     */
    public void executeWithTransaction() {
        // 开启事务并指定数据源
        TransactionState state = TransactionProxy.start("xugu-main");
        
        try {
            // 执行业务操作
            DataRow user = new DataRow();
            user.put("NAME", "张三");
            user.put("EMAIL", "zhangsan@example.com");
            service.insert("SSO_USER", user);
            
            // 执行其他操作
            DataRow order = new DataRow();
            order.put("USER_ID", user.get("ID"));
            order.put("PRODUCT_ID", 1001);
            order.put("AMOUNT", 100.00);
            service.insert("ORDERS", order);
            
            // 提交事务
            TransactionProxy.commit(state);
        } catch (Exception e) {
            // 回滚事务
            TransactionProxy.rollback(state);
            throw e;
        }
    }
    
    /**
     * 多数据源事务示例
     */
    public void executeWithMultiDataSourceTransaction() {
        // 开启主数据源事务
        TransactionState mainState = TransactionProxy.start("xugu-main");
        // 开启报表数据源事务
        TransactionState reportState = TransactionProxy.start("xugu-report");
        
        try {
            // 在主数据源执行操作
            DataSourceHolder.switcher("xugu-main");
            DataRow user = new DataRow();
            user.put("NAME", "李四");
            service.insert("SSO_USER", user);
            
            // 在报表数据源执行操作
            DataSourceHolder.switcher("xugu-report");
            DataRow report = new DataRow();
            report.put("USER_ID", user.get("ID"));
            report.put("REPORT_TYPE", "USER_CREATED");
            service.insert("REPORT_LOG", report);
            
            // 提交两个事务
            TransactionProxy.commit(mainState);
            TransactionProxy.commit(reportState);
        } catch (Exception e) {
            // 回滚两个事务
            TransactionProxy.rollback(mainState);
            TransactionProxy.rollback(reportState);
            throw e;
        }
    }
}
```

## Spring Boot 集成

### 1. 配置类

```java
import org.anyline.data.datasource.DataSourceHolder;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.alibaba.druid.pool.DruidDataSource;
import javax.sql.DataSource;

@Configuration
public class AnyLineConfiguration {
    
    /**
     * 主数据源配置
     */
    @Bean
    @ConfigurationProperties(prefix = "anyline.datasource")
    public DataSource primaryDataSource() {
        return new DruidDataSource();
    }
    
    /**
     * 报表数据源配置
     */
    @Bean
    @ConfigurationProperties(prefix = "anyline.datasource.xugu-report")
    public DataSource reportDataSource() {
        return new DruidDataSource();
    }
    
    /**
     * 初始化数据源注册
     */
    @Bean
    public DataSourceInitializer dataSourceInitializer(
            DataSource primaryDataSource,
            DataSource reportDataSource) {
        return new DataSourceInitializer(primaryDataSource, reportDataSource);
    }
}

@Component
public class DataSourceInitializer implements InitializingBean {
    
    private final DataSource primaryDataSource;
    private final DataSource reportDataSource;
    
    public DataSourceInitializer(DataSource primaryDataSource, DataSource reportDataSource) {
        this.primaryDataSource = primaryDataSource;
        this.reportDataSource = reportDataSource;
    }
    
    @Override
    public void afterPropertiesSet() throws Exception {
        // 注册主数据源
        DataSourceHolder.reg("xugu-main", primaryDataSource);
        
        // 注册报表数据源
        DataSourceHolder.reg("xugu-report", reportDataSource);
        
        // 设置默认数据源
        DataSourceHolder.switcher("xugu-main");
    }
}
```

### 2. Service 使用示例

```java
import org.anyline.data.service.AnylineService;
import org.anyline.data.DataRow;
import org.anyline.data.DataSet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserService {
    
    @Autowired
    private AnylineService service;
    
    /**
     * 查询用户列表
     */
    public DataSet<DataRow> queryUsers(String name, String email) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 构建查询条件
        // 条件格式: "字段:参数", "字段:[参数]"表示IN查询
        DataSet<DataRow> dataSet = service.queries("SSO_USER", 
            condition(true, "NAME:%name%", "EMAIL:%email%"));
        
        return dataSet;
    }
    
    /**
     * 分页查询
     */
    public DataSet<DataRow> queryUsersWithPage(int page, int size, String name) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 构建分页配置
        ConfigStore configs = new ConfigStore();
        configs.setPage(page);
        configs.setRows(size);
        
        // 添加查询条件
        if (name != null && !name.isEmpty()) {
            configs.addCondition("NAME", "like", "%" + name + "%");
        }
        
        // 执行查询
        DataSet<DataRow> dataSet = service.select("SSO_USER", configs);
        
        return dataSet;
    }
    
    /**
     * 插入用户
     */
    public int insertUser(String name, String email, String phone) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 构建数据行
        DataRow row = new DataRow();
        row.put("NAME", name);
        row.put("EMAIL", email);
        row.put("PHONE", phone);
        row.put("CREATE_TIME", new java.util.Date());
        
        // 执行插入
        return service.insert("SSO_USER", row);
    }
    
    /**
     * 更新用户
     */
    public int updateUser(Long id, String name, String email) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 构建更新数据
        DataRow row = new DataRow();
        row.put("NAME", name);
        row.put("EMAIL", email);
        row.put("UPDATE_TIME", new java.util.Date());
        
        // 构建条件
        Condition condition = new Condition();
        condition.eq("ID", id);
        
        // 执行更新
        return service.update("SSO_USER", row, condition);
    }
    
    /**
     * 删除用户
     */
    public int deleteUser(Long id) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 构建条件
        Condition condition = new Condition();
        condition.eq("ID", id);
        
        // 执行删除
        return service.delete("SSO_USER", condition);
    }
    
    /**
     * 查询报表数据
     */
    public DataSet<DataRow> queryReportData(String reportType) {
        // 切换到报表数据源
        DataSourceHolder.switcher("xugu-report");
        
        // 构建查询条件
        Condition condition = new Condition();
        condition.eq("REPORT_TYPE", reportType);
        
        // 执行查询
        DataSet<DataRow> dataSet = service.select("REPORT_DATA", condition);
        
        return dataSet;
    }
}
```

## 批量操作

### 1. 批量插入

```java
import org.anyline.data.DataRow;
import org.anyline.data.DataSet;
import java.util.ArrayList;
import java.util.List;

public class BatchService {
    
    @Autowired
    private AnylineService service;
    
    /**
     * 批量插入
     */
    public int[] batchInsert(List<UserDto> users) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 构建数据集
        DataSet<DataRow> dataSet = new DataSet<>();
        for (UserDto user : users) {
            DataRow row = new DataRow();
            row.put("NAME", user.getName());
            row.put("EMAIL", user.getEmail());
            row.put("PHONE", user.getPhone());
            row.put("CREATE_TIME", new java.util.Date());
            dataSet.add(row);
        }
        
        // 执行批量插入
        return service.insert("SSO_USER", dataSet);
    }
    
    /**
     * 批量更新
     */
    public int[] batchUpdate(List<UserDto> users) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 构建更新数据
        DataSet<DataRow> dataSet = new DataSet<>();
        List<Condition> conditions = new ArrayList<>();
        
        for (UserDto user : users) {
            DataRow row = new DataRow();
            row.put("NAME", user.getName());
            row.put("EMAIL", user.getEmail());
            row.put("UPDATE_TIME", new java.util.Date());
            dataSet.add(row);
            
            Condition condition = new Condition();
            condition.eq("ID", user.getId());
            conditions.add(condition);
        }
        
        // 执行批量更新
        return service.update("SSO_USER", dataSet, conditions);
    }
    
    /**
     * 批量删除
     */
    public int[] batchDelete(List<Long> ids) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 构建条件
        Condition condition = new Condition();
        condition.in("ID", ids);
        
        // 执行批量删除
        return service.delete("SSO_USER", condition);
    }
}
```

## 性能优化

### 1. 连接池优化

```java
import com.alibaba.druid.pool.DruidDataSource;

public class DataSourceOptimizer {
    
    /**
     * 优化 Druid 连接池配置
     */
    public DruidDataSource createOptimizedDataSource() {
        DruidDataSource dataSource = new DruidDataSource();
        
        // 基础配置
        dataSource.setDriverClassName("com.xugu.cloudjdbc.Driver");
        dataSource.setUrl("jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL");
        dataSource.setUsername("SYSDBA");
        dataSource.setPassword("SYSDBA");
        
        // 连接池优化配置
        dataSource.setInitialSize(10);           // 初始连接数
        dataSource.setMinIdle(10);               // 最小空闲连接数
        dataSource.setMaxActive(50);             // 最大连接数
        dataSource.setMaxWait(60000);            // 获取连接超时时间（毫秒）
        
        // 连接生命周期
        dataSource.setTimeBetweenEvictionRunsMillis(60000);  // 检测间隔（毫秒）
        dataSource.setMinEvictableIdleTimeMillis(300000);    // 最小空闲时间（毫秒）
        dataSource.setMaxEvictableIdleTimeMillis(900000);    // 最大空闲时间（毫秒）
        
        // 连接验证
        dataSource.setValidationQuery("SELECT 1");
        dataSource.setTestWhileIdle(true);
        dataSource.setTestOnBorrow(false);
        dataSource.setTestOnReturn(false);
        
        // 预处理语句缓存
        dataSource.setPoolPreparedStatements(true);
        dataSource.setMaxPoolPreparedStatementPerConnectionSize(20);
        
        // 监控统计
        dataSource.setFilters("stat,wall");
        dataSource.setUseGlobalDataSourceStat(true);
        dataSource.setConnectionProperties("druid.stat.mergeSql=true;druid.stat.slowSqlMillis=5000");
        
        // 连接泄漏检测
        dataSource.setRemoveAbandoned(true);
        dataSource.setRemoveAbandonedTimeout(300);
        dataSource.setLogAbandoned(true);
        
        return dataSource;
    }
}
```

### 2. 查询优化

```java
public class QueryOptimizer {
    
    @Autowired
    private AnylineService service;
    
    /**
     * 使用索引优化查询
     */
    public DataSet<DataRow> optimizedQuery(String name, String email) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 构建查询条件（确保使用索引字段）
        Condition condition = new Condition();
        condition.eq("EMAIL", email);  // EMAIL 字段有索引
        if (name != null && !name.isEmpty()) {
            condition.like("NAME", "%" + name + "%");  // NAME 字段有索引
        }
        
        // 执行查询
        return service.select("SSO_USER", condition);
    }
    
    /**
     * 分页查询优化
     */
    public DataSet<DataRow> optimizedPageQuery(int page, int size) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 构建分页配置
        ConfigStore configs = new ConfigStore();
        configs.setPage(page);
        configs.setRows(size);
        
        // 使用覆盖索引优化
        configs.setFields("ID", "NAME", "EMAIL");
        
        // 按主键排序
        configs.setOrder("ID", true);
        
        // 执行查询
        return service.select("SSO_USER", configs);
    }
    
    /**
     * 批量查询优化
     */
    public DataSet<DataRow> optimizedBatchQuery(List<Long> ids) {
        // 切换到主数据源
        DataSourceHolder.switcher("xugu-main");
        
        // 分批查询，避免 IN 子句过大
        int batchSize = 1000;
        DataSet<DataRow> result = new DataSet<>();
        
        for (int i = 0; i < ids.size(); i += batchSize) {
            List<Long> batchIds = ids.subList(i, Math.min(i + batchSize, ids.size()));
            
            Condition condition = new Condition();
            condition.in("ID", batchIds);
            
            DataSet<DataRow> batch = service.select("SSO_USER", condition);
            result.addAll(batch);
        }
        
        return result;
    }
}
```

## 测试配置

### 1. 单元测试

```java
import org.anyline.data.service.AnylineService;
import org.anyline.data.DataRow;
import org.anyline.data.DataSet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class UserServiceTest {
    
    @Autowired
    private AnylineService service;
    
    @Autowired
    private UserService userService;
    
    @BeforeEach
    void setUp() {
        // 切换到测试数据源
        DataSourceHolder.switcher("xugu-test");
    }
    
    @Test
    void testQueryUsers() {
        DataSet<DataRow> users = userService.queryUsers("张三", null);
        assertNotNull(users);
        assertTrue(users.size() > 0);
    }
    
    @Test
    void testInsertUser() {
        int result = userService.insertUser("测试用户", "test@example.com", "13800138000");
        assertEquals(1, result);
    }
    
    @Test
    void testUpdateUser() {
        int result = userService.updateUser(1L, "更新用户", "updated@example.com");
        assertEquals(1, result);
    }
    
    @Test
    void testDeleteUser() {
        int result = userService.deleteUser(1L);
        assertEquals(1, result);
    }
}
```

### 2. 集成测试

```java
import org.anyline.data.datasource.DataSourceHolder;
import org.anyline.data.transaction.TransactionProxy;
import org.anyline.data.transaction.TransactionState;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("integration")
@Transactional
class UserServiceIntegrationTest {
    
    @Autowired
    private UserService userService;
    
    @Test
    void testUserWorkflow() {
        // 1. 创建用户
        int insertResult = userService.insertUser("集成测试用户", "integration@example.com", "13900139000");
        assertEquals(1, insertResult);
        
        // 2. 查询用户
        DataSet<DataRow> users = userService.queryUsers("集成测试用户", null);
        assertNotNull(users);
        assertEquals(1, users.size());
        
        // 3. 更新用户
        Long userId = users.get(0).getLong("ID");
        int updateResult = userService.updateUser(userId, "更新后的用户", "updated@example.com");
        assertEquals(1, updateResult);
        
        // 4. 删除用户
        int deleteResult = userService.deleteUser(userId);
        assertEquals(1, deleteResult);
    }
    
    @Test
    void testMultiDataSourceTransaction() {
        // 测试多数据源事务
        TransactionService transactionService = new TransactionService();
        
        // 执行多数据源事务操作
        transactionService.executeWithMultiDataSourceTransaction();
        
        // 验证数据一致性
        // ... 添加验证逻辑
    }
}
```

## 常见问题与解决方案

### 1. 数据源切换失败

**问题**：切换数据源后，查询仍然使用旧数据源。

**解决方案**：
- 确保在每次操作前调用 `DataSourceHolder.switcher("数据源名称")`
- 检查数据源是否已正确注册
- 使用 `DataSourceHolder.current()` 验证当前数据源

### 2. 事务不生效

**问题**：事务回滚不生效。

**解决方案**：
- 使用 `TransactionProxy` 管理事务，而不是 Spring 的 `@Transactional`
- 确保在事务范围内完成所有操作
- 检查数据库连接的自动提交设置

### 3. 元数据读取失败

**问题**：无法读取虚谷数据库的表结构。

**解决方案**：
- 确保虚谷数据库连接字符串中包含 `COMPATIBLE_MODE=MYSQL`
- 检查用户是否有足够的权限读取元数据
- 验证虚谷数据库驱动版本是否兼容

### 4. 性能问题

**问题**：查询性能不佳。

**解决方案**：
- 为常用查询字段创建索引
- 优化连接池配置
- 使用批量操作减少数据库往返
- 避免在循环中切换数据源

## 最佳实践

1. **数据源管理**：使用统一的命名规范管理数据源
2. **连接池配置**：根据业务负载优化连接池参数
3. **事务管理**：对于跨数据源操作，使用编程式事务管理
4. **元数据操作**：谨慎执行 DDL 操作，建议在维护窗口进行
5. **性能优化**：为常用查询创建索引，使用批量操作
6. **异常处理**：捕获并处理数据库异常，记录详细日志
7. **监控告警**：配置数据库连接池监控和慢查询告警
8. **版本管理**：使用数据库迁移工具管理 schema 变更

## 相关资源

- [AnyLine 官方文档](http://doc.anyline.org/)
- [AnyLine GitHub 仓库](https://github.com/anylineorg/anyline)
- [虚谷数据库官方文档](https://www.xugudb.com)
- [Druid 连接池文档](https://github.com/alibaba/druid)

## 参考文档

详细配置信息请参考：`references/anyline-configuration.md`
