# HertzBeat 监控系统适配虚谷数据库配置指南

## 概述

Apache HertzBeat 是一个 AI 驱动的下一代开源实时观测系统，支持无代理监控、高性能集群、Prometheus 兼容。本指南介绍如何将 HertzBeat 适配到虚谷数据库（XuguDB），实现数据库性能监控和告警。

## 1. HertzBeat 简介

### 1.1 核心特性

- **无代理监控**：无需在被监控主机上安装 Agent
- **高性能集群**：支持多采集器集群横向扩展
- **Prometheus 兼容**：支持 Prometheus 数据格式和查询
- **自定义监控**：通过 YAML 模板自定义监控类型
- **AI 智能**：AI 驱动的智能告警和分析

### 1.2 支持的监控类型

**应用服务监控：**
- Web 服务、API 接口、Spring Boot 应用
- JVM、Tomcat、Nginx 等

**数据库监控：**
- MySQL、PostgreSQL、Oracle、SQL Server
- MongoDB、Redis、Elasticsearch
- 虚谷数据库（XuguDB）通过自定义模板支持

**操作系统监控：**
- Linux、Windows、macOS
- CPU、内存、磁盘、网络等

**中间件监控：**
- Kafka、RabbitMQ、RocketMQ
- ZooKeeper、Consul、Nacos

**云原生监控：**
- Kubernetes、Docker
- 云服务监控

## 2. 安装部署

### 2.1 Docker 部署（推荐）

```bash
# 拉取 HertzBeat 镜像
docker pull apache/hertzbeat:latest

# 启动 HertzBeat 容器
docker run -d \
  --name hertzbeat \
  -p 1157:1157 \
  -p 1158:1158 \
  -e LANG=zh_CN.UTF-8 \
  -e TZ=Asia/Shanghai \
  -v /opt/hertzbeat/config:/opt/hertzbeat/config \
  -v /opt/hertzbeat/logs:/opt/hertzbeat/logs \
  apache/hertzbeat:latest
```

### 2.2 Docker Compose 部署

```yaml
version: '3.8'
services:
  hertzbeat:
    image: apache/hertzbeat:latest
    container_name: hertzbeat
    ports:
      - "1157:1157"
      - "1158:1158"
    environment:
      - LANG=zh_CN.UTF-8
      - TZ=Asia/Shanghai
    volumes:
      - ./config:/opt/hertzbeat/config
      - ./logs:/opt/hertzbeat/logs
      - ./ext-lib:/opt/hertzbeat/ext-lib
    restart: unless-stopped
```

### 2.3 二进制包部署

```bash
# 下载 HertzBeat
wget https://github.com/apache/hertzbeat/releases/download/v1.5.0/hertzbeat-1.5.0.tar.gz

# 解压
tar -xzf hertzbeat-1.5.0.tar.gz

# 启动
cd hertzbeat-1.5.0
./bin/startup.sh
```

**访问地址：** `http://your-server-ip:1157`

**默认账号：**
- 用户名：admin
- 密码：hertzbeat

## 3. 虚谷数据库驱动配置

### 3.1 获取虚谷数据库驱动

**驱动文件：** `xugu-jdbc-12.3.4.jar`

**下载方式：**
1. 从虚谷数据库官网下载
2. 从 Maven Central 下载：`com.xugudb:xugu-jdbc:12.3.4`

### 3.2 部署驱动文件

```bash
# 将驱动文件复制到 HertzBeat 的 ext-lib 目录
cp xugu-jdbc-12.3.4.jar /opt/hertzbeat/ext-lib/

# 重启 HertzBeat 服务
docker restart hertzbeat
```

### 3.3 驱动类名配置

| 数据库 | 驱动类名 |
|--------|----------|
| 虚谷数据库 | `com.xugu.cloudjdbc.Driver` |
| MySQL | `com.mysql.cj.jdbc.Driver` |
| PostgreSQL | `org.postgresql.Driver` |
| Oracle | `oracle.jdbc.driver.OracleDriver` |
| SQL Server | `com.microsoft.sqlserver.jdbc.SQLServerDriver` |

## 4. 自定义监控模板

### 4.1 创建虚谷数据库监控模板

创建文件 `xugudb-monitor.yml`：

