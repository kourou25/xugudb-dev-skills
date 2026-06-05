---
name: 虚谷数据库生态集成
name_for_command: xugudb-ecosystem
description: |
  XuguDB 生态集成指南：ORM 框架适配（Java/Go/Python/PHP/Node.js）。
  涵盖 MyBatis、Hibernate、Spring Boot、GORM、Django、SQLAlchemy、Sequelize、ThinkPHP 等
  主流框架与虚谷数据库的集成配置。适用于使用各语言 ORM 框架开发虚谷数据库应用。
  包含37个主流中间件适配器，统一存放在adapters目录下。
tags: xugudb, orm, mybatis, hibernate, spring, gorm, django, sqlalchemy, ecosystem, adapters
---

# 虚谷数据库生态集成

## 支持的框架总览

### Java 生态

| 框架 | 版本 | 适配方式 | 说明 |
|------|------|----------|------|
| **MyBatis** | 3.5.10 | JDBC 直连 | 通过 XuguDB-JDBC + mybatis-config.xml |
| **MyBatis-Plus** | - | JDBC 直连 | MyBatis 增强版 |
| **Hibernate** | 6.6.1 | xugu-dialect | 需安装虚谷 Dialect 到 Hibernate |
| **Spring Boot** | 3.3.2 | JDBC + ORM | 支持 JPA/MyBatis/JdbcTemplate |
| **Druid** | 1.1.24 | 连接池 | 阿里巴巴数据库连接池 |
| **HikariCP** | 4.0.3 | 连接池 | Spring Boot 默认连接池 |
| **c3p0** | - | 连接池 | 传统连接池 |
| **ShardingSphere** | - | 分库分表 | 分布式数据库中间件 |
| **Flyway/Liquibase** | - | 数据库迁移 | Schema 版本管理 |
| **Quartz/XXL-JOB/PowerJob** | - | 任务调度 | 定时任务框架 |
| **Nacos** | - | 配置中心 | 服务配置管理 |
| **Activiti/Flowable/Camunda** | - | 工作流 | BPM 流程引擎 |

### Go 生态

| 框架 | 版本 | 适配方式 |
|------|------|----------|
| **GORM** | 1.20.0 | xggorm 适配器 |
| **XORM** | 1.3.1 | xugu.go dialect |

### Python 生态

| 框架 | 版本 | 适配方式 |
|------|------|----------|
| **Django** | 4.2.1 | xgcondb 引擎 |
| **SQLAlchemy** | 1.4.36 | xugu-sqlalchemy 方言 |
| **peewee** | 3.17.1 | xgpeewee 适配器 |

### PHP 生态

| 框架 | 版本 | 适配方式 |
|------|------|----------|
| **ThinkPHP** | 5.0.1 | Xugusql builder |

### Node.js 生态

| 框架 | 版本 | 适配方式 |
|------|------|----------|
| **Sequelize** | 6.37.3 | xugu-dialect |

> 详细参考：[Java ORM 集成](references/java-orm.md) / [其他语言 ORM 集成](references/other-orm.md)

## Java — MyBatis 集成

### Maven 依赖

```xml
<dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis</artifactId>
    <version>3.5.10</version>
</dependency>
<dependency>
    <groupId>com.xugudb</groupId>
    <artifactId>xugu-jdbc</artifactId>
    <version>12.3.4</version>
</dependency>
```

### mybatis-config.xml 关键配置

```xml
<dataSource type="druid">
    <property name="driver" value="com.xugu.cloudjdbc.Driver"/>
    <property name="url" value="jdbc:xugu://127.0.0.1:5138/SYSTEM"/>
    <property name="username" value="SYSDBA"/>
    <property name="password" value="SYSDBA"/>
</dataSource>
```

## Java — Spring Boot + HikariCP

### application.yml

```yaml
spring:
  datasource:
    type: com.zaxxer.hikari.HikariDataSource
    driver-class-name: com.xugu.cloudjdbc.Driver
    url: jdbc:xugu://127.0.0.1:5138/SYSTEM
    username: SYSDBA
    password: SYSDBA
    hikari:
      pool-name: MyHikariPool
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
      max-lifetime: 1800000
      idle-timeout: 600000
      connection-test-query: SELECT 1
```

## Go — GORM 集成

```go
import (
    "xggorm"
    "gorm.io/gorm"
    _ "gitee.com/XuguDB/go-xugu-driver"
)

dsn := "IP=127.0.0.1;DB=SYSTEM;User=SYSDBA;PWD=SYSDBA;Port=5138;CHAR_SET=UTF8"
db, err := gorm.Open(xggorm.Open(dsn), &gorm.Config{})
```

