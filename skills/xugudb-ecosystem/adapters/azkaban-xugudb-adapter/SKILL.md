---
name: azkaban-xugudb-adapter
description: Azkaban 工作流管理器适配虚谷数据库（XuguDB）的完整指南。当用户需要将基于 Azkaban 的工作流管理器配置或适配到虚谷数据库时使用此技能，包括安装部署、数据库配置、工作流定义、任务调度、监控管理等。适用于大数据作业调度和管理场景。
---

# Azkaban 工作流管理器虚谷数据库适配指南

## 概述

本技能提供 Azkaban 工作流管理器适配虚谷数据库（XuguDB）的完整配置指南。Azkaban 是 LinkedIn 开源的工作流管理器，主要用于管理 Hadoop 作业，现在可以通过配置支持虚谷数据库作为元数据存储。

**适用场景：**
- 大数据作业调度和管理
- Hadoop/Spark 作业编排
- 定时任务调度
- 工作流依赖管理
- 作业监控和报警

**核心特性：**
- 基于 Web 的用户界面
- 支持工作流依赖管理
- 支持定时调度
- 支持作业失败重试
- 支持作业优先级
- 支持多租户
- 支持邮件通知

## 快速开始

### 1. 安装部署

**下载 Azkaban：**
```bash
# 下载 Azkaban 二进制包
wget https://github.com/azkaban/azkaban/releases/download/3.90.0/azkaban-exec-server-3.90.0.tar.gz
wget https://github.com/azkaban/azkaban/releases/download/3.90.0/azkaban-web-server-3.90.0.tar.gz

# 解压
tar -xzf azkaban-exec-server-3.90.0.tar.gz
tar -xzf azkaban-web-server-3.90.0.tar.gz
```

### 2. 数据库配置

**创建数据库和用户：**
```sql
-- 在虚谷数据库中创建 Azkaban 数据库
CREATE DATABASE azkaban;

-- 创建用户（可选）
CREATE USER 'azkaban'@'%' IDENTIFIED BY 'azkaban_password';
GRANT ALL PRIVILEGES ON azkaban.* TO 'azkaban'@'%';
FLUSH PRIVILEGES;
```

**初始化数据库表：**
```bash
# 下载 Azkaban SQL 脚本
wget https://raw.githubusercontent.com/azkaban/azkaban/master/azkaban-db/src/main/sql/create.all.sql

# 执行 SQL 脚本
# 注意：需要根据虚谷数据库语法调整 SQL 脚本
```

### 3. 配置执行服务器

**编辑 `conf/azkaban.properties`：**
```properties
# Azkaban Executor 配置
azkaban.name=Azkaban
azkaban.label=Azkaban Executor
azkaban.default.timezone=Asia/Shanghai

# 数据库配置（虚谷数据库）
database.type=mysql
mysql.port=5138
mysql.host=127.0.0.1
mysql.database=azkaban
mysql.user=SYSDBA
mysql.password=SYSDBA
mysql.numconnections=100

# 驱动配置
mysql.driver=com.xugu.cloudjdbc.Driver
mysql.url=jdbc:xugu://127.0.0.1:5138/azkaban?current_schema=SYSDBA&CHAR_SET=UTF8

# 执行服务器配置
executor.port=12321
executor.maxThreads=50
executor.flow.threads=30

# 日志配置
executor.log.cleanup.interval.ms=604800000
executor.log.retention.ms=604800000
```

### 4. 配置 Web 服务器

**编辑 `conf/azkaban.properties`：**
```properties
# Azkaban Web 配置
azkaban.name=Azkaban
azkaban.label=Azkaban Web Server
azkaban.default.timezone=Asia/Shanghai

# 数据库配置（虚谷数据库）
database.type=mysql
mysql.port=5138
mysql.host=127.0.0.1
mysql.database=azkaban
mysql.user=SYSDBA
mysql.password=SYSDBA
mysql.numconnections=100

# 驱动配置
mysql.driver=com.xugu.cloudjdbc.Driver
mysql.url=jdbc:xugu://127.0.0.1:5138/azkaban?current_schema=SYSDBA&CHAR_SET=UTF8

# Web 服务器配置
server.port=8081
server.ssl.enabled=false
jetty.maxThreads=25

# 用户配置
user.manager.class=azkaban.user.XmlUserManager
user.manager.xml.file=conf/azkaban-users.xml

# 邮件配置（可选）
mail.sender=azkaban@example.com
mail.host=smtp.example.com
mail.user=azkaban@example.com
mail.password=***
```

### 5. 启动服务

**启动执行服务器：**
```bash
cd azkaban-exec-server-3.90.0
bin/start-exec.sh

# 检查状态
curl http://localhost:12321/status
```

