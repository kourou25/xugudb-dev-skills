---
name: nacos-xugudb-adapter
description: Nacos 适配虚谷数据库(XuguDB)的完整指南。当用户需要将基于 Nacos 的服务发现与配置管理平台配置或适配到虚谷数据库时使用此技能，包括版本获取、数据源配置、数据库初始化、启动配置、集群配置等。适用于从 MySQL/Oracle 迁移或新建虚谷数据库项目。
---

# Nacos 虚谷数据库适配指南

## 概述

本技能提供 Nacos 适配虚谷数据库(XuguDB)的完整流程。Nacos 是阿里巴巴开源的动态服务发现、配置管理和服务管理平台，通过适配虚谷数据库，可以实现微服务架构中的服务注册与配置管理。

## 适配流程

在开始适配前，按以下顺序检查和修改：

```
1. 版本获取 → 2. 数据库初始化 → 3. 数据源配置 → 4. 启动配置 → 5. 功能验证 → 6. 集群配置
```

## 第一步：获取版本

### 使用虚谷专用版本

**重要：** 必须使用虚谷提供的专用 Nacos Server 压缩包，而非直接使用原生 Nacos 安装包。

- **适配起始版本**: Nacos `1.4.6`
- **获取方式**: 从虚谷数据库开放源代码仓库下载专用的 Nacos Server 压缩包

## 第二步：数据库初始化

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

## 第三步：配置数据源

### 配置文件位置

数据源配置在文件 `nacos/conf/application.properties` 中完成。

### 配置示例

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

**关键配置说明：**
- `spring.sql.init.platform=xugu`：指定数据库平台为虚谷
- `current_schema=nacos_database`：指定当前模式名
- `db.driver-class-name.0=com.xugu.cloudjdbc.Driver`：指定虚谷 JDBC 驱动

## 第四步：启动配置

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

## 第五步：功能验证

### 验证基本功能

1. **服务注册**：测试服务注册功能
2. **服务发现**：测试服务发现功能
3. **配置管理**：测试配置发布和获取
4. **健康检查**：测试服务健康检查
5. **命名空间**：测试命名空间隔离

### 验证高级功能

1. **集群模式**：测试集群部署功能
2. **负载均衡**：测试负载均衡功能
3. **配置监听**：测试配置变更监听
4. **服务元数据**：测试服务元数据管理
5. **权限控制**：测试权限控制功能

## 第六步：集群配置

### 集群架构

Nacos 集群部署时，多个 Nacos 节点共享同一个虚谷数据库。

### 集群配置步骤

1. **数据库配置**: 所有 Nacos 节点指向同一个虚谷数据库
2. **集群节点配置**: 在 `nacos/conf/cluster.conf` 中配置集群节点信息
3. **启动集群**: 分别启动各个 Nacos 节点

### 集群配置文件

#### cluster.conf

```properties
# 集群节点列表
192.168.1.100:8848
192.168.1.101:8848
192.168.1.102:8848
```

#### application.properties（集群模式）

```properties
# 数据库数量
db.num=1

# 数据库平台
spring.sql.init.platform=xugu

# 数据库连接配置
db.url.0=jdbc:xugu://192.168.1.200:5137/SYSTEM?current_schema=nacos_database
db.user.0=SYSDBA
db.password.0=SYSDBA
db.driver-class-name.0=com.xugu.cloudjdbc.Driver

# 集群模式
nacos.core.auth.enabled=true
nacos.core.auth.system.type=nacos
```

### 负载均衡配置

在集群模式下，建议使用 Nginx 或其他负载均衡器进行负载均衡：

```nginx
upstream nacos-cluster {
    server 192.168.1.100:8848;
    server 192.168.1.101:8848;
    server 192.168.1.102:8848;
}

server {
    listen 80;
    server_name nacos.example.com;

    location / {
        proxy_pass http://nacos-cluster;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 常见问题排查

### 1. 驱动类找不到

**现象：** 启动时报错 `Driver class not found`

**原因：** JDBC 驱动未正确引入

**解决：** 确保虚谷 JDBC 驱动已正确放置在 `nacos/plugins/` 目录下

### 2. 连接 URL 错误

**现象：** 连接时报错 `Invalid connection URL`

**原因：** URL 参数错误

**解决：** 确保使用正确的 URL 格式，并包含 `current_schema=模式名`

### 3. 数据库表不存在

**现象：** 启动时报错 `Table 'xxx' doesn't exist`

**原因：** 数据库初始化脚本未执行

**解决：** 执行 `nacos/conf/xugu-schema.sql` 初始化脚本

### 4. 鉴权配置问题

**现象：** 无法登录或登录后无权限

**原因：** 鉴权配置不正确

**解决：** 
- 检查 `nacos.core.auth.enabled` 是否设置为 `true`
- 检查 `nacos.core.auth.plugin.nacos.token.secret.key` 是否配置正确

### 5. 集群节点通信问题

**现象：** 集群节点之间无法通信

**原因：** 集群配置不正确

**解决：** 
- 检查 `cluster.conf` 文件中的节点列表是否正确
- 检查防火墙是否开放了相关端口
- 检查网络连通性

### 6. 数据库连接池问题

**现象：** 连接超时或连接泄漏

**原因：** 数据库连接池配置不当

**解决：** 
- 检查数据库连接数是否足够
- 调整连接池参数
- 检查数据库服务器性能

## 最佳实践

### 1. 版本管理
- 始终使用虚谷提供的专用 Nacos Server 压缩包
- 定期检查虚谷官方发布的适配更新

### 2. 配置管理
- 使用外部化配置（如 application.properties）
- 为不同环境使用不同配置
- 敏感信息使用环境变量或加密存储

### 3. 性能优化
- 合理配置数据库连接池
- 使用集群模式提高可用性
- 配置负载均衡分散请求

### 4. 安全性
- 开启鉴权功能
- 使用强密码
- 定期更换密钥
- 限制访问 IP

### 5. 监控与日志
- 启用 Nacos 监控
- 配置日志级别
- 定期检查日志文件
- 监控数据库连接状态

## 参考文档

详细的配置指南和故障排除请参考：
- [Nacos 虚谷数据库配置指南](references/nacos-configuration.md)
- [Nacos 官方文档](https://nacos.io/zh-cn/docs/what-is-nacos.html)
- [虚谷数据库官方文档](https://docs.xugudb.com/)