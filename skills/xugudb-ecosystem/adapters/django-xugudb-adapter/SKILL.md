---
name: django-xugudb-adapter
description: Django Python Web 框架适配虚谷数据库(XuguDB)的完整指南。当用户需要将基于 Django 的 Python 项目配置或适配到虚谷数据库时使用此技能，包括驱动安装、数据库配置、模型定义、迁移配置、ORM 操作、管理后台等。适用于从 MySQL/PostgreSQL 迁移或新建虚谷数据库项目。
---

# Django 虚谷数据库适配指南

## 概述

本技能提供 Django 适配虚谷数据库(XuguDB)的完整流程。Django 是 Python 生态中最流行的 Web 框架之一，通过虚谷数据库专用的方言包 `xgcondb`，可以无缝集成 Django 框架的各种功能，包括 ORM、迁移、管理后台、REST API 等。

## 适配流程

在开始适配前，按以下顺序检查和修改：

```
1. 依赖安装 → 2. 数据库配置 → 3. 模型定义 → 4. 数据库迁移 → 5. ORM 操作 → 6. 管理后台 → 7. 测试验证
```

## 第一步：安装依赖

### 安装 Django

```bash
# 安装 Django
pip install django

# 验证安装
python -m django --version
```

### 安装虚谷数据库驱动

1. **获取方言包** - 从虚谷数据库官方下载 Django 方言压缩包（`xugu-django`）
2. **解压方言包** - 解压压缩包获取所有 `.py` 文件
3. **放置驱动文件** - 将解压目录内的所有 `.py` 文件复制到虚谷 Python 驱动包内
4. **放置驱动包** - 将包含驱动文件的 Python 驱动包放置到 Django 应用启动文件（如 `manage.py`）的同级目录中

### 验证驱动安装

```python
# 测试驱动导入
import xgcondb
print("xgcondb driver imported successfully")
```

## 第二步：创建 Django 项目

### 创建项目

```bash
# 创建 Django 项目
django-admin startproject myproject

# 进入项目目录
cd myproject

# 创建应用
python manage.py startapp myapp
```

### 项目结构

```
myproject/
├── myproject/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── myapp/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── views.py
│   ├── tests.py
│   └── migrations/
├── manage.py
└── xgcondb/  # 虚谷数据库驱动目录
```

## 第三步：配置数据库

### 基本数据库配置

在 `settings.py` 文件中配置数据库连接：

```python
DATABASES = {
    'default': {
        'ENGINE': 'xgcondb',   # 引擎名称，必须为 `xgcondb`
        'NAME': 'SYSTEM',      # 要连接的数据库名
        'USER': 'SYSDBA',      # 数据库用户名
        'PASSWORD': 'SYSDBA',  # 对应的密码
        'HOST': '127.0.0.1',   # 数据库服务器地址（多个IP用逗号间隔）
        'PORT': 5138,          # 数据库服务端口
    }
}
```

### 配置参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| ENGINE | 数据库引擎，必须为 `xgcondb` | - |
| NAME | 数据库名 | SYSTEM |
| USER | 用户名 | SYSDBA |
| PASSWORD | 密码 | - |
| HOST | 服务器地址（支持多IP，逗号分隔） | 127.0.0.1 |
| PORT | 端口号 | 5138 |

### 高级数据库配置

```python
DATABASES = {
    'default': {
        'ENGINE': 'xgcondb',
        'NAME': 'mydb',
        'USER': 'myuser',
        'PASSWORD': 'mypassword',
        'HOST': '192.168.1.100',
        'PORT': 5138,
        'OPTIONS': {
            'charset': 'UTF8',
            'autocommit': True,
            'timeout': 30,
        },
        'CONN_MAX_AGE': 600,  # 连接最大生存时间（秒）
        'CONN_HEALTH_CHECKS': True,  # 启用连接健康检查
    }
}
```

## 第四步：定义模型

### 基本模型定义

```python
from django.db import models

class User(models.Model):
    username = models.CharField(max_length=50, unique=True, verbose_name='用户名')
    email = models.EmailField(max_length=100, verbose_name='邮箱')
    age = models.IntegerField(default=0, verbose_name='年龄')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    is_active = models.BooleanField(default=True, verbose_name='是否活跃')
    
    class Meta:
        db_table = 'users'  # 指定表名
        verbose_name = '用户'
        verbose_name_plural = '用户'
        ordering = ['-created_at']  # 默认排序
    
    def __str__(self):
        return self.username
```

### 关联关系

```python
# 一对多关系
class Article(models.Model):
    title = models.CharField(max_length=200, verbose_name='标题')
    content = models.TextField(verbose_name='内容')
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='作者')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        db_table = 'articles'
        verbose_name = '文章'
        verbose_name_plural = '文章'

# 多对多关系
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name='标签名')
    articles = models.ManyToManyField(Article, verbose_name='文章')
    
    class Meta:
        db_table = 'tags'
        verbose_name = '标签'
        verbose_name_plural = '标签'

# 一对一关系
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name='用户')
    bio = models.TextField(blank=True, verbose_name='简介')
    avatar = models.ImageField(upload_to='avatars/', blank=True, verbose_name='头像')
    
    class Meta:
        db_table = 'profiles'
        verbose_name = '用户资料'
        verbose_name_plural = '用户资料'
```

## 第五步：数据库迁移

### 创建迁移文件

```bash
# 创建迁移文件
python manage.py makemigrations

# 查看迁移文件
python manage.py showmigrations
```

### 执行迁移