**启动 Web 服务器：**
```bash
cd azkaban-web-server-3.90.0
bin/start-web.sh

# 访问 Web 界面
# http://localhost:8081
```

## 工作流定义

### 1. 基础工作流

**创建 `flow.project` 文件：**
```properties
# 项目配置
project.name=my-project
project.description=My Azkaban Project
```

**创建 `flow.flow` 文件：**
```yaml
---
config:
  param1: "value1"
  param2: "value2"

nodes:
  - name: jobA
    type: command
    config:
      command: echo "Hello from Job A"
  
  - name: jobB
    type: command
    config:
      command: echo "Hello from Job B"
    dependsOn:
      - jobA
  
  - name: jobC
    type: command
    config:
      command: echo "Hello from Job C"
    dependsOn:
      - jobB
```

### 2. 常用作业类型

**Command 作业：**
```yaml
- name: myCommandJob
  type: command
  config:
    command: echo "Hello World"
    working.dir: /path/to/working/dir
    env.PATH: /usr/local/bin:$PATH
    failure.emails: admin@example.com
    success.emails: admin@example.com
```

**Java 作业：**
```yaml
- name: myJavaJob
  type: javaprocess
  config:
    java.class: com.example.MyJob
    classpath: ./lib/*
    Xms: 64M
    Xmx: 256M
    main.args: arg1 arg2
```

**Hadoop 作业：**
```yaml
- name: myHadoopJob
  type: hadoop
  config:
    jobtype: java
    work-path: /path/to/work
    classpath: ./lib/*
    java.class: com.example.HadoopJob
    force.failure.overwrite: true
```

**Spark 作业：**
```yaml
- name: mySparkJob
  type: spark
  config:
    master: yarn
    mode: cluster
    class: com.example.SparkJob
    jar: ./lib/spark-job.jar
    driver-memory: 2g
    executor-memory: 4g
    num-executors: 10
```

### 3. 条件工作流

```yaml
nodes:
  - name: checkCondition
    type: command
    config:
      command: |
        if [ "$(date +%u)" -lt 6 ]; then
          echo "status=0" > ./shared/condition.properties
        else
          echo "status=1" > ./shared/condition.properties
        fi
  
  - name: weekdayJob
    type: command
    config:
      command: echo "Weekday job"
    dependsOn:
      - checkCondition
    condition: ${status} == 0
  
  - name: weekendJob
    type: command
    config:
      command: echo "Weekend job"
    dependsOn:
      - checkCondition
    condition: ${status} == 1
```

## 任务调度

### 1. 定时调度配置

**通过 Web 界面配置：**
1. 登录 Azkaban Web 界面
2. 选择项目
3. 点击 "Flow" 选项卡
4. 点击 "Schedule" 按钮
5. 配置 Cron 表达式

**Cron 表达式示例：**
```properties
# 每天凌晨 2 点执行
0 0 2 * * ?

# 每小时执行一次
0 0 * * * ?

# 每周一上午 9 点执行
0 0 9 ? * MON

# 每月 1 日凌晨 1 点执行
0 0 1 1 * ?
```

### 2. API 调度

**创建调度：**
```bash
curl -X POST "http://localhost:8081/schedule" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "session.id=YOUR_SESSION_ID" \
  -d " projectName=my-project" \
  -d "flow=my-flow" \
  -d "scheduleTime=0,0,2,*,*,?" \
  -d "scheduleDate=2024/01/01" \
  -d "period=1d"
```

**取消调度：**
```bash
curl -X POST "http://localhost:8081/cancelSchedule" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "session.id=YOUR_SESSION_ID" \
  -d "scheduleId=SCHEDULE_ID"
```

### 3. 手动执行

**执行工作流：**
```bash
curl -X POST "http://localhost:8081/executor" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "session.id=YOUR_SESSION_ID" \
  -d "ajax=executeFlow" \
  -d "project=my-project" \
  -d "flow=my-flow"
```

## 数据库适配

### 1. 驱动配置

**添加虚谷数据库驱动：**
```bash
# 将虚谷数据库 JDBC 驱动复制到 Azkaban lib 目录
cp xugu-jdbc-*.jar azkaban-exec-server/lib/
cp xugu-jdbc-*.jar azkaban-web-server/lib/
```

### 2. 连接池配置

**优化连接池参数：**
```properties
# 连接池配置
mysql.numconnections=100
mysql.max.connections=200
mysql.connection.timeout=60000
mysql.idle.timeout=600000
mysql.max.age=3600000
```

### 3. 数据库初始化脚本

