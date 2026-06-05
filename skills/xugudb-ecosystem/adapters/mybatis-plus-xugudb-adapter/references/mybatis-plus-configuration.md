# MyBatis-Plus 虚谷数据库配置指南

## 概述

本文档提供 MyBatis-Plus 框架适配虚谷数据库(XuguDB)的完整配置指南，包括依赖配置、数据源配置、分页插件配置、代码生成器配置等。

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
- `current_schema`: 当前模式名（如RY）
- `CHAR_SET`: 字符集（推荐UTF8）
- `COMPATIBLE_MODE`: 兼容模式（MYSQL/ORACLE/POSTGRESQL）

### 1.3 示例 URL
```
jdbc:xugu://localhost:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

## 二、依赖配置

### 2.1 Maven 依赖

#### MyBatis-Plus 依赖
```xml
<!-- MyBatis-Plus 框架 -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.5.2</version>
</dependency>
```

#### JDBC 驱动依赖
```xml
<!-- 虚谷JDBC驱动 -->
<dependency>
    <groupId>com.xugudb</groupId>
    <artifactId>xugu-jdbc</artifactId>
    <version>12.3.4</version>
</dependency>
```

#### 数据库连接池依赖（可选）
```xml
<!-- Druid 连接池 -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>1.2.6</version>
</dependency>
```

### 2.2 Gradle 依赖

```groovy
// MyBatis-Plus 框架
implementation("com.baomidou:mybatis-plus-boot-starter:3.5.2")
// 虚谷JDBC驱动
implementation("com.xugudb:xugu-jdbc:12.3.4")
// Druid 连接池（可选）
implementation("com.alibaba:druid-spring-boot-starter:1.2.6")
```

## 三、数据源配置

### 3.1 application.yml 配置

```yaml
spring:
  datasource:
    driver-class-name: com.xugu.cloudjdbc.Driver
    url: jdbc:xugu://localhost:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: SYSDBA
    password: SYSDBA
```

### 3.2 Druid 连接池配置

```yaml
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    driver-class-name: com.xugu.cloudjdbc.Driver
    url: jdbc:xugu://localhost:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: SYSDBA
    password: SYSDBA
    druid:
      initial-size: 5
      min-idle: 10
      max-active: 20
      max-wait: 60000
      validation-query: SELECT 1
      test-while-idle: true
      test-on-borrow: false
      test-on-return: false
```

### 3.3 HikariCP 连接池配置

```yaml
spring:
  datasource:
    hikari:
      driver-class-name: com.xugu.cloudjdbc.Driver
      jdbc-url: jdbc:xugu://localhost:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
      username: SYSDBA
      password: SYSDBA
      minimum-idle: 5
      maximum-pool-size: 20
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      connection-test-query: SELECT 1
```

## 四、MyBatis-Plus 核心配置

### 4.1 基础配置

```yaml
mybatis-plus:
  configuration:
    # 开启驼峰命名自动映射
    map-underscore-to-camel-case: true
    # 是否开启 MyBatis 二级缓存
    cache-enabled: false
    # MyBatis 一级缓存作用范围
    local-cache-scope: statement
    # 指定 MyBatis 的执行器类型
    default-executor-type: reuse
    # 开启 SQL 日志（开发环境）
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  # 指定 Mapper XML 文件路径
  mapper-locations: classpath*:/mapper/**/*.xml
  # 全局配置
  global-config:
    db-config:
      # 主键生成策略
      id-type: auto
      # 逻辑删除字段
      logic-delete-field: deleted
      # 逻辑删除值
      logic-delete-value: 1
      # 逻辑未删除值
      logic-not-delete-value: 0