```yaml
# 虚谷数据库监控模板
category: db
app: xugudb
name:
  zh-CN: 虚谷数据库
  en-US: XuguDB
help:
  zh-CN: 对虚谷数据库的通用性能指标进行采集监控
  en-US: Collect and monitor the general performance metrics of XuguDB
helpLink:
  zh-CN: https://www.xugudb.com
  en-US: https://www.xugudb.com

# 监控参数定义
params:
  - field: host
    name:
      zh-CN: 主机Host
      en-US: Host
    type: host
    required: true
    defaultValue: 127.0.0.1
  - field: port
    name:
      zh-CN: 端口
      en-US: Port
    type: number
    required: true
    defaultValue: 5138
  - field: database
    name:
      zh-CN: 数据库名称
      en-US: Database Name
    type: text
    required: true
    defaultValue: SYSTEM
  - field: username
    name:
      zh-CN: 用户名
      en-US: Username
    type: text
    required: true
    defaultValue: SYSDBA
  - field: password
    name:
      zh-CN: 密码
      en-US: Password
    type: password
    required: true
    defaultValue: SYSDBA
  - field: timeout
    name:
      zh-CN: 查询超时(ms)
      en-US: Query Timeout(ms)
    type: number
    required: false
    defaultValue: 3000

# 监控指标定义
metrics:
  # 可用性指标
  - name: availability
    priority: 0
    fields:
      - field: status
        type: 0
        name:
          zh-CN: 状态
          en-US: Status
    protocol: jdbc
    jdbc:
      host: ^_^host^_^
      port: ^_^port^_^
      database: ^_^database^_^
      username: ^_^username^_^
      password: ^_^password^_^
      timeout: ^_^timeout^_^
      driver: com.xugu.cloudjdbc.Driver
      url: jdbc:xugu://^_^host^_^:^_^port^_^/^_^database^_^?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
      sql: SELECT 1 AS status
      mode: oneRow

  # 数据库基本信息
  - name: basic
    priority: 1
    fields:
      - field: version
        type: 1
        name:
          zh-CN: 数据库版本
          en-US: Database Version
      - field: uptime
        type: 1
        name:
          zh-CN: 运行时间
          en-US: Uptime
      - field: connections
        type: 0
        name:
          zh-CN: 当前连接数
          en-US: Current Connections
    protocol: jdbc
    jdbc:
      host: ^_^host^_^
      port: ^_^port^_^
      database: ^_^database^_^
      username: ^_^username^_^
      password: ^_^password^_^
      timeout: ^_^timeout^_^
      driver: com.xugu.cloudjdbc.Driver
      url: jdbc:xugu://^_^host^_^:^_^port^_^/^_^database^_^?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
      sql: |
        SELECT 
          VERSION() AS version,
          CURRENT_TIMESTAMP AS uptime,
          (SELECT COUNT(*) FROM V$SESSIONS WHERE STATUS = 'ACTIVE') AS connections
      mode: oneRow

  # 性能指标
  - name: performance
    priority: 2
    fields:
      - field: qps
        type: 0
        name:
          zh-CN: 每秒查询数
          en-US: Queries Per Second
        unit: queries/s
      - field: tps
        type: 0
        name:
          zh-CN: 每秒事务数
          en-US: Transactions Per Second
        unit: transactions/s
      - field: slow_queries
        type: 0
        name:
          zh-CN: 慢查询数
          en-US: Slow Queries
    protocol: jdbc
    jdbc:
      host: ^_^host^_^
      port: ^_^port^_^
      database: ^_^database^_^
      username: ^_^username^_^
      password: ^_^password^_^
      timeout: ^_^timeout^_^
      driver: com.xugu.cloudjdbc.Driver
      url: jdbc:xugu://^_^host^_^:^_^port^_^/^_^database^_^?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
      sql: |
        SELECT 
          (SELECT COUNT(*) FROM V$STATISTICS WHERE NAME = 'Queries') AS qps,
          (SELECT COUNT(*) FROM V$STATISTICS WHERE NAME = 'Transactions') AS tps,
          (SELECT COUNT(*) FROM V$STATISTICS WHERE NAME = 'Slow_queries') AS slow_queries
      mode: oneRow

  # 连接池指标
  - name: connection_pool
    priority: 3
    fields:
      - field: max_connections
        type: 0
        name:
          zh-CN: 最大连接数
          en-US: Max Connections
      - field: active_connections
        type: 0
        name:
          zh-CN: 活跃连接数
          en-US: Active Connections
      - field: idle_connections
        type: 0
        name:
          zh-CN: 空闲连接数
          en-US: Idle Connections
    protocol: jdbc
    jdbc:
      host: ^_^host^_^
      port: ^_^port^_^
      database: ^_^database^_^
      username: ^_^username^_^
      password: ^_^password^_^
      timeout: ^_^timeout^_^
      driver: com.xugu.cloudjdbc.Driver
      url: jdbc:xugu://^_^host^_^:^_^port^_^/^_^database^_^?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
      sql: |
        SELECT 
          (SELECT VALUE FROM V$PARAMETERS WHERE NAME = 'max_connections') AS max_connections,
          (SELECT COUNT(*) FROM V$SESSIONS WHERE STATUS = 'ACTIVE') AS active_connections,
          (SELECT COUNT(*) FROM V$SESSIONS WHERE STATUS = 'IDLE') AS idle_connections
      mode: oneRow

  # 表空间指标
  - name: tablespace
    priority: 4
    fields:
      - field: tablespace_name
        type: 1
        name:
          zh-CN: 表空间名称
          en-US: Tablespace Name
      - field: total_size
        type: 0
        name:
          zh-CN: 总大小
          en-US: Total Size
        unit: MB
      - field: used_size
        type: 0
        name:
          zh-CN: 已使用大小
          en-US: Used Size
        unit: MB
      - field: free_size
        type: 0
        name:
          zh-CN: 空闲大小
          en-US: Free Size
        unit: MB
      - field: used_percent
        type: 0
        name:
          zh-CN: 使用率
          en-US: Usage Percent
        unit: '%'
    protocol: jdbc
    jdbc:
      host: ^_^host^_^
      port: ^_^port^_^
      database: ^_^database^_^
      username: ^_^username^_^
      password: ^_^password^_^
      timeout: ^_^timeout^_^
      driver: com.xugu.cloudjdbc.Driver
      url: jdbc:xugu://^_^host^_^:^_^port^_^/^_^database^_^?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
      sql: |
        SELECT 
          TABLESPACE_NAME AS tablespace_name,
          TOTAL_SIZE / 1024 / 1024 AS total_size,
          USED_SIZE / 1024 / 1024 AS used_size,
          (TOTAL_SIZE - USED_SIZE) / 1024 / 1024 AS free_size,
          ROUND(USED_SIZE * 100.0 / TOTAL_SIZE, 2) AS used_percent
        FROM DBA_TABLESPACES
      mode: multiRow
```

