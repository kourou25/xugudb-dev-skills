# Quartz 任务调度虚谷数据库配置指南

## 概述

本文档提供 Quartz 任务调度框架适配虚谷数据库(XuguDB)的完整配置指南，包括数据库初始化、配置文件详解、使用示例、集群配置等。

## 一、核心配置信息

### 1.1 JDBC 驱动类
```
com.xugu.cloudjdbc.Driver
```

### 1.2 连接 URL 格式
```
jdbc:xugu://<host>:<port>/<database>
```

**参数说明：**
- `<host>`: 数据库服务器地址
- `<port>`: 数据库端口（默认5138）
- `<database>`: 数据库名（如quartz）

### 1.3 示例 URL
```
jdbc:xugu://127.0.0.1:5138/quartz
```

## 二、数据库初始化

### 2.1 获取初始化脚本

根据您使用的 Quartz 版本，数据库初始化文件的位置不同：

| Quartz 版本范围 | 数据库初始化文件 (`tables_xugu.sql`) 位置 |
| :--- | :--- |
| **V2.3.0 ~ V2.3.2** | `.\quartz-core\src\main\resources\org\quartz\impl\jdbcjobstore\` |
| **V2.2.0 ~ V2.2.3** | `.\distribution\src\main\assembly\root\docs\dbTables\` |
| **V1.8.0 ~ V2.1.7** | `.\docs\dbTables\` |

### 2.2 执行初始化脚本

```sql
-- 在虚谷数据库中执行 tables_xugu.sql 脚本
-- 创建 Quartz 所需的表结构
```

### 2.3 自动初始化（Spring Boot）

在 Spring Boot 项目中，可以配置自动初始化：

```yaml
spring:
  quartz:
    jdbc:
      initialize-schema: ALWAYS # 首次启动设为 ALWAYS 自动建表
      platform: xugu # 指定数据库平台为虚谷
```

**注意：** 首次启动后，建议将 `initialize-schema` 改为 `NEVER`，避免重复创建表。

## 三、Spring Boot 配置

### 3.1 Maven 依赖

```xml
<!-- Quartz -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-quartz</artifactId>
</dependency>

<!-- 虚谷JDBC驱动 -->
<dependency>
    <groupId>com.xugudb</groupId>
    <artifactId>xugu-jdbc</artifactId>
    <version>12.3.4</version>
</dependency>

<!-- Druid 连接池 -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>1.2.6</version>
</dependency>
```

### 3.2 application.yml 配置

```yaml
spring:
  datasource:
    url: jdbc:xugu://127.0.0.1:5138/quartz
    username: SYSDBA
    password: SYSDBA
    driver-class-name: com.xugu.cloudjdbc.Driver
    type: com.alibaba.druid.pool.DruidDataSource
    druid:
      initialSize: 5
      minIdle: 10
      maxActive: 20
      maxWait: 60000
      validationQuery: SELECT 1
      testWhileIdle: true
      testOnBorrow: false
      testOnReturn: false

  quartz:
    # 数据库初始化配置
    jdbc:
      initialize-schema: NEVER # 首次可设为 ALWAYS 自动建表，之后改为 NEVER
      platform: xugu # 关键配置，指定数据库平台为虚谷
    # 作业存储类型为数据库
    job-store-type: jdbc
    # 调度器名称
    scheduler-name: MyScheduler
    properties:
      org:
        quartz:
          scheduler:
            instanceName: MyScheduler
            threadName: MyQuartzThread
          jobStore:
            # 使用标准JDBC代理
            driverDelegateClass: org.quartz.impl.jdbcjobstore.StdJDBCDelegate
            # 数据源名称
            dataSource: myDS
            # 表名前缀
            tablePrefix: QRTZ_
            # 是否启用集群
            isClustered: false
            clusterCheckinInterval: 15000
          threadPool:
            class: org.quartz.simpl.SimpleThreadPool
            threadCount: 15
            threadNamePrefix: MyQuartzPool