**创建表结构：**
```sql
-- 执行服务器表
CREATE TABLE executors (
    id INT NOT NULL PRIMARY KEY,
    host VARCHAR(128) NOT NULL,
    port INT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    ssl_port INT,
    last_active_time BIGINT,
    UNIQUE (host, port)
);

-- 执行流表
CREATE TABLE execution_flows (
    exec_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    version INT NOT NULL,
    flow_id VARCHAR(128) NOT NULL,
    status VARCHAR(32),
    submit_user VARCHAR(64),
    submit_time BIGINT,
    start_time BIGINT,
    end_time BIGINT,
    flow_type VARCHAR(32),
    dispatch_method SMALLINT DEFAULT 0,
    executor_id INT,
    use_executor BOOLEAN DEFAULT FALSE,
    nested_id VARCHAR(64),
    flow_data BLOB,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 执行作业表
CREATE TABLE execution_jobs (
    exec_id INT NOT NULL,
    project_id INT NOT NULL,
    version INT NOT NULL,
    flow_id VARCHAR(128) NOT NULL,
    job_id VARCHAR(128) NOT NULL,
    attempt INT DEFAULT 0,
    start_time BIGINT,
    end_time BIGINT,
    status VARCHAR(32),
    input_params BLOB,
    output_params BLOB,
    attachments BLOB,
    PRIMARY KEY (exec_id, job_id, attempt),
    FOREIGN KEY (exec_id) REFERENCES execution_flows(exec_id)
);

-- 项目表
CREATE TABLE projects (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(64) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    modified_time BIGINT NOT NULL,
    create_time BIGINT NOT NULL,
    version BIGINT,
    last_modified_user VARCHAR(64),
    description VARCHAR(2048),
    enc_type TINYINT,
    settings_blob BLOB,
    UNIQUE (name)
);

-- 项目版本表
CREATE TABLE project_versions (
    project_id INT NOT NULL,
    version INT NOT NULL,
    upload_time BIGINT NOT NULL,
    uploader VARCHAR(64),
    file_type VARCHAR(16),
    file_name VARCHAR(128),
    md5 BLOB,
    num_chunks INT,
    resource_id VARCHAR(512),
    PRIMARY KEY (project_id, version),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 项目文件表
CREATE TABLE project_files (
    project_id INT NOT NULL,
    version INT NOT NULL,
    chunk INT,
    size INT,
    file BLOB,
    PRIMARY KEY (project_id, version, chunk),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 项目权限表
CREATE TABLE project_permissions (
    project_id VARCHAR(64) NOT NULL,
    modified_time BIGINT NOT NULL,
    name VARCHAR(64) NOT NULL,
    permissions VARCHAR(16) NOT NULL,
    isGroup BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (project_id, name, isGroup)
);

-- 调度表
CREATE TABLE schedules (
    schedule_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    project_name VARCHAR(64) NOT NULL,
    flow_name VARCHAR(128) NOT NULL,
    status VARCHAR(16),
    first_sched_time BIGINT,
    next_exec_time BIGINT,
    period VARCHAR(16),
    cron_expression VARCHAR(128),
    execution_options BLOB,
    CONSTRAINT schedule_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 触发器表
CREATE TABLE triggers (
    trigger_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    trigger_source VARCHAR(128),
    trigger_source_id INT,
    modified_time BIGINT NOT NULL,
    creation_time BIGINT NOT NULL,
    last_modify_time BIGINT NOT NULL,
    status VARCHAR(16),
    priority SMALLINT,
    enc_type TINYINT,
    trigger_data BLOB
);

-- 执行器日志表
CREATE TABLE executor_events (
    executor_id INT NOT NULL,
    event_type SMALLINT,
    event_time BIGINT,
    username VARCHAR(64),
    message VARCHAR(512),
    PRIMARY KEY (executor_id, event_time)
);

-- 项目事件表
CREATE TABLE project_events (
    project_id INT NOT NULL,
    event_type SMALLINT,
    event_time BIGINT,
    username VARCHAR(64),
    message VARCHAR(512),
    PRIMARY KEY (project_id, event_time)
);

-- 作业执行日志表
CREATE TABLE job_logs (
    exec_id INT NOT NULL,
    name VARCHAR(128),
    attempt INT,
    enc_type TINYINT,
    start_byte INT,
    end_byte INT,
    log BLOB,
    upload_time BIGINT,
    PRIMARY KEY (exec_id, name, attempt, start_byte)
);

-- 活动执行流表
CREATE TABLE active_executing_flows (
    exec_id INT NOT NULL,
    update_time BIGINT,
    PRIMARY KEY (exec_id)
);
```

## 监控管理

### 1. Web 界面监控

**访问 Azkaban Web 界面：**
- 默认地址：`http://localhost:8081`
- 默认用户名：`azkaban`
- 默认密码：`azkaban`

**监控功能：**
- 项目管理
- 工作流执行状态
- 作业日志查看
- 调度管理
- 用户管理

### 2. API 监控

