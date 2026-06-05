---
name: sqlancer-xugudb-adapter
description: SQLancer 数据库自动化测试工具适配虚谷数据库（XuguDB）的完整指南。当用户需要使用 SQLancer 对虚谷数据库进行自动化测试和错误检测时使用此技能，包括安装配置、测试策略、错误检测、性能测试等。适用于数据库质量保证和错误发现场景。
---

# SQLancer 数据库自动化测试工具虚谷数据库适配指南

## 概述

本技能提供 SQLancer 数据库自动化测试工具适配虚谷数据库（XuguDB）的完整配置指南。SQLancer 是一个自动化测试工具，用于检测数据库管理系统中的逻辑错误，现在可以通过配置支持虚谷数据库。

**适用场景：**
- 数据库质量保证
- 逻辑错误检测
- 性能测试
- 回归测试
- 数据库验证

**核心特性：**
- 自动生成测试 SQL
- 多种测试策略（TLP、NoREC、QPG 等）
- 支持多种数据库
- 可配置的测试参数
- 详细的错误报告
- 支持并行测试

## 快速开始

### 1. 安装 SQLancer

**从源码构建：**
```bash
# 克隆仓库
git clone https://github.com/sqlancer/sqlancer.git
cd sqlancer

# 构建项目
mvn package -DskipTests

# 构建后会在 target 目录生成 jar 文件
ls target/sqlancer-*.jar
```

**使用预编译版本：**
```bash
# 下载预编译版本
wget https://github.com/sqlancer/sqlancer/releases/download/v2.0.0/sqlancer-2.0.0.jar

# 重命名
mv sqlancer-2.0.0.jar sqlancer.jar
```

### 2. 配置虚谷数据库

**添加虚谷数据库驱动：**
```bash
# 将虚谷数据库 JDBC 驱动复制到 SQLancer lib 目录
cp xugu-jdbc-*.jar sqlancer/lib/

# 或者将驱动添加到 classpath
export CLASSPATH=$CLASSPATH:/path/to/xugu-jdbc-*.jar
```

**创建配置文件 `xugudb.properties`：**
```properties
# 虚谷数据库连接配置
dbms=xugudb
host=127.0.0.1
port=5138
database=SYSTEM
username=SYSDBA
password=SYSDBA

# 驱动配置
driver=com.xugu.cloudjdbc.Driver
url=jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=SYSDBA&CHAR_SET=UTF8

# 测试配置
testMode=TLP
threads=4
timeout=60
maxRows=1000
```

### 3. 运行测试

**基础测试：**
```bash
java -jar sqlancer.jar --dbms=xugudb \
  --host=127.0.0.1 \
  --port=5138 \
  --database=SYSTEM \
  --username=SYSDBA \
  --password=SYSDBA \
  --threads=4 \
  --timeout=60
```

**指定测试策略：**
```bash
# TLP (Ternary Logic Partitioning) 测试
java -jar sqlancer.jar --dbms=xugudb \
  --oracle=TLP \
  --threads=4 \
  --timeout=60

# NoREC (Non-Optimizing Reference Engine Construction) 测试
java -jar sqlancer.jar --dbms=xugudb \
  --oracle=NoREC \
  --threads=4 \
  --timeout=60

# QPG (Query Plan Guidance) 测试
java -jar sqlancer.jar --dbms=xugudb \
  --oracle=QPG \
  --threads=4 \
  --timeout=60
```

## 测试策略

### 1. TLP (Ternary Logic Partitioning)

**原理**：将查询分解为三个部分，验证结果一致性。

**测试示例**：
```sql
-- 原始查询
SELECT * FROM users WHERE age > 18 AND status = 1;

-- TLP 分解
-- 部分1: age > 18 AND status = 1
SELECT * FROM users WHERE age > 18 AND status = 1;

-- 部分2: age > 18 AND status != 1
SELECT * FROM users WHERE age > 18 AND status != 1;

-- 部分3: age <= 18
SELECT * FROM users WHERE age <= 18;

-- 验证: 部分1 UNION ALL 部分2 UNION ALL 部分3 = 原始查询
```

**运行 TLP 测试**：
```bash
java -jar sqlancer.jar --dbms=xugudb \
  --oracle=TLP \
  --threads=4 \
  --timeout=60 \
  --num-queries=1000
```

