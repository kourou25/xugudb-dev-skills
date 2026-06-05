---
name: pentaho-kettle-xugudb-adapter
description: Pentaho Kettle ETL 工具适配虚谷数据库（XuguDB）的完整指南。当用户需要将基于 Pentaho Kettle 的 ETL 工具配置或适配到虚谷数据库时使用此技能，包括安装部署、数据库连接、转换设计、作业调度、性能优化等。适用于数据集成、数据仓库建设、数据迁移等场景。
---

# Pentaho Kettle ETL 工具虚谷数据库适配指南

## 概述

本技能提供 Pentaho Kettle ETL 工具适配虚谷数据库（XuguDB）的完整配置指南。Pentaho Kettle 是一个开源的 ETL（Extract, Transform, Load）工具，用于数据集成和数据仓库建设，现在可以通过配置支持虚谷数据库作为数据源或目标数据库。

**适用场景：**
- 数据集成
- 数据仓库建设
- 数据迁移
- 数据清洗
- 数据同步

**核心特性：**
- 图形化转换设计器
- 支持多种数据源
- 强大的数据转换功能
- 作业调度和监控
- 支持集群部署
- 插件扩展机制

## 快速开始

### 1. 安装部署

**下载 Pentaho Kettle：**
```bash
# 下载 Pentaho Data Integration (Kettle)
wget https://sourceforge.net/projects/pentaho/files/Pentaho-9.3/client-tools/pdi-ce-9.3.0.0-428.zip

# 解压
unzip pdi-ce-9.3.0.0-428.zip
cd pdi-ce-9.3.0.0-428

# 启动 Spoon (图形化工具)
./spoon.sh
```

**使用 Docker 部署：**
```bash
# 拉取镜像
docker pull pentaho/pentaho-kettle:latest

# 运行容器
docker run -d --name kettle \
  -p 8080:8080 \
  -v /path/to/data:/data \
  pentaho/pentaho-kettle:latest
```

### 2. 配置虚谷数据库驱动

**添加 JDBC 驱动：**
```bash
# 将虚谷数据库 JDBC 驱动复制到 Kettle lib 目录
cp xugu-jdbc-*.jar data-integration/lib/

# 或者复制到 ext 目录
cp xugu-jdbc-*.jar data-integration/libext/
```

**配置数据库连接：**
1. 启动 Spoon 图形化工具
2. 点击 "工具" -> "数据库连接"
3. 点击 "新建"
4. 填写连接信息：
   - 连接名称：XuguDB
   - 连接类型：Generic database
   - 自定义连接 URL：`jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=SYSDBA&CHAR_SET=UTF8`
   - 自定义驱动类名：`com.xugu.cloudjdbc.Driver`
   - 用户名：SYSDBA
   - 密码：SYSDBA
5. 点击 "测试" 验证连接

### 3. 创建第一个转换

**步骤：**
1. 打开 Spoon
2. 新建转换
3. 从左侧树形菜单拖拽 "表输入" 步骤到画布
4. 双击 "表输入" 步骤，配置数据库连接和 SQL 查询
5. 从左侧树形菜单拖拽 "表输出" 步骤到画布
6. 双击 "表输出" 步骤，配置目标数据库和表
7. 按住 Shift 键，从 "表输入" 拖拽到 "表输出" 创建跳
8. 点击 "运行" 按钮执行转换

## 数据库连接配置

### 1. 连接配置

**JDBC 连接配置：**
```properties
# 连接名称
Connection Name=XuguDB

# 连接类型
Connection Type=Generic database

# 连接 URL
Connection URL=jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=SYSDBA&CHAR_SET=UTF8

# 驱动类名
Driver Class=com.xugu.cloudjdbc.Driver

# 用户名
Username=SYSDBA

# 密码
Password=SYSDBA
```

**连接池配置：**
```properties
# 使用连接池
Use Connection Pool=true

# 连接池配置
Initial Pool Size=5
Maximum Pool Size=20
Minimum Pool Size=5
Maximum Idle Time=60000
# 验证查询
Test Query=SELECT 1
```

### 2. 高级连接配置

**连接属性配置：**
```properties
# 字符集
CHAR_SET=UTF8

# 模式
current_schema=SYSDBA

# 连接超时
connectionTimeout=30000

# Socket 超时
socketTimeout=60000

# 自动重连
autoReconnect=true

# 最大重连次数
maxReconnects=3

# 重连间隔
reconnectInterval=2000
```

