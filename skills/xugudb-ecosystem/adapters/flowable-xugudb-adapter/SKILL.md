---
name: flowable-xugudb-adapter
description: Flowable 工作流引擎与虚谷数据库（XuguDB）集成适配指南。当用户需要在 Spring Boot 项目中使用 Flowable 工作流引擎连接 XuguDB 时使用此技能，包括流程引擎配置、数据源设置、BPMN 流程定义、任务管理、REST API、UI 管理界面等。适用于企业级工作流应用、审批流程、业务流程自动化、案例管理等场景。
---

# Flowable 工作流引擎 XuguDB 适配指南

## 概述

本指南详细介绍如何将 Flowable 工作流引擎与虚谷数据库（XuguDB）集成，包括完整的配置流程、使用示例和最佳实践。Flowable 是一个紧凑且高效的工作流和 BPM 平台，支持 BPMN 2.0、CMMN 和 DMN 标准。

## 快速开始

### 1. 获取适配版 Flowable

由于官方 Flowable 不支持 XuguDB，需要使用虚谷提供的适配版本：

```bash
# 克隆适配版源码
git clone https://github.com/Xugu-Open-Source/flowable-engine.git
git checkout 6.7.2-xugu

# 安装到本地 Maven 仓库
cd flowable-engine
./scripts/build-all.sh

# 安装 Liquibase 适配版
mvn install:install-file -Dfile=./lib/liquibase-core-4.5.0-xugu.jar \
    -DgroupId=org.liquibase \
    -DartifactId=liquibase-core \
    -Dversion=4.5.0-xugu \
    -Dpackaging=jar
```

### 2. 添加 Maven 依赖

```xml
<dependencies>
    <!-- Flowable 引擎（XuguDB 适配版） -->
    <dependency>
        <groupId>org.flowable</groupId>
        <artifactId>flowable-engine</artifactId>
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

### 3. 初始化数据库

在 XuguDB 中执行：

```sql
CREATE DATABASE `flowable` CHARACTER SET 'utf8_bin' TIME ZONE 'GMT+08:00';
USE flowable;
CREATE USER `flowable` IDENTIFIED BY 'flowable';
GRANT DBA IN SCHEMA `flowable` TO `flowable`;
```

### 4. 配置数据源

在 `application.yml` 中配置：

```yaml
spring:
  datasource:
    driver-class-name: com.xugu.cloudjdbc.Driver
    url: jdbc:xugu://127.0.0.1:5138/flowable
    username: flowable
    password: flowable
    type: com.alibaba.druid.pool.DruidDataSource
    druid:
      initialSize: 5
      minIdle: 10
      maxActive: 20
      validationQuery: SELECT 1
      testWhileIdle: true

flowable:
  database-schema-update: true
  history-level: full
  async-executor-activate: false
  check-process-definitions: false
```

## 配置详解

### 数据源配置参数

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `driver-class-name` | XuguDB JDBC 驱动类 | `com.xugu.cloudjdbc.Driver` |
| `url` | 数据库连接 URL | `jdbc:xugu://host:port/db` |
| `database-schema-update` | 表结构更新策略 | `true`（自动创建/更新） |
| `history-level` | 历史数据级别 | `full`（完整记录） |
| `async-executor-activate` | 异步执行器 | `false`（关闭） |

### 连接池配置

使用 Druid 连接池，关键参数：
- `initialSize`：初始连接数
- `minIdle`：最小空闲连接数
- `maxActive`：最大活跃连接数
- `validationQuery`：心跳检测 SQL（`SELECT 1`）

## 流程定义与部署

### 创建 BPMN 流程文件

在 `src/main/resources/processes/` 目录下创建 `.bpmn20.xml` 文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:flowable="http://flowable.org/bpmn"
             targetNamespace="http://www.flowable.org/test">
    
    <process id="expenseProcess" name="报销流程" isExecutable="true">
        <startEvent id="start"/>
        <sequenceFlow sourceRef="start" targetRef="applyTask"/>
        
        <userTask id="applyTask" name="报销申请" flowable:assignee="${applicant}"/>
        <sequenceFlow sourceRef="applyTask" targetRef="approveTask"/>
        
        <userTask id="approveTask" name="审批" flowable:assignee="${approver}"/>
        <sequenceFlow sourceRef="approveTask" targetRef="end"/>
        
        <endEvent id="end"/>
    </process>