### 4.2 导入监控模板

1. 登录 HertzBeat 系统
2. 进入【监控模板】→【导入模板】
3. 上传 `xugudb-monitor.yml` 文件
4. 确认导入成功

## 5. 配置监控任务

### 5.1 添加虚谷数据库监控

1. 进入【监控中心】→【新建监控】
2. 选择【虚谷数据库】监控类型
3. 配置监控参数：
   - **主机**：127.0.0.1
   - **端口**：5138
   - **数据库**：SYSTEM
   - **用户名**：SYSDBA
   - **密码**：SYSDBA
4. 点击【测试连接】验证配置
5. 点击【保存】完成配置

### 5.2 配置监控频率

**基本配置：**
- 采集间隔：60 秒（默认）
- 超时时间：3000 毫秒
- 重试次数：3 次

**高级配置：**
- 采集器：默认采集器
- 分组：数据库监控
- 标签：虚谷数据库、生产环境

### 5.3 批量监控配置

```yaml
# 批量监控配置示例
monitors:
  - name: 虚谷数据库-主库
    host: 192.168.1.100
    port: 5138
    database: SYSTEM
    username: SYSDBA
    password: SYSDBA
    
  - name: 虚谷数据库-从库
    host: 192.168.1.101
    port: 5138
    database: SYSTEM
    username: SYSDBA
    password: SYSDBA
    
  - name: 虚谷数据库-测试库
    host: 192.168.1.102
    port: 5138
    database: TEST_DB
    username: SYSDBA
    password: SYSDBA
```

## 6. 告警规则配置

### 6.1 创建告警规则

1. 进入【告警中心】→【阈值规则】
2. 点击【新建阈值规则】
3. 配置规则：
   - **规则名称**：虚谷数据库连接数告警
   - **监控类型**：虚谷数据库
   - **指标名称**：connection_pool
   - **字段名称**：active_connections
   - **告警条件**：大于 100
   - **告警级别**：警告
4. 点击【保存】

### 6.2 常用告警规则

**连接数告警：**
```yaml
name: 数据库连接数告警
condition: active_connections > 100
level: warning
message: "虚谷数据库连接数过高: {{active_connections}}"
```

**慢查询告警：**
```yaml
name: 慢查询告警
condition: slow_queries > 10
level: warning
message: "虚谷数据库慢查询数量过多: {{slow_queries}}"
```

**表空间使用率告警：**
```yaml
name: 表空间使用率告警
condition: used_percent > 80
level: warning
message: "虚谷数据库表空间使用率过高: {{used_percent}}%"
```

**数据库不可用告警：**
```yaml
name: 数据库不可用告警
condition: status != 1
level: critical
message: "虚谷数据库不可用"
```

### 6.3 告警通知配置