### 3. 多数据源配置

**配置多个数据库连接：**
```xml
<!-- 在 .ktr 文件中配置 -->
<connection>
    <name>XuguDB_Source</name>
    <server>127.0.0.1</server>
    <type>GENERIC</type>
    <access>Native</port>
    <port>5138</port>
    <username>SYSDBA</username>
    <password>Encrypted SYSDBA</password>
    <servername>SYSTEM</servername>
    <data_tablespace/>
    <index_tablespace/>
    <attributes>
        <attribute><code>CUSTOM_URL</code><attribute>jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=SYSDBA&CHAR_SET=UTF8</attribute></attribute>
        <attribute><code>CUSTOM_DRIVER_CLASS</code><attribute>com.xugu.cloudjdbc.Driver</attribute></attribute>
    </attributes>
</connection>

<connection>
    <name>XuguDB_Target</name>
    <server>127.0.0.1</server>
    <type>GENERIC</type>
    <access>Native</port>
    <port>5138</port>
    <username>SYSDBA</username>
    <password>Encrypted SYSDBA</password>
    <servername>SYSTEM</servername>
    <data_tablespace/>
    <index_tablespace/>
    <attributes>
        <attribute><code>CUSTOM_URL</code><attribute>jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=SYSDBA&CHAR_SET=UTF8</attribute></attribute>
        <attribute><code>CUSTOM_DRIVER_CLASS</code><attribute>com.xugu.cloudjdbc.Driver</attribute></attribute>
    </attributes>
</connection>
```

## 转换设计

### 1. 输入步骤

**表输入步骤：**
```sql
-- 查询源数据
SELECT 
    id,
    name,
    email,
    phone,
    status,
    created_at,
    updated_at
FROM users
WHERE status = 1
  AND created_at >= '2024-01-01'
ORDER BY id
```

**文件输入步骤：**
```csv
id,name,email,phone,status
1,张三,zhangsan@example.com,13800138001,1
2,李四,lisi@example.com,13800138002,1
3,王五,wangwu@example.com,13800138003,1
```

**生成行步骤：**
```javascript
// 生成测试数据
var data = [];
for (var i = 1; i <= 1000; i++) {
    data.push({
        id: i,
        name: "用户" + i,
        email: "user" + i + "@example.com",
        phone: "138" + String(i).padStart(8, "0"),
        status: 1,
        created_at: new Date(),
        updated_at: new Date()
    });
}
return data;
```

### 2. 转换步骤

**字段选择步骤：**
```javascript
// 选择和重命名字段
var fields = [
    {name: "id", type: "Integer", rename: "user_id"},
    {name: "name", type: "String", rename: "user_name"},
    {name: "email", type: "String", rename: "user_email"},
    {name: "phone", type: "String", rename: "user_phone"},
    {name: "status", type: "Integer", rename: "user_status"}
];
```

**过滤记录步骤：**
```javascript
// 过滤条件
var condition = {
    field: "status",
    operator: "=",
    value: 1
};
```

**排序步骤：**
```javascript
// 排序字段
var sortFields = [
    {field: "id", order: "ASC"},
    {field: "created_at", order: "DESC"}
];
```

**聚合步骤：**
```javascript
// 聚合配置
var aggregates = [
    {field: "id", function: "COUNT", rename: "total_count"},
    {field: "id", function: "COUNT_DISTINCT", rename: "unique_count"},
    {field: "created_at", function: "MIN", rename: "first_created"},
    {field: "created_at", function: "MAX", rename: "last_created"}
];
var groupFields = ["status"];
```

### 3. 输出步骤

**表输出步骤：**
```javascript
// 目标表配置
var targetTable = "users_target";
var batchSize = 1000;
var commitSize = 10000;

// 字段映射
var fieldMapping = [
    {source: "user_id", target: "id"},
    {source: "user_name", target: "name"},
    {source: "user_email", target: "email"},
    {source: "user_phone", target: "phone"},
    {source: "user_status", target: "status"}
];
```

**更新步骤：**
```javascript
// 更新配置
var updateKey = ["id"];
var updateFields = ["name", "email", "phone", "status", "updated_at"];
```