### 2. NoREC (Non-Optimizing Reference Engine Construction)

**原理**：比较优化和未优化查询的结果。

**测试示例**：
```sql
-- 优化查询
SELECT * FROM users WHERE age > 18;

-- 未优化查询
SELECT * FROM users WHERE NOT (age <= 18);

-- 验证两个查询结果一致
```

**运行 NoREC 测试**：
```bash
java -jar sqlancer.jar --dbms=xugudb \
  --oracle=NoREC \
  --threads=4 \
  --timeout=60 \
  --num-queries=1000
```

### 3. QPG (Query Plan Guidance)

**原理**：基于查询计划引导测试。

**测试示例**：
```sql
-- 生成查询计划
EXPLAIN SELECT * FROM users WHERE age > 18 AND status = 1;

-- 基于计划生成测试查询
SELECT * FROM users WHERE age > 18 AND status = 1;
SELECT * FROM users WHERE age > 18;
SELECT * FROM users WHERE status = 1;
```

**运行 QPG 测试**：
```bash
java -jar sqlancer.jar --dbms=xugudb \
  --oracle=QPG \
  --threads=4 \
  --timeout=60 \
  --num-queries=1000
```

## 测试配置

### 1. 连接配置

```properties
# 基础连接
dbms=xugudb
host=127.0.0.1
port=5138
database=SYSTEM
username=SYSDBA
password=SYSDBA

# 高级连接
connectionTimeout=30000
socketTimeout=60000
autoReconnect=true
maxReconnects=3
```

### 2. 测试参数配置

```properties
# 测试模式
testMode=TLP
oracle=TLP
threads=4
timeout=60
num-queries=1000
maxRows=1000

# 表配置
maxTables=10
maxColumns=20
maxRows=10000

# 查询配置
maxJoins=5
maxPredicates=10
maxExpressions=10

# 错误处理
ignoreErrors=false
logErrors=true
errorLogFile=errors.log
```

### 3. 输出配置

```properties
# 输出格式
outputFormat=JSON
outputFile=results.json
logLevel=INFO
logFile=sqlancer.log

# 统计配置
printStats=true
printQueries=true
printErrors=true
```

## 高级测试

### 1. 自定义测试脚本

**创建测试脚本 `test_xugudb.sh`：**
```bash
#!/bin/bash

# 配置参数
DBMS="xugudb"
HOST="127.0.0.1"
PORT="5138"
DATABASE="SYSTEM"
USERNAME="SYSDBA"
PASSWORD="SYSDBA"
THREADS=4
TIMEOUT=60
NUM_QUERIES=1000

# 运行测试
java -jar sqlancer.jar \
  --dbms=$DBMS \
  --host=$HOST \
  --port=$PORT \
  --database=$DATABASE \
  --username=$USERNAME \
  --password=$PASSWORD \
  --threads=$THREADS \
  --timeout=$TIMEOUT \
  --num-queries=$NUM_QUERIES \
  --oracle=TLP \
  --outputFormat=JSON \
  --outputFile=results_$(date +%Y%m%d_%H%M%S).json \
  --logLevel=INFO \
  --logFile=sqlancer_$(date +%Y%m%d_%H%M%S).log

# 检查结果
if [ $? -eq 0 ]; then
    echo "测试完成，未发现错误"
else
    echo "测试发现错误，请检查日志"
    exit 1
fi
```

### 2. 批量测试

**创建批量测试脚本 `batch_test.sh`：**
```bash
#!/bin/bash

# 测试配置数组
declare -a ORACLES=("TLP" "NoREC" "QPG")
declare -a THREADS=(2 4 8)
declare -a TIMEOUTS=(30 60 120)

# 遍历配置
for oracle in "${ORACLES[@]}"; do
    for thread in "${THREADS[@]}"; do
        for timeout in "${TIMEOUTS[@]}"; do
            echo "运行测试: oracle=$oracle, threads=$thread, timeout=$timeout"
            
            java -jar sqlancer.jar \
              --dbms=xugudb \
              --host=127.0.0.1 \
              --port=5138 \
              --database=SYSTEM \
              --username=SYSDBA \
              --password=SYSDBA \
              --oracle=$oracle \
              --threads=$thread \
              --timeout=$timeout \
              --num-queries=500 \
              --outputFormat=JSON \
              --outputFile="results_${oracle}_${thread}_${timeout}.json" \
              --logLevel=INFO \
              --logFile="sqlancer_${oracle}_${thread}_${timeout}.log"
            
            # 检查结果
            if [ $? -ne 0 ]; then
                echo "测试失败: oracle=$oracle, threads=$thread, timeout=$timeout"
                echo "请检查日志文件"
            fi
        done
    done
done

echo "批量测试完成"
```

