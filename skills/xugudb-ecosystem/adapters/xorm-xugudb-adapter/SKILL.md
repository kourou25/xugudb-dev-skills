---
name: xorm-xugudb-adapter
description: XORM Go ORM 适配虚谷数据库(XuguDB)的完整指南。当用户需要将基于 XORM 的 Go 项目配置或适配到虚谷数据库时使用此技能，包括驱动安装、方言包配置、连接字符串、模型定义、CRUD 操作、事务处理等。适用于从 MySQL/PostgreSQL 迁移或新建虚谷数据库项目。
---

# XORM 虚谷数据库适配指南

## 概述

本技能提供 XORM 适配虚谷数据库(XuguDB)的完整流程。XORM 是一个简单而强大的 Go 语言 ORM 框架，通过虚谷数据库专用的方言包 `xugu.go`，可以无缝集成 XORM 框架的各种功能，包括模型定义、CRUD 操作、事务处理、关联关系等。

## 适配流程

在开始适配前，按以下顺序检查和修改：

```
1. 依赖安装 → 2. 连接配置 → 3. 模型定义 → 4. 数据库操作 → 5. 高级功能 → 6. 性能优化 → 7. 测试验证
```

## 第一步：安装依赖

### 安装 XORM

```bash
# 安装 XORM 框架
go get xorm.io/xorm

# 安装 XORM 命令行工具（可选）
go get xorm.io/xorm/cmd/xorm
```

### 安装虚谷数据库驱动

```bash
# 安装虚谷数据库 Go 驱动
go get gitee.com/XuguDB/go-xugu-driver@latest
```

### 安装 XORM 方言包

1. **下载方言包** - 从虚谷数据库官方下载 XORM 方言压缩包
2. **解压方言包** - 解压压缩包获取 `xugu.go` 文件
3. **放置方言文件** - 将 `xugu.go` 文件放置到 XORM 框架的 `dialects` 目录中
   - 典型路径：`$GOPATH/pkg/mod/xorm.io/xorm@v1.3.1/dialects`
   - 或者 Go Modules 路径：`~/go/pkg/mod/xorm.io/xorm@v1.3.1/dialects`

### 验证驱动安装

```go
package main

import (
    "fmt"
    _ "gitee.com/XuguDB/go-xugu-driver"
    "xorm.io/xorm"
)

func main() {
    // 创建数据库连接
    engine, err := xorm.NewEngine("xugu", "IP=127.0.0.1;DB=SYSTEM;User=SYSDBA;PWD=SYSDBA;Port=5138;char_set=utf8;")
    if err != nil {
        fmt.Printf("Failed to connect to database: %v\n", err)
        return
    }
    defer engine.Close()

    // 测试连接
    err = engine.Ping()
    if err != nil {
        fmt.Printf("Failed to ping database: %v\n", err)
        return
    }

    fmt.Println("Database connection established successfully!")
}
```

## 第二步：配置连接

### 连接字符串格式

虚谷数据库连接字符串格式（分号分隔键值对）：

```
IP=127.0.0.1;DB=SYSTEM;User=SYSDBA;PWD=SYSDBA;Port=5138;char_set=utf8;
```

### 连接参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| IP | 服务器 IP 地址 | 127.0.0.1 |
| IPS | 多 IP 负载均衡（逗号分隔） | - |
| PORT | 端口号 | 5138 |
| DB/DBNAME | 数据库名 | SYSTEM |
| USER/User | 用户名 | SYSDBA |
| PASSWORD/PWD | 密码 | - |
| CHAR_SET | 字符集（GBK/UTF8） | GBK |
| CURRENT_SCHEMA | 当前模式名 | - |
| AUTO_COMMIT | 自动提交（on/off） | on |
| USESSL | 是否启用 SSL（TRUE/FALSE） | FALSE |
| CONNECT_TIMEOUT | 连接超时时间（秒） | 30 |

### 基本连接配置

```go
package main

import (
    "fmt"
    "time"
    _ "gitee.com/XuguDB/go-xugu-driver"
    "xorm.io/xorm"
    "xorm.io/xorm/log"
)

func main() {
    // 配置连接字符串
    dataSourceName := "IP=127.0.0.1;DB=SYSTEM;User=SYSDBA;PWD=SYSDBA;Port=5138;char_set=utf8;"
    
    // 创建数据库连接
    engine, err := xorm.NewEngine("xugu", dataSourceName)
    if err != nil {
        fmt.Printf("Failed to connect to database: %v\n", err)
        return
    }
    defer engine.Close()

    // 配置连接池
    engine.SetMaxOpenConns(20)          // 最大打开连接数
    engine.SetMaxIdleConns(5)           // 最大空闲连接数
    engine.SetConnMaxLifetime(30 * time.Minute)  // 连接最大生存时间

    // 配置日志
    engine.SetLogLevel(log.LOG_DEBUG)
    engine.ShowSQL(true)

    // 测试连接
    err = engine.Ping()
    if err != nil {
        fmt.Printf("Failed to ping database: %v\n", err)
        return
    }

    fmt.Println("Database connection established successfully!")
}
```