```

### 3.3 关键配置项说明

| 配置项 | 说明 | 推荐值 |
|--------|------|--------|
| `spring.quartz.jdbc.platform` | 数据库平台 | xugu |
| `spring.quartz.job-store-type` | 作业存储类型 | jdbc |
| `spring.quartz.jdbc.initialize-schema` | 是否自动初始化表结构 | NEVER |
| `org.quartz.jobStore.driverDelegateClass` | JDBC 代理类 | StdJDBCDelegate |
| `org.quartz.jobStore.tablePrefix` | 表名前缀 | QRTZ_ |
| `org.quartz.jobStore.isClustered` | 是否启用集群 | false |

## 四、纯 Quartz 配置（非 Spring Boot）

### 4.1 quartz.properties 配置

```properties
# 调度器配置
org.quartz.scheduler.instanceName = MyScheduler
org.quartz.scheduler.instanceId = AUTO
org.quartz.scheduler.rmi.export = false
org.quartz.scheduler.rmi.proxy = false
org.quartz.scheduler.wrapJobExecutionInUserTransaction = false

# 线程池配置
org.quartz.threadPool.class = org.quartz.simpl.SimpleThreadPool
org.quartz.threadPool.threadCount = 15
org.quartz.threadPool.threadPriority = 5
org.quartz.threadPool.threadsInheritContextClassLoaderOfInitializingThread = true

# 作业存储配置
org.quartz.jobStore.misfireThreshold = 60000
org.quartz.jobStore.class = org.quartz.impl.jdbcjobstore.JobStoreTX
org.quartz.jobStore.driverDelegateClass = org.quartz.impl.jdbcjobstore.StdJDBCDelegate
org.quartz.jobStore.tablePrefix = QRTZ_
org.quartz.jobStore.isClustered = false
org.quartz.jobStore.clusterCheckinInterval = 15000

# 数据源配置
org.quartz.jobStore.dataSource = myDS
org.quartz.dataSource.myDS.driver = com.xugu.cloudjdbc.Driver
org.quartz.dataSource.myDS.URL = jdbc:xugu://127.0.0.1:5138/quartz
org.quartz.dataSource.myDS.user = SYSDBA
org.quartz.dataSource.myDS.password = SYSDBA
org.quartz.dataSource.myDS.maxConnections = 10
org.quartz.dataSource.myDS.validationQuery = SELECT 1
```

## 五、使用示例

### 5.1 定义作业类

```java
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;

public class MyJob implements Job {
    
    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        // 获取作业数据
        String jobData = context.getMergedJobDataMap().getString("jobData");
        
        // 执行业务逻辑
        System.out.println("执行作业: " + jobData);
    }
}
```

### 5.2 创建作业和触发器

```java
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class QuartzScheduler {

    @Autowired
    private Scheduler scheduler;

    public void addJob(String jobName, String jobGroup, String cronExpression) throws SchedulerException {
        // 创建作业详情
        JobDetail jobDetail = JobBuilder.newJob(MyJob.class)
                .withIdentity(jobName, jobGroup)
                .usingJobData("jobData", "自定义数据")
                .build();

        // 创建触发器
        CronTrigger trigger = TriggerBuilder.newTrigger()
                .withIdentity(jobName + "Trigger", jobGroup)
                .withSchedule(CronScheduleBuilder.cronSchedule(cronExpression))
                .build();

        // 调度作业
        scheduler.scheduleJob(jobDetail, trigger);
    }

    public void deleteJob(String jobName, String jobGroup) throws SchedulerException {
        scheduler.deleteJob(JobKey.jobKey(jobName, jobGroup));
    }

    public void pauseJob(String jobName, String jobGroup) throws SchedulerException {
        scheduler.pauseJob(JobKey.jobKey(jobName, jobGroup));
    }

    public void resumeJob(String jobName, String jobGroup) throws SchedulerException {
        scheduler.resumeJob(JobKey.jobKey(jobName, jobGroup));
    }
}
```

### 5.3 控制器示例

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/task")
public class QuartzDemoController {

    @Autowired
    private QuartzScheduler quartzScheduler;

    @PostMapping("/simpleJob")
    public String createJob() {
        try {
            quartzScheduler.addJob("testJob", "testGroup", "0/5 * * * * ?");
            return "作业创建成功";
        } catch (Exception e) {
            return "作业创建失败: " + e.getMessage();
        }
    }

    @DeleteMapping("/deleteJob")
    public String deleteJob() {
        try {
            quartzScheduler.deleteJob("testJob", "testGroup");
            return "作业删除成功";
        } catch (Exception e) {
            return "作业删除失败: " + e.getMessage();
        }
    }
}
```

