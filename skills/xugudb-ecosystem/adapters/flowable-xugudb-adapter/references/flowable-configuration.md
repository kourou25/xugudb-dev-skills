# Flowable 工作流引擎与 XuguDB 集成配置指南

## 1. 概述

Flowable 是一个紧凑且高效的工作流和业务流程管理（BPM）平台，支持 BPMN 2.0、CMMN 和 DMN 标准。本文档详细介绍如何将 Flowable 与虚谷数据库（XuguDB）集成，包括依赖配置、数据源配置、流程引擎配置以及使用示例。

### 1.1 版本兼容性
- **Flowable 版本**：v6.7.2-xugu（XuguDB 适配版）
- **XuguDB 版本**：v12.0.0+
- **JDK 版本**：JDK 1.8
- **Maven 版本**：3.6.x

### 1.2 核心特性
- 支持 BPMN 2.0 流程定义
- 支持 CMMN 案例管理
- 支持 DMN 决策模型
- 与 Spring Boot 深度集成
- 提供 REST API 和 Java API
- 支持 Flowable UI 管理界面

## 2. 环境准备

### 2.1 获取适配版 Flowable
由于 Flowable 官方版本不支持 XuguDB，需要使用虚谷提供的适配版本。

**方式一：Git 克隆**
```bash
git clone https://github.com/Xugu-Open-Source/flowable-engine.git
# 切换到适配分支
git checkout 6.7.2-xugu
```

**方式二：直接下载**
访问 https://github.com/Xugu-Open-Source/flowable-engine 下载对应分支源码。

### 2.2 安装到本地 Maven 仓库
```bash
cd flowable-engine
# 使用项目自带的构建脚本
./scripts/build-all.sh

# 如果需要 UI 组件
cd modules/flowable-ui
mvn clean install -DskipTests
```

### 2.3 安装 Liquibase 适配版
Flowable 使用 Liquibase 管理数据库表结构，必须使用适配虚谷的版本：

```bash
# 安装 Liquibase 虚谷适配版
mvn install:install-file -Dfile=./lib/liquibase-core-4.5.0-xugu.jar \
    -DgroupId=org.liquibase \
    -DartifactId=liquibase-core \
    -Dversion=4.5.0-xugu \
    -Dpackaging=jar
```

## 3. Maven 依赖配置

### 3.1 核心依赖
```xml
<dependencies>
    <!-- Flowable 引擎（XuguDB 适配版） -->
    <dependency>
        <groupId>org.flowable</groupId>
        <artifactId>flowable-engine</artifactId>
        <version>6.7.2-xugu</version>
    </dependency>
    
    <!-- Flowable Spring 集成 -->
    <dependency>
        <groupId>org.flowable</groupId>
        <artifactId>flowable-spring</artifactId>
        <version>6.7.2-xugu</version>
    </dependency>
    
    <!-- Liquibase（XuguDB 适配版） -->
    <dependency>
        <groupId>org.liquibase</groupId>
        <artifactId>liquibase-core</artifactId>
        <version>4.5.0-xugu</version>
    </dependency>
    
    <!-- XuguDB JDBC 驱动 -->
    <dependency>
        <groupId>com.xugudb</groupId>
        <artifactId>xugu-jdbc</artifactId>
        <version>12.3.4</version>
    </dependency>
    
    <!-- Spring Boot Starter -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Druid 连接池 -->
    <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>druid-spring-boot-starter</artifactId>
        <version>1.2.8</version>
    </dependency>
</dependencies>
```

### 3.2 Spring Boot 父 POM
```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.7.0</version>
    <relativePath/>
</parent>
```

## 4. 数据库初始化

### 4.1 创建数据库和用户
在 XuguDB 中执行以下 SQL：

```sql
-- 在 SYSTEM 用户下执行
CREATE DATABASE `flowable` CHARACTER SET 'utf8_bin' TIME ZONE 'GMT+08:00';
USE flowable;
CREATE USER `flowable` IDENTIFIED BY 'flowable';
GRANT DBA IN SCHEMA `flowable` TO `flowable`;
```