**插入/更新步骤：**
```javascript
// 插入/更新配置
var lookupKey = ["id"];
var updateFields = ["name", "email", "phone", "status", "updated_at"];
var insertFields = ["id", "name", "email", "phone", "status", "created_at", "updated_at"];
```

## 作业设计

### 1. 作业配置

**创建作业：**
1. 打开 Spoon
2. 新建作业
3. 从左侧树形菜单拖拽 "Start" 步骤到画布
4. 拖拽 "转换" 步骤到画布
5. 双击 "转换" 步骤，选择之前创建的转换文件
6. 拖拽 "成功" 步骤到画布
7. 按住 Shift 键，从 "Start" 拖拽到 "转换"，从 "转换" 拖拽到 "成功"
8. 保存作业文件

### 2. 作业调度

**使用作业调度器：**
```bash
# 使用 Kitchen 命令行执行作业
./kitchen.sh -file=/path/to/job.kjb -level=Basic

# 使用 Carte 服务器执行作业
./carte.sh localhost 8080

# 使用 cron 调度作业
0 2 * * * /path/to/data-integration/kitchen.sh -file=/path/to/job.kjb -level=Basic
```

### 3. 错误处理

**配置错误处理：**
```javascript
// 错误处理步骤
var errorHandler = {
    // 错误处理策略
    strategy: "CONTINUE", // CONTINUE, SKIP, ABORT
    
    // 错误行处理
    errorLineHandling: {
        // 错误行目标
        target: "error_table",
        
        // 错误字段
        errorFields: [
            {name: "error_message", type: "String"},
            {name: "error_timestamp", type: "Date"}
        ]
    },
    
    // 重试配置
    retry: {
        maxRetries: 3,
        retryInterval: 1000
    }
};
```

## 数据转换

### 1. 数据类型转换

**虚谷数据库数据类型映射：**
```javascript
// Kettle 数据类型到虚谷数据库数据类型映射
var typeMapping = {
    "String": "VARCHAR",
    "Integer": "INT",
    "Long": "BIGINT",
    "Double": "DOUBLE",
    "Boolean": "BOOLEAN",
    "Date": "TIMESTAMP",
    "BigDecimal": "DECIMAL",
    "Binary": "BLOB",
    "Timestamp": "TIMESTAMP",
    "Internet Address": "VARCHAR"
};
```

**数据类型转换步骤：**
```javascript
// 转换配置
var conversions = [
    {field: "id", fromType: "String", toType: "Integer"},
    {field: "amount", fromType: "String", toType: "Double"},
    {field: "created_at", fromType: "String", toType: "Date", format: "yyyy-MM-dd HH:mm:ss"}
];
```

### 2. 数据清洗

**数据清洗步骤：**
```javascript
// 数据清洗配置
var cleaningRules = [
    // 去除空格
    {field: "name", operation: "TRIM"},
    {field: "email", operation: "TRIM"},
    
    // 转换大小写
    {field: "email", operation: "LOWER"},
    
    // 替换空值
    {field: "phone", operation: "REPLACE_NULL", value: ""},
    
    // 验证格式
    {field: "email", operation: "VALIDATE_EMAIL"},
    {field: "phone", operation: "VALIDATE_PHONE"},
    
    // 去除重复
    {fields: ["email"], operation: "REMOVE_DUPLICATES"}
];
```

### 3. 数据验证

**数据验证步骤：**
```javascript
// 验证规则
var validationRules = [
    {
        field: "id",
        rules: [
            {type: "NOT_NULL", message: "ID 不能为空"},
            {type: "POSITIVE", message: "ID 必须为正数"}
        ]
    },
    {
        field: "email",
        rules: [
            {type: "NOT_NULL", message: "邮箱不能为空"},
            {type: "EMAIL", message: "邮箱格式不正确"},
            {type: "MAX_LENGTH", value: 200, message: "邮箱长度不能超过200"}
        ]
    },
    {
        field: "phone",
        rules: [
            {type: "PHONE", message: "手机号格式不正确"},
            {type: "MAX_LENGTH", value: 20, message: "手机号长度不能超过20"}
        ]
    }
];
```

## 性能优化

### 1. 批量处理配置

**批量大小配置：**
```javascript
// 批量处理配置
var batchConfig = {
    // 批量大小
    batchSize: 1000,
    
    // 提交大小
    commitSize: 10000,
    
    // 并行处理
    parallelProcessing: true,
    
    // 并行线程数
    parallelThreads: 4,
    
    // 缓存大小
    cacheSize: 10000
};
```