```

### 4.2 分页插件配置

```java
import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MybatisPlusConfig {

    /**
     * 配置 MybatisPlus 分页插件
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 指定数据库类型为 OTHER 或根据实际测试选择最匹配的
        PaginationInnerInterceptor paginationInterceptor = new PaginationInnerInterceptor(DbType.OTHER);
        interceptor.addInnerInterceptor(paginationInterceptor);
        return interceptor;
    }
}
```

**关于 DbType 选择：**
- 建议从 `DbType.OTHER` 开始尝试
- 如果分页功能不正常，可以依次尝试 `DbType.MYSQL`、`DbType.POSTGRE_SQL` 等
- 根据虚谷数据库的兼容模式选择相应的 DbType

### 4.3 乐观锁插件配置

```java
import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OptimisticLockerConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 乐观锁插件
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
        return interceptor;
    }
}
```

### 4.4 防全表更新与删除插件

```java
import com.baomidou.mybatisplus.extension.plugins.inner.BlockAttackInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BlockAttackConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 防全表更新与删除插件
        interceptor.addInnerInterceptor(new BlockAttackInnerInterceptor());
        return interceptor;
    }
}
```

## 五、代码生成器配置

### 5.1 依赖配置

```xml
<!-- 代码生成器 -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-generator</artifactId>
    <version>3.5.2</version>
</dependency>

<!-- 模板引擎 -->
<dependency>
    <groupId>org.freemarker</groupId>
    <artifactId>freemarker</artifactId>
    <version>2.3.31</version>
</dependency>
```

### 5.2 代码生成器示例

```java
import com.baomidou.mybatisplus.generator.FastAutoGenerator;
import com.baomidou.mybatisplus.generator.config.OutputFile;
import com.baomidou.mybatisplus.generator.engine.FreemarkerTemplateEngine;

import java.util.Collections;

public class CodeGenerator {

    public static void main(String[] args) {
        FastAutoGenerator.create(
                "jdbc:xugu://localhost:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL",
                "SYSDBA",
                "SYSDBA"
            )
            .globalConfig(builder -> {
                builder.author("your-name")
                    .outputDir(System.getProperty("user.dir") + "/src/main/java")
                    .disableOpenDir();
            })
            .packageConfig(builder -> {
                builder.parent("com.example")
                    .moduleName("demo")
                    .pathInfo(Collections.singleton(OutputFile.xml, 
                        System.getProperty("user.dir") + "/src/main/resources/mapper"));
            })
            .strategyConfig(builder -> {
                builder.addInclude("your_table_name") // 设置需要生成的表名
                    .addTablePrefix("t_", "c_") // 设置过滤表前缀
                    .entityBuilder()
                    .enableLombok()
                    .enableTableFieldAnnotation()
                    .controllerBuilder()
                    .enableRestStyle()
                    .serviceBuilder()
                    .formatServiceFileName("%sService");
            })
            .templateEngine(new FreemarkerTemplateEngine())
            .execute();
    }
}
```

## 六、实体类配置

### 6.1 实体类示例

```java
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_user")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("user_name")
    private String userName;

    @TableField("nick_name")
    private String nickName;

    @TableField("email")
    private String email;

    @TableField("phonenumber")
    private String phoneNumber;

    @TableField("sex")
    private String sex;

    @TableField("avatar")
    private String avatar;

    @TableField("password")
    private String password;

    @TableField("status")
    private String status;

    @TableField("del_flag")
    @TableLogic
    private String delFlag;

    @TableField("login_ip")
    private String loginIp;

    @TableField("login_date")
    private LocalDateTime loginDate;

    @TableField("create_by")
    private String createBy;

    @TableField("create_time")
    private LocalDateTime createTime;

    @TableField("update_by")
    private String updateBy;

    @TableField("update_time")
    private LocalDateTime updateTime;

    @TableField("remark")
    private String remark;
}
```

### 6.2 Mapper 接口示例

```java
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
    // 可以在这里定义自定义方法
}
```

### 6.3 Service 接口示例

```java
import com.baomidou.mybatisplus.extension.service.IService;

public interface UserService extends IService<User> {
    // 可以在这里定义自定义方法
}
```

### 6.4 Service 实现类示例

```java
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {
    // 可以在这里实现自定义方法
}
```

## 七、常见问题排查

### 7.1 驱动类找不到

**现象：** 启动时报错 `Driver class not found`

**原因：** JDBC 驱动未正确引入

**解决：** 确保 `xugu-jdbc` 依赖已正确配置

### 7.2 连接 URL 错误

**现象：** 连接时报错 `Invalid connection URL` 或 `Schema not found`

**原因：** URL 参数错误，特别是 `current_schema` 参数

**解决：** 确保使用 `current_schema=模式名` 而不是 `schema=模式名`

### 7.3 分页查询异常

**现象：** 分页查询报错或结果不正确

**原因：** 分页插件配置错误或 DbType 选择不当

**解决：** 
- 尝试使用 `DbType.OTHER`
- 如果不行，尝试 `DbType.MYSQL` 或 `DbType.POSTGRE_SQL`
- 检查 SQL 语法兼容性

### 7.4 主键生成策略问题

**现象：** 主键生成失败或值重复

**原因：** 主键生成策略配置不当

**解决：** 
- 使用 `IdType.AUTO` 配合自增列
- 使用 `IdType.ASSIGN_ID` 配合雪花算法
- 使用 `IdType.ASSIGN_UUID` 配合 UUID 生成

### 7.5 逻辑删除问题

**现象：** 逻辑删除功能不正常

**原因：** 逻辑删除配置不正确

**解决：** 
- 确保实体类中使用 `@TableLogic` 注解
- 确保数据库表有相应的逻辑删除字段
- 检查逻辑删除值配置

### 7.6 驼峰命名映射问题

**现象：** 字段映射失败，查询结果为 null

**原因：** 驼峰命名映射配置不正确

**解决：** 
- 确保 `map-underscore-to-camel-case` 设置为 `true`
- 或者使用 `@TableField` 注解明确指定字段名

## 八、最佳实践

### 8.1 版本管理
- 始终保持 MyBatis-Plus 版本与 Spring Boot 版本兼容
- 定期检查 MyBatis-Plus 官方发布的更新

### 8.2 配置管理
- 使用外部化配置（如 application.yml）
- 为不同环境使用不同配置
- 敏感信息使用环境变量或加密存储

### 8.3 性能优化
- 合理配置连接池参数
- 启用批量操作
- 使用二级缓存（如 Ehcache、Redis）
- 避免 N+1 查询问题

### 8.4 安全性
- 使用最小权限原则配置数据库用户
- 定期更换数据库密码
- 启用 SSL 加密连接（生产环境）

### 8.5 代码规范
- 使用 Lombok 简化实体类代码
- 使用 `@Mapper` 注解标记 Mapper 接口
- 遵循 MyBatis-Plus 的命名规范

## 九、参考资源

### 9.1 官方文档
- [MyBatis-Plus 官方文档](https://baomidou.com/)
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [虚谷数据库 MyBatis-Plus 示例](https://help.xugudb.com/content/ecosystem/orm/java/mybatis-plus)

### 9.2 示例项目
- [虚谷 MyBatis-Plus 示例](https://gitee.com/XuguDB/xugu-mysplus-demo)
- [MyBatis-Plus 示例项目](https://github.com/baomidou/mybatis-plus-samples)

### 9.3 社区资源
- [虚谷数据库社区](https://www.xugudb.com/)
- [MyBatis-Plus 社区](https://baomidou.com/guide/community.html)