**获取执行状态：**
```bash
curl "http://localhost:8081/executor?ajax=fetchexecflow&execid=EXEC_ID"
```

**获取作业日志：**
```bash
curl "http://localhost:8081/executor?ajax=fetchJobLogs&execid=EXEC_ID&jobId=JOB_ID&attempt=0&offset=0&length=100000"
```

**获取执行统计：**
```bash
curl "http://localhost:8081/executor?ajax=fetchFlowExecutions&project=PROJECT_NAME&flow=FLOW_NAME&start=0&length=10"
```

### 3. 日志配置

**配置日志级别：**
```properties
# 在 conf/azkaban.properties 中配置
log4j.rootLogger=INFO, Console
log4j.appender.Console=org.apache.log4j.ConsoleAppender
log4j.appender.Console.layout=org.apache.log4j.PatternLayout
log4j.appender.Console.layout.ConversionPattern=%d{yyyy-MM-dd HH:mm:ss} %-5p %c{1}:%L - %m%n

# 特定包日志级别
log4j.logger.azkaban=INFO
log4j.logger.org.apache.velocity=WARN
log4j.logger.org.mortbay.log=WARN
```

## 性能优化

### 1. 数据库优化

**索引优化：**
```sql
-- 为常用查询字段创建索引
CREATE INDEX idx_execution_flows_project_id ON execution_flows(project_id);
CREATE INDEX idx_execution_flows_status ON execution_flows(status);
CREATE INDEX idx_execution_flows_submit_time ON execution_flows(submit_time);
CREATE INDEX idx_execution_jobs_exec_id ON execution_jobs(exec_id);
CREATE INDEX idx_schedules_next_exec_time ON schedules(next_exec_time);
```

**查询优化：**
```properties
# 连接池优化
mysql.numconnections=100
mysql.max.connections=200
mysql.connection.timeout=60000
mysql.idle.timeout=600000
mysql.max.age=3600000
```

### 2. 执行服务器优化

**线程池配置：**
```properties
# 执行服务器线程池
executor.maxThreads=50
executor.flow.threads=30
executor.job.thread.count=10

# 内存配置
executor.Xms=512M
executor.Xmx=2G
executor.MaxPermSize=256M
```

### 3. Web 服务器优化

**Jetty 配置：**
```properties
# Jetty 服务器配置
server.port=8081
server.ssl.enabled=false
jetty.maxThreads=25
jetty.minThreads=5
jetty.acceptQueueSize=100
```

## 故障排除

### 1. 连接问题

**问题**：无法连接到虚谷数据库。

**解决方案**：
```bash
# 检查数据库服务状态
systemctl status xugudb

# 检查连接配置
cat conf/azkaban.properties | grep mysql

# 测试数据库连接
java -cp "lib/*:extlib/*" com.xugu.cloudjdbc.Driver -url "jdbc:xugu://127.0.0.1:5138/SYSTEM" -user SYSDBA -password SYSDBA
```

### 2. 启动失败

**问题**：Azkaban 服务启动失败。

**解决方案**：
```bash
# 检查日志
tail -f logs/azkaban-exec-server.log
tail -f logs/azkaban-web-server.log

# 检查端口占用
netstat -tulpn | grep 8081
netstat -tulpn | grep 12321

# 检查 Java 版本
java -version
```

### 3. 作业执行失败

**问题**：作业执行失败。

**解决方案**：
```bash
# 检查作业日志
curl "http://localhost:8081/executor?ajax=fetchJobLogs&execid=EXEC_ID&jobId=JOB_ID&attempt=0&offset=0&length=100000"

# 检查执行器状态
curl "http://localhost:12321/status"

# 检查资源限制
ulimit -a
```

## 最佳实践

### 1. 项目组织
- 按业务域组织项目
- 使用有意义的项目名称
- 添加项目描述和文档
- 定期清理旧项目

### 2. 工作流设计
- 保持工作流简单
- 合理设置依赖关系
- 添加错误处理
- 使用参数化配置

### 3. 调度管理
- 合理设置调度时间
- 避免资源竞争
- 监控调度执行
- 设置失败重试策略

### 4. 安全管理
- 配置用户权限
- 限制敏感操作
- 审计日志记录
- 定期更新密码

### 5. 监控报警
- 配置邮件通知
- 监控执行状态
- 设置超时报警
- 定期检查日志

## 相关资源

- [Azkaban 官方文档](https://azkaban.github.io/azkaban/docs/latest/)
- [Azkaban GitHub 仓库](https://github.com/azkaban/azkaban)
- [虚谷数据库官方文档](https://www.xugudb.com)
- [Azkaban 虚谷数据库适配](https://github.com/Xugu-Open-Source/azkaban)

## 参考文档

详细配置信息请参考：`references/azkaban-configuration.md`