</definitions>
```

### 部署流程定义

```java
@Service
public class ProcessService {
    
    @Autowired
    private RepositoryService repositoryService;
    
    // 部署流程
    public String deployProcess(String bpmnFile) {
        Deployment deployment = repositoryService.createDeployment()
                .addClasspathResource(bpmnFile)
                .name("报销流程")
                .deploy();
        return deployment.getId();
    }
}
```

## 流程操作

### 启动流程实例

```java
@Autowired
private RuntimeService runtimeService;

public String startProcess(String processKey, Map<String, Object> variables) {
    ProcessInstance instance = runtimeService.startProcessInstanceByKey(processKey, variables);
    return instance.getId();
}
```

### 任务管理

```java
@Autowired
private TaskService taskService;

// 查询待办任务
public List<Task> getTasks(String assignee) {
    return taskService.createTaskQuery()
            .taskAssignee(assignee)
            .list();
}

// 完成任务
public void completeTask(String taskId, Map<String, Object> variables) {
    taskService.complete(taskId, variables);
}
```

## REST API 使用

### Flowable 原生 REST API

Flowable 提供完整的 REST API：

**基础认证**：`username:password`（如 `admin:test`）

**常用端点**：
- 查询流程部署：`GET /process-api/repository/deployments`
- 启动流程实例：`POST /process-api/runtime/process-instances`
- 查询任务：`GET /process-api/runtime/tasks`
- 操作任务：`POST /process-api/runtime/tasks/{taskId}`

### 自定义 REST 控制器

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
}
```

## Flowable UI 管理界面

### 访问地址

- **任务管理**：`http://localhost:8080/workflow/#/tasks`
- **流程建模**：`http://localhost:8080/modeler/#/processes`
- **系统管理**：`http://localhost:8080/admin/#/engine`
- **身份管理**：`http://localhost:8080/idm/#/user-mgmt`

### 默认凭据

- **用户名**：`admin`
- **密码**：`test`

### UI 功能

- **流程建模器**：可视化设计 BPMN 流程
- **任务管理**：查看和处理待办任务
- **流程监控**：查看运行中的流程实例
- **用户管理**：管理用户和组

## 数据库表结构

Flowable 在 XuguDB 中自动创建以下表：

- **ACT_RE_***：流程定义存储
- **ACT_RU_***：运行时数据
- **ACT_HI_***：历史数据
- **ACT_GE_***：通用数据
- **ACT_ID_***：身份数据

## 性能优化

### 1. 数据库索引

```sql
CREATE INDEX idx_task_assignee ON ACT_RU_TASK(ASSIGNEE_);
CREATE INDEX idx_task_process ON ACT_RU_TASK(PROC_INST_ID_);
```

### 2. 连接池调优

```yaml
spring:
  datasource:
    druid:
      maxActive: 30
      minIdle: 10
      maxWait: 6000
```

### 3. 查询优化

```java
// 使用分页
List<Task> tasks = taskService.createTaskQuery()
        .taskAssignee("user1")
        .listPage(0, 20);
```

## 故障排除

### 常见问题

1. **表创建失败**：确保使用适配版 Flowable（v6.7.2-xugu）
2. **连接超时**：调整连接池 `maxWait` 参数
3. **Liquibase 错误**：手动安装 `liquibase-core-4.5.0-xugu.jar`
4. **表已存在但报不存在**：确保数据库用户权限仅限于目标 Schema

### 日志配置

```xml
<logger name="org.flowable" level="DEBUG"/>
<logger name="com.xugu" level="DEBUG"/>
```

## 最佳实践

1. 使用清晰的流程 ID 和名称
2. 为任务添加文档说明
3. 合理使用事务管理
4. 定期清理历史数据
5. 监控流程实例数量
6. 使用 Flowable UI 进行流程设计和监控

## 资源

- **示例项目**：https://github.com/Xugu-Open-Source/xugu-flowable-demo
- **官方文档**：https://help.xugudb.com/content/ecosystem/orm/java/flowable
- **Flowable 文档**：https://www.flowable.com/open-source/docs/

---

**注意**：本指南基于 Flowable v6.7.2-xugu 适配版本，确保使用正确的版本以避免兼容性问题。必须同时安装 Liquibase 虚谷适配版（v4.5.0-xugu）。