### 3. 性能测试

**创建性能测试脚本 `performance_test.sh`：**
```bash
#!/bin/bash

# 性能测试配置
declare -a QUERY_COUNTS=(100 500 1000 5000)
declare -a TABLE_COUNTS=(5 10 20 50)
declare -a COLUMN_COUNTS=(10 20 50 100)

echo "开始性能测试..."
echo "时间戳,查询数量,表数量,列数量,执行时间(秒),查询/秒" > performance_results.csv

for query_count in "${QUERY_COUNTS[@]}"; do
    for table_count in "${TABLE_COUNTS[@]}"; do
        for column_count in "${COLUMN_COUNTS[@]}"; do
            echo "测试: queries=$query_count, tables=$table_count, columns=$column_count"
            
            start_time=$(date +%s)
            
            java -jar sqlancer.jar \
              --dbms=xugudb \
              --host=127.0.0.1 \
              --port=5138 \
              --database=SYSTEM \
              --username=SYSDBA \
              --password=SYSDBA \
              --oracle=TLP \
              --threads=4 \
              --timeout=60 \
              --num-queries=$query_count \
              --maxTables=$table_count \
              --maxColumns=$column_count \
              --outputFormat=JSON \
              --outputFile="perf_${query_count}_${table_count}_${column_count}.json" \
              --logLevel=ERROR \
              --logFile="perf_${query_count}_${table_count}_${column_count}.log"
            
            end_time=$(date +%s)
            execution_time=$((end_time - start_time))
            queries_per_second=$((query_count / execution_time))
            
            echo "$(date +%Y-%m-%d %H:%M:%S),$query_count,$table_count,$column_count,$execution_time,$queries_per_second" >> performance_results.csv
            
            echo "执行时间: ${execution_time}秒, 查询/秒: $queries_per_second"
        done
    done
done

echo "性能测试完成，结果保存在 performance_results.csv"
```

## 错误检测

### 1. 常见错误类型

**逻辑错误**：
```sql
-- 错误: WHERE 条件逻辑错误
SELECT * FROM users WHERE age > 18 AND age < 18; -- 永远为空

-- 错误: JOIN 条件错误
SELECT * FROM users u JOIN orders o ON u.id = o.user_id AND u.id = o.product_id;

-- 错误: 聚合函数使用错误
SELECT COUNT(*), name FROM users; -- 缺少 GROUP BY
```

**性能错误**：
```sql
-- 错误: 缺少索引
SELECT * FROM users WHERE email = 'test@example.com'; -- email 列没有索引

-- 错误: 全表扫描
SELECT * FROM users WHERE UPPER(name) = 'TEST'; -- 函数导致索引失效

-- 错误: 笛卡尔积
SELECT * FROM users, orders; -- 缺少 JOIN 条件
```

**数据完整性错误**：
```sql
-- 错误: 外键约束违反
INSERT INTO orders (user_id, product_id) VALUES (999, 1); -- user_id 不存在

-- 错误: 唯一约束违反
INSERT INTO users (email) VALUES ('existing@example.com'); -- email 已存在

-- 错误: 非空约束违反
INSERT INTO users (name) VALUES (NULL); -- name 列不允许为空
```

### 2. 错误报告分析

