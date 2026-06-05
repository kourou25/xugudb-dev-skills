# PowerJob 分布式任务调度与 XuguDB 集成配置指南

## 1. 概述

PowerJob（原 OhMyScheduler）是新一代分布式调度与计算框架，支持 CRON 表达式、固定频率、固定延迟等调度策略，提供工作流来编排任务解决依赖关系。本文档详细介绍如何将 PowerJob 与虚谷数据库（XuguDB）集成，包括依赖配置、数据源配置、任务调度配置以及使用示例。

### 1.1 版本兼容性
- **PowerJob 版本**：v4.0.1 及以上（示例基于 v4.3.6/v4.3.9）
- **XuguDB 版本**：v12.10.8+
- **JDK 版本**：JDK 1.8
- **Maven 版本**：3.6.x

### 1.2 核心特性
- 支持多种调度策略（CRON、固定频率、固定延迟、OpenAPI）
- 支持多种执行模式（单机、广播、Map、MapReduce）
- 提供工作流（DAG）支持
- 提供友好的 Web UI 管理界面
- 支持分布式计算
- 支持延迟任务
- 提供 REST API

## 2. 环境准备

### 2.1 获取适配版 PowerJob
由于 PowerJob 官方版本不支持 XuguDB，需要使用虚谷提供的适配版本。

**方式一：下载适配版**
访问虚谷官方文档下载适配版 PowerJob：https://docs.xugudb.com/content/ecosystem/orm/java/powerjob

**方式二：从源码构建**
```bash
# 克隆 PowerJob 源码
git clone https://github.com/PowerJob/PowerJob.git
# 切换到适配分支（如果存在）
git checkout 4.3.6-xugu
```

### 2.2 数据库准备
PowerJob 需要两个数据库：
1. **主数据库**：存储元数据（任务配置、调度信息等）
2. **任务执行数据库**：存储任务执行日志和结果

在 XuguDB 中创建数据库和用户：

```sql
-- 创建主数据库
CREATE DATABASE `powerjob` CHARACTER SET 'utf8_bin' TIME ZONE 'GMT+08:00';
USE powerjob;
CREATE USER `powerjob` IDENTIFIED BY 'powerjob';
GRANT DBA IN SCHEMA `powerjob` TO `powerjob`;

-- 创建任务执行数据库
CREATE DATABASE `powerjob_remote` CHARACTER SET 'utf8_bin' TIME ZONE 'GMT+08:00';
USE powerjob_remote;
CREATE USER `powerjob_remote` IDENTIFIED BY 'powerjob_remote';
GRANT DBA IN SCHEMA `powerjob_remote` TO `powerjob_remote`;
```

## 3. 配置步骤

### 3.1 application.properties 配置
PowerJob 使用 `application.properties` 配置文件，关键配置项如下：

```properties
# ==================== 服务器配置 ====================
# 服务器端口
server.port=7700
# 服务器上下文路径
server.servlet.context-path=/

# ==================== 数据库配置 ====================
# 主数据库连接（用于存储元数据）
spring.datasource.core.driver-class-name=com.xugudb.jdbc.Driver
spring.datasource.core.url=jdbc:xugu://127.0.0.1:5138/powerjob
spring.datasource.core.username=powerjob
spring.datasource.core.password=powerjob

# 任务执行数据库连接
spring.datasource.remote.driver-class-name=com.xugudb.jdbc.Driver
spring.datasource.remote.url=jdbc:xugu://127.0.0.1:5138/powerjob_remote
spring.datasource.remote.username=powerjob_remote
spring.datasource.remote.password=powerjob_remote

# ==================== Hibernate 配置 ====================
# 设置为虚谷数据库方言
spring.datasource.remote.hibernate.properties.hibernate.dialect=org.hibernate.dialect.XuguDialect
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.XuguDialect

# ==================== PowerJob 配置 ====================
# 自动建表配置（初次使用时开启）
oms.storage.dfs.xugu_series.auto_create_table=true

# 调度策略配置
oms.instanceinfo.retention.min=7200
oms.container.retention.local=10080
oms.log.retention=7200

# 集群配置（可选）
oms.address=127.0.0.1:7700
oms.name=powerjob-server
```

### 3.2 配置参数详解

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `spring.datasource.core.driver-class-name` | XuguDB JDBC 驱动类 | `com.xugudb.jdbc.Driver` |
| `spring.datasource.core.url` | 主数据库连接 URL | `jdbc:xugu://host:port/db` |
| `spring.datasource.remote.url` | 任务执行数据库连接 URL | `jdbc:xugu://host:port/db` |
| `hibernate.dialect` | Hibernate 方言 | `org.hibernate.dialect.XuguDialect` |
| `oms.storage.dfs.xugu_series.auto_create_table` | 自动建表 | `true`（初次使用） |
| `oms.instanceinfo.retention.min` | 实例信息保留时间（分钟） | `7200`（5天） |