### 连接池配置

| 方法 | 说明 | 默认值 |
|------|------|--------|
| SetMaxOpenConns | 设置最大打开连接数 | 0（无限制） |
| SetMaxIdleConns | 设置最大空闲连接数 | 2 |
| SetConnMaxLifetime | 设置连接最大生存时间 | 0（无限制） |

## 第三步：定义模型

### 基本模型定义

```go
package models

import (
    "time"
)

// User 用户模型
type User struct {
    Id      int64     `xorm:"pk autoincr"`
    Name    string    `xorm:"varchar(100) notnull"`
    Email   string    `xorm:"varchar(100) unique"`
    Age     int       `xorm:"int default(0)"`
    Status  string    `xorm:"varchar(20) default('active')"`
    Created time.Time `xorm:"created"`
    Updated time.Time `xorm:"updated"`
    Deleted time.Time `xorm:"deleted"`
}

// TableName 设置表名
func (User) TableName() string {
    return "users"
}
```

### 模型标签说明

| 标签 | 说明 | 示例 |
|------|------|------|
| pk | 主键 | `xorm:"pk"` |
| autoincr | 自增 | `xorm:"autoincr"` |
| varchar | 字符串类型 | `xorm:"varchar(100)"` |
| int | 整数类型 | `xorm:"int"` |
| notnull | 非空 | `xorm:"notnull"` |
| unique | 唯一 | `xorm:"unique"` |
| default | 默认值 | `xorm:"default(0)"` |
| created | 创建时间 | `xorm:"created"` |
| updated | 更新时间 | `xorm:"updated"` |
| deleted | 删除时间（软删除） | `xorm:"deleted"` |
| column | 列名 | `xorm:"column(user_name)"` |
| type | 数据类型 | `xorm:"type(text)"` |

### 关联关系

```go
package models

import (
    "time"
)

// Article 文章模型
type Article struct {
    Id        int64     `xorm:"pk autoincr"`
    Title     string    `xorm:"varchar(200) notnull"`
    Content   string    `xorm:"text"`
    UserId    int64     `xorm:"index"`
    User      User      `xorm:"rel(fk)"`
    Created   time.Time `xorm:"created"`
    Updated   time.Time `xorm:"updated"`
}

// TableName 设置表名
func (Article) TableName() string {
    return "articles"
}

// Tag 标签模型
type Tag struct {
    Id   int64  `xorm:"pk autoincr"`
    Name string `xorm:"varchar(50) unique"`
}

// TableName 设置表名
func (Tag) TableName() string {
    return "tags"
}

// ArticleTag 文章标签关联模型
type ArticleTag struct {
    Id        int64 `xorm:"pk autoincr"`
    ArticleId int64 `xorm:"index"`
    TagId     int64 `xorm:"index"`
}

// TableName 设置表名
func (ArticleTag) TableName() string {
    return "article_tags"
}
```

## 第四步：数据库操作

### 自动迁移

```go
// 同步表结构
err := engine.Sync2(new(User), new(Article), new(Tag), new(ArticleTag))
if err != nil {
    fmt.Printf("Failed to sync database: %v\n", err)
    return
}
```

### CRUD 操作

#### 创建记录

```go
// 创建单个记录
user := User{
    Name:  "张三",
    Email: "zhangsan@example.com",
    Age:   25,
}
affected, err := engine.Insert(&user)
if err != nil {
    fmt.Printf("Failed to insert user: %v\n", err)
    return
}
fmt.Printf("Inserted user ID: %d, affected rows: %d\n", user.Id, affected)

// 批量创建
users := []User{
    {Name: "user1", Email: "user1@example.com", Age: 20},
    {Name: "user2", Email: "user2@example.com", Age: 25},
    {Name: "user3", Email: "user3@example.com", Age: 30},
}
affected, err = engine.Insert(&users)
if err != nil {
    fmt.Printf("Failed to insert users: %v\n", err)
    return
}
fmt.Printf("Inserted %d users\n", affected)
```

#### 查询记录