**JSON 报告格式**：
```json
{
  "testId": "test_001",
  "timestamp": "2024-01-01T00:00:00Z",
  "database": "xugudb",
  "oracle": "TLP",
  "duration": 60,
  "queriesExecuted": 1000,
  "errorsFound": 2,
  "errors": [
    {
      "errorId": "err_001",
      "type": "LOGIC_ERROR",
      "query": "SELECT * FROM users WHERE age > 18 AND status = 1",
      "expected": "10 rows",
      "actual": "8 rows",
      "description": "TLP 分区结果不一致",
      "severity": "HIGH",
      "suggestion": "检查 WHERE 条件逻辑"
    },
    {
      "errorId": "err_002",
      "type": "PERFORMANCE_ERROR",
      "query": "SELECT * FROM users WHERE email = 'test@example.com'",
      "executionTime": "2.5s",
      "description": "查询执行时间过长",
      "severity": "MEDIUM",
      "suggestion": "为 email 列创建索引"
    }
  ],
  "statistics": {
    "totalQueries": 1000,
    "successfulQueries": 998,
    "failedQueries": 2,
    "averageQueryTime": "0.05s",
    "maxQueryTime": "2.5s",
    "minQueryTime": "0.01s"
  }
}
```

### 3. 错误处理策略

**忽略特定错误**：
```properties
# 忽略特定错误类型
ignoreErrors=true
ignoreErrorTypes=CONSTRAINT_VIOLATION,SYNTAX_ERROR

# 忽略特定错误消息
ignoreErrorMessages=Table not found,Column not found

# 忽略特定错误代码
ignoreErrorCodes=42P01,42703
```

**错误重试**：
```properties
# 错误重试配置
retryOnError=true
maxRetries=3
retryDelay=1000

# 特定错误重试
retryOnErrors=CONNECTION_TIMEOUT,DEADLOCK
```

## 集成测试

### 1. CI/CD 集成

**Jenkins Pipeline**：
```groovy
pipeline {
    agent any
    
    stages {
        stage('SQLancer 测试') {
            steps {
                script {
                    // 运行 SQLancer 测试
                    sh '''
                        java -jar sqlancer.jar \
                          --dbms=xugudb \
                          --host=127.0.0.1 \
                          --port=5138 \
                          --database=SYSTEM \
                          --username=SYSDBA \
                          --password=SYSDBA \
                          --oracle=TLP \
                          --threads=4 \
                          --timeout=60 \
                          --num-queries=1000 \
                          --outputFormat=JSON \
                          --outputFile=results.json
                    '''
                }
            }
            
            post {
                always {
                    // 发布测试结果
                    archiveArtifacts artifacts: 'results.json'
                    
                    // 解析结果
                    script {
                        def results = readJSON file: 'results.json'
                        if (results.errorsFound > 0) {
                            error "SQLancer 测试发现 ${results.errorsFound} 个错误"
                        }
                    }
                }
            }
        }
    }
}
```

**GitHub Actions**：
```yaml
name: SQLancer 测试

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  sqlancer-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: 设置 Java
      uses: actions/setup-java@v2
      with:
        java-version: '11'
        distribution: 'adopt'
    
    - name: 下载 SQLancer
      run: |
        wget https://github.com/sqlancer/sqlancer/releases/download/v2.0.0/sqlancer-2.0.0.jar
        mv sqlancer-2.0.0.jar sqlancer.jar
    
    - name: 下载虚谷数据库驱动
      run: |
        wget https://github.com/Xugu-Open-Source/xugu-jdbc/releases/download/12.0.0/xugu-jdbc-12.0.0.jar
        mkdir -p lib
        mv xugu-jdbc-12.0.0.jar lib/
    
    - name: 运行 SQLancer 测试
      run: |
        java -cp "sqlancer.jar:lib/*" sqlancer.Main \
          --dbms=xugudb \
          --host=${{ secrets.DB_HOST }} \
          --port=5138 \
          --database=SYSTEM \
          --username=${{ secrets.DB_USERNAME }} \
          --password=${{ secrets.DB_PASSWORD }} \
          --oracle=TLP \
          --threads=4 \
          --timeout=60 \
          --num-queries=1000 \
          --outputFormat=JSON \
          --outputFile=results.json
    
    - name: 上传测试结果
      uses: actions/upload-artifact@v2
      with:
        name: sqlancer-results
        path: results.json
    
    - name: 检查测试结果
      run: |
        python3 -c "
        import json
        with open('results.json') as f:
            results = json.load(f)
        if results['errorsFound'] > 0:
            print(f'发现 {results[\"errorsFound\"]} 个错误')
            exit(1)
        else:
            print('测试通过，未发现错误')
        "
```

### 2. 自动化测试脚本

