# XuguDB Dev Skills

虚谷数据库 Claude Code 技能包，为 AI 编码助手提供 XuguDB 领域知识、驱动开发指南、SQL/PLSQL 参考、运维部署说明，以及框架和中间件适配指导。

当前目录是合并版：

- 上游来源：[kourou25/xugudb-dev-skills](https://github.com/kourou25/xugudb-dev-skills)
- 上游分支：`master`
- 本地增强：`xugudb-ecosystem` 使用当前目录中新作的框架适配 skill 覆盖上游同名 skill
- 规模：25 个顶层技能、62 个 `SKILL.md`、121 份 reference 文档、37 个生态适配器

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

## 合并说明

当前包使用上游的安装脚本和 24 个通用 XuguDB 技能，同时把本地增强版生态集成内容放到 canonical 位置：

```txt
skills/xugudb-ecosystem/
```

## 安装

### npx 一键安装

```bash
npx xugudb-dev-skills
```

执行后会把包内 `skills/` 复制到当前工作目录的 `skills/` 下。

### 本地开发安装

```bash
git clone https://github.com/kourou25/xugudb-dev-skills.git
cd xugudb-dev-skills
npm link
xugudb-dev-skills
```

如果 GitHub 访问不稳定，可使用镜像：

```bash
git clone https://gitee.com/kourou25/xugudb-dev-skills.git
git clone https://ghproxy.com/https://github.com/kourou25/xugudb-dev-skills.git
```

## 验证安装

在 Claude Code 中输入：

```txt
/xugudb
```

如果能返回虚谷数据库概览，说明基础技能可用。也可以验证增强生态 skill：

```txt
/xugudb-ecosystem
hibernate-xugudb-adapter 怎么配置？
peewee-xugudb-adapter 怎么接入虚谷？
```

本地文件级验证：

```powershell
(Get-ChildItem .\skills -Directory | Measure-Object).Count
(Get-ChildItem .\skills\xugudb-ecosystem\adapters -Directory | Measure-Object).Count
(Get-ChildItem .\skills -Recurse -File -Filter SKILL.md | Measure-Object).Count
(Get-ChildItem .\skills -Recurse -File -Filter *.md | Where-Object { $_.FullName -match '\\references\\' } | Measure-Object).Count
```

期望结果依次为 `25`、`37`、`62`、`121`。

## 技能列表

| 命令 | 名称 | 说明 | 参考文档 |
|------|------|------|:--------:|
| `/xugudb` | 产品概览 | 架构设计、版本选型、快速上手 | 5 |
| `/xugudb-sql` | SQL 语法 | DDL/DML/查询/数据类型/运算符 + Oracle/MySQL/PG 对比 | 8 |
| `/xugudb-plsql` | PL/SQL 编程 | 存储过程、函数、触发器、游标、异常处理 | 1 |
| `/xugudb-functions` | 系统函数 | 字符串、数学、日期、聚合、分析、JSON/XML 等函数 | 6 |
| `/xugudb-data-dictionary` | 数据字典 | 系统表、系统视图、系统包 | 1 |
| `/xugudb-objects` | 对象管理 | 表、索引、视图、约束、序列、触发器、DBLink 等 | 5 |
| `/xugudb-config` | 系统配置 | `xugu.ini` 参数、集群配置、类型映射 | 4 |
| `/xugudb-security` | 安全权限 | 认证、权限、角色、审计、加密 | 4 |
| `/xugudb-deployment` | 安装部署 | 标准版、企业版、分布式版、安全版、Docker | 6 |
| `/xugudb-distributed` | 分布式架构 | 集群部署、节点角色、存算分离/融合 | 2 |
| `/xugudb-ha` | 高可用 | 集群管理、备份恢复、故障切换 | 5 |
| `/xugudb-migration` | 数据迁移 | Oracle/MySQL/PostgreSQL 迁移到虚谷 | 2 |
| `/xugudb-vector` | 向量功能 | `VECTOR`、`HALFVEC`、`SPARSEVEC`、DiskANN 索引 | 4 |
| `/xugudb-spatial` | 空间数据库 | GIS 几何模型、空间函数、地图服务集成 | 4 |
| `/xugudb-jdbc` | Java JDBC | 连接池、CRUD、事务、批量操作、SSL | 5 |
| `/xugudb-python` | Python | `xgcondb` 驱动、参数化查询、游标 | 4 |
| `/xugudb-go` | Go | `database/sql` 接口、事务、大对象 | 3 |
| `/xugudb-csharp` | C# (.NET) | ADO.NET、`XGConnection`、`DataSet` | 3 |
| `/xugudb-php` | PHP | PDO 驱动、参数绑定、存储过程 | 3 |
| `/xugudb-nodejs` | Node.js | ODBC 桥接、Sequelize ORM 集成 | 2 |
| `/xugudb-odbc` | ODBC | DSN 配置、连接字符串、跨语言访问 | 3 |
| `/xugudb-c` | C 语言 | NCI/OCI/XGCI 三种 C 接口 | 3 |
| `/xugudb-ecosystem` | 生态集成 | ORM、连接池、迁移、调度、工作流、BI、监控等框架适配 | 32 |
| `/xugudb-tools` | 客户端工具 | XGConsole 命令行、DBeaver 集成 | 2 |
| `/xugudb-faq` | 常见问题 | FAQ + 错误码参考 | 4 |

## 生态适配器

增强版 `/xugudb-ecosystem` 包含 37 个适配器，统一位于 [skills/xugudb-ecosystem/adapters](skills/xugudb-ecosystem/adapters)：

- ORM 与数据访问：Hibernate、MyBatis-Plus、MyBatis PageHelper、jOOQ、EclipseLink、EF6、EF Core、GORM、XORM、Django、SQLAlchemy、Peewee、ThinkPHP、Sequelize、TypeORM
- 数据源与分布式数据：Druid、AnyLine、Seata、ShardingSphere、Nacos
- 迁移、同步与开发工具：Flyway、Liquibase、DataX、Pentaho Kettle、DBeaver、CloudBeaver、SQLancer
- BI 与监控：DataEase、HertzBeat
- 工作流引擎：Activiti、Flowable、Camunda
- 任务调度与作业编排：Quartz、PowerJob、XXL-JOB、Azkaban
- 平台插件：Nacos Plugin

## 目录结构

```txt
xugudb-dev-skills/
├── skills/
│   ├── xugudb/
│   │   ├── SKILL.md
│   │   └── references/
│   ├── xugudb-ecosystem/
│   │   ├── SKILL.md
│   │   ├── references/
│   │   └── adapters/
│   │       ├── hibernate-xugudb-adapter/
│   │       ├── peewee-xugudb-adapter/
│   │       └── ...
│   └── ...
├── install.js
├── package.json
├── README.md
└── LICENSE
```

## README 有效性维护

更新技能或适配器后，需要同步检查：

1. `skills/` 顶层技能数量。
2. `skills/xugudb-ecosystem/adapters/` 适配器数量。
3. 所有 README 本地链接是否存在。
4. `package.json` 的 `bin.xugudb-dev-skills` 是否仍指向存在的 `install.js`。
5. `package.json` 的 `files` 是否只包含发布需要的路径。
6. 新增 `SKILL.md` 是否包含 frontmatter、`name`、`description` 和一级标题。

## 其他 IDE 集成

这些 Markdown 文件也可以作为知识库在其他工具中使用：

| 平台 | 集成方式 |
|------|----------|
| Cursor | 将 `skills/` 目录加入 Rules 或通过 `@file` 引用 |
| GitHub Copilot | 通过 `#file` 引用 `SKILL.md` 文件 |
| Windsurf | 加入项目上下文 |
| Dify / Coze / FastGPT | 将 `references/` 目录作为 RAG 知识库导入 |
| LangChain / LlamaIndex | 作为文档加载器的数据源 |

## 许可证

[Apache License 2.0](LICENSE)

## 贡献

欢迎提交 Issue 和 Pull Request。技能文档基于虚谷数据库 V12.9 / V13 官方文档整理；框架适配内容应优先附带最小连接示例、配置项说明、验证步骤和常见问题。