## 4. 启动与验证

### 4.1 启动命令
```bash
# Windows 环境
java -jar powerjob-server-starter-4.3.9.jar --spring.config.location=<配置文件路径>/application.properties

# Linux 环境
java -jar powerjob-server-starter-4.3.9.jar --spring.config.location=/path/to/application.properties
```

### 4.2 验证步骤
1. **启动日志**：检查控制台输出，确认无数据库连接错误
2. **自动建表**：查看 XuguDB 数据库，确认已自动生成 PowerJob 相关表结构
3. **访问 Web 界面**：打开浏览器访问 `http://127.0.0.1:7700/#/welcome`
4. **注册应用**：首次使用需注册应用账户，后续登录使用该账户

### 4.3 登录信息
- **默认端口**：7700
- **默认管理员账户**（v5.x 及以上版本）：
  - 账号：`ADMIN`
  - 密码：`powerjob_admin`

## 5. 任务配置与管理

### 5.1 创建任务
通过 Web UI 创建任务：
1. 登录 PowerJob 控制台
2. 进入"任务管理"页面
3. 点击"新建任务"
4. 配置任务参数：
   - 任务名称
   - 任务描述
   - 调度类型（CRON、固定频率等）
   - 执行器类型（Java、Shell、Python）
   - 执行器信息（类名、脚本路径等）

### 5.2 调度策略
PowerJob 支持多种调度策略：

**1. CRON 表达式**
```properties
# 每天凌晨 2 点执行
0 0 2 * * ?
```

**2. 固定频率**
```properties
# 每 5 分钟执行一次
fixedRate=300000
```

**3. 固定延迟**
```properties
# 上次执行完成后延迟 10 秒执行
fixedDelay=10000
```

**4. API 触发**
```properties
# 通过 API 触发执行
api=true
```

### 5.3 执行模式
PowerJob 支持多种执行模式：

**1. 单机模式（Standalone）**
- 任务只在单个 Worker 节点执行
- 适用于不需要分布式的任务

**2. 广播模式（Broadcast）**
- 任务在所有 Worker 节点执行
- 适用于集群清理、日志收集等场景

**3. Map 模式**
- 将大任务拆分为多个小任务并行执行
- 适用于数据处理、文件处理等场景

**4. MapReduce 模式**
- 支持分布式计算
- 适用于大规模数据处理、机器学习等场景

## 6. Worker 配置

### 6.1 Spring Boot 集成
在 Spring Boot 项目中集成 PowerJob Worker：

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

### 6.2 Worker 配置
在 `application.yml` 中配置：

```yaml
powerjob:
  worker:
    # PowerJob Server 地址
    server-address: 127.0.0.1:7700
    # 应用名称（需要在 Server 中注册）
    app-name: my-application
    # 应用密码（需要在 Server 中注册）
    password: my-password
    # Worker 端口（可选）
    port: 27777
    # 启用持久化存储（可选）
    store-strategy: disk
```

### 6.3 任务处理器
创建任务处理器：

```java
@Component
public class MyBasicProcessor implements BasicProcessor {
    
    @Override
    public ProcessResult process(TaskContext context) throws Exception {
        // 获取任务参数
        String jobParams = context.getJobParams();
        
        // 执行业务逻辑
        System.out.println("执行任务，参数：" + jobParams);
        
        // 返回执行结果
        return new ProcessResult(true, "任务执行成功");
    }
}
```

## 7. REST API 使用

### 7.1 PowerJob REST API
PowerJob 提供完整的 REST API：

**基础认证**：使用应用账号和密码

**常用端点**：
- 查询任务列表：`GET /api/job/list`
- 创建任务：`POST /api/job/save`
- 启用任务：`POST /api/job/enable`
- 禁用任务：`POST /api/job/disable`
- 手动触发任务：`POST /api/job/trigger`

### 7.2 API 调用示例
```bash
# 查询任务列表
curl -X GET "http://127.0.0.1:7700/api/job/list" \
  -H "Content-Type: application/json" \
  -u "my-application:my-password"

# 创建任务
curl -X POST "http://127.0.0.1:7700/api/job/save" \
  -H "Content-Type: application/json" \
  -u "my-application:my-password" \
  -d '{
    "jobName": "测试任务",
    "jobDescription": "这是一个测试任务",
    "jobParams": "test params",
    "scheduleType": 1,
    "scheduleValue": "0 0 2 * * ?",
    "executeType": 1,
    "processorType": 1,
    "processorInfo": "com.example.MyBasicProcessor"
  }'
```

## 8. 数据库表结构