### 4.2 数据库参数说明
- `CHARACTER SET 'utf8_bin'`：字符集设置
- `TIME ZONE 'GMT+08:00'`：时区设置
- `GRANT DBA`：授予 DBA 权限（Flowable 需要创建表结构）

## 5. Spring Boot 配置

### 5.1 application.yml 配置
```yaml
server:
  port: 8080

spring:
  jackson:
    time-zone: Asia/Shanghai
  datasource:
    # 虚谷数据库 JDBC 连接串
    url: jdbc:xugu://127.0.0.1:5138/flowable
    # 数据库凭据
    username: flowable
    password: flowable
    # 虚谷 JDBC 驱动类名
    driver-class-name: com.xugu.cloudjdbc.Driver
    # 使用 Druid 连接池
    type: com.alibaba.druid.pool.DruidDataSource
    druid:
      initialSize: 5
      minIdle: 10
      maxActive: 20
      maxWait: 6000
      time-between-eviction-runs-millis: 2000
      min-evictable-idle-time-millis: 600000
      max-evictable-idle-time-millis: 1800000
      # 虚谷数据库心跳检测SQL
      validationQuery: SELECT 1
      testWhileIdle: true
      testOnBorrow: false
      testOnReturn: false
      keep-alive: true

# Flowable 引擎配置
flowable:
  # 禁用 resources/processes 目录下的自动部署
  check-process-definitions: false
  # 保存最高级别历史数据
  history-level: full
  # 关闭异步执行器
  async-executor-activate: false
  # 启用时自动更新数据库表结构
  database-schema-update: true
```

### 5.2 配置参数详解

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `driver-class-name` | XuguDB JDBC 驱动类 | `com.xugu.cloudjdbc.Driver` |
| `url` | 数据库连接 URL | `jdbc:xugu://host:port/db` |
| `database-schema-update` | 表结构更新策略 | `true`（自动创建/更新） |
| `history-level` | 历史数据级别 | `full`（完整记录） |
| `async-executor-activate` | 异步执行器 | `false`（关闭） |
| `check-process-definitions` | 自动部署流程定义 | `false`（手动部署） |

## 6. 流程定义与部署

### 6.1 BPMN 流程文件
创建 `src/main/resources/processes/expense-process.bpmn20.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xmlns:flowable="http://flowable.org/bpmn"
             targetNamespace="http://www.flowable.org/test">
    
    <process id="expenseProcess" name="报销流程" isExecutable="true">
        <startEvent id="start" name="开始"/>
        
        <sequenceFlow id="flow1" sourceRef="start" targetRef="applyTask"/>
        
        <userTask id="applyTask" name="报销申请" flowable:assignee="${applicant}">
            <documentation>填写报销申请表</documentation>
        </userTask>
        
        <sequenceFlow id="flow2" sourceRef="applyTask" targetRef="approveTask"/>
        
        <userTask id="approveTask" name="审批" flowable:assignee="${approver}">
            <documentation>审批报销申请</documentation>
        </userTask>
        
        <sequenceFlow id="flow3" sourceRef="approveTask" targetRef="decision"/>
        
        <exclusiveGateway id="decision" name="审批结果"/>
        
        <sequenceFlow id="flow4" sourceRef="decision" targetRef="end">
            <conditionExpression xsi:type="tFormalExpression"><![CDATA[${approved == true}]]></conditionExpression>
        </sequenceFlow>
        
        <sequenceFlow id="flow5" sourceRef="decision" targetRef="applyTask">
            <conditionExpression xsi:type="tFormalExpression"><![CDATA[${approved == false}]]></conditionExpression>
        </sequenceFlow>
        
        <endEvent id="end" name="结束"/>
    </process>
</definitions>
```

