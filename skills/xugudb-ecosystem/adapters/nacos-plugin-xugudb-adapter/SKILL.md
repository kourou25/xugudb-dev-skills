---
name: nacos-plugin-xugudb-adapter
description: Nacos 插件系统适配虚谷数据库(XuguDB)的完整指南。当用户需要通过 Nacos 插件机制扩展 Nacos 功能，特别是配置虚谷数据库插件时使用此技能，包括插件架构、数据源配置、插件开发、插件管理等。适用于需要自定义 Nacos 功能或扩展数据库支持的场景。
---

# Nacos 插件系统虚谷数据库适配指南

## 概述

本技能提供 Nacos 插件系统适配虚谷数据库(XuguDB)的完整流程。Nacos 插件系统允许用户自定义和扩展 Nacos 的核心功能，通过插件机制可以实现数据库切换、配置管理扩展、服务发现增强等功能。

## 插件系统架构

### 插件类型

Nacos 支持以下类型的插件：

1. **数据源插件** - 扩展数据库支持（如虚谷数据库）
2. **配置管理插件** - 扩展配置存储和管理功能
3. **服务发现插件** - 扩展服务注册和发现机制
4. **健康检查插件** - 自定义健康检查逻辑
5. **认证授权插件** - 自定义认证和授权逻辑
6. **通知插件** - 扩展配置变更通知机制

### 插件加载机制

Nacos 通过 SPI（Service Provider Interface）机制加载插件：

```
插件接口定义 → 插件实现 → 插件注册 → 插件加载
```

## 适配流程

在开始适配前，按以下顺序检查和修改：

```
1. 插件获取 → 2. 插件安装 → 3. 数据源配置 → 4. 数据库初始化 → 5. 插件配置 → 6. 功能验证 → 7. 插件监控
```

## 第一步：获取虚谷数据库插件

### 官方插件获取

**重要：** 必须使用虚谷提供的专用 Nacos Server 压缩包，其中已包含虚谷数据库插件。

- **适配起始版本**: Nacos `1.4.6`
- **获取方式**: 从虚谷数据库开放源代码仓库下载专用的 Nacos Server 压缩包

### 手动编译插件

如果需要自定义插件，可以从源码编译：

```bash
# 克隆虚谷数据库 Nacos 插件仓库
git clone https://github.com/Xugu-Open-Source/nacos-plugin.git

# 进入项目目录
cd nacos-plugin

# 编译插件
mvn clean package -DskipTests
```

## 第二步：安装插件

### 放置插件文件

1. **虚谷数据库驱动** - 将 `xugu-jdbc.jar` 放置在 `nacos/plugins/` 目录下
2. **Nacos 插件** - 将 `nacos-xugu-plugin.jar` 放置在 `nacos/plugins/` 目录下

### 验证插件安装

```bash
# 检查插件目录
ls -la nacos/plugins/

# 应该看到类似文件：
# xugu-jdbc-12.3.4.jar
# nacos-xugu-plugin-1.0.0.jar
```

## 第三步：配置数据源

### 基本数据源配置

在 `nacos/conf/application.properties` 中添加以下配置：

```properties
# 数据库数量
db.num=1

# 数据库平台
spring.sql.init.platform=xugu

# 数据库连接配置
db.url.0=jdbc:xugu://127.0.0.1:5137/SYSTEM?current_schema=nacos_database
db.user.0=SYSDBA
db.password.0=SYSDBA
db.driver-class-name.0=com.xugu.cloudjdbc.Driver
```

### 高级数据源配置

```properties
# 连接池配置
db.pool.config.maximumPoolSize=20
db.pool.config.minimumIdle=5
db.pool.config.connectionTimeout=30000
db.pool.config.idleTimeout=600000
db.pool.config.maxLifetime=1800000

# 连接测试配置
db.pool.config.connectionTestQuery=SELECT 1
db.pool.config.validationTimeout=5000

# 连接泄漏检测
db.pool.config.leakDetectionThreshold=60000
```

### 多数据源配置

