---
name: camunda-xugudb-adapter
description: Camunda BPM 平台适配虚谷数据库（XuguDB）的完整指南。当用户需要将基于 Camunda 的工作流和决策自动化平台配置或适配到虚谷数据库时使用此技能，包括安装部署、数据库配置、BPMN 流程定义、任务管理、REST API、UI 管理界面等。适用于企业级工作流应用、审批流程、业务流程自动化、案例管理等场景。
---

# Camunda BPM 平台虚谷数据库适配指南

## 概述

本技能提供 Camunda BPM 平台适配虚谷数据库（XuguDB）的完整配置指南。Camunda 是一个工作流和决策自动化平台，支持 BPMN（业务流程模型和符号）、CMMN（案例管理模型和符号）和 DMN（决策模型和符号）标准，现在可以通过配置支持虚谷数据库作为元数据存储。

**适用场景：**
- 企业级工作流应用
- 审批流程管理
- 业务流程自动化
- 案例管理
- 决策自动化

**核心特性：**
- 支持 BPMN 2.0 标准
- 支持 CMMN 1.1 标准
- 支持 DMN 1.1 标准
- 基于 Web 的建模器
- 强大的 REST API
- 任务管理界面
- 历史数据分析
- 支持集群部署

## 快速开始

### 1. 安装部署

**下载 Camunda BPM：**
```bash
# 下载 Camunda BPM 平台
wget https://downloads.camunda.cloud/release/camunda-bpm/tomcat/7.20.0/camunda-bpm-tomcat-7.20.0.tar.gz

# 解压
tar -xzf camunda-bpm-tomcat-7.20.0.tar.gz
cd camunda-bpm-tomcat-7.20.0
```

**使用 Docker 部署：**
```bash
# 拉取镜像
docker pull camunda/camunda-bpm-platform:latest

# 运行容器
docker run -d --name camunda \
  -p 8080:8080 \
  -p 8000:8000 \
  -e DB_DRIVER=com.xugu.cloudjdbc.Driver \
  -e DB_URL=jdbc:xugu://host.docker.internal:5138/SYSTEM?current_schema=SYSDBA \
  -e DB_USERNAME=SYSDBA \
  -e DB_PASSWORD=SYSDBA \
  camunda/camunda-bpm-platform:latest
```

### 2. 数据库配置

**创建数据库：**
```sql
-- 在虚谷数据库中创建 Camunda 数据库
CREATE DATABASE camunda;

-- 创建用户（可选）
CREATE USER 'camunda'@'%' IDENTIFIED BY 'camunda_password';
GRANT ALL PRIVILEGES ON camunda.* TO 'camunda'@'%';
FLUSH PRIVILEGES;
```

**配置数据源：**
编辑 `conf/server.xml`：
```xml
<Resource name="jdbc/ProcessEngine"
          auth="Container"
          type="javax.sql.DataSource"
          factory="org.apache.tomcat.jdbc.pool.DataSourceFactory"
          uniqueResourceName="process-engine"
          driverClassName="com.xugu.cloudjdbc.Driver"
          url="jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=SYSDBA&amp;CHAR_SET=UTF8"
          username="SYSDBA"
          password="SYSDBA"
          maxActive="20"
          minIdle="5"
          maxIdle="20"
          maxWait="60000"
          jdbcInterceptors="org.apache.tomcat.jdbc.pool.interceptor.ConnectionState;org.apache.tomcat.jdbc.pool.interceptor.StatementFinalizer"/>
```

### 3. 初始化数据库

**执行初始化脚本：**
```bash
# 下载 Camunda SQL 脚本
wget https://raw.githubusercontent.com/camunda/camunda-bpm-platform/master/engine/src/main/resources/org/camunda/bpm/engine/db/create/activiti.xugudb.create.engine.sql
wget https://raw.githubusercontent.com/camunda/camunda-bpm-platform/master/engine/src/main/resources/org/camunda/bpm/engine/db/create/activiti.xugudb.create.history.sql
wget https://raw.githubusercontent.com/camunda/camunda-bpm-platform/master/engine/src/main/resources/org/camunda/bpm/engine/db/create/activiti.xugudb.create.identity.sql

# 执行 SQL 脚本
# 注意：需要根据虚谷数据库语法调整 SQL 脚本
```

### 4. 启动服务

