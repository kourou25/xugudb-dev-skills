---
name: powerjob-xugudb-adapter
description: PowerJob 分布式任务调度框架与虚谷数据库（XuguDB）集成适配指南。当用户需要在 Spring Boot 项目中使用 PowerJob 连接 XuguDB 时使用此技能，包括任务调度配置、数据源设置、任务处理器编写、工作流配置、MapReduce 分布式计算等。适用于定时任务、批量数据处理、分布式计算、工作流编排等场景。
---

# PowerJob 分布式任务调度 XuguDB 适配指南

## 概述

本指南详细介绍如何将 PowerJob 分布式任务调度框架与虚谷数据库（XuguDB）集成，包括完整的配置流程、使用示例和最佳实践。PowerJob 是新一代分布式调度与计算框架，支持多种调度策略和执行模式。

## 快速开始

### 1. 获取适配版 PowerJob

由于官方 PowerJob 不支持 XuguDB，需要使用虚谷提供的适配版本：

```bash
# 下载适配版 PowerJob
# 访问：https://docs.xugudb.com/content/ecosystem/orm/java/powerjob
```

### 2. 初始化数据库

在 XuguDB 中创建两个数据库：

```sql
-- 创建主数据库（存储元数据）
CREATE DATABASE `powerjob` CHARACTER SET 'utf8_bin' TIME ZONE 'GMT+08:00';
USE powerjob;
CREATE USER `powerjob` IDENTIFIED BY 'powerjob';
GRANT DBA IN SCHEMA `powerjob` TO `powerjob`;

-- 创建任务执行数据库（存储执行日志）
CREATE DATABASE `powerjob_remote` CHARACTER SET 'utf8_bin' TIME ZONE 'GMT+08:00';
USE powerjob_remote;
CREATE USER `powerjob_remote` IDENTIFIED BY 'powerjob_remote';
GRANT DBA IN SCHEMA `powerjob_remote` TO `powerjob_remote';
```

### 3. 配置数据源

在 `application.properties` 中配置：

```properties
# 主数据库连接
spring.datasource.core.driver-class-name=com.xugudb.jdbc.Driver
spring.datasource.core.url=jdbc:xugu://127.0.0.1:5138/powerjob
spring.datasource.core.username=powerjob
spring.datasource.core.password=powerjob

# 任务执行数据库连接
spring.datasource.remote.driver-class-name=com.xugudb.jdbc.Driver
spring.datasource.remote.url=jdbc:xugu://127.0.0.1:5138/powerjob_remote
spring.datasource.remote.username=powerjob_remote
spring.datasource.remote.password=powerjob_remote

# Hibernate 方言配置
spring.datasource.remote.hibernate.properties.hibernate.dialect=org.hibernate.dialect.XuguDialect
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.XuguDialect

# 自动建表配置
oms.storage.dfs.xugu_series.auto_create_table=true
```

### 4. 启动 PowerJob Server

```bash
java -jar powerjob-server-starter-4.3.9.jar --spring.config.location=./application.properties
```

### 5. 访问管理界面

- **地址**：`http://127.0.0.1:7700/#/welcome`
- **默认账号**：`ADMIN`
- **默认密码**：`powerjob_admin`

## 配置详解

### 数据源配置参数

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `driver-class-name` | XuguDB JDBC 驱动类 | `com.xugudb.jdbc.Driver` |
| `url` | 数据库连接 URL | `jdbc:xugu://host:port/db` |
| `hibernate.dialect` | Hibernate 方言 | `org.hibernate.dialect.XuguDialect` |
| `auto_create_table` | 自动建表 | `true`（初次使用） |

### 连接池配置

```properties
spring.datasource.core.hikari.maximum-pool-size=20
spring.datasource.core.hikari.minimum-idle=5
spring.datasource.core.hikari.idle-timeout=30000

spring.datasource.remote.hikari.maximum-pool-size=20
spring.datasource.remote.hikari.minimum-idle=5
spring.datasource.remote.hikari.idle-timeout=30000
```

## Worker 集成

### 1. 添加 Maven 依赖

```xml
<dependencies>
    <!-- PowerJob Worker Spring Boot Starter -->
    <dependency>
        <groupId>tech.powerjob</groupId>
        <artifactId>powerjob-worker-spring-boot-starter</artifactId>
        <version>4.3.6</version>
    </dependency>
    
    <!-- XuguDB JDBC 驱动 -->
    <dependency>
        <groupId>com.xugudb</groupId>
        <artifactId>xugu-jdbc</artifactId>
        <version>12.3.4</version>
    </dependency>
</dependencies>
```

### 2. 配置 Worker

在 `application.yml` 中配置：

