# Activiti 工作流引擎与 XuguDB 集成配置指南

## 1. 概述

Activiti 是一个轻量级的工作流和业务流程管理（BPM）平台，核心是 BPMN 2.0 流程引擎。本文档详细介绍如何将 Activiti 与虚谷数据库（XuguDB）集成，包括依赖配置、数据源配置、流程引擎配置以及使用示例。

### 1.1 版本兼容性
- **Activiti 版本**：v5.2.1-xugu（XuguDB 适配版）
- **XuguDB 版本**：v12.10.8+
- **JDK 版本**：JDK 8
- **Maven 版本**：3.6.x

### 1.2 核心特性
- 支持 BPMN 2.0 标准流程定义
- 完整的流程生命周期管理（部署、启动、执行、完成）
- 与 Spring Boot 深度集成
- 支持流程变量、任务监听器、事件处理
- 提供 REST API 和 Java API

## 2. 环境准备

### 2.1 获取适配版 Activiti
由于 Activiti 官方版本不支持 XuguDB，需要使用虚谷提供的适配版本。

**方式一：Git 克隆**
```bash
git clone https://github.com/Xugu-Open-Source/activiti-5.2.1.git
```

**方式二：直接下载**
访问 https://github.com/Xugu-Open-Source/activiti-5.2.1 下载源码压缩包。

### 2.2 安装到本地 Maven 仓库
```bash
cd activiti-5.2.1
mvn clean install -DskipTests
```

**验证安装成功**：
控制台输出 `BUILD SUCCESS` 表示安装成功，之后可在项目中通过 Maven 依赖引用。

## 3. Maven 依赖配置

### 3.1 核心依赖
```xml
<dependencies>
    <!-- Activiti 引擎（XuguDB 适配版） -->
    <dependency>
        <groupId>org.activiti</groupId>
        <artifactId>activiti-engine</artifactId>
        <version>5.2.1-xugu</version>
    </dependency>
    
    <!-- Activiti Spring 集成 -->
    <dependency>
        <groupId>org.activiti</groupId>
        <artifactId>activiti-spring</artifactId>
        <version>5.2.1-xugu</version>
    </dependency>
    
    <!-- Activiti BPMN 模型 -->
    <dependency>
        <groupId>org.activiti</groupId>
        <artifactId>activiti-bpmn-model</artifactId>
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
    
    <!-- 数据库连接池（推荐 HikariCP） -->
    <dependency>
        <groupId>com.zaxxer</groupId>
        <artifactId>HikariCP</artifactId>
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

## 4. 数据源配置

### 4.1 application.yml 配置
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
      idle-timeout: 30000
      pool-name: ActivitiHikariCP
      max-lifetime: 1800000
      connection-timeout: 30000
  
  # Activiti 配置
  activiti:
    database-schema-update: true
    check-process-definitions: false
    process-definition-location-prefix: classpath:/processes/
```

### 4.2 activiti.cfg.xml 配置（传统方式）
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd">
    
    <!-- 数据源配置 -->
    <bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource" destroy-method="close">
        <property name="driverClassName" value="com.xugu.cloudjdbc.Driver"/>
        <property name="jdbcUrl" value="jdbc:xugu://localhost:5137/activiti_db?useUnicode=true&amp;characterEncoding=utf-8&amp;serverTimezone=UTC&amp;nullCatalogMeansCurrent=true&amp;keyword_filter=LINK"/>
        <property name="username" value="SYSDBA"/>
        <property name="password" value="SYSDBA"/>
        <property name="maximumPoolSize" value="20"/>
        <property name="minimumIdle" value="5"/>
    </bean>
    
    <!-- 流程引擎配置 -->
    <bean id="processEngineConfiguration" class="org.activiti.engine.impl.cfg.StandaloneProcessEngineConfiguration">
        <property name="dataSource" ref="dataSource"/>
        <property name="databaseSchemaUpdate" value="true"/>
        <property name="databaseType" value="mysql"/>
        <property name="jobExecutorActivate" value="false"/>
    </bean>
    
    <!-- 流程引擎 -->
    <bean id="processEngine" class="org.activiti.spring.ProcessEngineFactoryBean">
        <property name="processEngineConfiguration" ref="processEngineConfiguration"/>
    </bean>
    
    <!-- Activiti 服务 -->
    <bean id="repositoryService" factory-bean="processEngine" factory-method="getRepositoryService"/>
    <bean id="runtimeService" factory-bean="processEngine" factory-method="getRuntimeService"/>
    <bean id="taskService" factory-bean="processEngine" factory-method="getTaskService"/>
    <bean id="historyService" factory-bean="processEngine" factory-method="getHistoryService"/>
    <bean id="managementService" factory-bean="processEngine" factory-method="getManagementService"/>
</beans>
```

## 5. Spring Boot 集成配置

### 5.1 配置类
```java
@Configuration
public class ActivitiConfig {
    
    @Bean
    public ProcessEngineConfiguration processEngineConfiguration(DataSource dataSource) {
        SpringProcessEngineConfiguration config = new SpringProcessEngineConfiguration();
        config.setDataSource(dataSource);
        config.setDatabaseSchemaUpdate("true");
        config.setDatabaseType("mysql");
        config.setTransactionManager(transactionManager());
        config.setAsyncExecutorActivate(false);
        return config;
    }
    
    @Bean
    public ProcessEngine processEngine(ProcessEngineConfiguration configuration) {
        return configuration.buildProcessEngine();
    }
    
    @Bean
    public RepositoryService repositoryService(ProcessEngine processEngine) {
        return processEngine.getRepositoryService();
    }
    
    @Bean
    public RuntimeService runtimeService(ProcessEngine processEngine) {
        return processEngine.getRuntimeService();
    }
    