**每日测试脚本 `daily_test.sh`：**
```bash
#!/bin/bash

# 配置
SQLANCER_JAR="sqlancer.jar"
XUGU_DRIVER="lib/xugu-jdbc-*.jar"
DB_HOST="127.0.0.1"
DB_PORT="5138"
DB_DATABASE="SYSTEM"
DB_USERNAME="SYSDBA"
DB_PASSWORD="SYSDBA"
RESULTS_DIR="results/$(date +%Y-%m-%d)"
LOG_DIR="logs/$(date +%Y-%m-%d)"

# 创建目录
mkdir -p $RESULTS_DIR $LOG_DIR

# 测试配置
declare -a ORACLES=("TLP" "NoREC" "QPG")
declare -a THREADS=(2 4 8)

echo "开始每日测试: $(date)"

for oracle in "${ORACLES[@]}"; do
    for thread in "${THREADS[@]}"; do
        echo "运行测试: oracle=$oracle, threads=$thread"
        
        java -cp "$SQLANCER_JAR:$XUGU_DRIVER" sqlancer.Main \
          --dbms=xugudb \
          --host=$DB_HOST \
          --port=$DB_PORT \
          --database=$DB_DATABASE \
          --username=$DB_USERNAME \
          --password=$DB_PASSWORD \
          --oracle=$oracle \
          --threads=$thread \
          --timeout=60 \
          --num-queries=500 \
          --outputFormat=JSON \
          --outputFile="$RESULTS_DIR/${oracle}_${thread}.json" \
          --logLevel=INFO \
          --logFile="$LOG_DIR/${oracle}_${thread}.log"
        
        # 检查结果
        if [ $? -ne 0 ]; then
            echo "测试失败: oracle=$oracle, threads=$thread"
            echo "请检查日志: $LOG_DIR/${oracle}_${thread}.log"
        else
            echo "测试完成: oracle=$oracle, threads=$thread"
        fi
    done
done

# 生成报告
echo "生成测试报告..."
python3 generate_report.py $RESULTS_DIR

echo "每日测试完成: $(date)"
```

## 最佳实践

### 1. 测试策略选择

**TLP 测试**：
- 适用于复杂查询
- 能检测逻辑错误
- 测试覆盖率高
- 推荐作为主要测试策略

**NoREC 测试**：
- 适用于优化器测试
- 能检测优化错误
- 测试速度快
- 推荐作为补充测试

**QPG 测试**：
- 适用于查询计划测试
- 能检测计划错误
- 测试针对性强
- 推荐用于特定场景

### 2. 测试参数调优

**线程数**：
- 根据 CPU 核心数调整
- 一般设置为 CPU 核心数的 1-2 倍
- 避免设置过高导致资源竞争

**超时时间**：
- 根据查询复杂度调整
- 简单查询：30-60 秒
- 复杂查询：120-300 秒
- 避免设置过短导致测试不充分

**查询数量**：
- 根据测试时间调整
- 快速测试：100-500 个查询
- 标准测试：1000-5000 个查询
- 全面测试：10000+ 个查询

### 3. 错误处理

**错误分类**：
- 逻辑错误：优先级高
- 性能错误：优先级中
- 数据完整性错误：优先级高
- 语法错误：优先级低

**错误处理**：
- 记录详细错误信息
- 分析错误原因
- 制定修复计划
- 验证修复效果

### 4. 结果分析

**统计指标**：
- 查询成功率
- 平均查询时间
- 错误类型分布
- 性能瓶颈分析

**报告生成**：
- 生成 HTML 报告
- 包含错误详情
- 包含性能图表
- 包含改进建议

### 5. 持续改进

**测试优化**：
- 定期更新测试用例
- 优化测试参数
- 改进错误检测
- 提高测试效率

**流程优化**：
- 自动化测试流程
- 集成 CI/CD
- 建立反馈机制
- 持续监控改进

## 相关资源

- [SQLancer 官方文档](https://github.com/sqlancer/sqlancer)
- [SQLancer 论文](https://arxiv.org/abs/2011.06919)
- [虚谷数据库官方文档](https://www.xugudb.com)
- [SQLancer 虚谷数据库适配](https://github.com/Xugu-Open-Source/sqlancer)

## 参考文档

详细配置信息请参考：`references/sqlancer-configuration.md`