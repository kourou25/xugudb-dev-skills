# Peewee 配置参考

## 连接参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `database` | 数据库名 | `SYSTEM` |
| `user` | 用户名 | `SYSDBA` |
| `password` | 密码 | `SYSDBA` |
| `host` | 服务地址 | `127.0.0.1` |
| `port` | 服务端口 | `5138` |

## 类型映射建议

| Peewee 类型 | XuguDB 类型 | 说明 |
|-------------|-------------|------|
| `IntegerField` | `INTEGER` | 普通整数 |
| `BigIntegerField` | `BIGINT` | 大整数 |
| `CharField` | `VARCHAR(n)` | 字符串 |
| `TextField` | `CLOB` | 长文本 |
| `DecimalField` | `NUMERIC(p,s)` | 定点数 |
| `DateTimeField` | `DATETIME` | 日期时间 |
| `BlobField` | `BLOB` | 二进制对象 |
| `BooleanField` | `BOOLEAN` | 布尔值 |

## 最小验证脚本

```python
from peewee import CharField, IntegerField, Model
from peewee_xugu import XuguDatabase

db = XuguDatabase(
    "SYSTEM",
    user="SYSDBA",
    password="SYSDBA",
    host="127.0.0.1",
    port=5138,
)


class BaseModel(Model):
    class Meta:
        database = db


class SmokeUser(BaseModel):
    id = IntegerField(primary_key=True)
    name = CharField(max_length=64)

    class Meta:
        table_name = "smoke_user"


with db:
    db.create_tables([SmokeUser])
    SmokeUser.create(id=1, name="ok")
    assert SmokeUser.get(SmokeUser.id == 1).name == "ok"
    SmokeUser.delete().where(SmokeUser.id == 1).execute()
    db.drop_tables([SmokeUser])
```

## 生产落地检查

1. 明确主键策略，避免 ORM 默认自增语法与数据库策略不一致。
2. 确认分页 SQL 在所选兼容模式下可执行。
3. 对模型生成 DDL 做人工审核。
4. 使用参数化查询，不拼接用户输入。
5. 将连接密码放入环境变量或密钥管理系统，不提交到仓库。
