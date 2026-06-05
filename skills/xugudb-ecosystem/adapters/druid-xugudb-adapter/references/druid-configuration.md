# Druid 连接池虚谷数据库配置指南

## 概述

本文档提供 Druid 连接池适配虚谷数据库(XuguDB)的完整配置指南，包括依赖配置、连接池配置、监控配置、WallFilter 配置、多数据源配置等。

## 一、核心配置信息

### 1.1 JDBC 驱动类
```
com.xugu.cloudjdbc.Driver
```

### 1.2 连接 URL 格式
```
jdbc:xugu://<host>:<port>/<database>?char_set=UTF8
```

**参数说明：**
- `<host>`: 数据库服务器地址
- `<port>`: 数据库端口（默认5138）
- `<database>`: 数据库名（如SYSTEM）
- `char_set`: 字符集（推荐UTF8）

### 1.3 示例 URL
```
jdbc:xugu://127.0.0.1:5135/system?char_set=UTF8
```

## 二、依赖配置

### 2.1 使用虚谷适配版 Druid

**重要：** 必须使用虚谷官方提供的适配版 Druid，而非阿里云原版。

#### 从源码编译安装

1. 从虚谷数据库开放源代码仓库下载指定版本（如 `xugu-druid-1.1.24`）的源码
2. 在项目根目录执行 Maven 命令：

```shell
mvn install:install-file -Dfile=./lib/druid-1.1.24.jar -DgroupId=com.alibaba -DartifactId=druid -Dversion=1.1.24 -Dpackaging=jar -DgeneratePom=true
```

#### Maven 依赖

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

### 2.2 Spring Boot Starter 依赖

```xml
<!-- Druid Spring Boot Starter -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>1.1.24</version>
</dependency>
```

## 三、连接池配置

### 3.1 单一数据源配置

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

### 3.2 连接池参数说明

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `initialSize` | 初始化连接数 | 5 |
| `minIdle` | 最小空闲连接数 | 10 |
| `maxActive` | 最大活跃连接数 | 20 |
| `maxWait` | 获取连接最大等待时间（毫秒） | 6000 |
| `time-between-eviction-runs-millis` | 空闲连接检测间隔（毫秒） | 2000 |
| `min-evictable-idle-time-millis` | 连接最小空闲时间（毫秒） | 600000 |
| `max-evictable-idle-time-millis` | 连接最大空闲时间（毫秒） | 1800000 |
| `validationQuery` | 连接有效性验证SQL | SELECT 1 |
| `testWhileIdle` | 空闲时是否检测 | true |
| `testOnBorrow` | 借出时是否检测 | false |
| `testOnReturn` | 归还时是否检测 | false |
| `keep-alive` | 保持连接活性 | true |
| `poolPreparedStatements` | 是否缓存PreparedStatement | false |

## 四、监控配置

### 4.1 过滤器配置

```yaml
spring:
  datasource:
    druid:
      filters: wall,stat,log4j2 # 启用Wall（防SQL注入）、Stat（监控统计）、Log4j2（日志）过滤器
      useGlobalDataSourceStat: true
      connectionProperties: druid.stat.mergeSql=true;druid.stat.slowSqlMillis=3000 # 合并SQL、慢SQL阈值
```

### 4.2 Web 监控页面配置

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

### 4.3 监控页面访问

启动应用后，访问 `http://localhost:8080/druid/` 即可查看监控页面。

## 五、WallFilter 配置

### 5.1 WallFilter 基础配置

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

### 5.2 WallFilter 配置参数说明

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `enabled` | 是否启用WallFilter | true |
| `backup-allow` | 允许 BACKUP 语句 | true |
| `restore-allow` | 允许 RESTORE 语句 | true |
| `strictSyntaxCheck` | 严格语法检查 | false（遇到解析错误时） |
| `none-base-statement-allow` | 允许非基表语句 | true（可选） |

### 5.3 WallFilter 常见问题

#### 问题1：`dbType not support : xugu` 错误

**原因：** 使用了未适配的原版 Druid 且开启了 WallFilter

**解决：** 
- 使用虚谷适配版 Druid
- 或关闭 WallFilter（从 `filters` 中移除 `wall`）

#### 问题2：SQL 解析错误 `ParserException`

**原因：** WallFilter 无法解析虚谷特有 SQL

**解决：** 
- 确认 SQL 无风险后，临时关闭严格语法检查：`strictSyntaxCheck: false`
- 或关闭 WallFilter

#### 问题3：SQL 注入违规 `sql injection violation`

**原因：** SQL 被识别为有风险

**解决：** 
- 检查 WallFilter 的 `config` 项，为所需的虚谷语句设置允许（`xxx-allow: true`）
- 如无需此功能，则关闭 WallFilter

## 六、多数据源配置

### 6.1 使用 dynamic-datasource-spring-boot-starter

```xml
<!-- 动态多数据源 -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>dynamic-datasource-spring-boot-starter</artifactId>
    <version>3.5.0</version>
</dependency>
```

### 6.2 多数据源配置示例

```yaml
spring:
  autoconfigure:
    exclude: com.alibaba.druid.spring.boot.autoconfigure.DruidDataSourceAutoConfigure
  datasource:
    druid:
      # 仅配置Web监控页面和统计滤镜
      web-stat-filter:
        enabled: true
        url-pattern: /*
        exclusions: /druid/*,*.js,*.css,*.gif,*.jpg,*.bmp,*.png,*.ico
      stat-view-servlet:
        enabled: true
        url-pattern: /druid/*
        reset-enable: false
    dynamic:
      primary: master # 默认数据源
      strict: false
      datasource:
        master:
          url: jdbc:xugu://127.0.0.1:5135/system?char_set=UTF8
          username: SYSDBA
          password: SYSDBA
          driver-class-name: com.xugu.cloudjdbc.Driver
          druid:
            # 完整的连接池、过滤器（wall, stat）、WallFilter配置
            filters: wall,stat,log4j2
            initialSize: 5
            minIdle: 10
            maxActive: 20
            maxWait: 6000
            validationQuery: SELECT 1
            testWhileIdle: true
            testOnBorrow: false
            testOnReturn: false
            wall:
              config:
                backup-allow: true
                restore-allow: true
        slave:
          url: jdbc:xugu://127.0.0.1:5136/system?char_set=UTF8
          username: SYSDBA
          password: SYSDBA
          driver-class-name: com.xugu.cloudjdbc.Driver
          druid:
            # 从库配置
            filters: wall,stat,log4j2
            initialSize: 5
            minIdle: 10
            maxActive: 20
            maxWait: 6000
            validationQuery: SELECT 1
            testWhileIdle: true
            testOnBorrow: false
            testOnReturn: false
            wall:
              config:
                backup-allow: true
                restore-allow: true
```

## 七、常见问题排查

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

## 八、最佳实践

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

## 九、参考资源

### 9.1 官方文档
- [Druid 官方文档](https://github.com/alibaba/druid/wiki)
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [虚谷数据库 Druid 示例](https://docs.xugudb.com/content/ecosystem/orm/java/druid)

### 9.2 示例项目
- [虚谷 Druid 示例](https://gitee.com/XuguDB/xugu-druid-demo)
- [Druid 示例项目](https://github.com/alibaba/druid/tree/master/druid-demo)

### 9.3 社区资源
- [虚谷数据库社区](https://www.xugudb.com/)
- [Druid 社区](https://github.com/alibaba/druid/issues)