**启动 Camunda BPM：**
```bash
# 启动 Tomcat
./bin/startup.sh

# 访问 Camunda BPM
# http://localhost:8080/camunda

# 默认用户名密码
# 用户名: demo
# 密码: demo
```

## BPMN 流程定义

### 1. 基础流程

**创建 BPMN 文件 `process.bpmn`：**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
             targetNamespace="http://camunda.org/examples">
    
    <process id="loanApproval" name="Loan Approval Process" isExecutable="true">
        
        <startEvent id="start" name="Start">
            <extensionElements>
                <camunda:formData>
                    <camunda:formField id="amount" label="Loan Amount" type="long" required="true"/>
                    <camunda:formField id="applicant" label="Applicant Name" type="string" required="true"/>
                </camunda:formData>
            </extensionElements>
        </startEvent>
        
        <userTask id="reviewTask" name="Review Loan Application" camunda:assignee="${reviewer}">
            <extensionElements>
                <camunda:formData>
                    <camunda:formField id="approved" label="Approve?" type="enum">
                        <camunda:value id="true" name="Yes"/>
                        <camunda:value id="false" name="No"/>
                    </camunda:formField>
                    <camunda:formField id="comments" label="Comments" type="string"/>
                </camunda:formData>
            </extensionElements>
        </userTask>
        
        <exclusiveGateway id="gateway" name="Approval Decision"/>
        
        <serviceTask id="approvedTask" name="Process Approved Loan" camunda:delegateExpression="${loanService}"/>
        
        <endEvent id="endApproved" name="Loan Approved"/>
        <endEvent id="endRejected" name="Loan Rejected"/>
        
        <sequenceFlow id="flow1" sourceRef="start" targetRef="reviewTask"/>
        <sequenceFlow id="flow2" sourceRef="reviewTask" targetRef="gateway"/>
        <sequenceFlow id="flow3" sourceRef="gateway" targetRef="approvedTask">
            <conditionExpression>${approved == 'true'}</conditionExpression>
        </sequenceFlow>
        <sequenceFlow id="flow4" sourceRef="gateway" targetRef="endRejected">
            <conditionExpression>${approved == 'false'}</conditionExpression>
        </sequenceFlow>
        <sequenceFlow id="flow5" sourceRef="approvedTask" targetRef="endApproved"/>
        
    </process>
    
</definitions>
```

### 2. 服务任务

**创建 Java 委托类：**
```java
package com.example.camunda;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("loanService")
public class LoanService implements JavaDelegate {
    
    @Override
    public void execute(DelegateExecution execution) throws Exception {
        String applicant = (String) execution.getVariable("applicant");
        Long amount = (Long) execution.getVariable("amount");
        
        // 处理贷款审批逻辑
        System.out.println("Processing loan for " + applicant + " amount: " + amount);
        
        // 设置流程变量
        execution.setVariable("processed", true);
        execution.setVariable("processedAt", new Date());
    }
}
```

### 3. 复杂流程

**多实例任务：**
```xml
<userTask id="multiReview" name="Review by Multiple Reviewers">
    <multiInstanceLoopCharacteristics isSequential="false">
        <loopDataInputRef>reviewers</loopDataInputRef>
        <inputDataItem name="reviewer"/>
    </multiInstanceLoopCharacteristics>
</userTask>
```

**子流程：**
```xml
<subProcess id="subProcess" name="Sub Process">
    <startEvent id="subStart"/>
    <serviceTask id="subTask" name="Sub Task"/>
    <endEvent id="subEnd"/>
    <sequenceFlow sourceRef="subStart" targetRef="subTask"/>
    <sequenceFlow sourceRef="subTask" targetRef="subEnd"/>
</subProcess>
```

## 任务管理

### 1. 用户任务

**任务分配：**
```xml
<!-- 固定分配 -->
<userTask id="task1" name="Review" camunda:assignee="john"/>

<!-- 候选用户 -->
<userTask id="task2" name="Review" camunda:candidateUsers="john,mary,peter"/>

<!-- 候选组 -->
<userTask id="task3" name="Review" camunda:candidateGroups="managers"/>
```

**任务表单：**
```xml
<userTask id="formTask" name="Form Task">
    <extensionElements>
        <camunda:formData>
            <camunda:formField id="name" label="Name" type="string" required="true"/>
            <camunda:formField id="email" label="Email" type="string">
                <camunda:validation>
                    <camunda:constraint name="email"/>
                </camunda:validation>
            </camunda:formField>
            <camunda:formField id="age" label="Age" type="long">
                <camunda:validation>
                    <camunda:constraint name="min" config="18"/>
                    <camunda:constraint name="max" config="100"/>
                </camunda:validation>
            </camunda:formField>
        </camunda:formData>
    </extensionElements>
