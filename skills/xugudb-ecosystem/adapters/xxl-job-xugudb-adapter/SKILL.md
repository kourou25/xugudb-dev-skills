---
name: xxl-job-xugudb-adapter
description: XXL-JOB 分布式任务调度框架与虚谷数据库（XuguDB）集成适配指南。当用户需要在 Spring Boot 项目中使用 XXL-JOB 连接 XuguDB 时使用此技能，包括任务调度配置、数据源设置、执行器配置、任务处理器编写、路由策略、分片任务等。适用于定时任务、批量数据处理、分布式计算、工作流编排等场景。
---

# XXL-JOB 分布式任务调度 XuguDB 适配指南

## 概述

本指南详细介绍如何将 XXL-JOB 分布式任务调度框架与虚谷数据库（XuguDB）集成，包括完整的配置流程、使用示例和最佳实践。XXL-JOB 是一个轻量级分布式任务调度框架，支持动态任务管理、多种路由策略和故障转移。

## 快速开始

### 1. 获取适配版 XXL-JOB

由于官方 XXL-JOB 不支持 XuguDB，需要使用虚谷提供的适配版本：

```bash
# 下载适配版 XXL-JOB
# 访问：https://help.xugudb.com/content/ecosystem/orm/java/xxl-job
```

### 2. 初始化数据库

在 XuguDB 中创建数据库：

```sql
CREATE DATABASE `xxl_job` CHARACTER SET 'utf8_bin' TIME ZONE 'GMT+08:00';
USE xxl_job;
CREATE USER `xxl_job` IDENTIFIED BY 'xxl_job';
GRANT DBA IN SCHEMA `xxl_job' TO 'xxl_job';
```

执行适配版提供的 SQL 初始化脚本 `tables_xxl_job_xugu.sql`。

### 3. 配置数据源

在 `application.properties` 中配置：

```properties
spring.datasource.driver-class-name=com.xugudb.jdbc.Driver
spring.datasource.url=jdbc:xugu://127.0.0.1:5138/xxl_job
spring.datasource.username=xxl_job
spring.datasource.password=xxl_job
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.maximum-pool-size=20

xxl.job.accessToken=default_token
```

### 4. 启动 XXL-JOB Admin

```bash
java -jar xxl-job-admin-2.3.1.jar --spring.config.location=file:./application.properties
```

### 5. 访问管理界面

- **地址**：`http://localhost:8080/xxl-job-admin/toLogin`
- **默认账号**：`admin`
- **默认密码**：`123456`

## 配置详解

### 数据源配置参数

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `driver-class-name` | XuguDB JDBC 驱动类 | `com.xugudb.jdbc.Driver` |
| `url` | 数据库连接 URL | `jdbc:xugu://host:port/db` |
| `accessToken` | 通信令牌 | `default_token`（建议修改） |

### 连接池配置

```properties
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.idle-timeout=30000
spring.datasource.hikari.max-lifetime=1800000
```

## 执行器集成

### 1. 添加 Maven 依赖

```xml
<dependencies>
    <!-- XXL-JOB 执行器 -->
    <dependency>
        <groupId>com.xuxueli</groupId>
        <artifactId>xxl-job-core</artifactId>
        <version>2.3.1</version>
    </dependency>
    
    <!-- XuguDB JDBC 驱动 -->
    <dependency>
        <groupId>com.xugudb</groupId>
        <artifactId>xugu-jdbc</artifactId>
        <version>12.3.4</version>
    </dependency>
</dependencies>
```

### 2. 配置执行器

在 `application.yml` 中配置：

```yaml
xxl:
  job:
    admin:
      addresses: http://127.0.0.1:8080/xxl-job-admin
    executor:
      appname: my-executor
      port: 9999
      logpath: /data/applogs/xxl-job/jobhandler
      logretentiondays: 30
    accessToken: default_token
```

### 3. 配置执行器 Bean

```java
@Configuration
public class XxlJobConfig {
    
    @Value("${xxl.job.admin.addresses}")
    private String adminAddresses;
    
    @Value("${xxl.job.accessToken}")
    private String accessToken;
    
    @Value("${xxl.job.executor.appname}")
    private String appname;
    
    @Value("${xxl.job.executor.port}")
    private int port;
    
    @Value("${xxl.job.executor.logpath}")
    private String logpath;
    
    @Value("${xxl.job.executor.logretentiondays}")
    private int logretentiondays;
    
    @Bean
    public XxlJobSpringExecutor xxlJobExecutor() {
        XxlJobSpringExecutor executor = new XxlJobSpringExecutor();
        executor.setAdminAddresses(adminAddresses);
        executor.setAppname(appname);
        executor.setPort(port);
        executor.setLogPath(logpath);
        executor.setLogRetentionDays(logretentiondays);
        executor.setAccessToken(accessToken);
        return executor;
    }
}
```

## 任务处理器

### Bean 模式任务处理器

```java
@Component
public class MyJobHandler {
    
    @XxlJob("myJobHandler")
    public void myJobHandler() throws Exception {
        String jobParam = XxlJobHelper.getJobParam();
        XxlJobHelper.log("执行任务，参数：" + jobParam);
        XxlJobHelper.handleSuccess("任务执行成功");
    }
}
```

### 分片任务处理器