## Python — Django 集成

### settings.py

```python
DATABASES = {
    'default': {
        'ENGINE': 'xgcondb',
        'NAME': 'SYSTEM',
        'USER': 'SYSDBA',
        'PASSWORD': 'SYSDBA',
        'HOST': '127.0.0.1',
        'PORT': 5138,
    }
}
```

## Python — SQLAlchemy 集成

```python
from sqlalchemy import create_engine
engine = create_engine('xugu://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')
```

## 工作流程

当用户咨询生态集成问题时：

1. 确定使用的编程语言和框架
2. 确认框架版本与虚谷适配器版本的兼容性
3. 提供数据源配置（连接字符串、驱动类名）
4. 标注需要额外安装的适配插件（dialect/adapter）
5. 对虚谷特有语法建议使用原生 SQL

## 参考文档

- [Java ORM 集成](references/java-orm.md) — MyBatis/Hibernate/Spring Boot/连接池配置
- [其他语言 ORM 集成](references/other-orm.md) — Go GORM/XORM、Python Django/SQLAlchemy、PHP ThinkPHP、Node.js Sequelize

## 适配器目录

所有37个中间件适配器技能统一存放在 `adapters/` 目录下，每个适配器都是一个独立的技能，包含完整的配置指南和文档。

### 适配器分类索引

#### 1. ORM 与数据访问适配器（15个）

| 技能名称 | 描述 | 适用场景 |
|----------|------|----------|
| `hibernate-xugudb-adapter` | Hibernate ORM适配器 | 企业级Java应用，需要完整的ORM功能 |
| `mybatis-plus-xugudb-adapter` | MyBatis-Plus适配器 | 简化MyBatis开发，提供增强功能 |
| `mybatis-pagehelper-xugudb-adapter` | MyBatis PageHelper适配器 | MyBatis分页查询 |
| `jooq-xugudb-adapter` | jOOQ SQL构建器适配器 | 类型安全的SQL构建，代码生成 |
| `eclipselink-xugudb-adapter` | EclipseLink ORM适配器 | JPA标准应用开发，高级缓存和查询优化 |
| `ef6-xugudb-adapter` | Entity Framework 6适配器 | .NET Framework应用开发 |
| `efcore-xugudb-adapter` | Entity Framework Core适配器 | .NET Core/.NET 5+应用开发 |
| `gorm-xugudb-adapter` | GORM ORM适配器 | Go语言ORM开发 |
| `xorm-xugudb-adapter` | XORM ORM适配器 | Go语言ORM开发，支持多种数据库 |
| `django-xugudb-adapter` | Django ORM适配器 | Python Web应用开发 |
| `sqlalchemy-xugudb-adapter` | SQLAlchemy ORM适配器 | Python数据库ORM开发 |
| `peewee-xugudb-adapter` | Peewee ORM适配器 | 轻量级Python ORM开发 |
| `thinkphp-xugudb-adapter` | ThinkPHP ORM适配器 | PHP Web应用开发 |
| `sequelize-xugudb-adapter` | Sequelize ORM适配器 | Node.js ORM开发 |
| `typeorm-xugudb-adapter` | TypeORM适配器 | TypeScript/Node.js ORM开发 |

#### 2. 数据源与分布式数据适配器（5个）

| 技能名称 | 描述 | 适用场景 |
|----------|------|----------|
| `druid-xugudb-adapter` | Druid连接池适配器 | 高性能数据库连接池管理 |
| `anyline-xugudb-adapter` | AnyLine动态数据源适配器 | 多数据源管理、数据中台、低代码平台 |
| `seata-xugudb-adapter` | Seata分布式事务适配器 | 微服务架构分布式事务管理 |
| `shardingsphere-xugudb-adapter` | ShardingSphere分库分表适配器 | 大数据量分库分表、读写分离 |
| `nacos-xugudb-adapter` | Nacos配置中心适配器 | 微服务配置管理和服务发现 |

#### 3. 迁移、同步与开发工具适配器（7个）