</userTask>
```

### 2. 任务查询

**使用 Java API：**
```java
// 查询待办任务
List<Task> tasks = taskService.createTaskQuery()
    .taskAssignee("john")
    .taskCreatedAfter(date)
    .taskDueBefore(dueDate)
    .orderByTaskPriority().desc()
    .list();

// 查询历史任务
List<HistoricTaskInstance> historicTasks = historyService.createHistoricTaskInstanceQuery()
    .taskAssignee("john")
    .finished()
    .orderByHistoricTaskInstanceEndTime().desc()
    .list();
```

**使用 REST API：**
```bash
# 查询待办任务
curl -X GET "http://localhost:8080/engine-rest/task?assignee=john" \
  -H "Content-Type: application/json"

# 认领任务
curl -X POST "http://localhost:8080/engine-rest/task/TASK_ID/claim" \
  -H "Content-Type: application/json" \
  -d '{"userId": "john"}'

# 完成任务
curl -X POST "http://localhost:8080/engine-rest/task/TASK_ID/complete" \
  -H "Content-Type: application/json" \
  -d '{"variables": {"approved": {"value": true}}}'
```

## 决策自动化 (DMN)

### 1. 决策表

**创建 DMN 文件 `decision.dmn`：**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/"
             xmlns:camunda="http://camunda.org/schema/1.0/dmn"
             id="dish" name="Dish" namespace="http://camunda.org/examples">
    
    <decision id="dishDecision" name="Dish Decision">
        <decisionTable id="dishDecisionTable">
            <input id="season" label="Season">
                <inputExpression id="seasonExpression" typeRef="string">
                    <text>season</text>
                </inputExpression>
            </input>
            <input id="guests" label="Number of Guests">
                <inputExpression id="guestsExpression" typeRef="integer">
                    <text>guests</text>
                </inputExpression>
            </input>
            
            <output id="dish" label="Dish" typeRef="string"/>
            
            <rule id="rule1">
                <inputEntry id="inputEntry1">
                    <text>"Fall"</text>
                </inputEntry>
                <inputEntry id="inputEntry2">
                    <text>&lt;= 8</text>
                </inputEntry>
                <outputEntry id="outputEntry1">
                    <text>"Spareribs"</text>
                </outputEntry>
            </rule>
            
            <rule id="rule2">
                <inputEntry id="inputEntry3">
                    <text>"Winter"</text>
                </inputEntry>
                <inputEntry id="inputEntry4">
                    <text>&lt;= 8</text>
                </inputEntry>
                <outputEntry id="outputEntry2">
                    <text>"Roastbeef"</text>
                </outputEntry>
            </rule>
            
            <rule id="rule3">
                <inputEntry id="inputEntry5">
                    <text>"Spring"</text>
                </inputEntry>
                <inputEntry id="inputEntry6">
                    <text>&lt;= 4</text>
                </inputEntry>
                <outputEntry id="outputEntry3">
                    <text>"Dry Aged Gourmet Steak"</text>
                </outputEntry>
            </rule>
            
            <rule id="rule4">
                <inputEntry id="inputEntry7">
                    <text>"Spring"</text>
                </inputEntry>
                <inputEntry id="inputEntry8">
                    <text>[5..8]</text>
                </inputEntry>
                <outputEntry id="outputEntry4">
                    <text>"Steak"</text>
                </outputEntry>
            </rule>
            
        </decisionTable>
    </decision>
    
</definitions>
```

### 2. 决策执行

**使用 Java API：**
```java
// 执行决策
DmnDecisionTableResult result = decisionService.evaluateDecisionTableByKey("dishDecision")
    .variables(Variables.putValue("season", "Fall").putValue("guests", 4))
    .evaluate();

// 获取结果
DmnDecisionResultEntries entries = result.getSingleResult();
String dish = entries.getEntry("dish");
```

**使用 REST API：**
```bash
curl -X POST "http://localhost:8080/engine-rest/decision-definition/key/dishDecision/evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
        "season": {"value": "Fall", "type": "String"},
        "guests": {"value": 4, "type": "Integer"}
    }
  }'
```