### 6.2 部署流程
```java
@Service
public class ProcessService {
    
    @Autowired
    private RepositoryService repositoryService;
    
    @Autowired
    private RuntimeService runtimeService;
    
    @Autowired
    private TaskService taskService;
    
    /**
     * 部署流程定义
     */
    public String deployProcess(String bpmnFile) {
        Deployment deployment = repositoryService.createDeployment()
                .addClasspathResource(bpmnFile)
                .name("报销流程")
                .deploy();
        return deployment.getId();
    }
    
    /**
     * 启动流程实例
     */
    public String startProcess(String processKey, Map<String, Object> variables) {
        ProcessInstance processInstance = runtimeService.startProcessInstanceByKey(processKey, variables);
        return processInstance.getId();
    }
    
    /**
     * 完成任务
     */
    public void completeTask(String taskId, Map<String, Object> variables) {
        taskService.complete(taskId, variables);
    }
    
    /**
     * 查询待办任务
     */
    public List<Task> getTasksByAssignee(String assignee) {
        return taskService.createTaskQuery()
                .taskAssignee(assignee)
                .list();
    }
}
```

## 7. REST API 使用

### 7.1 Flowable 原生 REST API
Flowable 提供完整的 REST API，可通过 HTTP 调用：

**基础认证**：`username:password`（如 `admin:test`）

**常用端点**：
- 查询流程部署：`GET /process-api/repository/deployments`
- 创建新部署：`POST /process-api/repository/deployments`
- 启动流程实例：`POST /process-api/runtime/process-instances`
- 查询任务：`GET /process-api/runtime/tasks`
- 操作任务：`POST /process-api/runtime/tasks/{taskId}`

### 7.2 自定义 REST 控制器
```java
@RestController
@RequestMapping("/expense-process")
public class ExpenseProcessController {
    
    @Autowired
    private RepositoryService repositoryService;
    
    @Autowired
    private RuntimeService runtimeService;
    
    @Autowired
    private TaskService taskService;
    
    @PostMapping("/deploy")
    public String deploy() {
        Deployment deployment = repositoryService.createDeployment()
                .addClasspathResource("processes/expense-process.bpmn20.xml")
                .name("报销流程")
                .deploy();
        return "部署成功，ID: " + deployment.getId();
    }
    
    @GetMapping("/start-process-instance-by-key")
    public String startProcess() {
        Map<String, Object> variables = new HashMap<>();
        variables.put("applicant", "user1");
        variables.put("approver", "manager1");
        
        ProcessInstance instance = runtimeService.startProcessInstanceByKey("expenseProcess", variables);
        return "流程启动成功，ID: " + instance.getId();
    }
    
    @GetMapping("/list-task")
    public List<Task> listTasks(@RequestParam String assignee) {
        return taskService.createTaskQuery()
                .taskAssignee(assignee)
                .list();
    }
    
    @GetMapping("/apply")
    public String apply(@RequestParam String taskId) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("approved", true);
        taskService.complete(taskId, variables);
        return "任务完成";
    }
}
```

## 8. Flowable UI 管理界面

### 8.1 访问地址
- **任务管理**：`http://localhost:8080/workflow/#/tasks`
- **流程建模**：`http://localhost:8080/modeler/#/processes`
- **系统管理**：`http://localhost:8080/admin/#/engine`
- **身份管理**：`http://localhost:8080/idm/#/user-mgmt`

### 8.2 默认凭据
- **用户名**：`admin`
- **密码**：`test`

### 8.3 UI 功能
- **流程建模器**：可视化设计 BPMN 流程
- **任务管理**：查看和处理待办任务
- **流程监控**：查看运行中的流程实例
- **用户管理**：管理用户和组

## 9. 数据库表结构

Flowable 在 XuguDB 中自动创建以下表（前缀为 `ACT_`）：

### 9.1 核心表
- `ACT_RE_*`：流程定义存储（Repository）
- `ACT_RU_*`：运行时数据（Runtime）
- `ACT_HI_*`：历史数据（History）
- `ACT_GE_*`：通用数据（General）
- `ACT_ID_*`：身份数据（Identity）

### 9.2 表结构说明
- `ACT_RE_DEPLOYMENT`：部署信息
- `ACT_RE_PROCDEF`：流程定义
- `ACT_RU_EXECUTION`：流程实例执行
- `ACT_RU_TASK`：用户任务
- `ACT_RU_VARIABLE`：流程变量
- `ACT_HI_PROCINST`：历史流程实例
- `ACT_HI_TASKINST`：历史任务实例

## 10. 高级配置

### 10.1 事务管理
```java
@Configuration
@EnableTransactionManagement
public class TransactionConfig {
    
    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
```