```go
// 查询单个记录
var user User
has, err := engine.ID(1).Get(&user)
if err != nil {
    fmt.Printf("Failed to get user: %v\n", err)
    return
}
if has {
    fmt.Printf("Found user: %+v\n", user)
} else {
    fmt.Println("User not found")
}

// 条件查询
var users []User
err = engine.Where("age > ?", 18).Find(&users)
if err != nil {
    fmt.Printf("Failed to find users: %v\n", err)
    return
}
fmt.Printf("Found %d users\n", len(users))

// 查询特定字段
var names []string
err = engine.Table("users").Cols("name").Find(&names)
if err != nil {
    fmt.Printf("Failed to find names: %v\n", err)
    return
}

// 分页查询
var pageUsers []User
err = engine.Limit(10, 0).Find(&pageUsers)
if err != nil {
    fmt.Printf("Failed to find users: %v\n", err)
    return
}

// 排序查询
err = engine.OrderBy("age desc").Find(&users)
if err != nil {
    fmt.Printf("Failed to find users: %v\n", err)
    return
}

// 计数
count, err := engine.Where("age > ?", 18).Count(&User{})
if err != nil {
    fmt.Printf("Failed to count users: %v\n", err)
    return
}
fmt.Printf("Found %d users\n", count)
```

#### 更新记录

```go
// 更新单个字段
affected, err := engine.ID(1).Update(&User{Age: 30})
if err != nil {
    fmt.Printf("Failed to update user: %v\n", err)
    return
}
fmt.Printf("Updated %d users\n", affected)

// 更新多个字段
affected, err = engine.ID(1).Update(map[string]interface{}{
    "name": "李四",
    "age":  35,
})
if err != nil {
    fmt.Printf("Failed to update user: %v\n", err)
    return
}

// 批量更新
affected, err = engine.Where("age < ?", 18).Update(&User{Status: "inactive"})
if err != nil {
    fmt.Printf("Failed to update users: %v\n", err)
    return
}
```

#### 删除记录

```go
// 删除单个记录
affected, err := engine.ID(1).Delete(&User{})
if err != nil {
    fmt.Printf("Failed to delete user: %v\n", err)
    return
}
fmt.Printf("Deleted %d users\n", affected)

// 条件删除
affected, err = engine.Where("age < ?", 18).Delete(&User{})
if err != nil {
    fmt.Printf("Failed to delete users: %v\n", err)
    return
}

// 软删除（如果模型包含 deleted 字段）
affected, err = engine.ID(1).Delete(&User{})
if err != nil {
    fmt.Printf("Failed to delete user: %v\n", err)
    return
}
```

## 第五步：高级功能

### 事务处理

```go
// 使用事务
session := engine.NewSession()
defer session.Close()

// 开始事务
err := session.Begin()
if err != nil {
    fmt.Printf("Failed to begin transaction: %v\n", err)
    return
}

// 在事务中执行操作
_, err = session.Insert(&User{Name: "user1"})
if err != nil {
    session.Rollback()
    fmt.Printf("Failed to insert user: %v\n", err)
    return
}

_, err = session.Insert(&User{Name: "user2"})
if err != nil {
    session.Rollback()
    fmt.Printf("Failed to insert user: %v\n", err)
    return
}

// 提交事务
err = session.Commit()
if err != nil {
    fmt.Printf("Failed to commit transaction: %v\n", err)
    return
}

fmt.Println("Transaction committed successfully")
```

### 原生 SQL

```go
// 执行原生 SQL 查询
var users []User
err := engine.SQL("SELECT * FROM users WHERE age > ?", 18).Find(&users)
if err != nil {
    fmt.Printf("Failed to execute SQL: %v\n", err)
    return
}

// 执行原生 SQL 更新
result, err := engine.Exec("UPDATE users SET age = ? WHERE id = ?", 30, 1)
if err != nil {
    fmt.Printf("Failed to execute SQL: %v\n", err)
    return
}
affected, _ := result.RowsAffected()
fmt.Printf("Updated %d rows\n", affected)
```

### 预编译语句

```go
// 使用预编译语句
stmt, err := engine.Prepare("SELECT * FROM users WHERE age > ?")
if err != nil {
    fmt.Printf("Failed to prepare statement: %v\n", err)
    return
}
defer stmt.Close()

rows, err := stmt.Query(18)
if err != nil {
    fmt.Printf("Failed to execute statement: %v\n", err)
    return
}
defer rows.Close()
```

## 第六步：性能优化

### 批量操作