## REST API

### 1. 流程定义 API

**获取流程定义：**
```bash
# 获取所有流程定义
curl -X GET "http://localhost:8080/engine-rest/process-definition" \
  -H "Content-Type: application/json"

# 获取特定流程定义
curl -X GET "http://localhost:8080/engine-rest/process-definition/PROCESS_DEFINITION_ID" \
  -H "Content-Type: application/json"

# 获取流程定义 XML
curl -X GET "http://localhost:8080/engine-rest/process-definition/PROCESS_DEFINITION_ID/xml" \
  -H "Content-Type: application/json"
```

### 2. 流程实例 API

**启动流程实例：**
```bash
# 启动流程实例
curl -X POST "http://localhost:8080/engine-rest/process-definition/key/loanApproval/start" \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
        "amount": {"value": 10000, "type": "Long"},
        "applicant": {"value": "John Doe", "type": "String"}
    }
  }'

# 获取流程实例
curl -X GET "http://localhost:8080/engine-rest/process-instance/PROCESS_INSTANCE_ID" \
  -H "Content-Type: application/json"

# 删除流程实例
curl -X DELETE "http://localhost:8080/engine-rest/process-instance/PROCESS_INSTANCE_ID" \
  -H "Content-Type: application/json"
```

### 3. 任务 API

**任务操作：**
```bash
# 获取任务列表
curl -X GET "http://localhost:8080/engine-rest/task?assignee=john" \
  -H "Content-Type: application/json"

# 认领任务
curl -X POST "http://localhost:8080/engine-rest/task/TASK_ID/claim" \
  -H "Content-Type: application/json" \
  -d '{"userId": "john"}'

# 完成任务
curl -X POST "http://localhost:8080/engine-rest/task/TASK_ID/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
        "approved": {"value": true, "type": "Boolean"},
        "comments": {"value": "Approved", "type": "String"}
    }
  }'

# 委派任务
curl -X POST "http://localhost:8080/engine-rest/task/TASK_ID/delegate" \
  -H "Content-Type: application/json" \
  -d '{"userId": "mary"}'
```

### 4. 历史 API

**查询历史数据：**
```bash
# 获取历史流程实例
curl -X GET "http://localhost:8080/engine-rest/history/process-instance?processDefinitionKey=loanApproval" \
  -H "Content-Type: application/json"

# 获取历史任务实例
curl -X GET "http://localhost:8080/engine-rest/history/task-instance?taskAssignee=john" \
  -H "Content-Type: application/json"

# 获取历史活动实例
curl -X GET "http://localhost:8080/engine-rest/history/activity-instance?processInstanceId=PROCESS_INSTANCE_ID" \
  -H "Content-Type: application/json"
```

## 数据库适配

### 1. 驱动配置

**添加虚谷数据库驱动：**
```bash
# 将虚谷数据库 JDBC 驱动复制到 Camunda lib 目录
cp xugu-jdbc-*.jar server/apache-tomcat-*/lib/
```

### 2. 连接池配置

**优化连接池参数：**
```xml
<Resource name="jdbc/ProcessEngine"
          auth="Container"
          type="javax.sql.DataSource"
          factory="org.apache.tomcat.jdbc.pool.DataSourceFactory"
          uniqueResourceName="process-engine"
          driverClassName="com.xugu.cloudjdbc.Driver"
          url="jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=SYSDBA&amp;CHAR_SET=UTF8"
          username="SYSDBA"
          password="SYSDBA"
          maxActive="20"
          minIdle="5"
          maxIdle="20"
          maxWait="60000"
          validationQuery="SELECT 1"
          validationInterval="30000"
          testOnBorrow="true"
          testWhileIdle="true"
          timeBetweenEvictionRunsMillis="30000"
          minEvictableIdleTimeMillis="60000"
          removeAbandoned="true"
          removeAbandonedTimeout="60"
          logAbandoned="true"
          jdbcInterceptors="org.apache.tomcat.jdbc.pool.interceptor.ConnectionState;org.apache.tomcat.jdbc.pool.interceptor.StatementFinalizer"/>
```

### 3. 数据库初始化脚本

