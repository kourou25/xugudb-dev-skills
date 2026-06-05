---
name: druid-xugudb-adapter
description: Druid 连接池适配虚谷数据库(XuguDB)的完整指南。当用户需要将基于 Druid 的数据库连接池配置或适配到虚谷数据库时使用此技能，包括依赖配置、连接池配置、监控配置、WallFilter 配置、多数据源配置等。适用于从 MySQL/Oracle 迁移或新建虚谷数据库项目。
---

# Druid 连接池虚谷数据库适配指南

## 概述

本技能提供 Druid 连接池适配虚谷数据库(XuguDB)的完整流程。Druid 是阿里巴巴开源的高性能数据库连接池和 SQL 解析器，通过适配虚谷数据库，可以实现连接池管理、SQL 监控、安全防护等功能。

## 适配流程

在开始适配前，按以下顺序检查和修改：

```
1. 依赖配置 → 2. 连接池配置 → 3. 监控配置 → 4. WallFilter 配置 → 5. 功能验证 → 6. 性能优化
```

## 第一步：配置依赖

### 使用虚谷适配版 Druid

**重要：** 必须使用虚谷官方提供的适配版 Druid，而非阿里云原版。

#### 从源码编译安装

1. 从虚谷数据库开放源代码仓库下载指定版本（如 `xugu-druid-1.1.24`）的源码
2. 在项目根目录执行 Maven 命令：

```shell
mvn install:install-file -Dfile=./lib/druid-1.1.24.jar -DgroupId=com.alibaba -DartifactId=druid -Dversion=1.1.24 -Dpackaging=jar -DgeneratePom=true
```

#### Maven 依赖配置

```xml
<!-- Druid 连接池（虚谷适配版） -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid</artifactId>
    <version>1.1.24</version>
</dependency>

<!-- 虚谷JDBC驱动 -->
<dependency>
    <groupId>com.xugudb</groupId>
    <artifactId>xugu-jdbc</artifactId>
    <version>12.3.4</version>
</dependency>
```

## 第二步：配置连接池

### 单一数据源配置

```yaml
spring:
  datasource:
    url: jdbc:xugu://127.0.0.1:5135/system?char_set=UTF8
    username: SYSDBA
    password: SYSDBA
    driver-class-name: com.xugu.cloudjdbc.Driver
    type: com.alibaba.druid.pool.DruidDataSource

    druid:
      # ===== 连接池核心配置 =====
      initialSize: 5 # 初始化连接数
      minIdle: 10 # 最小空闲连接数
      maxActive: 20 # 最大活跃连接数
      maxWait: 6000 # 获取连接最大等待时间（毫秒）
      time-between-eviction-runs-millis: 2000 # 空闲连接检测间隔（毫秒）
      min-evictable-idle-time-millis: 600000 # 连接最小空闲时间（毫秒）
      max-evictable-idle-time-millis: 1800000 # 连接最大空闲时间（毫秒）
      validationQuery: SELECT 1 # 连接有效性验证SQL
      testWhileIdle: true # 空闲时是否检测
      testOnBorrow: false # 借出时是否检测（影响性能）
      testOnReturn: false # 归还时是否检测（影响性能）
      keep-alive: true # 保持连接活性
      poolPreparedStatements: false # 是否缓存PreparedStatement
      maxPoolPreparedStatementPerConnectionSize: 0 # 每个连接缓存的PS数量
```

**关键配置说明：**
- `char_set=UTF8`：字符集配置
- `validationQuery: SELECT 1`：虚谷数据库使用 `SELECT 1` 而不是 `SELECT 1 FROM DUAL`
- `testOnBorrow: false`：建议关闭借出时检测，提高性能

## 第三步：配置监控

### 过滤器配置

```yaml
spring:
  datasource:
    druid:
      filters: wall,stat,log4j2 # 启用Wall（防SQL注入）、Stat（监控统计）、Log4j2（日志）过滤器
      useGlobalDataSourceStat: true
      connectionProperties: druid.stat.mergeSql=true;druid.stat.slowSqlMillis=3000 # 合并SQL、慢SQL阈值
```

### Web 监控页面配置

```yaml
spring:
  datasource:
    druid:
      web-stat-filter:
        enabled: true
        url-pattern: /*
        exclusions: /druid/*,*.js,*.css,*.gif,*.jpg,*.bmp,*.png,*.ico
      stat-view-servlet:
        enabled: true
        url-pattern: /druid/* # 监控页面访问路径
        reset-enable: false # 禁用重置按钮
        # login-username: admin # 可选的登录用户名
        # login-password: 123456 # 可选的登录密码
```

**监控页面访问：** 启动应用后，访问 `http://localhost:8080/druid/` 即可查看监控页面。

## 第四步：配置 WallFilter

### WallFilter 基础配置

```yaml
spring:
  datasource:
    druid:
      filter:
        wall:
          enabled: true
          config:
            # 关键：允许虚谷特定的SQL语句
            backup-allow: true # 允许 BACKUP 语句
            restore-allow: true # 允许 RESTORE 语句
            # strictSyntaxCheck: false # 临时关闭严格语法检查（当遇到无法解析的虚谷特有SQL时）
            # none-base-statement-allow: true # 可选：允许非基表语句
```