### 2. 连接池优化

**连接池配置：**
```javascript
// 连接池优化配置
var connectionPoolConfig = {
    // 初始连接数
    initialSize: 5,
    
    // 最大连接数
    maxSize: 20,
    
    // 最小空闲连接数
    minIdle: 5,
    
    // 最大空闲连接数
    maxIdle: 20,
    
    // 最大等待时间
    maxWait: 60000,
    
    // 验证查询
    validationQuery: "SELECT 1",
    
    // 验证间隔
    validationInterval: 30000,
    
    // 测试借用
    testOnBorrow: true,
    
    // 测试空闲
    testWhileIdle: true,
    
    // 驱动连接
    driverClassName: "com.xugu.cloudjdbc.Driver",
    
    // 连接 URL
    url: "jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=SYSDBA&CHAR_SET=UTF8"
};
```

### 3. 查询优化

**查询优化策略：**
```javascript
// 查询优化配置
var queryOptimization = {
    // 使用索引
    useIndexes: true,
    
    // 使用覆盖索引
    useCoveringIndexes: true,
    
    // 使用分区
    usePartitions: true,
    
    // 使用并行查询
    useParallelQueries: true,
    
    // 查询超时
    queryTimeout: 30000,
    
    // 获取大小
    fetchSize: 1000
};
```

### 4. 内存优化

**内存配置：**
```bash
# 修改 Spoon 启动脚本
# 编辑 spoon.sh 或 spoon.bat

# 设置 JVM 内存参数
JAVA_OPTS="-Xms1024m -Xmx4096m -XX:MaxPermSize=256m"

# 或者在 spoon.sh 中修改
if [ -z "$PENTAHO_DI_JAVA_OPTIONS" ]; then
    PENTAHO_DI_JAVA_OPTIONS="-Xms1024m -Xmx4096m -XX:MaxPermSize=256m"
fi
```

## 集群部署

### 1. Carte 服务器配置

**配置 Carte 服务器：**
```xml
<!-- carte-config.xml -->
<slave_config>
    <slaveserver>
        <name>master</name>
        <hostname>192.168.1.100</hostname>
        <port>8080</port>
        <username>cluster</username>
        <password>cluster</password>
        <master>Y</master>
    </slaveserver>
    
    <slaveserver>
        <name>slave1</name>
        <hostname>192.168.1.101</hostname>
        <port>8080</port>
        <username>cluster</username>
        <password>cluster</password>
        <master>N</master>
    </slaveserver>
    
    <slaveserver>
        <name>slave2</name>
        <hostname>192.168.1.102</hostname>
        <port>8080</port>
        <username>cluster</username>
        <password>cluster</password>
        <master>N</master>
    </slaveserver>
</slave_config>
```

### 2. 集群作业配置

**集群作业配置：**
```javascript
// 集群配置
var clusterConfig = {
    // 集群名称
    clusterName: "ETL_Cluster",
    
    // 主服务器
    master: {
        hostname: "192.168.1.100",
        port: 8080,
        username: "cluster",
        password: "cluster"
    },
    
    // 从服务器
    slaves: [
        {hostname: "192.168.1.101", port: 8080},
        {hostname: "192.168.1.102", port: 8080}
    ],
    
    // 数据分区策略
    partitioning: {
        method: "HASH", // HASH, RANGE, ROUND_ROBIN
        field: "id",
        numPartitions: 3
    }
};
```

## 监控管理

### 1. 日志配置

**配置日志级别：**
```xml
<!-- log4j.xml -->
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/kettle.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/kettle.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <logger name="org.pentaho" level="INFO"/>
    <logger name="org.apache" level="WARN"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="FILE"/>
    </root>
</configuration>
```

### 2. 性能监控

**监控指标：**
```javascript
// 性能监控配置
var monitoringConfig = {
    // 监控间隔（秒）
    interval: 60,
    
    // 监控指标
    metrics: [
        "rows_processed",
        "processing_speed",
        "memory_usage",
        "cpu_usage",
        "connection_pool_usage",
        "error_count"
    ],
    
    // 报警配置
    alerts: [
        {
            metric: "error_count",
            threshold: 10,
            action: "email",
            recipients: ["admin@example.com"]
        },
        {
            metric: "memory_usage",
            threshold: 80,
            action: "log",
            message: "内存使用率超过80%"
        }
    ]
};
```