    @Bean
    public TaskService taskService(ProcessEngine processEngine) {
        return processEngine.getTaskService();
    }
    
    @Bean
    public HistoryService historyService(ProcessEngine processEngine) {
        return processEngine.getHistoryService();
    }
}
```

### 5.2 启动类
```java
@SpringBootApplication
@EnableActiviti
public class ActivitiApplication {
    public static void main(String[] args) {
        SpringApplication.run(ActivitiApplication.class, args);
    }
}
```

## 6. 流程定义与部署

### 6.1 BPMN 流程文件
创建 `src/main/resources/processes/leave-process.bpmn20.xml`：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xmlns:activiti="http://activiti.org/bpmn"
             targetNamespace="http://www.activiti.org/test">
    
    <process id="leaveProcess" name="请假流程" isExecutable="true">
        <startEvent id="start" name="开始"/>
        
        <sequenceFlow id="flow1" sourceRef="start" targetRef="applyTask"/>
        
        <userTask id="applyTask" name="请假申请" activiti:assignee="${applicant}">
            <documentation>填写请假申请表</documentation>
        </userTask>
        
        <sequenceFlow id="flow2" sourceRef="applyTask" targetRef="approveTask"/>
        
        <userTask id="approveTask" name="审批" activiti:assignee="${approver}">
            <documentation>审批请假申请</documentation>
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
                .name("请假流程")
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

## 7. 数据库表结构

Activiti 在 XuguDB 中会自动创建以下表（前缀为 `ACT_`）：

### 7.1 核心表
- `ACT_RE_*`：流程定义存储（Repository）
  - `ACT_RE_DEPLOYMENT`：部署信息
  - `ACT_RE_PROCDEF`：流程定义
  - `ACT_RE_MODEL`：模型信息

- `ACT_RU_*`：运行时数据（Runtime）
  - `ACT_RU_EXECUTION`：流程实例执行
  - `ACT_RU_TASK`：用户任务
  - `ACT_RU_VARIABLE`：流程变量
  - `ACT_RU_JOB`：作业

- `ACT_HI_*`：历史数据（History）
  - `ACT_HI_PROCINST`：历史流程实例
  - `ACT_HI_TASKINST`：历史任务实例
  - `ACT_HI_VARINST`：历史变量

- `ACT_GE_*`：通用数据（General）
  - `ACT_GE_PROPERTY`：引擎属性
  - `ACT_GE_BYTEARRAY`：二进制数据

## 8. 高级配置

### 8.1 事务管理
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

### 8.2 异步执行器配置
```yaml
spring:
  activiti:
    async-executor:
      enabled: true
      core-pool-size: 8
      max-pool-size: 16
      queue-capacity: 100
```

### 8.3 历史级别配置
```yaml
spring:
  activiti:
    history-level: full
```

**历史级别说明**：
- `none`：不记录历史
- `activity`：记录流程实例、活动实例
- `audit`：记录变量值
- `full`：记录所有细节（推荐）

## 9. 性能优化

### 9.1 数据库优化
```sql
-- 为常用查询字段创建索引
CREATE INDEX idx_task_assignee ON ACT_RU_TASK(ASSIGNEE_);
CREATE INDEX idx_task_process_instance ON ACT_RU_TASK(PROC_INST_ID_);
CREATE INDEX idx_execution_process_instance ON ACT_RU_EXECUTION(PROC_INST_ID_);
CREATE INDEX idx_variable_task ON ACT_RU_VARIABLE(TASK_ID_);
```

### 9.2 连接池优化
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 30
      minimum-idle: 10
      idle-timeout: 60000
      max-lifetime: 1800000
      connection-timeout: 30000
      leak-detection-threshold: 60000
```

### 9.3 查询优化
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

## 10. 故障排除

### 10.1 常见问题

**问题1：表创建失败**
- **现象**：启动时报 SQL 语法错误
- **原因**：XuguDB 与 MySQL 语法差异
- **解决**：确保使用适配版 Activiti（v5.2.1-xugu）

**问题2：连接超时**
- **现象**：获取数据库连接超时
- **解决**：调整连接池配置，增加 `connection-timeout`

**问题3：关键字冲突**
- **现象**：SQL 执行报关键字错误
- **解决**：在 JDBC URL 中添加 `keyword_filter=LINK`

### 10.2 日志配置
```xml
<configuration>
    <logger name="org.activiti" level="DEBUG"/>
    <logger name="com.xugu" level="DEBUG"/>
</configuration>
```

## 11. 最佳实践

### 11.1 流程设计
1. 使用清晰的流程 ID 和名称
2. 为任务添加文档说明
3. 合理使用网关和条件表达式
4. 避免过于复杂的流程设计

### 11.2 代码规范
1. 使用事务管理确保数据一致性
2. 及时完成任务，避免任务积压
3. 合理使用流程变量，避免存储大量数据
4. 定期清理历史数据

### 11.3 监控与维护
1. 监控流程实例数量
2. 定期检查作业执行情况
3. 备份流程定义和数据
4. 监控数据库表空间使用

## 12. 示例项目

完整的示例项目可参考：
- **GitHub 仓库**：https://github.com/Xugu-Open-Source/xugu-activiti-demo
- **官方文档**：https://docs.xugudb.com/content/ecosystem/orm/java/activiti

## 13. 参考资料

- [Activiti 官方文档](https://www.activiti.org/userguide/)
- [Activiti 5.x 用户指南](https://doc.yonyoucloud.com/doc/activiti-5.x-user-guide/)
- [虚谷数据库官方文档](https://docs.xugudb.com)
- [BPMN 2.0 规范](https://www.omg.org/spec/BPMN/2.0/About-BPMN/)