**创建表结构：**
```sql
-- 流程定义表
CREATE TABLE ACT_RE_PROCDEF (
    ID_ VARCHAR(64) NOT NULL,
    REV_ INTEGER,
    CATEGORY_ VARCHAR(255),
    NAME_ VARCHAR(255),
    KEY_ VARCHAR(255) NOT NULL,
    VERSION_ INTEGER NOT NULL,
    DEPLOYMENT_ID_ VARCHAR(64),
    RESOURCE_NAME_ VARCHAR(4000),
    DGRM_RESOURCE_NAME_ VARCHAR(4000),
    DESCRIPTION_ VARCHAR(4000),
    HAS_START_FORM_KEY_ TINYINT,
    HAS_GRAPHICAL_NOTATION_ TINYINT,
    SUSPENSION_STATE_ INTEGER,
    TENANT_ID_ VARCHAR(64),
    PRIMARY KEY (ID_)
);

-- 流程实例表
CREATE TABLE ACT_RU_EXECUTION (
    ID_ VARCHAR(64) NOT NULL,
    REV_ INTEGER,
    PROC_INST_ID_ VARCHAR(64),
    BUSINESS_KEY_ VARCHAR(255),
    PARENT_ID_ VARCHAR(64),
    PROC_DEF_ID_ VARCHAR(64),
    SUPER_EXEC_ VARCHAR(64),
    ROOT_PROC_INST_ID_ VARCHAR(64),
    ACT_ID_ VARCHAR(255),
    IS_ACTIVE_ TINYINT,
    IS_CONCURRENT_ TINYINT,
    IS_SCOPE_ TINYINT,
    IS_EVENT_SCOPE_ TINYINT,
    IS_MI_ROOT_ TINYINT,
    SUSPENSION_STATE_ INTEGER,
    CACHED_ENT_STATE_ INTEGER,
    SEQUENCE_COUNTER_ BIGINT,
    TENANT_ID_ VARCHAR(64),
    PRIMARY KEY (ID_)
);

-- 任务表
CREATE TABLE ACT_RU_TASK (
    ID_ VARCHAR(64) NOT NULL,
    REV_ INTEGER,
    EXECUTION_ID_ VARCHAR(64),
    PROC_INST_ID_ VARCHAR(64),
    PROC_DEF_ID_ VARCHAR(64),
    NAME_ VARCHAR(255),
    PARENT_TASK_ID_ VARCHAR(64),
    DESCRIPTION_ VARCHAR(4000),
    TASK_DEF_KEY_ VARCHAR(255),
    OWNER_ VARCHAR(255),
    ASSIGNEE_ VARCHAR(255),
    DELEGATION_ VARCHAR(64),
    PRIORITY_ INTEGER,
    CREATE_TIME_ TIMESTAMP,
    DUE_DATE_ TIMESTAMP,
    FOLLOW_UP_DATE_ TIMESTAMP,
    SUSPENSION_STATE_ INTEGER,
    TENANT_ID_ VARCHAR(64),
    PRIMARY KEY (ID_)
);

-- 历史流程实例表
CREATE TABLE ACT_HI_PROCINST (
    ID_ VARCHAR(64) NOT NULL,
    PROC_INST_ID_ VARCHAR(64) NOT NULL,
    BUSINESS_KEY_ VARCHAR(255),
    PROC_DEF_ID_ VARCHAR(64) NOT NULL,
    START_TIME_ TIMESTAMP NOT NULL,
    END_TIME_ TIMESTAMP,
    DURATION_ BIGINT,
    START_USER_ID_ VARCHAR(255),
    START_ACT_ID_ VARCHAR(255),
    END_ACT_ID_ VARCHAR(255),
    SUPER_PROCESS_INSTANCE_ID_ VARCHAR(64),
    DELETE_REASON_ VARCHAR(4000),
    TENANT_ID_ VARCHAR(64),
    PRIMARY KEY (ID_)
);

-- 历史任务实例表
CREATE TABLE ACT_HI_TASKINST (
    ID_ VARCHAR(64) NOT NULL,
    PROC_DEF_ID_ VARCHAR(64),
    TASK_DEF_KEY_ VARCHAR(255),
    PROC_INST_ID_ VARCHAR(64),
    EXECUTION_ID_ VARCHAR(64),
    PARENT_TASK_ID_ VARCHAR(64),
    NAME_ VARCHAR(255),
    DESCRIPTION_ VARCHAR(4000),
    OWNER_ VARCHAR(255),
    ASSIGNEE_ VARCHAR(255),
    START_TIME_ TIMESTAMP NOT NULL,
    END_TIME_ TIMESTAMP,
    DURATION_ BIGINT,
    DELETE_REASON_ VARCHAR(4000),
    PRIORITY_ INTEGER,
    DUE_DATE_ TIMESTAMP,
    FORM_KEY_ VARCHAR(255),
    CATEGORY_ VARCHAR(255),
    TENANT_ID_ VARCHAR(64),
    PRIMARY KEY (ID_)
);

-- 用户表
CREATE TABLE ACT_ID_USER (
    ID_ VARCHAR(64) NOT NULL,
    REV_ INTEGER,
    FIRST_ VARCHAR(255),
    LAST_ VARCHAR(255),
    EMAIL_ VARCHAR(255),
    PWD_ VARCHAR(255),
    PICTURE_ID_ VARCHAR(64),
    PRIMARY KEY (ID_)
);

-- 组表
CREATE TABLE ACT_ID_GROUP (
    ID_ VARCHAR(64) NOT NULL,
    REV_ INTEGER,
    NAME_ VARCHAR(255),
    TYPE_ VARCHAR(255),
    PRIMARY KEY (ID_)
);

-- 用户组关系表
CREATE TABLE ACT_ID_MEMBERSHIP (
    USER_ID_ VARCHAR(64) NOT NULL,
    GROUP_ID_ VARCHAR(64) NOT NULL,
    PRIMARY KEY (USER_ID_, GROUP_ID_)
);
```