### 3. 作业监控

**作业监控脚本：**
```bash
#!/bin/bash

# 监控作业执行状态
monitor_job() {
    local job_id=$1
    local status=$(curl -s "http://localhost:8080/kettle/job/status/?job_id=$job_id")
    
    echo "作业状态: $status"
    
    if [[ $status == *"ERROR"* ]]; then
        echo "作业执行失败"
        # 发送报警
        send_alert "作业 $job_id 执行失败"
    fi
}

# 监控所有作业
monitor_all_jobs() {
    local jobs=$(curl -s "http://localhost:8080/kettle/job/list/")
    
    for job in $jobs; do
        monitor_job $job
    done
}

# 发送报警
send_alert() {
    local message=$1
    echo "发送报警: $message"
    # 发送邮件或其他通知
}

# 主函数
main() {
    while true; do
        monitor_all_jobs
        sleep 60
    done
}

main
```

## 故障排除

### 1. 连接问题

**问题**：无法连接到虚谷数据库。

**解决方案**：
```bash
# 检查数据库服务状态
systemctl status xugudb

# 检查连接配置
cat ~/.kettle/kettle.properties | grep -i xugu

# 测试数据库连接
java -cp "lib/*:extlib/*" com.xugu.cloudjdbc.Driver -url "jdbc:xugu://127.0.0.1:5138/SYSTEM" -user SYSDBA -password SYSDBA

# 检查网络连接
ping 127.0.0.1
telnet 127.0.0.1 5138
```

### 2. 性能问题

**问题**：ETL 作业执行缓慢。

**解决方案**：
```bash
# 检查系统资源
top
free -h
df -h

# 检查数据库性能
# 在虚谷数据库中执行
SELECT * FROM v$session WHERE status = 'ACTIVE';
SELECT * FROM v$sql ORDER BY elapsed_time DESC;

# 优化 JVM 参数
export PENTAHO_DI_JAVA_OPTIONS="-Xms2048m -Xmx8192m -XX:MaxPermSize=512m"

# 优化批量大小
# 在转换中调整批量大小
```

### 3. 内存问题

**问题**：内存溢出。

**解决方案**：
```bash
# 增加 JVM 内存
export PENTAHO_DI_JAVA_OPTIONS="-Xms4096m -Xmx16384m -XX:MaxPermSize=1024m"

# 优化内存使用
# 1. 减少批量大小
# 2. 使用流式处理
# 3. 增加垃圾回收频率

# 监控内存使用
jstat -gcutil <pid> 1000
```

### 4. 数据类型问题

**问题**：数据类型转换错误。

**解决方案**：
```javascript
// 检查数据类型映射
var typeCheck = {
    "String": "VARCHAR",
    "Integer": "INT",
    "Long": "BIGINT",
    "Double": "DOUBLE",
    "Boolean": "BOOLEAN",
    "Date": "TIMESTAMP"
};

// 使用显式类型转换
var conversion = {
    field: "amount",
    fromType: "String",
    toType: "Double",
    format: "#,##0.00"
};
```

## 最佳实践

### 1. 转换设计
- 保持转换简单清晰
- 使用子转换分解复杂逻辑
- 添加错误处理
- 使用参数化配置

### 2. 作业设计
- 合理设置调度策略
- 添加错误重试机制
- 监控作业执行状态
- 记录执行日志

### 3. 性能优化
- 优化批量大小
- 使用连接池
- 启用并行处理
- 监控系统资源

### 4. 数据质量
- 添加数据验证
- 清洗脏数据
- 记录数据质量报告
- 定期检查数据一致性

### 5. 安全管理
- 加密敏感数据
- 限制访问权限
- 审计操作日志
- 定期备份数据

## 相关资源

- [Pentaho Kettle 官方文档](https://help.pentaho.com/Documentation/9.3/Products/Pentaho_Data_Integration)
- [Pentaho Kettle GitHub 仓库](https://github.com/pentaho/pentaho-kettle)
- [虚谷数据库官方文档](https://www.xugudb.com)
- [Pentaho Kettle 虚谷数据库适配](https://github.com/Xugu-Open-Source/pentaho-kettle)

## 参考文档

详细配置信息请参考：`references/kettle-configuration.md`