```yaml
powerjob:
  worker:
    server-address: 127.0.0.1:7700
    app-name: my-application
    password: my-password
    port: 27777
    store-strategy: disk
```

### 3. 创建任务处理器

```java
@Component
public class MyBasicProcessor implements BasicProcessor {
    
    @Override
    public ProcessResult process(TaskContext context) throws Exception {
        String jobParams = context.getJobParams();
        System.out.println("执行任务，参数：" + jobParams);
        return new ProcessResult(true, "任务执行成功");
    }
}
```

## 任务配置

### 调度策略

PowerJob 支持多种调度策略：

1. **CRON 表达式**：`0 0 2 * * ?`（每天凌晨 2 点）
2. **固定频率**：`fixedRate=300000`（每 5 分钟）
3. **固定延迟**：`fixedDelay=10000`（延迟 10 秒）
4. **API 触发**：通过 API 手动触发

### 执行模式

PowerJob 支持多种执行模式：

1. **单机模式（Standalone）**：任务只在单个 Worker 节点执行
2. **广播模式（Broadcast）**：任务在所有 Worker 节点执行
3. **Map 模式**：将大任务拆分为多个小任务并行执行
4. **MapReduce 模式**：支持分布式计算

## 工作流配置

PowerJob 支持 DAG 工作流：

1. 创建工作流
2. 添加工作流节点
3. 配置节点依赖关系
4. 设置工作流参数

## REST API 使用

PowerJob 提供完整的 REST API：

**基础认证**：使用应用账号和密码

**常用端点**：
- 查询任务列表：`GET /api/job/list`
- 创建任务：`POST /api/job/save`
- 启用任务：`POST /api/job/enable`
- 禁用任务：`POST /api/job/disable`
- 手动触发任务：`POST /api/job/trigger`

## MapReduce 配置

```java
@Component
public class MyMapReduceProcessor implements MapReduceProcessor {
    
    @Override
    public ProcessResult process(TaskContext context) throws Exception {
        if (isRootTask()) {
            List<Long> subTaskIds = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                subTaskIds.add(map("subTask" + i, null));
            }
            return new ProcessResult(true, "任务拆分完成");
        } else {
            String taskName = (String) context.getSubTask();
            System.out.println("执行子任务：" + taskName);
            return new ProcessResult(true, "子任务执行完成");
        }
    }
}
```

## 数据库表结构

PowerJob 在 XuguDB 中自动创建以下表：

**主数据库表**：
- `job_info`：任务信息表
- `job_log`：任务日志表
- `container_info`：容器信息表
- `workflow_info`：工作流信息表

**任务执行数据库表**：
- `instance_log`：任务实例日志表
- `instance_info`：任务实例信息表

## 性能优化

### 1. 数据库索引

```sql
CREATE INDEX idx_job_info_job_id ON job_info(job_id);
CREATE INDEX idx_instance_log_instance_id ON instance_log(instance_id);
```

### 2. 连接池调优

```properties
spring.datasource.core.hikari.maximum-pool-size=30
spring.datasource.core.hikari.minimum-idle=10
spring.datasource.core.hikari.idle-timeout=60000
```

### 3. 任务优化

1. 合理设置任务超时时间
2. 避免任务执行时间过长
3. 合理使用 MapReduce 模式
4. 定期清理历史日志

## 故障排除

### 常见问题

1. **数据库连接失败**：检查 XuguDB 服务是否启动，JDBC 驱动版本是否兼容
2. **表结构未自动创建**：确保 `auto_create_table=true`，检查数据库用户权限
3. **Hibernate 方言错误**：确认 `hibernate.dialect` 设置为 `org.hibernate.dialect.XuguDialect`
4. **Worker 无法连接 Server**：检查 Server 地址、网络连接、防火墙设置

### 日志配置

```xml
<logger name="tech.powerjob" level="DEBUG"/>
<logger name="com.xugu" level="DEBUG"/>
```

## 最佳实践

1. 使用清晰的任务名称和描述
2. 合理设置调度策略
3. 避免任务执行时间过长
4. 部署多个 Server 节点实现高可用
5. 部署多个 Worker 节点提高处理能力
6. 监控集群状态和任务执行情况
7. 定期备份数据库

## 资源

- **示例项目**：https://github.com/PowerJob/PowerJob
- **官方文档**：https://docs.xugudb.com/content/ecosystem/orm/java/powerjob
- **PowerJob 官网**：http://www.powerjob.tech/
- **在线体验**：https://try.powerjob.tech

---

**注意**：本指南基于 PowerJob v4.3.6/v4.3.9 适配版本，确保使用正确的版本以避免兼容性问题。PowerJob 需要配置两个数据库连接（主库和任务执行库）。