**WallFilter 配置说明：**
- `backup-allow: true`：允许虚谷数据库的 BACKUP 语句
- `restore-allow: true`：允许虚谷数据库的 RESTORE 语句
- `strictSyntaxCheck: false`：遇到解析错误时临时关闭严格语法检查

## 第五步：功能验证

### 验证基本功能

1. **连接测试**：确保应用能成功连接到虚谷数据库
2. **连接池监控**：访问监控页面查看连接池状态
3. **SQL 监控**：查看 SQL 执行统计和慢 SQL
4. **WallFilter**：测试 SQL 防火墙功能
5. **多数据源**：测试多数据源切换功能

### 验证高级功能

1. **连接泄漏检测**：测试连接泄漏检测功能
2. **慢 SQL 统计**：测试慢 SQL 统计功能
3. **SQL 注入防护**：测试 WallFilter 防护功能
4. **监控告警**：测试监控告警功能
5. **性能分析**：测试性能分析功能

## 第六步：性能优化

### 连接池参数优化

```yaml
spring:
  datasource:
    druid:
      # 根据实际负载调整参数
      initialSize: 10 # 初始化连接数
      minIdle: 20 # 最小空闲连接数
      maxActive: 50 # 最大活跃连接数
      maxWait: 10000 # 获取连接最大等待时间
      time-between-eviction-runs-millis: 60000 # 空闲连接检测间隔
      min-evictable-idle-time-millis: 300000 # 连接最小空闲时间
      max-evictable-idle-time-millis: 900000 # 连接最大空闲时间
```

### 监控优化

```yaml
spring:
  datasource:
    druid:
      connectionProperties: druid.stat.mergeSql=true;druid.stat.slowSqlMillis=5000 # 慢SQL阈值调整为5秒
```

### SQL 优化

1. **使用索引**：为常用查询字段创建索引
2. **避免全表扫描**：确保查询条件包含索引字段
3. **批量操作**：使用批量插入和更新
4. **连接复用**：合理配置连接池参数

## 常见问题排查

### 1. 驱动类找不到

**现象：** 启动时报错 `Driver class not found`

**原因：** JDBC 驱动未正确引入

**解决：** 确保 `xugu-jdbc` 依赖已正确配置

### 2. 连接 URL 错误

**现象：** 连接时报错 `Invalid connection URL`

**原因：** URL 参数错误

**解决：** 确保使用正确的 URL 格式，并包含 `char_set=UTF8`

### 3. `dbType not support : xugu` 错误

**现象：** 启动时报错 `dbType not support : xugu`

**原因：** 使用了未适配的原版 Druid 且开启了 WallFilter

**解决：** 
- 使用虚谷适配版 Druid
- 或关闭 WallFilter（从 `filters` 中移除 `wall`）

### 4. SQL 解析错误 `ParserException`

**现象：** 执行 SQL 时报错 `ParserException`

**原因：** WallFilter 无法解析虚谷特有 SQL

**解决：** 
- 确认 SQL 无风险后，临时关闭严格语法检查：`strictSyntaxCheck: false`
- 或关闭 WallFilter

### 5. SQL 注入违规 `sql injection violation`

**现象：** 执行 SQL 时报错 `sql injection violation`

**原因：** SQL 被识别为有风险

**解决：** 
- 检查 WallFilter 的 `config` 项，为所需的虚谷语句设置允许（`xxx-allow: true`）
- 如无需此功能，则关闭 WallFilter

### 6. 连接超时问题

**现象：** 连接超时

**原因：** Druid v1.2.12+ 默认设置了 10 秒超时，可能覆盖 URL 参数

**解决：** 
- 显式配置 `connect-timeout` 和 `socket-timeout`
- 或升级到已修复的 Druid 版本

### 7. 监控页面无法访问

**现象：** 访问 `/druid/` 路径返回 404

**原因：** 监控页面配置不正确

**解决：** 
- 确保 `stat-view-servlet.enabled` 设置为 `true`
- 检查 `url-pattern` 配置是否正确

## 最佳实践

### 1. 版本管理
- 始终使用虚谷适配版 Druid，而非阿里云原版
- 定期检查虚谷官方发布的适配更新

### 2. 配置管理
- 使用外部化配置（如 application.yml）
- 为不同环境使用不同配置
- 敏感信息使用环境变量或加密存储

### 3. 性能优化
- 合理配置连接池参数
- 启用 SQL 合并和慢 SQL 统计
- 使用监控页面分析性能瓶颈

### 4. 安全性
- 使用 WallFilter 防止 SQL 注入
- 配置监控页面登录认证
- 定期更换数据库密码

### 5. 监控与日志
- 启用监控页面（生产环境建议关闭或限制访问）
- 配置慢 SQL 阈值
- 定期检查连接池状态

## 参考文档

详细的配置指南和故障排除请参考：
- [Druid 连接池虚谷数据库配置指南](references/druid-configuration.md)
- [Druid 官方文档](https://github.com/alibaba/druid/wiki)
- [虚谷数据库官方文档](https://docs.xugudb.com/)