# Nacos 虚谷数据库配置指南

## 概述

本文档提供 Nacos 适配虚谷数据库(XuguDB)的完整配置指南，包括版本获取、数据源配置、数据库初始化、启动配置、集群配置等。

## 一、核心配置信息

### 1.1 JDBC 驱动类
```
com.xugu.cloudjdbc.Driver
```

### 1.2 连接 URL 格式
```
jdbc:xugu://<host>:<port>/<database>?current_schema=<schema>
```

**参数说明：**
- `<host>`: 数据库服务器地址
- `<port>`: 数据库端口（默认5138）
- `<database>`: 数据库名（如SYSTEM）
- `current_schema`: 当前模式名（如nacos_database）

### 1.3 示例 URL
```
jdbc:xugu://127.0.0.1:5137/SYSTEM?current_schema=nacos_database
```

## 二、版本获取

### 2.1 适配版本

- **适配起始版本**: Nacos `1.4.6`
- **获取方式**: 需要下载虚谷提供的专用 `NACOS-SERVER` 压缩包，而非直接使用原生 Nacos 安装包

### 2.2 下载地址

从虚谷数据库开放源代码仓库下载专用的 Nacos Server 压缩包。

## 三、数据库初始化

### 3.1 初始化脚本

在配置数据源前，必须先在目标虚谷数据库中执行初始化脚本：

- **脚本位置**: `nacos/conf/` 目录下的 `xugu-schema.sql`
- **目的**: 创建 Nacos 运行所需的所有数据库表、视图等对象
- **验证**: 执行后应检查表对象数量是否正确

### 3.2 执行初始化脚本

```sql
-- 连接到虚谷数据库
-- 执行 xugu-schema.sql 脚本
-- 验证表创建成功
SELECT table_name FROM all_tables WHERE schema_id = (SELECT schema_id FROM all_schemas WHERE schema_name = 'NACOS_DATABASE');
```

## 四、数据源配置

### 4.1 配置文件位置

数据源配置在文件 `nacos/conf/application.properties` 中完成。

### 4.2 配置示例

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

### 4.3 配置项说明

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| `db.num` | 数据库数量 | 1 |
| `spring.sql.init.platform` | 数据库平台 | xugu |
| `db.url.0` | 数据库连接串 | jdbc:xugu://127.0.0.1:5137/SYSTEM?current_schema=nacos_database |
| `db.user.0` | 数据库用户名 | SYSDBA |
| `db.password.0` | 数据库密码 | SYSDBA |
| `db.driver-class-name.0` | 驱动类名 | com.xugu.cloudjdbc.Driver |

## 五、启动配置

### 5.1 单机启动

在 `nacos/bin` 目录下执行启动命令：

```bash
# Windows
startup.cmd -m standalone

# Linux/Mac
sh startup.sh -m standalone
```

### 5.2 默认访问地址

```
http://localhost:8848/nacos/#/login
```

### 5.3 默认凭证

- **用户名**: `nacos`
- **密码**: `nacos`

**重要提示**: 从 Nacos 2.2.3 版本开始，需要手动开启鉴权配置才会出现登录界面。

### 5.4 鉴权配置

在 `application.properties` 中添加以下配置开启鉴权：

```properties
# 开启鉴权
nacos.core.auth.enabled=true
nacos.core.auth.system.type=nacos
nacos.core.auth.plugin.nacos.token.secret.key=SecretKey012345678901234567890123456789012345678901234567890123456789
nacos.core.auth.server.identity.key=serverIdentity
nacos.core.auth.plugin.nacos.token.expire.seconds=18000
```

## 六、集群配置

### 6.1 集群架构

Nacos 集群部署时，多个 Nacos 节点共享同一个虚谷数据库。

### 6.2 集群配置步骤

1. **数据库配置**: 所有 Nacos 节点指向同一个虚谷数据库
2. **集群节点配置**: 在 `nacos/conf/cluster.conf` 中配置集群节点信息
3. **启动集群**: 分别启动各个 Nacos 节点

### 6.3 集群配置文件

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

### 6.4 负载均衡配置

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

## 七、Docker 部署

### 7.1 Docker 镜像

使用虚谷提供的专用 Docker 镜像：

```bash
# 拉取镜像
docker pull xugudb/nacos-server:latest

# 运行容器
docker run -d \
  --name nacos \
  -p 8848:8848 \
  -p 9848:9848 \
  -e MODE=standalone \
  -e SPRING_DATASOURCE_PLATFORM=xugu \
  -e MYSQL_SERVICE_HOST=127.0.0.1 \
  -e MYSQL_SERVICE_PORT=5137 \
  -e MYSQL_SERVICE_DB_NAME=SYSTEM \
  -e MYSQL_SERVICE_USER=SYSDBA \
  -e MYSQL_SERVICE_PASSWORD=SYSDBA \
  -e MYSQL_SERVICE_DB_PARAM="current_schema=nacos_database" \
  xugudb/nacos-server:latest
```

### 7.2 Docker Compose

```yaml
version: '3.8'
services:
  nacos:
    image: xugudb/nacos-server:latest
    container_name: nacos
    ports:
      - "8848:8848"
      - "9848:9848"
    environment:
      - MODE=standalone
      - SPRING_DATASOURCE_PLATFORM=xugu
      - MYSQL_SERVICE_HOST=127.0.0.1
      - MYSQL_SERVICE_PORT=5137
      - MYSQL_SERVICE_DB_NAME=SYSTEM
      - MYSQL_SERVICE_USER=SYSDBA
      - MYSQL_SERVICE_PASSWORD=SYSDBA
      - MYSQL_SERVICE_DB_PARAM=current_schema=nacos_database
    restart: unless-stopped
```

## 八、常见问题排查

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

## 九、最佳实践

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

## 十、参考资源

### 10.1 官方文档
- [Nacos 官方文档](https://nacos.io/zh-cn/docs/what-is-nacos.html)
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [虚谷数据库 Nacos 示例](https://help.xugudb.com/content/ecosystem/orm/java/nacos)

### 10.2 示例项目
- [虚谷 Nacos 示例](https://gitee.com/XuguDB/xugu-nacos-demo)
- [Nacos Docker 示例](https://github.com/nacos-group/nacos-docker)

### 10.3 社区资源
- [虚谷数据库社区](https://www.xugudb.com/)
- [Nacos 社区](https://nacos.io/zh-cn/community/index.html)