# XXL-JOB 分布式任务调度与 XuguDB 集成配置指南

## 1. 概述

XXL-JOB 是一个轻量级分布式任务调度框架，其核心设计目标是开发迅速、学习简单、轻量级、易扩展。本文档详细介绍如何将 XXL-JOB 与虚谷数据库（XuguDB）集成，包括依赖配置、数据源配置、任务调度配置以及使用示例。

### 1.1 版本兼容性
- **XXL-JOB 版本**：v1.4.6 及以上（示例基于 v2.3.1）
- **XuguDB 版本**：v12.10.8+
- **JDK 版本**：JDK 1.8
- **Maven 版本**：3.6.x

### 1.2 核心特性
- 轻量级分布式任务调度框架
- 支持动态任务管理
- 支持多种路由策略
- 支持故障转移
- 提供友好的 Web UI 管理界面
- 支持任务依赖
- 支持分片任务
- 提供 REST API

## 2. 环境准备

### 2.1 获取适配版 XXL-JOB
由于 XXL-JOB 官方版本不支持 XuguDB，需要使用虚谷提供的适配版本。

**方式一：下载适配版**
访问虚谷官方文档下载适配版 XXL-JOB：https://help.xugudb.com/content/ecosystem/orm/java/xxl-job

**方式二：从源码构建**
```bash
# 克隆 XXL-JOB 源码
git clone https://github.com/xuxueli/xxl-job.git
# 切换到适配分支（如果存在）
git checkout 2.3.1-xugu
```

### 2.2 数据库准备
在 XuguDB 中创建数据库和用户：

```sql
-- 创建数据库
CREATE DATABASE `xxl_job` CHARACTER SET 'utf8_bin' TIME ZONE 'GMT+08:00';
USE xxl_job;
CREATE USER `xxl_job` IDENTIFIED BY 'xxl_job';
GRANT DBA IN SCHEMA `xxl_job` TO `xxl_job';
```

### 2.3 初始化数据库
执行适配版 XXL-JOB 提供的 SQL 初始化脚本 `tables_xxl_job_xugu.sql`，该脚本会创建 XXL-JOB 运行所需的八个表对象：

1. `xxl_job_group`：执行器信息表
2. `xxl_job_info`：任务信息表
3. `xxl_job_lock`：任务锁表
4. `xxl_job_log`：任务日志表
5. `xxl_job_log_report`：任务日志报表
6. `xxl_job_logglue`：任务 GLUE 日志表
7. `xxl_job_registry`：执行器注册表
8. `xxl_job_user`：用户表

## 3. 配置步骤

### 3.1 application.properties 配置
XXL-JOB 使用 `application.properties` 配置文件，关键配置项如下：

```properties
# ==================== 服务器配置 ====================
# 服务器端口
server.port=8080
# 上下文路径
server.servlet.context-path=/xxl-job-admin

# ==================== 数据库配置 ====================
# 数据库连接
spring.datasource.url=jdbc:xugu://127.0.0.1:5138/xxl_job
spring.datasource.username=xxl_job
spring.datasource.password=xxl_job
spring.datasource.driver-class-name=com.xugudb.jdbc.Driver

# ==================== 连接池配置 ====================
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.idle-timeout=30000
spring.datasource.hikari.pool-name=XXL-JOB-HikariCP
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.connection-timeout=30000

# ==================== XXL-JOB 配置 ====================
# 调度中心配置
xxl.job.accessToken=default_token
xxl.job.i18n=

# 邮件配置（可选）
spring.mail.host=smtp.qq.com
spring.mail.port=25
spring.mail.username=xxx@qq.com
spring.mail.password=xxx
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
```

### 3.2 配置参数详解

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `spring.datasource.driver-class-name` | XuguDB JDBC 驱动类 | `com.xugudb.jdbc.Driver` |
| `spring.datasource.url` | 数据库连接 URL | `jdbc:xugu://host:port/db` |
| `xxl.job.accessToken` | 调度中心与执行器通信令牌 | `default_token`（建议修改） |
| `xxl.job.i18n` | 国际化配置 | 空（默认中文） |

## 4. 启动与验证

### 4.1 启动命令
```bash
# Windows 环境
java -jar xxl-job-admin-2.3.1.jar --spring.config.location=file:/path/to/application.properties

# Linux 环境
java -jar xxl-job-admin-2.3.1.jar --spring.config.location=file:/path/to/application.properties
```