```java
@Component
public class ShardingJobHandler {
    
    @XxlJob("shardingJobHandler")
    public void shardingJobHandler() throws Exception {
        int shardIndex = XxlJobHelper.getShardIndex();
        int shardTotal = XxlJobHelper.getShardTotal();
        
        XxlJobHelper.log("分片参数：当前分片={}, 总分片={}", shardIndex, shardTotal);
        
        // 处理分片任务
        List<Integer> items = getItemList();
        for (int i = 0; i < items.size(); i++) {
            if (i % shardTotal == shardIndex) {
                processItem(items.get(i));
            }
        }
        
        XxlJobHelper.handleSuccess("分片任务执行成功");
    }
}
```

## 路由策略

XXL-JOB 支持多种路由策略：

1. **FIRST（第一个）**：固定选择第一个机器执行
2. **LAST（最后一个）**：固定选择最后一个机器执行
3. **ROUND（轮询）**：按顺序轮流执行
4. **RANDOM（随机）**：随机选择一台机器执行
5. **CONSISTENT_HASH（一致性 HASH）**：每个任务按照 Hash 算法固定选择某一台机器执行
6. **LEAST_FREQUENTLY_USED（最不经常使用）**：使用频率最低的机器优先执行
7. **LEAST_RECENTLY_USED（最近最久未使用）**：最久未使用的机器优先执行
8. **FAILOVER（故障转移）**：按照顺序依次进行心跳检测，第一个心跳检测成功的机器选定为目标执行器并发起调度
9. **BUSYOVER（忙碌转移）**：按照顺序依次进行空闲检测，第一个空闲检测成功的机器选定为目标执行器并发起调度
10. **SHARDING_BROADCAST（分片广播）**：广播触发对应集群中所有机器执行一次任务，同时系统自动传递分片参数

## 运行模式

XXL-JOB 支持多种运行模式：

1. **BEAN（Bean 模式）**：任务以 Bean 方式注册到执行器，支持 @XxlJob 注解方式
2. **GLUE（GLUE 模式）**：任务以 GLUE 代码方式运行，支持 Java、Shell、Python、Node.js、PHP、PowerShell 等
3. **GLUE_GROOVY（Groovy 模式）**：任务以 Groovy 脚本方式运行

## REST API 使用

XXL-JOB 提供完整的 REST API：

**基础认证**：使用管理员账号和密码

**常用端点**：
- 查询任务列表：`POST /api/jobinfo/pageList`
- 创建任务：`POST /api/jobinfo/add`
- 更新任务：`POST /api/jobinfo/update`
- 删除任务：`POST /api/jobinfo/remove`
- 启动任务：`POST /api/jobinfo/start`
- 停止任务：`POST /api/jobinfo/stop`
- 手动触发任务：`POST /api/jobinfo/trigger`

## 数据库表结构

XXL-JOB 在 XuguDB 中自动创建以下表：

- `xxl_job_group`：执行器信息表
- `xxl_job_info`：任务信息表
- `xxl_job_lock`：任务锁表
- `xxl_job_log`：任务日志表
- `xxl_job_log_report`：任务日志报表
- `xxl_job_logglue`：任务 GLUE 日志表
- `xxl_job_registry`：执行器注册表
- `xxl_job_user`：用户表

## 性能优化

### 1. 数据库索引

```sql
CREATE INDEX idx_job_info_job_group ON xxl_job_info(job_group);
CREATE INDEX idx_job_log_job_id ON xxl_job_log(job_id);
CREATE INDEX idx_job_log_trigger_time ON xxl_job_log(trigger_time);
```

### 2. 连接池调优

```properties
spring.datasource.hikari.minimum-idle=10
spring.datasource.hikari.maximum-pool-size=30
spring.datasource.hikari.idle-timeout=60000
```

### 3. 任务优化

1. 合理设置任务超时时间
2. 避免任务执行时间过长
3. 合理使用分片任务
4. 定期清理历史日志

## 故障排除

### 常见问题

1. **数据库连接失败**：检查 XuguDB 服务是否启动，JDBC 驱动版本是否兼容
2. **执行器注册失败**：检查调度中心地址、网络连接、访问令牌是否一致
3. **任务执行失败**：检查任务处理器代码，查看执行日志，确认执行器配置正确
4. **GLUE 模式任务失败**：检查 GLUE 代码语法，确认运行环境正确

### 日志配置

```xml
<logger name="com.xuxueli" level="DEBUG"/>
<logger name="com.xugu" level="DEBUG"/>
```

## 最佳实践

1. 使用清晰的任务描述
2. 合理设置路由策略
3. 避免任务执行时间过长
4. 部署多个调度中心节点实现高可用
5. 使用 Nginx 进行负载均衡
6. 监控集群状态和任务执行情况
7. 定期备份数据库

## 资源

- **示例项目**：https://github.com/xuxueli/xxl-job
- **官方文档**：https://help.xugudb.com/content/ecosystem/orm/java/xxl-job
- **XXL-JOB 官网**：http://www.xuxueli.com/xxl-job/

---

**注意**：本指南基于 XXL-JOB v2.3.1 适配版本，确保使用正确的版本以避免兼容性问题。必须使用虚谷提供的适配版 XXL-JOB 和专用 SQL 初始化脚本。