## 性能优化

### 1. 数据库优化

**索引优化：**
```sql
-- 为常用查询字段创建索引
CREATE INDEX IDX_PROCDEF_KEY ON ACT_RE_PROCDEF(KEY_);
CREATE INDEX IDX_PROCDEF_DEPLOYMENT_ID ON ACT_RE_PROCDEF(DEPLOYMENT_ID_);
CREATE INDEX IDX_EXECUTION_PROC_INST_ID ON ACT_RU_EXECUTION(PROC_INST_ID_);
CREATE INDEX IDX_EXECUTION_PROC_DEF_ID ON ACT_RU_EXECUTION(PROC_DEF_ID_);
CREATE INDEX IDX_TASK_ASSIGNEE ON ACT_RU_TASK(ASSIGNEE_);
CREATE INDEX IDX_TASK_CREATE_TIME ON ACT_RU_TASK(CREATE_TIME_);
CREATE INDEX IDX_HIPROCINST_PROC_DEF_ID ON ACT_HI_PROCINST(PROC_DEF_ID_);
CREATE INDEX IDX_HIPROCINST_START_TIME ON ACT_HI_PROCINST(START_TIME_);
CREATE INDEX IDX_HITASKINST_ASSIGNEE ON ACT_HI_TASKINST(ASSIGNEE_);
CREATE INDEX IDX_HITASKINST_START_TIME ON ACT_HI_TASKINST(START_TIME_);
```

**查询优化：**
```properties
# 在 application.properties 中配置
camunda.bpm.generic-properties.properties.jdbc-batch-processing=true
camunda.bpm.generic-properties.properties.jdbc-max-active-connections=20
camunda.bpm.generic-properties.properties.jdbc-max-idle-connections=10
camunda.bpm.generic-properties.properties.jdbc-max-checkout-time=20000
camunda.bpm.generic-properties.properties.jdbc-max-wait-time=10000
```

### 2. 引擎配置优化

**配置文件优化：**
```xml
<!-- 在 applicationContext.xml 中配置 -->
<bean id="processEngineConfiguration" class="org.camunda.bpm.engine.impl.cfg.StandaloneProcessEngineConfiguration">
    
    <!-- 数据源配置 -->
    <property name="dataSource" ref="dataSource"/>
    
    <!-- 数据库配置 -->
    <property name="databaseSchemaUpdate" value="true"/>
    <property name="databaseType" value="xugudb"/>
    <property name="jdbcBatchProcessing" value="true"/>
    
    <!-- 异步执行配置 -->
    <property name="asyncExecutorEnabled" value="true"/>
    <property name="asyncExecutorActivate" value="true"/>
    <property name="asyncExecutorCorePoolSize" value="5"/>
    <property name="asyncExecutorMaxPoolSize" value="50"/>
    <property name="asyncExecutorThreadKeepAliveSeconds" value="60"/>
    
    <!-- 历史配置 -->
    <property name="history" value="full"/>
    <property name="historyCleanupEnabled" value="true"/>
    <property name="historyCleanupBatchWindowStartTime" value="00:01"/>
    <property name="historyCleanupBatchWindowEndTime" value="23:59"/>
    <property name="historyTimeToLive" value="180"/>
    
    <!-- 缓存配置 -->
    <property name="cacheCapacity" value="10000"/>
    
</bean>
```