**邮件通知：**
```yaml
notification:
  type: email
  config:
    host: smtp.example.com
    port: 587
    username: alert@example.com
    password: your_password
    from: alert@example.com
    to: admin@example.com
```

**钉钉通知：**
```yaml
notification:
  type: dingtalk
  config:
    webhook: https://oapi.dingtalk.com/robot/send?access_token=your_token
    secret: your_secret
```

**企业微信通知：**
```yaml
notification:
  type: wechat
  config:
    webhook: https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=your_key
```

## 7. 监控仪表板

### 7.1 创建仪表板

1. 进入【仪表板】→【新建仪表板】
2. 配置仪表板名称和描述
3. 添加图表组件

### 7.2 常用图表配置

**连接数趋势图：**
- 图表类型：折线图
- 数据源：虚谷数据库监控
- 指标：connection_pool.active_connections
- 时间范围：最近 1 小时

**QPS 趋势图：**
- 图表类型：折线图
- 数据源：虚谷数据库监控
- 指标：performance.qps
- 时间范围：最近 1 小时

**表空间使用率饼图：**
- 图表类型：饼图
- 数据源：虚谷数据库监控
- 指标：tablespace.used_percent
- 分组：tablespace_name

**告警统计柱状图：**
- 图表类型：柱状图
- 数据源：告警记录
- 分组：告警级别
- 时间范围：最近 24 小时

## 8. 性能优化

### 8.1 监控性能优化

**采集间隔优化：**
- 生产环境：60 秒
- 测试环境：300 秒
- 关键指标：30 秒

**超时时间优化：**
- 默认超时：3000 毫秒
- 复杂查询：10000 毫秒
- 简单查询：1000 毫秒

**并发采集优化：**
- 最大并发数：10
- 采集器数量：3
- 采集队列大小：1000

### 8.2 数据库优化

**索引优化：**
```sql
-- 为监控查询创建索引
CREATE INDEX idx_sessions_status ON V$SESSIONS(STATUS);
CREATE INDEX idx_statistics_name ON V$STATISTICS(NAME);
CREATE INDEX idx_parameters_name ON V$PARAMETERS(NAME);
```

**查询优化：**
```sql
-- 使用覆盖索引
SELECT STATUS, COUNT(*) FROM V$SESSIONS GROUP BY STATUS;

-- 避免全表扫描
SELECT * FROM V$SESSIONS WHERE STATUS = 'ACTIVE';
```

### 8.3 存储优化

**数据保留策略：**
- 原始数据：7 天
- 聚合数据：30 天
- 历史数据：90 天

**存储压缩：**
- 启用数据压缩
- 压缩算法：LZ4
- 压缩比：3:1

## 9. 常见问题与解决方案

### 9.1 连接失败

**问题**：无法连接到虚谷数据库。

**解决方案**：
- 检查数据库服务是否启动
- 验证网络连接和防火墙设置
- 确认用户名和密码是否正确
- 检查驱动类名是否正确

### 9.2 驱动加载失败

**问题**：驱动类名不正确或驱动文件损坏。

**解决方案**：
- 确认驱动类名：`com.xugu.cloudjdbc.Driver`
- 重新下载驱动文件
- 检查驱动文件版本兼容性

### 9.3 监控数据不准确

**问题**：监控数据与实际不符。

**解决方案**：
- 检查 SQL 查询语句是否正确
- 验证数据类型转换
- 调整采集间隔和超时时间

### 9.4 告警延迟

**问题**：告警通知延迟。

**解决方案**：
- 优化告警规则条件
- 调整告警检查频率
- 检查通知渠道配置

### 9.5 性能问题

**问题**：监控系统性能不佳。

**解决方案**：
- 优化采集间隔
- 使用集群部署
- 配置数据保留策略

## 10. 最佳实践

1. **监控策略**：制定合理的监控策略，覆盖关键指标
2. **告警规则**：设置合理的告警阈值，避免误报
3. **通知配置**：配置多种通知渠道，确保及时响应
4. **性能优化**：定期优化监控性能，确保系统稳定
5. **数据备份**：定期备份监控配置和历史数据
6. **安全防护**：配置访问控制，保护监控数据安全
7. **版本管理**：及时更新 HertzBeat 和数据库驱动版本
8. **文档维护**：维护监控文档，记录配置变更

## 11. 相关资源

- [HertzBeat 官方文档](https://hertzbeat.apache.org/)
- [HertzBeat GitHub 仓库](https://github.com/apache/hertzbeat)
- [虚谷数据库官方文档](https://www.xugudb.com)
- [HertzBeat 社区论坛](https://github.com/apache/hertzbeat/discussions)