### 4.2 验证步骤
1. **启动日志**：检查控制台输出，确认无数据库连接错误
2. **自动建表**：查看 XuguDB 数据库，确认已创建 XXL-JOB 相关表结构
3. **访问 Web 界面**：打开浏览器访问 `http://localhost:8080/xxl-job-admin/toLogin`
4. **登录系统**：使用默认账号登录

### 4.3 登录信息
- **默认端口**：8080
- **默认上下文路径**：`/xxl-job-admin`
- **默认管理员账户**：
  - 账号：`admin`
  - 密码：`123456`

## 5. 执行器配置

### 5.1 Spring Boot 集成
在 Spring Boot 项目中集成 XXL-JOB 执行器：

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

### 5.2 执行器配置
在 `application.yml` 中配置：

```yaml
xxl:
  job:
    admin:
      # 调度中心地址
      addresses: http://127.0.0.1:8080/xxl-job-admin
    executor:
      # 执行器名称
      appname: my-executor
      # 执行器端口
      port: 9999
      # 执行器日志路径
      logpath: /data/applogs/xxl-job/jobhandler
      # 执行器日志保留天数
      logretentiondays: 30
    # 通信令牌（需要与调度中心一致）
    accessToken: default_token
```

### 5.3 执行器配置类
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

## 6. 任务配置与管理

### 6.1 创建任务
通过 Web UI 创建任务：
1. 登录 XXL-JOB 控制台
2. 进入"任务管理"页面
3. 点击"新增任务"
4. 配置任务参数：
   - 任务描述
   - 路由策略
   - Cron 表达式
   - 运行模式
   - 执行器
   - JobHandler

### 6.2 路由策略
XXL-JOB 支持多种路由策略：

**1. FIRST（第一个）**
- 固定选择第一个机器执行

**2. LAST（最后一个）**
- 固定选择最后一个机器执行

**3. ROUND（轮询）**
- 按顺序轮流执行

**4. RANDOM（随机）**
- 随机选择一台机器执行

**5. CONSISTENT_HASH（一致性 HASH）**
- 每个任务按照 Hash 算法固定选择某一台机器执行

**6. LEAST_FREQUENTLY_USED（最不经常使用）**
- 使用频率最低的机器优先执行

**7. LEAST_RECENTLY_USED（最近最久未使用）**
- 最久未使用的机器优先执行

**8. FAILOVER（故障转移）**
- 按照顺序依次进行心跳检测，第一个心跳检测成功的机器选定为目标执行器并发起调度

**9. BUSYOVER（忙碌转移）**
- 按照顺序依次进行空闲检测，第一个空闲检测成功的机器选定为目标执行器并发起调度

**10. SHARDING_BROADCAST（分片广播）**
- 广播触发对应集群中所有机器执行一次任务，同时系统自动传递分片参数

### 6.3 运行模式
XXL-JOB 支持多种运行模式：

**1. BEAN（Bean 模式）**
- 任务以 Bean 方式注册到执行器
- 支持 @XxlJob 注解方式

**2. GLUE（GLUE 模式）**
- 任务以 GLUE 代码方式运行
- 支持 Java、Shell、Python、Node.js、PHP、PowerShell 等

**3. GLUE_GROOVY（Groovy 模式）**
- 任务以 Groovy 脚本方式运行

## 7. 任务处理器

### 7.1 Bean 模式任务处理器
```java
@Component
public class MyJobHandler {
    
    @XxlJob("myJobHandler")
    public void myJobHandler() throws Exception {
        // 获取任务参数
        String jobParam = XxlJobHelper.getJobParam();
        
        // 执行业务逻辑
        XxlJobHelper.log("执行任务，参数：" + jobParam);
        
        // 返回执行结果
        XxlJobHelper.handleSuccess("任务执行成功");
    }
}
```

### 7.2 分片任务处理器
```java
@Component
public class ShardingJobHandler {
    
    @XxlJob("shardingJobHandler")
    public void shardingJobHandler() throws Exception {
        // 分片参数
        int shardIndex = XxlJobHelper.getShardIndex();
        int shardTotal = XxlJobHelper.getShardTotal();
        
        // 执行业务逻辑
        XxlJobHelper.log("分片参数：当前分片={}, 总分片={}", shardIndex, shardTotal);
        
        // 处理分片任务
        List<Integer> items = getItemList();
        for (int i = 0; i < items.size(); i++) {
            if (i % shardTotal == shardIndex) {
                // 处理当前分片的任务
                processItem(items.get(i));
            }
        }
        
        XxlJobHelper.handleSuccess("分片任务执行成功");
    }
}
```