```bash
# 执行迁移
python manage.py migrate

# 执行特定应用的迁移
python manage.py migrate myapp

# 回滚迁移
python manage.py migrate myapp 0001
```

## 第六步：Django ORM 操作

### 创建记录

```python
# 创建单个记录
user = User.objects.create(
    username='john',
    email='john@example.com',
    age=25
)

# 使用 save 方法
user = User(username='jane', email='jane@example.com', age=30)
user.save()

# 批量创建
users = [
    User(username='user1', email='user1@example.com', age=20),
    User(username='user2', email='user2@example.com', age=25),
    User(username='user3', email='user3@example.com', age=30),
]
User.objects.bulk_create(users)
```

### 查询记录

```python
# 查询所有记录
users = User.objects.all()

# 查询单个记录
user = User.objects.get(id=1)
user = User.objects.get(username='john')

# 条件查询
users = User.objects.filter(age__gt=18)
users = User.objects.filter(age__gte=18, is_active=True)
users = User.objects.filter(username__contains='john')
users = User.objects.filter(email__endswith='@example.com')

# 排序查询
users = User.objects.order_by('-created_at')
users = User.objects.order_by('age', '-created_at')

# 分页查询
users = User.objects.all()[:10]  # 前10条
users = User.objects.all()[10:20]  # 第11-30条

# 计数
count = User.objects.count()
count = User.objects.filter(age__gt=18).count()

# 聚合查询
from django.db.models import Avg, Sum, Max, Min
avg_age = User.objects.aggregate(Avg('age'))
total_age = User.objects.aggregate(Sum('age'))
```

### 更新记录

```python
# 更新单个记录
user = User.objects.get(id=1)
user.age = 26
user.save()

# 批量更新
User.objects.filter(is_active=False).update(is_active=True)
User.objects.filter(age__lt=18).update(age=18)

# 使用 F 表达式
from django.db.models import F
User.objects.update(age=F('age') + 1)
```

### 删除记录

```python
# 删除单个记录
user = User.objects.get(id=1)
user.delete()

# 批量删除
User.objects.filter(is_active=False).delete()
User.objects.filter(age__lt=18).delete()

# 清空表
User.objects.all().delete()
```

## 第七步：Django 管理后台

### 注册模型

```python
# myapp/admin.py
from django.contrib import admin
from .models import User, Article, Tag

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'age', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['username', 'email']
    list_per_page = 20

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'created_at']
    list_filter = ['author', 'created_at']
    search_fields = ['title', 'content']

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']
```

### 创建超级用户

```bash
# 创建超级用户
python manage.py createsuperuser

# 按照提示输入用户名、邮箱和密码
```

### 访问管理后台

```bash
# 启动开发服务器
python manage.py runserver

# 访问管理后台
# http://127.0.0.1:8000/admin/
```

## 第八步：Django REST framework（可选）

### 安装 Django REST framework

```bash
pip install djangorestframework
```

### 配置 Django REST framework

```python
# settings.py
INSTALLED_APPS = [
    ...
    'rest_framework',
]

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### 创建序列化器

```python
# myapp/serializers.py
from rest_framework import serializers
from .models import User, Article

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'age', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class ArticleSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Article
        fields = ['id', 'title', 'content', 'author', 'created_at']
        read_only_fields = ['created_at']
```

## 第九步：测试验证

### 运行测试

```bash
# 运行所有测试
python manage.py test

# 运行特定应用的测试
python manage.py test myapp

# 运行特定测试
python manage.py test myapp.tests.UserModelTest
```

### 验证数据库连接

```python
# 验证数据库连接
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT 1")
    result = cursor.fetchone()
    print(f"Database connection test: {result}")
```

## 常见问题排查

### 1. 连接错误

**现象：** 无法连接到虚谷数据库

**解决：**
- 检查 `settings.py` 中的连接参数（HOST, PORT, USER, PASSWORD, NAME）是否正确
- 使用其他数据库客户端工具验证连接信息
- 确保虚谷数据库服务已启动
- 检查网络连接和防火墙设置

### 2. 时区类型错误

**现象：** `AttributeError: 'str' object has no attribute 'utcoffset'`

**解决：** 在 `settings.py` 文件中将 `USE_TZ` 设置为 `False`

```python
USE_TZ = False
```

### 3. 方法参数不匹配错误

**现象：** `TypeError: _alter_column_type_sql() takes 5 positional arguments but 7 were given`

**解决：** 下载并使用与您 Django 版本匹配的方言包

### 4. 迁移失败

**现象：** 数据库迁移失败

**解决：**
- 检查模型定义是否正确
- 检查数据库权限
- 检查 SQL 语法兼容性
- 尝试重置迁移：`python manage.py migrate myapp zero`

### 5. 性能问题

**现象：** 查询响应缓慢

**解决：**
- 创建合适的索引
- 使用 `select_related` 和 `prefetch_related` 优化查询
- 使用分页查询
- 配置数据库连接池

### 6. 字符编码问题

**现象：** 数据显示乱码

**解决：**
- 在数据库配置中添加 `charset: 'UTF8'`
- 检查数据库字符集配置
- 确保 Django 项目字符编码设置正确

## 参考文档

详细的配置和使用说明请参考：
- [Django 配置详解](references/django-configuration.md)
- [Django 官方文档](https://docs.djangoproject.com/)
- [虚谷数据库 Django 适配文档](https://docs.xugudb.com/content/ecosystem/orm/python/django)
- [虚谷数据库 Python 驱动文档](https://docs.xugudb.com/content/development/python/python)