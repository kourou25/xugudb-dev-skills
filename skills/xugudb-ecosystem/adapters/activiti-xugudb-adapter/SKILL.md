---
name: activiti-xugudb-adapter
description: Activiti 工作流引擎与虚谷数据库（XuguDB）集成适配指南。当用户需要在 Spring Boot 项目中使用 Activiti 工作流引擎连接 XuguDB 时使用此技能，包括流程引擎配置、数据源设置、BPMN 流程定义、任务管理、历史记录查询等。适用于企业级工作流应用、审批流程、业务流程自动化等场景。
---

# Activiti 工作流引擎 XuguDB 适配指南

## 概述

本指南详细介绍如何将 Activiti 工作流引擎与虚谷数据库（XuguDB）集成，包括完整的配置流程、使用示例和最佳实践。Activiti 是一个轻量级的工作流和 BPM 平台，支持 BPMN 2.0 标准。

## 快速开始

### 1. 获取适配版 Activiti

由于官方 Activiti 不支持 XuguDB，需要使用虚谷提供的适配版本：

```bash
# 克隆适配版源码
git clone https://github.com/Xugu-Open-Source/activiti-5.2.1.git

# 安装到本地 Maven 仓库
cd activiti-5.2.1
mvn clean install -DskipTests
```

### 2. 添加 Maven 依赖

```xml
<dependencies>
    <!-- Activiti 引擎（XuguDB 适配版） -->
    <dependency>
        <groupId>org.activiti</groupId>
        <artifactId>activiti-engine</artifactId>
        <version>5.2.1-xugu</version>
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
    
    <!-- HikariCP 连接池 -->
    <dependency>
        <groupId>com.zaxxer</groupId>
        <artifactId>HikariCP</artifactId>
    </dependency>
</dependencies>
```

### 3. 配置数据源

在 `application.yml` 中配置：

```yaml
spring:
  datasource:
    driver-class-name: com.xugu.cloudjdbc.Driver
    url: jdbc:xugu://localhost:5137/activiti_db?useUnicode=true&characterEncoding=utf-8&serverTimezone=UTC&nullCatalogMeansCurrent=true&keyword_filter=LINK
    username: SYSDBA
    password: SYSDBA
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
  
  activiti:
    database-schema-update: true
    check-process-definitions: false
```

## 配置详解

### 数据源配置参数

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `driver-class-name` | XuguDB JDBC 驱动类 | `com.xugu.cloudjdbc.Driver` |
| `url` | 数据库连接 URL | `jdbc:xugu://host:port/db?params` |
| `database-schema-update` | 表结构更新策略 | `true`（自动创建/更新） |
| `check-process-definitions` | 启动时检查流程定义 | `false`（开发环境） |

### 关键 URL 参数

- `useUnicode=true&characterEncoding=utf-8`：字符编码
- `serverTimezone=UTC`：时区设置
- `nullCatalogMeansCurrent=true`：元数据 catalog 参数处理
- `keyword_filter=LINK`：过滤关键字冲突

## 流程定义与部署

### 创建 BPMN 流程文件

在 `src/main/resources/processes/` 目录下创建 `.bpmn20.xml` 文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:activiti="http://activiti.org/bpmn"
             targetNamespace="http://www.activiti.org/test">
    
    <process id="leaveProcess" name="请假流程" isExecutable="true">
        <startEvent id="start"/>
        <sequenceFlow sourceRef="start" targetRef="applyTask"/>
        
        <userTask id="applyTask" name="请假申请" activiti:assignee="${applicant}"/>
        <sequenceFlow sourceRef="applyTask" targetRef="approveTask"/>
        
        <userTask id="approveTask" name="审批" activiti:assignee="${approver}"/>
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
                .name("请假流程")
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

### 历史查询

```java
@Autowired
private HistoryService historyService;

// 查询历史流程实例
public List<HistoricProcessInstance> getHistoryProcesses(String processKey) {
    return historyService.createHistoricProcessInstanceQuery()
            .processDefinitionKey(processKey)
            .orderByProcessInstanceEndTime().desc()
            .list();
}
```

## Spring Boot 集成

### 配置类

```java
@Configuration
@EnableActiviti
public class ActivitiConfig {
    
    @Bean
    public ProcessEngineConfiguration processEngineConfiguration(DataSource dataSource) {
        SpringProcessEngineConfiguration config = new SpringProcessEngineConfiguration();
        config.setDataSource(dataSource);
        config.setDatabaseSchemaUpdate("true");
        config.setDatabaseType("mysql"); // XuguDB 使用 MySQL 兼容模式
        return config;
    }
}
```

### 启动类

```java
@SpringBootApplication
public class ActivitiApplication {
    public static void main(String[] args) {
        SpringApplication.run(ActivitiApplication.class, args);
    }
}
```

## 数据库表结构

Activiti 在 XuguDB 中自动创建以下表：

- **ACT_RE_***：流程定义存储
- **ACT_RU_***：运行时数据
- **ACT_HI_***：历史数据
- **ACT_GE_***：通用数据

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
    hikari:
      maximum-pool-size: 30
      minimum-idle: 10
      idle-timeout: 60000
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

1. **表创建失败**：确保使用适配版 Activiti（v5.2.1-xugu）
2. **连接超时**：调整连接池 `connection-timeout` 参数
3. **关键字冲突**：JDBC URL 添加 `keyword_filter=LINK`

### 日志配置

```xml
<logger name="org.activiti" level="DEBUG"/>
<logger name="com.xugu" level="DEBUG"/>
```

## 最佳实践

1. 使用清晰的流程 ID 和名称
2. 为任务添加文档说明
3. 合理使用事务管理
4. 定期清理历史数据
5. 监控流程实例数量

## 资源

- **示例项目**：https://github.com/Xugu-Open-Source/xugu-activiti-demo
- **官方文档**：https://docs.xugudb.com/content/ecosystem/orm/java/activiti
- **Activiti 文档**：https://www.activiti.org/userguide/

---

**注意**：本指南基于 Activiti v5.2.1-xugu 适配版本，确保使用正确的版本以避免兼容性问题。