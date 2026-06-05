# SQLAlchemy 虚谷数据库配置指南

## 概述

本文档提供 SQLAlchemy 适配虚谷数据库(XuguDB)的完整配置流程。SQLAlchemy 是一个功能强大的 Python ORM 库，通过虚谷数据库专用的方言包 `xugu-sqlalchemy`，可以无缝集成 SQLAlchemy 框架的各种功能，包括模型定义、CRUD 操作、事务处理、关联关系等。

## 前置条件

1. 已安装 Python 环境（推荐 Python 3.6 或更高版本）
2. 已部署虚谷数据库 v12.0.0 或更高版本
3. 已获取虚谷数据库 Python 驱动和 SQLAlchemy 方言包

## 第一步：安装依赖

### 安装 SQLAlchemy

```bash
# 安装 SQLAlchemy
pip install sqlalchemy

# 或者使用 pip3
pip3 install sqlalchemy
```

### 安装虚谷数据库驱动

1. **下载方言包** - 从虚谷数据库官方下载 SQLAlchemy 方言压缩包
2. **解压方言包** - 解压压缩包获取 `xg` 目录
3. **放置方言文件** - 将 `xg` 目录放置在 Python 项目根目录下
4. **注册方言** - 在 Python 程序入口处注册方言

### 验证驱动安装

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 测试连接
try:
    with engine.connect() as connection:
        print("Database connection established successfully!")
except Exception as e:
    print(f"Failed to connect to database: {e}")
```

## 第二步：配置连接

### 连接字符串格式

虚谷数据库连接字符串格式：

```
xg://用户名:密码@IP地址:端口/数据库名
```

### 连接参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| 用户名 | 数据库用户名 | SYSDBA |
| 密码 | 数据库密码 | - |
| IP地址 | 服务器地址 | 127.0.0.1 |
| 端口 | 端口号 | 5138 |
| 数据库名 | 数据库名 | SYSTEM |

### 基本连接配置

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 创建会话工厂
Session = sessionmaker(bind=engine)

# 创建基类
Base = declarative_base()
```

### 连接池配置

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接（带连接池配置）
engine = create_engine(
    'xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM',
    poolclass=QueuePool,
    pool_size=20,          # 连接池大小
    max_overflow=10,       # 超出连接池大小的额外连接数
    pool_timeout=30,       # 获取连接超时时间（秒）
    pool_recycle=1800,     # 连接回收时间（秒）
    pool_pre_ping=True     # 连接前检查
)

# 创建会话工厂
Session = sessionmaker(bind=engine)

# 创建基类
Base = declarative_base()
```

## 第三步：定义模型

### 基本模型定义

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 创建基类
Base = declarative_base()

# 定义用户模型
class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    age = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"
```

### 字段类型说明

| 字段类型 | 说明 | 示例 |
|----------|------|------|
| Integer | 整数 | `Column(Integer)` |
| BigInteger | 大整数 | `Column(BigInteger)` |
| String | 字符串 | `Column(String(100))` |
| Text | 文本 | `Column(Text)` |
| Float | 浮点数 | `Column(Float)` |
| Numeric | 数值 | `Column(Numeric(10, 2))` |
| Boolean | 布尔值 | `Column(Boolean)` |
| Date | 日期 | `Column(Date)` |
| DateTime | 日期时间 | `Column(DateTime)` |
| Time | 时间 | `Column(Time)` |
| UUID | UUID | `Column(UUID)` |
| LargeBinary | 二进制大对象 | `Column(LargeBinary)` |
| JSON | JSON | `Column(JSON)` |

### 关联关系

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from datetime import datetime

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 创建基类
Base = declarative_base()

# 定义用户模型
class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    age = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)
    
    # 定义关联关系
    articles = relationship("Article", back_populates="author")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"