### 10.2 异步执行器配置
```yaml
flowable:
  async-executor:
    enabled: true
    core-pool-size: 8
    max-pool-size: 16
    queue-capacity: 100
```

### 10.3 历史级别配置
```yaml
flowable:
  history-level: full
```

**历史级别说明**：
- `none`：不记录历史
- `activity`：记录流程实例、活动实例
- `audit`：记录变量值
- `full`：记录所有细节（推荐）

## 11. 性能优化

### 11.1 数据库优化
```sql
-- 为常用查询字段创建索引
CREATE INDEX idx_task_assignee ON ACT_RU_TASK(ASSIGNEE_);
CREATE INDEX idx_task_process_instance ON ACT_RU_TASK(PROC_INST_ID_);
CREATE INDEX idx_execution_process_instance ON ACT_RU_EXECUTION(PROC_INST_ID_);
CREATE INDEX idx_variable_task ON ACT_RU_VARIABLE(TASK_ID_);
```

### 11.2 连接池优化
```yaml
spring:
  datasource:
    druid:
      maxActive: 30
      minIdle: 10
      maxWait: 6000
      time-between-eviction-runs-millis: 2000
      min-evictable-idle-time-millis: 600000
```

### 11.3 查询优化
```java
// 使用分页查询
List<Task> tasks = taskService.createTaskQuery()
        .taskAssignee("user1")
        .taskCreatedAfter(startDate)
        .taskCreatedBefore(endDate)
        .orderByTaskCreateTime().desc()
        .listPage(0, 20);

// 使用原生 SQL 查询（复杂查询场景）
List<Task> tasks = taskService.createNativeTaskQuery()
        .sql("SELECT * FROM ACT_RU_TASK WHERE ASSIGNEE_ = #{assignee}")
        .parameter("assignee", "user1")
        .list();
```

## 12. 故障排除

### 12.1 常见问题

**问题1：表创建失败**
- **现象**：启动时报 SQL 语法错误
- **原因**：XuguDB 与 MySQL 语法差异
- **解决**：确保使用适配版 Flowable（v6.7.2-xugu）

**问题2：连接超时**
- **现象**：获取数据库连接超时
- **解决**：调整连接池配置，增加 `maxWait` 参数

**问题3：Liquibase 错误**
- **现象**：启动时报 Liquibase 相关错误
- **原因**：未使用适配虚谷的 Liquibase 版本
- **解决**：手动安装 `liquibase-core-4.5.0-xugu.jar` 到本地仓库

**问题4：表已存在但报不存在**
- **现象**：启动时报“相关表不存在”但未自动创建
- **原因**：数据库用户权限过宽，能看到其他 Schema 下的同名表
- **解决**：确保配置的数据库用户仅能在目标 Schema 下查询到相关表

### 12.2 日志配置
```xml
<configuration>
    <logger name="org.flowable" level="DEBUG"/>
    <logger name="com.xugu" level="DEBUG"/>
</configuration>
```

## 13. 最佳实践

### 13.1 流程设计
1. 使用清晰的流程 ID 和名称
2. 为任务添加文档说明
3. 合理使用网关和条件表达式
4. 避免过于复杂的流程设计

### 13.2 代码规范
1. 使用事务管理确保数据一致性
2. 及时完成任务，避免任务积压
3. 合理使用流程变量，避免存储大量数据
4. 定期清理历史数据

### 13.3 监控与维护
1. 监控流程实例数量
2. 定期检查作业执行情况
3. 备份流程定义和数据
4. 监控数据库表空间使用

## 14. 示例项目

完整的示例项目可参考：
- **GitHub 仓库**：https://github.com/Xugu-Open-Source/xugu-flowable-demo
- **官方文档**：https://help.xugudb.com/content/ecosystem/orm/java/flowable

## 15. 参考资料

- [Flowable 官方文档](https://www.flowable.com/open-source/docs/)
- [Flowable 中文文档](https://flowable.me/)
- [虚谷数据库官方文档](https://help.xugudb.com)
- [BPMN 2.0 规范](https://www.omg.org/spec/BPMN/2.0/About-BPMN/)