```properties
# 数据库数量
db.num=2

# 第一个数据源
db.url.0=jdbc:xugu://192.168.1.100:5137/SYSTEM?current_schema=nacos_database
db.user.0=SYSDBA
db.password.0=SYSDBA
db.driver-class-name.0=com.xugu.cloudjdbc.Driver

# 第二个数据源
db.url.1=jdbc:xugu://192.168.1.101:5137/SYSTEM?current_schema=nacos_database
db.user.1=SYSDBA
db.password.1=SYSDBA
db.driver-class-name.1=com.xugu.cloudjdbc.Driver
```

## 第四步：数据库初始化

### 执行初始化脚本

在配置数据源前，必须先在目标虚谷数据库中执行初始化脚本：

1. **脚本位置**: `nacos/conf/` 目录下的 `xugu-schema.sql`
2. **目的**: 创建 Nacos 运行所需的所有数据库表、视图等对象
3. **验证**: 执行后应检查表对象数量是否正确

```sql
-- 连接到虚谷数据库
-- 执行 xugu-schema.sql 脚本
-- 验证表创建成功
SELECT table_name FROM all_tables WHERE schema_id = (SELECT schema_id FROM all_schemas WHERE schema_name = 'NACOS_DATABASE');
```

### 验证数据库初始化

```sql
-- 检查配置信息表
SELECT COUNT(*) FROM config_info;

-- 检查服务信息表
SELECT COUNT(*) FROM service_info;

-- 检查用户表
SELECT COUNT(*) FROM users;
```

## 第五步：插件配置

### 插件启用配置

```properties
# 启用虚谷数据库插件
nacos.plugin.xugu.enabled=true

# 禁用默认MySQL插件
nacos.plugin.mysql.enabled=false

# 插件加载顺序
nacos.plugin.order.xugu=100
nacos.plugin.order.mysql=200
```

### 插件热加载配置

```properties
# 启用插件热加载
nacos.plugin.hot-reload.enabled=true
nacos.plugin.hot-reload.interval=60000
nacos.plugin.hot-reload.watch-path=./plugins
```

### 插件配置文件

创建 `nacos/conf/plugin/xugu-config.properties` 配置文件：

```properties
# 虚谷数据库配置
xugu.datasource.url=jdbc:xugu://127.0.0.1:5137/SYSTEM?current_schema=nacos_database
xugu.datasource.username=SYSDBA
xugu.datasource.password=SYSDBA
xugu.datasource.driver-class-name=com.xugu.cloudjdbc.Driver

# 连接池配置
xugu.datasource.pool.maximumPoolSize=20
xugu.datasource.pool.minimumIdle=5
xugu.datasource.pool.connectionTimeout=30000

# 表前缀配置
xugu.table.prefix=CONFIG_
xugu.table.config-info=CONFIG_INFO
xugu.table.config-tag=CONFIG_TAGS_RELATION
xugu.table.config-aggregate=CONFIG_INFO_AGGR
xugu.table.config-beta=CONFIG_INFO_BETA
xugu.table.config-tag-beta=CONFIG_INFO_TAG
```

## 第六步：启动配置

### 单机启动

在 `nacos/bin` 目录下执行启动命令：

```bash
# Windows
startup.cmd -m standalone

# Linux/Mac
sh startup.sh -m standalone
```

### 默认访问地址

```
http://localhost:8848/nacos/#/login
```

### 默认凭证

- **用户名**: `nacos`
- **密码**: `nacos`

**重要提示**: 从 Nacos 2.2.3 版本开始，需要手动开启鉴权配置才会出现登录界面。

### 鉴权配置

在 `application.properties` 中添加以下配置开启鉴权：

```properties
# 开启鉴权
nacos.core.auth.enabled=true
nacos.core.auth.system.type=nacos
nacos.core.auth.plugin.nacos.token.secret.key=SecretKey012345678901234567890123456789012345678901234567890123456789
nacos.core.auth.server.identity.key=serverIdentity
nacos.core.auth.plugin.nacos.token.expire.seconds=18000
```

## 第七步：功能验证

### 验证基本功能