# 定义文章模型
class Article(Base):
    __tablename__ = 'articles'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    content = Column(String(1000))
    user_id = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.now)
    
    # 定义关联关系
    author = relationship("User", back_populates="articles")
    tags = relationship("Tag", secondary="article_tags", back_populates="articles")
    
    def __repr__(self):
        return f"<Article(id={self.id}, title='{self.title}')>"

# 定义标签模型
class Tag(Base):
    __tablename__ = 'tags'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    
    # 定义关联关系
    articles = relationship("Article", secondary="article_tags", back_populates="tags")
    
    def __repr__(self):
        return f"<Tag(id={self.id}, name='{self.name}')>"

# 定义文章标签关联表
article_tags = Table('article_tags', Base.metadata,
    Column('article_id', Integer, ForeignKey('articles.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)
```

## 第四步：数据库迁移

### 创建表

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 创建基类
Base = declarative_base()

# 定义模型（略）

# 创建所有表
Base.metadata.create_all(engine)
```

### 使用迁移工具

```python
# 安装迁移工具
# pip install alembic

# 初始化迁移
# alembic init alembic

# 生成迁移脚本
# alembic revision --autogenerate -m "create_users_table"

# 执行迁移
# alembic upgrade head

# 回滚迁移
# alembic downgrade -1
```

## 第五步：CRUD 操作

### 创建记录

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 创建会话工厂
Session = sessionmaker(bind=engine)

# 创建基类
Base = declarative_base()

# 定义用户模型
class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    age = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)

# 创建表
Base.metadata.create_all(engine)

# 创建会话
session = Session()

# 创建单个记录
new_user = User(username='john', email='john@example.com', age=25)
session.add(new_user)
session.commit()
print(f"Created user ID: {new_user.id}")

# 批量创建
users_data = [
    User(username='user1', email='user1@example.com', age=20),
    User(username='user2', email='user2@example.com', age=25),
    User(username='user3', email='user3@example.com', age=30),
]
session.add_all(users_data)
session.commit()
print("Created users successfully")

# 关闭会话
session.close()
```

### 查询记录

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 创建会话工厂
Session = sessionmaker(bind=engine)

# 创建会话
session = Session()

# 查询所有记录
users = session.query(User).all()
for user in users:
    print(f"User: {user.username}, Age: {user.age}")

# 查询单个记录
user = session.query(User).filter_by(id=1).first()
if user:
    print(f"Found user: {user.username}")

# 条件查询
users = session.query(User).filter(User.age > 18).all()
for user in users:
    print(f"User: {user.username}, Age: {user.age}")

# 查询特定字段
users = session.query(User.username, User.email).all()
for user in users:
    print(f"Username: {user.username}, Email: {user.email}")

# 分页查询
users = session.query(User).limit(10).offset(0).all()
for user in users:
    print(f"User: {user.username}")

# 排序查询
users = session.query(User).order_by(User.age.desc()).all()
for user in users:
    print(f"User: {user.username}, Age: {user.age}")

# 计数
count = session.query(User).filter(User.age > 18).count()
print(f"Found {count} users")

# 关闭会话
session.close()
```

### 更新记录

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 创建会话工厂
Session = sessionmaker(bind=engine)

# 创建会话
session = Session()

# 更新单个记录
user = session.query(User).filter_by(id=1).first()
if user:
    user.age = 30
    session.commit()
    print(f"Updated user: {user.username}, Age: {user.age}")

# 批量更新
session.query(User).filter(User.age < 18).update({User.is_active: False})
session.commit()
print("Updated users successfully")

# 关闭会话
session.close()
```

### 删除记录

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 创建会话工厂
Session = sessionmaker(bind=engine)

# 创建会话
session = Session()

# 删除单个记录
user = session.query(User).filter_by(id=1).first()
if user:
    session.delete(user)
    session.commit()
    print(f"Deleted user: {user.username}")

# 批量删除
session.query(User).filter(User.age < 18).delete()
session.commit()
print("Deleted users successfully")

# 关闭会话
session.close()
```

## 第六步：高级功能

### 事务处理

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 创建会话工厂
Session = sessionmaker(bind=engine)

# 创建会话
session = Session()

# 使用事务
try:
    # 在事务中执行操作
    new_user1 = User(username='user1', email='user1@example.com', age=20)
    new_user2 = User(username='user2', email='user2@example.com', age=25)
    
    session.add(new_user1)
    session.add(new_user2)
    
    # 提交事务
    session.commit()
    print("Transaction committed successfully")
except Exception as e:
    # 回滚事务
    session.rollback()
    print(f"Transaction failed: {e}")
finally:
    # 关闭会话
    session.close()
```

### 原生 SQL

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine, text

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 执行原生 SQL 查询
with engine.connect() as connection:
    result = connection.execute(text('SELECT * FROM users WHERE age > :age'), {'age': 18})
    for row in result:
        print(f"User: {row.username}, Age: {row.age}")

# 执行原生 SQL 更新
with engine.connect() as connection:
    connection.execute(text('UPDATE users SET age = :age WHERE id = :id'), {'age': 30, 'id': 1})
    connection.commit()
    print("Updated user successfully")
```

### 关联查询

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, joinedload

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 创建会话工厂
Session = sessionmaker(bind=engine)

# 创建会话
session = Session()

# 使用 joinedload 预加载关联查询
users = session.query(User).options(joinedload(User.articles)).all()
for user in users:
    print(f"User: {user.username}")
    for article in user.articles:
        print(f"  Article: {article.title}")

# 关闭会话
session.close()
```

## 第七步：性能优化

### 批量操作

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 创建会话工厂
Session = sessionmaker(bind=engine)

# 创建会话
session = Session()

# 批量插入
users_data = []
for i in range(1000):
    users_data.append(User(
        username=f'user{i}',
        email=f'user{i}@example.com',
        age=20 + (i % 50),
    ))

# 分批插入，每批 100 条
batch_size = 100
for i in range(0, len(users_data), batch_size):
    batch = users_data[i:i + batch_size]
    session.add_all(batch)
    session.flush()

session.commit()
print("Bulk insert completed")

# 关闭会话
session.close()
```

### 查询优化

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, joinedload, load_only

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 创建会话工厂
Session = sessionmaker(bind=engine)

# 创建会话
session = Session()

# 使用特定字段
users = session.query(User).options(load_only(User.id, User.username, User.email)).all()
for user in users:
    print(f"Username: {user.username}, Email: {user.email}")

# 使用关联查询优化
users = session.query(User).options(joinedload(User.articles)).limit(10).all()
for user in users:
    print(f"User: {user.username}")
    for article in user.articles:
        print(f"  Article: {article.title}")

# 关闭会话
session.close()
```

## 第八步：测试验证

### 运行测试

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import unittest

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 创建基类
Base = declarative_base()

# 定义用户模型
class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    age = Column(Integer, default=0)

# 创建表
Base.metadata.create_all(engine)

# 创建会话工厂
Session = sessionmaker(bind=engine)

class TestUserModel(unittest.TestCase):
    def setUp(self):
        self.session = Session()
    
    def tearDown(self):
        self.session.rollback()
        self.session.close()
    
    def test_create_user(self):
        user = User(username='testuser', email='test@example.com', age=25)
        self.session.add(user)
        self.session.commit()
        
        self.assertIsNotNone(user.id)
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.age, 25)
    
    def test_find_user_by_id(self):
        user = User(username='testuser', email='test@example.com', age=25)
        self.session.add(user)
        self.session.commit()
        
        found_user = self.session.query(User).filter_by(id=user.id).first()
        self.assertIsNotNone(found_user)
        self.assertEqual(found_user.username, 'testuser')
    
    def test_update_user(self):
        user = User(username='testuser', email='test@example.com', age=25)
        self.session.add(user)
        self.session.commit()
        
        user.age = 30
        self.session.commit()
        
        updated_user = self.session.query(User).filter_by(id=user.id).first()
        self.assertEqual(updated_user.age, 30)
    
    def test_delete_user(self):
        user = User(username='testuser', email='test@example.com', age=25)
        self.session.add(user)
        self.session.commit()
        
        self.session.delete(user)
        self.session.commit()
        
        deleted_user = self.session.query(User).filter_by(id=user.id).first()
        self.assertIsNone(deleted_user)

if __name__ == '__main__':
    unittest.main()
```

### 验证数据库连接

```python
import xg
import xg.xgPython
from sqlalchemy.dialects import registry
from sqlalchemy import create_engine, text

# 注册方言
registry.register("xg", "xg.xgPython", "dialect")

# 创建数据库连接
engine = create_engine('xg://SYSDBA:SYSDBA@127.0.0.1:5138/SYSTEM')

# 验证数据库连接
try:
    with engine.connect() as connection:
        print("Database connection established successfully!")
        
        # 验证表结构
        result = connection.execute(text('DESCRIBE users'))
        columns = result.fetchall()
        print("Table structure:")
        for column in columns:
            print(f"  {column}")
        
except Exception as e:
    print(f"Failed to connect to database: {e}")
```

## 常见问题排查

### 1. 方言包找不到

**现象：** `ModuleNotFoundError: No module named 'xg'`

**解决：** 确保 `xg` 目录已正确放置在 Python 项目根目录下

### 2. 连接错误

**现象：** 无法连接到虚谷数据库

**解决：**
- 检查连接字符串中的主机、端口、用户名、密码、库名是否正确
- 确保虚谷数据库服务已启动
- 检查网络连接和防火墙设置
- 建议先用其他数据库客户端（如 XGConsole）测试连接信息

### 3. 表不存在错误

**现象：** 提示目标表不存在

**解决：**
- 确认是否已执行 `Base.metadata.create_all(engine)` 来创建表
- 检查当前连接的数据库用户是否有访问该表的权限
- 如果数据库有模式（Schema）概念，请确认模型中是否正确指定了 `__table_args__ = {'schema': '模式名'}`

### 4. 迁移失败

**现象：** 数据库迁移失败

**解决：**
- 检查迁移文件中的 SQL 语法是否正确
- 检查数据库权限
- 检查表名是否已存在
- 尝试回滚迁移后重新执行

### 5. 性能问题

**现象：** 查询响应缓慢

**解决：**
- 创建合适的索引
- 使用 `load_only` 限制查询字段
- 使用 `joinedload` 优化关联查询
- 使用分页查询
- 配置连接池参数

### 6. N+1 查询问题

**现象：** 关联查询产生大量 SQL 查询

**解决：** 使用 `joinedload` 和 `subqueryload` 方法优化查询，并可使用日志功能查看实际执行的 SQL

## 最佳实践

### 1. 模型设计
- 使用有意义的表名和字段名
- 合理使用索引
- 避免过度关联
- 使用软删除

### 2. 连接管理
- 使用环境变量管理敏感信息
- 配置连接池参数
- 启用连接健康检查
- 使用连接超时设置

### 3. 查询优化
- 使用 `load_only` 限制查询字段
- 使用 `joinedload` 优化关联查询
- 使用分页查询
- 避免 N+1 查询问题

### 4. 事务处理
- 使用事务保证数据一致性
- 避免长事务
- 合理设置事务隔离级别
- 使用事务超时设置

### 5. 错误处理
- 检查所有数据库操作的错误
- 记录错误日志
- 使用事务回滚
- 实现重试机制

## 参考资料

- [SQLAlchemy 官方文档](https://docs.sqlalchemy.org/)
- [SQLAlchemy 中文文档](https://docs.sqlalchemy.org.cn/)
- [虚谷数据库 SQLAlchemy 适配文档](https://docs.xugudb.com/content/ecosystem/orm/python/sqlalchemy)
- [虚谷数据库 Python 驱动文档](https://help.xugudb.com/content/development/python)