### 3. 集群配置

**集群部署配置：**
```xml
<!-- 在每个节点的配置文件中 -->
<bean id="processEngineConfiguration" class="org.camunda.bpm.engine.impl.cfg.StandaloneProcessEngineConfiguration">
    
    <!-- 节点 ID -->
    <property name="idGenerator">
        <bean class="org.camunda.bpm.engine.impl.db.DbIdGenerator">
            <property name="idBatchSize" value="1000"/>
        </bean>
    </property>
    
    <!-- 集群配置 -->
    <property name="jobExecutorDeploymentAware" value="true"/>
    <property name="jobExecutorAcquireByPriority" value="true"/>
    
</bean>
```

## 监控管理

### 1. Web 界面监控

**访问 Camunda Web 界面：**
- 默认地址：`http://localhost:8080/camunda`
- 默认用户名：`demo`
- 默认密码：`demo`

**监控功能：**
- Cockpit：流程实例监控
- Tasklist：任务管理
- Admin：用户和权限管理
- Optimize：流程优化分析

### 2. REST API 监控

**获取引擎状态：**
```bash
# 获取引擎信息
curl -X GET "http://localhost:8080/engine-rest/engine" \
  -H "Content-Type: application/json"

# 获取部署信息
curl -X GET "http://localhost:8080/engine-rest/deployment" \
  -H "Content-Type: application/json"

# 获取作业信息
curl -X GET "http://localhost:8080/engine-rest/job" \
  -H "Content-Type: application/json"
```

### 3. 日志配置

**配置日志级别：**
```properties
# 在 logback.xml 中配置
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <logger name="org.camunda" level="INFO"/>
    <logger name="org.camunda.bpm.engine" level="INFO"/>
    <logger name="org.camunda.bpm.engine.impl" level="WARN"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

## 故障排除

### 1. 连接问题

**问题**：无法连接到虚谷数据库。

**解决方案**：
```bash
# 检查数据库服务状态
systemctl status xugudb

# 检查连接配置
cat conf/server.xml | grep -A 10 "jdbc/ProcessEngine"

# 测试数据库连接
java -cp "lib/*:extlib/*" com.xugu.cloudjdbc.Driver -url "jdbc:xugu://127.0.0.1:5138/SYSTEM" -user SYSDBA -password SYSDBA
```

### 2. 启动失败

**问题**：Camunda BPM 启动失败。

**解决方案**：
```bash
# 检查日志
tail -f logs/catalina.out

# 检查端口占用
netstat -tulpn | grep 8080

# 检查 Java 版本
java -version

# 检查内存配置
free -h
```

### 3. 流程部署失败

**问题**：BPMN 流程部署失败。

**解决方案**：
```bash
# 检查 BPMN 文件格式
xmllint --noout process.bpmn

# 检查流程定义语法
curl -X POST "http://localhost:8080/engine-rest/deployment/create" \
  -F "deployment-name=test" \
  -F "process.bpmn=@process.bpmn"

# 检查日志中的错误信息
grep -i "error\|exception" logs/catalina.out
```

## 最佳实践

### 1. 流程设计
- 保持流程简单清晰
- 使用子流程分解复杂逻辑
- 合理使用网关和条件
- 添加异常处理

### 2. 任务管理
- 合理分配任务
- 设置任务优先级
- 配置任务提醒
- 监控任务执行

### 3. 数据管理
- 定期清理历史数据
- 备份重要数据
- 监控数据库性能
- 优化查询语句

### 4. 安全管理
- 配置用户权限
- 限制敏感操作
- 审计日志记录
- 定期更新密码

### 5. 性能优化
- 优化数据库配置
- 使用连接池
- 启用异步执行
- 监控性能指标

## 相关资源

- [Camunda 官方文档](https://docs.camunda.org/)
- [Camunda GitHub 仓库](https://github.com/camunda/camunda-bpm-platform)
- [BPMN 2.0 标准](https://www.omg.org/spec/BPMN/2.0/)
- [虚谷数据库官方文档](https://www.xugudb.com)

## 参考文档

详细配置信息请参考：`references/camunda-configuration.md`