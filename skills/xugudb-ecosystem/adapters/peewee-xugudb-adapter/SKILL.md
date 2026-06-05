---
name: peewee-xugudb-adapter
description: Peewee 轻量级 Python ORM 适配虚谷数据库(XuguDB)的指南。当用户需要在 Peewee 项目中通过 xgcondb 或 DB-API 兼容驱动连接虚谷数据库时使用此技能，包括驱动安装、Database 封装、模型映射、CRUD、事务和测试验证。
---

# Peewee 虚谷数据库适配指南

## 概述

Peewee 没有内置 XuguDB 方言时，可以通过虚谷 Python 驱动提供的 DB-API 能力封装 `Database` 子类，复用 Peewee 的模型、查询构造和事务能力。适配重点是连接参数、SQL 差异、字段类型映射和分页语法。

## 适配流程

```
1. 安装依赖 -> 2. 封装 Database -> 3. 配置模型 -> 4. 验证 CRUD -> 5. 校验事务与分页
```

## 第一步：安装依赖

```bash
pip install peewee
```

同时准备虚谷 Python 驱动 `xgcondb`，确保应用运行环境可以导入：

```python
import xgcondb
```

## 第二步：封装数据库连接

优先使用虚谷 Python 驱动的 DB-API 接口作为底层连接。下面示例提供最小封装，实际项目可继续扩展字段类型、分页编译和异常映射。

```python
import xgcondb
from peewee import Database


class XuguDatabase(Database):
    field_types = {
        "AUTO": "INTEGER",
        "BIGAUTO": "BIGINT",
        "BIGINT": "BIGINT",
        "BLOB": "BLOB",
        "BOOL": "BOOLEAN",
        "DATETIME": "DATETIME",
        "DECIMAL": "NUMERIC",
        "DOUBLE": "DOUBLE",
        "FLOAT": "FLOAT",
        "INT": "INTEGER",
        "TEXT": "CLOB",
        "UUID": "VARCHAR(36)",
        "VARCHAR": "VARCHAR",
    }

    def _connect(self):
        return xgcondb.connect(
            database=self.database,
            user=self.connect_params.get("user", "SYSDBA"),
            password=self.connect_params.get("password"),
            host=self.connect_params.get("host", "127.0.0.1"),
            port=self.connect_params.get("port", 5138),
        )


db = XuguDatabase(
    "SYSTEM",
    user="SYSDBA",
    password="SYSDBA",
    host="127.0.0.1",
    port=5138,
)
```

## 第三步：定义模型

```python
from peewee import CharField, IntegerField, Model


class BaseModel(Model):
    class Meta:
        database = db


class User(BaseModel):
    id = IntegerField(primary_key=True)
    name = CharField(max_length=100)
    age = IntegerField(null=True)

    class Meta:
        table_name = "users"
```

## 第四步：CRUD 示例

```python
db.connect()
db.create_tables([User])

User.create(id=1, name="Alice", age=30)

user = User.get(User.id == 1)
user.age = 31
user.save()

rows = list(User.select().where(User.age >= 18))
User.delete().where(User.id == 1).execute()
db.close()
```

## 第五步：事务与分页验证

```python
with db.atomic():
    User.create(id=2, name="Bob", age=25)
    User.create(id=3, name="Carol", age=28)

page_rows = list(
    User.select()
    .order_by(User.id)
    .paginate(1, 20)
)
```

验证时至少覆盖：

1. 连接成功，`SELECT 1` 可执行。
2. `create_tables` 生成的字段类型符合预期。
3. 插入、查询、更新、删除成功。
4. `atomic()` 可提交和回滚。
5. `paginate()` 生成 SQL 后能在当前兼容模式下执行。

## 常见问题

### 自增主键不符合预期

虚谷项目中建议显式确认自增列或序列策略。若 Peewee 默认 `AutoField` 生成的 DDL 不符合项目规范，改用 `IntegerField(primary_key=True)` 并由业务或序列分配主键。

### 分页 SQL 不兼容

如果 Peewee 生成的分页语法与当前虚谷兼容模式不一致，优先切换连接串兼容模式；仍不满足时，在 `XuguDatabase` 中扩展 SQL 编译逻辑。

### 字段类型需要精细控制

通过模型字段参数指定 `constraints` 或扩展 `field_types`。生产迁移前应导出 DDL 并人工审核。

## 参考文档

- [Peewee 配置参考](references/peewee-configuration.md)