## 六、集群配置

### 6.1 集群配置示例

```yaml
spring:
  quartz:
    properties:
      org:
        quartz:
          jobStore:
            isClustered: true
            clusterCheckinInterval: 15000
          scheduler:
            instanceId: AUTO
```

### 6.2 集群部署步骤

1. **数据库配置**: 所有 Quartz 节点指向同一个虚谷数据库
2. **配置文件**: 每个节点的配置文件中设置 `isClustered: true`
3. **启动集群**: 分别启动各个 Quartz 节点

### 6.3 集群注意事项

- 所有节点必须使用相同的数据库
- 所有节点必须使用相同的表前缀
- 所有节点必须使用相同的调度器名称
- 建议使用 NTP 同步各节点时间

## 七、常见问题排查

### 1. 驱动类找不到

**现象：** 启动时报错 `Driver class not found`

**原因：** JDBC 驱动未正确引入

**解决：** 确保 `xugu-jdbc` 依赖已正确配置

### 2. 连接 URL 错误

**现象：** 连接时报错 `Invalid connection URL`

**原因：** URL 参数错误

**解决：** 确保使用正确的 URL 格式

### 3. 相关表不存在

**现象：** 启动时报错 "相关表不存在"

**原因：** 数据库初始化脚本未执行

**解决：** 
- 执行 `tables_xugu.sql` 初始化脚本
- 或设置 `spring.quartz.jdbc.initialize-schema: ALWAYS`

### 4. 调度器启动失败

**现象：** 调度器启动失败

**原因：** 配置错误或数据库连接问题

**解决：** 
- 检查数据库连接配置
- 检查 Quartz 配置文件
- 查看日志获取详细错误信息

### 5. 作业执行失败

**现象：** 作业执行失败

**原因：** 作业逻辑错误或资源不足

**解决：** 
- 检查作业逻辑
- 检查数据库连接
- 检查线程池配置

### 6. 集群节点不同步

**现象：** 集群节点之间不同步

**原因：** 集群配置不正确

**解决：** 
- 检查 `isClustered` 配置
- 检查数据库连接
- 检查网络连通性

## 八、最佳实践

### 1. 版本管理
- 始终保持 Quartz 版本与虚谷数据库版本兼容
- 定期检查 Quartz 官方发布的更新

### 2. 配置管理
- 使用外部化配置（如 application.yml）
- 为不同环境使用不同配置
- 敏感信息使用环境变量或加密存储

### 3. 性能优化
- 合理配置线程池大小
- 使用集群模式提高可用性
- 优化作业执行逻辑
- 避免作业执行时间过长

### 4. 安全性
- 使用最小权限原则配置数据库用户
- 定期更换数据库密码
- 启用 SSL 加密连接

### 5. 监控与日志
- 启用 Quartz 监控
- 配置日志级别
- 定期检查日志文件
- 监控作业执行状态

## 九、参考资源

### 9.1 官方文档
- [Quartz 官方文档](http://www.quartz-scheduler.org/documentation/)
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [虚谷数据库 Quartz 示例](https://help.xugudb.com/content/ecosystem/orm/java/quartz)

### 9.2 示例项目
- [虚谷 Quartz 示例](https://gitee.com/XuguDB/xugu-quartz-demo)
- [Quartz 示例项目](https://github.com/quartz-scheduler/quartz)

### 9.3 社区资源
- [虚谷数据库社区](https://www.xugudb.com/)
- [Quartz 社区](http://www.quartz-scheduler.org/community/)