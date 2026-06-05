---
name: mybatis-plus-xugudb-adapter
description: MyBatis-Plus 框架适配虚谷数据库(XuguDB)的完整指南。当用户需要将基于 MyBatis-Plus 的 Java 项目配置或适配到虚谷数据库时使用此技能，包括依赖配置、数据源配置、分页插件配置、代码生成器配置等。适用于从 MySQL/Oracle 迁移或新建虚谷数据库项目。
---

# MyBatis-Plus 虚谷数据库适配指南

## 概述

本技能提供 MyBatis-Plus 框架适配虚谷数据库(XuguDB)的完整流程。虚谷数据库的 JDBC 驱动与 MyBatis-Plus 框架完全兼容，可以无缝集成使用。

## 适配流程

在开始适配前，按以下顺序检查和修改：

```
1. 依赖配置 → 2. 数据源配置 → 3. 分页插件配置 → 4. 代码生成器配置 → 5. 功能验证 → 6. 性能优化
```

## 第一步：配置依赖

### Maven 依赖配置

添加 MyBatis-Plus 和虚谷 JDBC 驱动依赖：

```xml
<!-- MyBatis-Plus 框架 -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.5.2</version>
</dependency>

<!-- 虚谷JDBC驱动 -->
<dependency>
    <groupId>com.xugudb</groupId>
    <artifactId>xugu-jdbc</artifactId>
    <version>12.3.4</version>
</dependency>

<!-- Druid 连接池（可选） -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>1.2.6</version>
</dependency>
```

## 第二步：配置数据源

### application.yml 配置

```yaml
spring:
  datasource:
    driver-class-name: com.xugu.cloudjdbc.Driver
    url: jdbc:xugu://localhost:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
    username: SYSDBA
    password: SYSDBA
```

**关键配置说明：**
- `current_schema`：指定当前模式名（不是数据库名）
- `CHAR_SET=UTF8`：字符集配置
- `COMPATIBLE_MODE=MYSQL`：MySQL兼容模式（可选：ORACLE、POSTGRESQL）

### Druid 连接池配置

```yaml
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
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

## 第三步：配置分页插件

### 分页插件配置类

```java
import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MybatisPlusConfig {

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

## 第四步：配置代码生成器

### 代码生成器依赖

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

### 代码生成器示例

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

## 第五步：功能验证

### 验证基本功能

1. **连接测试**：确保应用能成功连接到虚谷数据库
2. **CRUD 操作**：测试基本的增删改查操作
3. **分页查询**：测试分页功能是否正常
4. **条件查询**：测试 Wrapper 条件查询
5. **关联查询**：测试一对一、一对多、多对多关联

### 验证高级功能

1. **代码生成器**：测试代码生成功能
2. **逻辑删除**：测试逻辑删除功能
3. **自动填充**：测试自动填充功能
4. **乐观锁**：测试乐观锁功能
5. **多租户**：测试多租户功能

## 第六步：性能优化

### 批量操作优化

```yaml
mybatis-plus:
  configuration:
    # 开启批量插入优化
    default-executor-type: batch
```

### 查询优化

1. **避免 N+1 查询**：使用 `@BatchSize` 或 `JOIN` 查询
2. **使用投影查询**：只查询需要的字段
3. **合理使用缓存**：配置二级缓存（如 Ehcache）
4. **索引优化**：为常用查询字段创建索引

### 连接池优化

```yaml
spring:
  datasource:
    druid:
      # 启用监控
      stat-view-servlet:
        enabled: true
      # 启用过滤器
      filters: stat,wall
```

## 常见问题排查

### 1. 驱动类找不到

**现象：** 启动时报错 `Driver class not found`

**原因：** JDBC 驱动未正确引入

**解决：** 确保 `xugu-jdbc` 依赖已正确配置

### 2. 连接 URL 错误

**现象：** 连接时报错 `Invalid connection URL`

**原因：** URL 参数错误

**解决：** 确保使用正确的 URL 格式：
```
jdbc:xugu://host:port/database?current_schema=schema&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

### 3. 分页查询异常

**现象：** 分页查询报错或结果不正确

**原因：** 分页插件配置错误或 DbType 选择不当

**解决：** 
- 尝试使用 `DbType.OTHER`
- 如果不行，尝试 `DbType.MYSQL` 或 `DbType.POSTGRE_SQL`
- 检查 SQL 语法兼容性

### 4. 主键生成策略问题

**现象：** 主键生成失败或值重复

**原因：** 主键生成策略配置不当

**解决：** 
- 使用 `IdType.AUTO` 配合自增列
- 使用 `IdType.ASSIGN_ID` 配合雪花算法
- 使用 `IdType.ASSIGN_UUID` 配合 UUID 生成

### 5. 逻辑删除问题

**现象：** 逻辑删除功能不正常

**原因：** 逻辑删除配置不正确

**解决：** 
- 确保实体类中使用 `@TableLogic` 注解
- 确保数据库表有相应的逻辑删除字段
- 检查逻辑删除值配置

### 6. 驼峰命名映射问题

**现象：** 字段映射失败，查询结果为 null

**原因：** 驼峰命名映射配置不正确

**解决：** 
- 确保 `map-underscore-to-camel-case` 设置为 `true`
- 或者使用 `@TableField` 注解明确指定字段名

## 最佳实践

### 1. 版本管理
- 始终保持 MyBatis-Plus 版本与 Spring Boot 版本兼容
- 定期检查 MyBatis-Plus 官方发布的更新

### 2. 配置管理
- 使用外部化配置（如 application.yml）
- 为不同环境使用不同配置
- 敏感信息使用环境变量或加密存储

### 3. 性能优化
- 合理配置连接池参数
- 启用批量操作
- 使用二级缓存
- 避免 N+1 查询问题

### 4. 安全性
- 使用最小权限原则配置数据库用户
- 定期更换数据库密码
- 启用 SSL 加密连接（生产环境）

### 5. 代码规范
- 使用 Lombok 简化实体类代码
- 使用 `@Mapper` 注解标记 Mapper 接口
- 遵循 MyBatis-Plus 的命名规范

## 参考文档

详细的配置指南和故障排除请参考：
- [MyBatis-Plus 虚谷数据库配置指南](references/mybatis-plus-configuration.md)
- [MyBatis-Plus 官方文档](https://baomidou.com/)
- [虚谷数据库官方文档](https://docs.xugudb.com/)