## 8. REST API 使用

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

## 9. 数据库表结构

XXL-JOB 在 XuguDB 中自动创建以下表：

### 9.1 核心表
- `xxl_job_group`：执行器信息表
- `xxl_job_info`：任务信息表
- `xxl_job_lock`：任务锁表
- `xxl_job_log`：任务日志表
- `xxl_job_log_report`：任务日志报表
- `xxl_job_logglue`：任务 GLUE 日志表
- `xxl_job_registry`：执行器注册表
- `xxl_job_user`：用户表

### 9.2 表结构说明
- `xxl_job_group`：存储执行器信息，包括执行器名称、地址类型等
- `xxl_job_info`：存储任务信息，包括 Cron 表达式、路由策略、运行模式等
- `xxl_job_log`：存储任务执行日志，包括执行时间、执行结果等

## 10. 高级配置

### 10.1 集群配置
XXL-JOB 支持集群部署：
1. 部署多个调度中心节点
2. 使用 Nginx 进行负载均衡
3. 配置相同的数据库连接
4. 配置相同的访问令牌

### 10.2 邮件报警配置
```properties
spring.mail.host=smtp.qq.com
spring.mail.port=25
spring.mail.username=xxx@qq.com
spring.mail.password=xxx
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
```

### 10.3 日志配置
```properties
# 日志路径
xxl.job.executor.logpath=/data/applogs/xxl-job/jobhandler
# 日志保留天数
xxl.job.executor.logretentiondays=30
```

## 11. 性能优化

### 11.1 数据库优化
```sql
-- 为常用查询字段创建索引
CREATE INDEX idx_job_info_job_group ON xxl_job_info(job_group);
CREATE INDEX idx_job_log_job_id ON xxl_job_log(job_id);
CREATE INDEX idx_job_log_trigger_time ON xxl_job_log(trigger_time);
```

### 11.2 连接池优化
```properties
spring.datasource.hikari.minimum-idle=10
spring.datasource.hikari.maximum-pool-size=30
spring.datasource.hikari.idle-timeout=60000
spring.datasource.hikari.max-lifetime=1800000
```

### 11.3 任务优化
1. 合理设置任务超时时间
2. 避免任务执行时间过长
3. 合理使用分片任务
4. 定期清理历史日志

## 12. 故障排除

### 12.1 常见问题

**问题1：数据库连接失败**
- **现象**：启动时报数据库连接错误
- **解决**：检查 XuguDB 服务是否启动，网络是否可达，JDBC 驱动版本是否兼容

**问题2：执行器注册失败**
- **现象**：执行器无法注册到调度中心
- **解决**：检查调度中心地址是否正确，网络是否可达，访问令牌是否一致

**问题3：任务执行失败**
- **现象**：任务执行时报错
- **解决**：检查任务处理器代码，查看执行日志，确认执行器配置正确

**问题4：GLUE 模式任务失败**
- **现象**：GLUE 模式任务执行失败
- **解决**：检查 GLUE 代码语法，确认运行环境正确

### 12.2 日志配置
```xml
<configuration>
    <logger name="com.xuxueli" level="DEBUG"/>
    <logger name="com.xugu" level="DEBUG"/>
</configuration>
```

## 13. 最佳实践

### 13.1 任务设计
1. 使用清晰的任务描述
2. 合理设置路由策略
3. 避免任务执行时间过长
4. 合理使用分片任务

### 13.2 集群管理
1. 部署多个调度中心节点实现高可用
2. 使用 Nginx 进行负载均衡
3. 监控集群状态和任务执行情况
4. 定期备份数据库

### 13.3 监控与维护
1. 监控任务执行状态
2. 定期清理历史日志
3. 监控数据库表空间使用
4. 监控系统资源使用情况

## 14. 示例项目

完整的示例项目可参考：
- **GitHub 仓库**：https://github.com/xuxueli/xxl-job
- **官方文档**：https://help.xugudb.com/content/ecosystem/orm/java/xxl-job
- **XXL-JOB 官网**：http://www.xuxueli.com/xxl-job/

## 15. 参考资料

- [XXL-JOB 官方文档](http://www.xuxueli.com/xxl-job/)
- [XXL-JOB GitHub](https://github.com/xuxueli/xxl-job)
- [虚谷数据库官方文档](https://help.xugudb.com)
- [Spring Boot 配置参考](https://docs.spring.io/spring-boot/docs/current/reference/html/)