1. **服务注册** - 测试服务注册功能
2. **服务发现** - 测试服务发现功能
3. **配置管理** - 测试配置发布和获取
4. **健康检查** - 测试服务健康检查
5. **命名空间** - 测试命名空间隔离

### 验证插件功能

1. **数据源切换** - 验证数据源已切换到虚谷数据库
2. **插件加载** - 验证插件已正确加载
3. **配置持久化** - 验证配置数据已存储到虚谷数据库
4. **服务数据持久化** - 验证服务数据已存储到虚谷数据库

### 验证高级功能

1. **集群模式** - 测试集群部署功能
2. **负载均衡** - 测试负载均衡功能
3. **配置监听** - 测试配置变更监听
4. **服务元数据** - 测试服务元数据管理
5. **权限控制** - 测试权限控制功能

## 第八步：插件监控

### 启用插件监控

```properties
# 启用插件监控
nacos.plugin.monitor.enabled=true
nacos.plugin.monitor.metrics-enabled=true
nacos.plugin.monitor.health-check-enabled=true
```

### 监控指标

1. **连接池指标**
   - 活跃连接数
   - 空闲连接数
   - 等待连接数
   - 连接创建时间
   - 连接使用时间

2. **查询指标**
   - 查询次数
   - 查询时间
   - 错误次数
   - 慢查询次数

3. **事务指标**
   - 事务开始次数
   - 事务提交次数
   - 事务回滚次数
   - 事务超时次数

### 监控接口

```bash
# 获取插件状态
curl http://localhost:8848/nacos/v1/plugin/status

# 获取连接池状态
curl http://localhost:8848/nacos/v1/datasource/status

# 获取监控指标
curl http://localhost:8848/nacos/v1/metrics
```

## 常见问题排查

### 1. 插件加载失败

**现象：** Nacos 启动时报错 `Plugin class not found`

**解决：**
- 检查插件 JAR 文件是否放置在正确目录
- 检查插件类路径是否正确
- 检查插件依赖是否完整

### 2. 数据源连接失败

**现象：** 无法连接到虚谷数据库

**解决：**
- 检查虚谷数据库服务是否启动
- 检查连接字符串参数是否正确
- 检查用户名和密码是否正确
- 检查网络连接和防火墙设置

### 3. 数据库表不存在

**现象：** 启动时报错 `Table 'xxx' doesn't exist`

**解决：** 执行 `nacos/conf/xugu-schema.sql` 初始化脚本

### 4. 插件性能问题

**现象：** 插件运行缓慢

**解决：**
- 检查数据库连接池配置
- 检查 SQL 查询性能
- 检查数据库索引
- 检查网络延迟

### 5. 插件兼容性问题

**现象：** 插件与 Nacos 版本不兼容

**解决：**
- 检查插件版本与 Nacos 版本的兼容性
- 更新插件到最新版本
- 检查插件接口是否发生变化

### 6. 插件配置问题

**现象：** 插件配置不生效

**解决：**
- 检查配置文件路径是否正确
- 检查配置文件格式是否正确
- 检查插件是否已启用
- 检查插件加载顺序

## 最佳实践

### 1. 插件选择
- 优先使用官方提供的插件
- 选择经过充分测试的插件
- 避免使用多个功能重叠的插件

### 2. 插件配置
- 使用外部化配置管理插件参数
- 为不同环境使用不同配置
- 敏感信息使用环境变量或加密存储

### 3. 插件监控
- 启用插件监控功能
- 定期检查插件状态
- 设置告警阈值

### 4. 插件更新
- 定期更新插件到最新版本
- 测试环境先行验证
- 制定回滚计划

### 5. 插件安全
- 限制插件访问权限
- 定期审查插件代码
- 监控插件行为

## 参考文档

详细的配置指南和故障排除请参考：
- [Nacos 插件系统配置指南](references/nacos-plugin-configuration.md)
- [Nacos 插件系统官方文档](https://nacos.io/zh-cn/docs/plugin.html)
- [Nacos 插件仓库](https://github.com/nacos-group/nacos-plugin)
- [虚谷数据库 Nacos 适配文档](https://help.xugudb.com/content/ecosystem/orm/java/nacos)