| 技能名称 | 描述 | 适用场景 |
|----------|------|----------|
| `flyway-xugudb-adapter` | Flyway数据库迁移适配器 | 数据库版本管理和迁移 |
| `liquibase-xugudb-adapter` | Liquibase数据库迁移适配器 | 复杂的数据库变更管理 |
| `datax-xugudb-adapter` | DataX数据同步适配器 | 批量数据同步、离线交换 |
| `pentaho-kettle-xugudb-adapter` | Pentaho Kettle适配器 | ETL作业开发和调度 |
| `dbeaver-xugudb-adapter` | DBeaver数据库工具适配器 | 数据库管理和开发 |
| `cloudbeaver-xugudb-adapter` | CloudBeaver云数据库管理器适配器 | 团队协作、远程数据库管理 |
| `sqlancer-xugudb-adapter` | SQLancer数据库测试工具适配器 | 数据库自动化测试、错误检测、性能测试 |

#### 4. BI 与监控适配器（2个）

| 技能名称 | 描述 | 适用场景 |
|----------|------|----------|
| `dataease-xugudb-adapter` | DataEase BI工具适配器 | 数据可视化、自助分析、报表分享 |
| `hertzbeat-xugudb-adapter` | HertzBeat监控系统适配器 | 数据库性能监控、故障预警、运维管理 |

#### 5. 工作流引擎适配器（3个）

| 技能名称 | 描述 | 适用场景 |
|----------|------|----------|
| `activiti-xugudb-adapter` | Activiti工作流引擎适配器 | 企业级工作流应用、审批流程、业务流程自动化 |
| `flowable-xugudb-adapter` | Flowable工作流引擎适配器 | 工作流应用、审批流程、案例管理 |
| `camunda-xugudb-adapter` | Camunda BPM平台适配器 | 企业级工作流应用、审批流程、业务流程自动化、案例管理 |

#### 6. 任务调度与作业编排适配器（4个）

| 技能名称 | 描述 | 适用场景 |
|----------|------|----------|
| `quartz-xugudb-adapter` | Quartz任务调度框架适配器 | 定时任务、作业调度 |
| `powerjob-xugudb-adapter` | PowerJob分布式任务调度适配器 | 分布式任务调度、批量数据处理、工作流编排 |
| `xxl-job-xugudb-adapter` | XXL-JOB分布式任务调度适配器 | 分布式任务调度、定时任务管理 |
| `azkaban-xugudb-adapter` | Azkaban工作流管理器适配器 | 大数据作业调度和管理、Hadoop/Spark作业编排 |

#### 7. 平台插件适配器（1个）

| 技能名称 | 描述 | 适用场景 |
|----------|------|----------|
| `nacos-plugin-xugudb-adapter` | Nacos插件系统适配器 | 自定义Nacos功能扩展 |

### 适配器使用方式

每个适配器都是一个独立的技能，可以通过以下方式使用：

1. **查看适配器列表**：浏览 `adapters/` 目录下的所有适配器
2. **加载特定适配器**：使用对应的技能名称（如 `hibernate-xugudb-adapter`）
3. **查看适配器文档**：每个适配器目录下都有 `SKILL.md` 文件，包含完整的配置指南

### 快速选择指南

#### 按项目类型选择

**企业级Java Web应用**
- ORM框架：`hibernate-xugudb-adapter` 或 `mybatis-plus-xugudb-adapter`
- 连接池：`druid-xugudb-adapter`
- 数据库迁移：`flyway-xugudb-adapter` 或 `liquibase-xugudb-adapter`
- 监控：`hertzbeat-xugudb-adapter`
- 任务调度：`quartz-xugudb-adapter` 或 `xxl-job-xugudb-adapter`

**微服务架构**
- ORM框架：`mybatis-plus-xugudb-adapter`
- 分布式事务：`seata-xugudb-adapter`
- 配置中心：`nacos-xugudb-adapter`
- 分库分表：`shardingsphere-xugudb-adapter`
- 任务调度：`powerjob-xugudb-adapter`

**低代码平台/数据中台**
- 动态数据源：`anyline-xugudb-adapter`
- BI工具：`dataease-xugudb-adapter`
- 监控：`hertzbeat-xugudb-adapter`

**工作流应用**
- 工作流引擎：`activiti-xugudb-adapter` 或 `flowable-xugudb-adapter`
- ORM框架：`hibernate-xugudb-adapter`
- 任务调度：`quartz-xugudb-adapter`

**Go/Python/PHP/Node.js项目**
- Go：`gorm-xugudb-adapter` 或 `xorm-xugudb-adapter`
- Python：`django-xugudb-adapter`、`sqlalchemy-xugudb-adapter` 或 `peewee-xugudb-adapter`
- PHP：`thinkphp-xugudb-adapter`
- Node.js：`sequelize-xugudb-adapter`