```go
// 批量插入
var users []User
for i := 0; i < 1000; i++ {
    users = append(users, User{
        Name: fmt.Sprintf("user%d", i),
        Email: fmt.Sprintf("user%d@example.com", i),
        Age: 20 + i%50,
    })
}

// 分批插入，每批 100 条
batchSize := 100
for i := 0; i < len(users); i += batchSize {
    end := i + batchSize
    if end > len(users) {
        end = len(users)
    }
    batch := users[i:end]
    _, err := engine.Insert(&batch)
    if err != nil {
        fmt.Printf("Failed to insert batch: %v\n", err)
        return
    }
}
```

### 索引优化

```go
// 定义索引
type User struct {
    Id      int64     `xorm:"pk autoincr"`
    Name    string    `xorm:"varchar(100) notnull index"`
    Email   string    `xorm:"varchar(100) unique"`
    Age     int       `xorm:"int index"`
    Status  string    `xorm:"varchar(20) index"`
    Created time.Time `xorm:"created"`
    Updated time.Time `xorm:"updated"`
}
```

### 查询优化

```go
// 使用 Cols 查询特定字段
var users []User
err := engine.Cols("id", "name", "email").Find(&users)
if err != nil {
    fmt.Printf("Failed to find users: %v\n", err)
    return
}

// 使用 Omit 忽略字段
err = engine.Omit("content").Find(&articles)
if err != nil {
    fmt.Printf("Failed to find articles: %v\n", err)
    return
}

// 使用 Join 连接查询
var results []UserArticle
err = engine.Table("users").Join("INNER", "articles", "users.id = articles.user_id").Find(&results)
if err != nil {
    fmt.Printf("Failed to find results: %v\n", err)
    return
}
```

## 第七步：测试验证

### 编译运行

```bash
# 编译项目
go build -o app .

# 运行项目
./app
```

### 验证数据库连接

```go
// 测试连接
err := engine.Ping()
if err != nil {
    fmt.Printf("Failed to ping database: %v\n", err)
    return
}

fmt.Println("Database connection success")
```

### 验证 CRUD 操作

```go
// 测试创建
user := User{Name: "test", Email: "test@example.com", Age: 25}
affected, err := engine.Insert(&user)
if err != nil {
    fmt.Printf("Failed to insert user: %v\n", err)
    return
}
fmt.Printf("Inserted user ID: %d, affected rows: %d\n", user.Id, affected)

// 测试查询
var foundUser User
has, err := engine.ID(user.Id).Get(&foundUser)
if err != nil {
    fmt.Printf("Failed to get user: %v\n", err)
    return
}
if has {
    fmt.Printf("Found user: %+v\n", foundUser)
}

// 测试更新
affected, err = engine.ID(user.Id).Update(&User{Age: 30})
if err != nil {
    fmt.Printf("Failed to update user: %v\n", err)
    return
}
fmt.Printf("Updated %d users\n", affected)

// 测试删除
affected, err = engine.ID(user.Id).Delete(&User{})
if err != nil {
    fmt.Printf("Failed to delete user: %v\n", err)
    return
}
fmt.Printf("Deleted %d users\n", affected)
```

## 常见问题排查

### 1. 方言包找不到

**现象：** `Unsupported driver name: xugu`

**解决：** 确保 `xugu.go` 文件已正确放置到 XORM 的 `dialects` 目录下

### 2. 引擎名称错误

**现象：** `Unsupported driver name: xugusql`

**解决：** 使用正确的引擎名称 `"xugu"`（全小写）

### 3. 驱动未导入

**现象：** `unknown driver "xugu" (forgotten import?)`

**解决：** 确保已正确安装驱动并在代码中使用匿名导入 `_ "gitee.com/XuguDB/go-xugu-driver"`

### 4. 连接失败

**现象：** 无法连接到虚谷数据库

**解决：**
- 检查虚谷数据库服务是否启动
- 检查连接字符串参数是否正确
- 检查用户名和密码是否正确
- 检查网络连接和防火墙设置

### 5. 迁移失败

**现象：** 自动迁移失败

**解决：**
- 检查模型定义是否正确
- 检查数据库权限
- 检查 SQL 语法兼容性

### 6. 性能问题

**现象：** 查询响应缓慢

**解决：**
- 创建合适的索引
- 使用批量操作
- 优化查询语句
- 配置连接池

## 参考文档

详细的配置和使用说明请参考：
- [XORM 配置详解](references/xorm-configuration.md)
- [XORM 官方文档](https://xorm.io/zh/docs/)
- [虚谷数据库 XORM 适配文档](https://help.xugudb.com/content/ecosystem/orm/go/xorm)
- [虚谷数据库 Go 驱动文档](https://docs.xugudb.com/content/development/go/go)