PowerJob 在 XuguDB 中自动创建以下表：

### 8.1 主数据库表
- `job_info`：任务信息表
- `job_log`：任务日志表
- `container_info`：容器信息表
- `workflow_info`：工作流信息表
- `workflow_node_info`：工作流节点信息表

### 8.2 任务执行数据库表
- `instance_log`：任务实例日志表
- `instance_info`：任务实例信息表

## 9. 高级配置

### 9.1 集群配置
```properties
# 服务器地址（多个用逗号分隔）
oms.address=127.0.0.1:7700,127.0.0.1:7701

# 集群名称
oms.name=powerjob-cluster

# 集群节点 ID（每个节点不同）
oms.id=1
```

### 9.2 工作流配置
PowerJob 支持 DAG 工作流：

1. 创建工作流
2. 添加工作流节点
3. 配置节点依赖关系
4. 设置工作流参数

### 9.3 MapReduce 配置
```java
@Component
public class MyMapReduceProcessor implements MapReduceProcessor {
    
    @Override
    public ProcessResult process(TaskContext context) throws Exception {
        if (isRootTask()) {
            // 根任务：拆分任务
            List<Long> subTaskIds = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                subTaskIds.add(map("subTask" + i, null));
            }
            return new ProcessResult(true, "任务拆分完成");
        } else {
            // 子任务：执行具体逻辑
            String taskName = (String) context.getSubTask();
            System.out.println("执行子任务：" + taskName);
            return new ProcessResult(true, "子任务执行完成");
        }
    }
}
```

## 10. 性能优化

### 10.1 数据库优化
```sql
-- 为常用查询字段创建索引
CREATE INDEX idx_job_info_job_id ON job_info(job_id);
CREATE INDEX idx_instance_log_instance_id ON instance_log(instance_id);
CREATE INDEX idx_job_log_job_id ON job_log(job_id);
```

### 10.2 连接池优化
```properties
# HikariCP 连接池配置
spring.datasource.core.hikari.maximum-pool-size=20
spring.datasource.core.hikari.minimum-idle=5
spring.datasource.core.hikari.idle-timeout=30000

spring.datasource.remote.hikari.maximum-pool-size=20
spring.datasource.remote.hikari.minimum-idle=5
spring.datasource.remote.hikari.idle-timeout=30000
```

### 10.3 任务优化
1. 合理设置任务超时时间
2. 避免任务执行时间过长
3. 合理使用 MapReduce 模式
4. 定期清理历史日志

## 11. 故障排除

### 11.1 常见问题

**问题1：数据库连接失败**
- **现象**：启动时报数据库连接错误
- **解决**：检查 XuguDB 服务是否启动，网络是否可达，JDBC 驱动版本是否兼容

**问题2：表结构未自动创建**
- **现象**：启动时报表不存在
- **解决**：确保配置项 `oms.storage.dfs.xugu_series.auto_create_table=true` 已设置，检查数据库用户是否有建表权限

**问题3：Hibernate 方言错误**
- **现象**：启动时报 Hibernate 方言相关异常
- **解决**：确认 `hibernate.dialect` 已设置为 `org.hibernate.dialect.XuguDialect`

**问题4：Worker 无法连接 Server**
- **现象**：Worker 启动后无法连接到 Server
- **解决**：检查 Server 地址是否正确，网络是否可达，防火墙设置

### 11.2 日志配置
```xml
<configuration>
    <logger name="tech.powerjob" level="DEBUG"/>
    <logger name="com.xugu" level="DEBUG"/>
</configuration>
```

## 12. 最佳实践

### 12.1 任务设计
1. 使用清晰的任务名称和描述
2. 合理设置调度策略
3. 避免任务执行时间过长
4. 合理使用任务参数

### 12.2 集群管理
1. 部署多个 Server 节点实现高可用
2. 部署多个 Worker 节点提高处理能力
3. 监控集群状态和任务执行情况
4. 定期备份数据库

### 12.3 监控与维护
1. 监控任务执行状态
2. 定期清理历史日志
3. 监控数据库表空间使用
4. 监控系统资源使用情况

## 13. 示例项目

完整的示例项目可参考：
- **GitHub 仓库**：https://github.com/PowerJob/PowerJob
- **官方文档**：https://docs.xugudb.com/content/ecosystem/orm/java/powerjob
- **在线体验**：https://try.powerjob.tech

## 14. 参考资料

- [PowerJob 官方文档](http://www.powerjob.tech/)
- [PowerJob GitHub](https://github.com/PowerJob/PowerJob)
- [虚谷数据库官方文档](https://docs.xugudb.com)
- [Hibernate 方言配置](https://docs.jboss.org/hibernate/orm/5.4/userguide/html_single/Hibernate_User_Guide.html)