---
name: gorm-xugudb-adapter
description: GORM Go ORM 适配虚谷数据库(XuguDB)的完整指南。当用户需要将基于 GORM 的 Go 项目配置或适配到虚谷数据库时使用此技能，包括驱动安装、方言包配置、连接字符串、模型定义、CRUD 操作、事务处理等。适用于从 MySQL/PostgreSQL 迁移或新建虚谷数据库项目。
---

# GORM 虚谷数据库适配指南

## 概述

本技能提供 GORM 适配虚谷数据库(XuguDB)的完整流程。GORM 是 Go 语言中最受欢迎的 ORM 库之一，通过虚谷数据库专用的方言包 `xggorm`，可以无缝集成 GORM 框架的各种功能，包括数据访问、模型定义、CRUD 操作、事务处理等。

## 适配流程

在开始适配前，按以下顺序检查和修改：

```
1. 依赖安装 → 2. 连接配置 → 3. 模型定义 → 4. 数据库操作 → 5. 高级功能 → 6. 性能优化 → 7. 测试验证
```

## 第一步：安装依赖

### 安装 GORM

```bash
# 安装 GORM 核心包
go get gorm.io/gorm

# 安装 GORM 日志器
go get gorm.io/gorm/logger
```

### 安装虚谷数据库驱动

```bash
# 安装虚谷数据库 Go 驱动
go get gitee.com/XuguDB/go-xugu-driver@latest
```

### 安装 GORM 方言包

```bash
# 安装虚谷数据库 GORM 方言包
go get gitee.com/XuguDB/xggorm@latest
```

## 第二步：配置连接

### 连接字符串格式

虚谷数据库连接字符串格式（分号分隔键值对）：

```
IP=127.0.0.1;DB=SYSTEM;User=SYSDBA;PWD=SYSDBA;Port=5138;CURRENT_SCHEMA=SYSTEM;AUTO_COMMIT=on;CHAR_SET=UTF8
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
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
    _ "gitee.com/XuguDB/go-xugu-driver"
    "xggorm"
)

func main() {
    // 配置连接字符串
    dsn := "IP=127.0.0.1;DB=SYSTEM;User=SYSDBA;PWD=SYSDBA;Port=5138;CURRENT_SCHEMA=SYSTEM;AUTO_COMMIT=on;CHAR_SET=UTF8"
    
    // 创建数据库连接
    db, err := gorm.Open(xggorm.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
    })
    if err != nil {
        fmt.Printf("gorm open fail, err:%v dsn:%v\n", err, dsn)
        return
    }
    
    fmt.Println("open conn success")
    
    // 获取底层 sql.DB 对象
    sqlDB, err := db.DB()
    if err != nil {
        fmt.Printf("get sql.DB fail, err:%v\n", err)
        return
    }
    
    // 配置连接池
    sqlDB.SetMaxOpenConns(10)          // 最大打开连接数
    sqlDB.SetMaxIdleConns(5)           // 最大空闲连接数
    sqlDB.SetConnMaxLifetime(30 * time.Minute)  // 连接最大生存时间
    
    // 测试连接
    err = sqlDB.Ping()
    if err != nil {
        fmt.Printf("ping fail, err:%v\n", err)
        return
    }
    
    fmt.Println("ping success")
}
```

## 第三步：定义模型

### 基本模型定义

```go
package models

import (
    "time"
    "gorm.io/gorm"
)

// User 用户模型
type User struct {
    ID        uint           `gorm:"primaryKey;autoIncrement"`
    Username  string         `gorm:"size:50;not null;uniqueIndex"`
    Email     string         `gorm:"size:100"`
    Age       int            `gorm:"default:0"`
    CreatedAt time.Time      `gorm:"autoCreateTime"`
    UpdatedAt time.Time      `gorm:"autoUpdateTime"`
    DeletedAt gorm.DeletedAt `gorm:"index"`
}

// TableName 设置表名
func (User) TableName() string {
    return "users"
}
```

### 模型标签说明

| 标签 | 说明 | 示例 |
|------|------|------|
| primaryKey | 主键 | `gorm:"primaryKey"` |
| autoIncrement | 自增 | `gorm:"autoIncrement"` |
| size | 字段大小 | `gorm:"size:50"` |
| not null | 非空 | `gorm:"not null"` |
| uniqueIndex | 唯一索引 | `gorm:"uniqueIndex"` |
| index | 索引 | `gorm:"index"` |
| default | 默认值 | `gorm:"default:0"` |
| autoCreateTime | 自动创建时间 | `gorm:"autoCreateTime"` |
| autoUpdateTime | 自动更新时间 | `gorm:"autoUpdateTime"` |
| column | 列名 | `gorm:"column:user_name"` |
| type | 数据类型 | `gorm:"type:varchar(50)"` |

### 关联关系

```go
// Article 文章模型
type Article struct {
    ID       uint   `gorm:"primaryKey"`
    Title    string `gorm:"size:200;not null"`
    Content  string `gorm:"type:text"`
    UserID   uint   `gorm:"index"`
    User     User   `gorm:"foreignKey:UserID"`
    Tags     []Tag  `gorm:"many2many:article_tags;"`
    CreatedAt time.Time
    UpdatedAt time.Time
}

// Tag 标签模型
type Tag struct {
    ID       uint      `gorm:"primaryKey"`
    Name     string    `gorm:"size:50;uniqueIndex"`
    Articles []Article `gorm:"many2many:article_tags;"`
}
```

## 第四步：数据库操作

### 自动迁移

```go
// 自动迁移表结构
err := db.AutoMigrate(&User{}, &Article{}, &Tag{})
if err != nil {
    fmt.Printf("auto migrate fail, err:%v\n", err)
    return
}
```

### CRUD 操作

#### 创建记录

```go
// 创建单个记录
user := User{Username: "jack", Email: "jack@example.com", Age: 18}
result := db.Create(&user)
if result.Error != nil {
    fmt.Printf("create user fail, err:%v\n", result.Error)
    return
}
fmt.Printf("created user id: %d\n", user.ID)

// 批量创建
users := []User{
    {Username: "user1", Email: "user1@example.com", Age: 20},
    {Username: "user2", Email: "user2@example.com", Age: 25},
    {Username: "user3", Email: "user3@example.com", Age: 30},
}
result = db.Create(&users)
if result.Error != nil {
    fmt.Printf("batch create fail, err:%v\n", result.Error)
    return
}
```

#### 查询记录

```go
// 查询单个记录
var user User
result := db.First(&user, 1) // 根据主键查询
if result.Error != nil {
    fmt.Printf("find user fail, err:%v\n", result.Error)
    return
}

// 条件查询
var users []User
result = db.Where("age > ?", 18).Find(&users)
if result.Error != nil {
    fmt.Printf("find users fail, err:%v\n", result.Error)
    return
}

// 查询特定字段
var usernames []string
db.Model(&User{}).Pluck("username", &usernames)

// 分页查询
var pageUsers []User
db.Offset(0).Limit(10).Find(&pageUsers)

// 排序查询
db.Order("age desc").Find(&users)

// 计数
var count int64
db.Model(&User{}).Where("age > ?", 18).Count(&count)
```

#### 更新记录

```go
// 更新单个字段
db.Model(&user).Update("age", 20)

// 更新多个字段
db.Model(&user).Updates(User{Age: 20, Email: "new@example.com"})

// 使用 map 更新
db.Model(&user).Updates(map[string]interface{}{
    "age":   20,
    "email": "new@example.com",
})

// 批量更新
db.Model(&User{}).Where("age < ?", 18).Update("status", "inactive")
```

#### 删除记录

```go
// 删除单个记录
db.Delete(&user, 1)

// 条件删除
db.Where("age < ?", 18).Delete(&User{})

// 软删除（如果模型包含 gorm.DeletedAt 字段）
db.Delete(&user) // 设置 deleted_at 字段

// 物理删除
db.Unscoped().Delete(&user)
```

## 第五步：高级功能

### 事务处理

```go
// 使用事务
err := db.Transaction(func(tx *gorm.DB) error {
    // 在事务中执行操作
    if err := tx.Create(&User{Username: "user1"}).Error; err != nil {
        return err // 回滚事务
    }
    
    if err := tx.Create(&User{Username: "user2"}).Error; err != nil {
        return err // 回滚事务
    }
    
    return nil // 提交事务
})

if err != nil {
    fmt.Printf("transaction fail, err:%v\n", err)
}
```

### 原生 SQL

```go
// 执行原生 SQL
var users []User
db.Raw("SELECT * FROM users WHERE age > ?", 18).Scan(&users)

// 执行原生 SQL 更新
db.Exec("UPDATE users SET age = ? WHERE id = ?", 20, 1)
```

### 预编译语句

```go
// 使用预编译语句
stmt, err := db.DB().Prepare("SELECT * FROM users WHERE age > ?")
if err != nil {
    fmt.Printf("prepare fail, err:%v\n", err)
    return
}
defer stmt.Close()

rows, err := stmt.Query(18)
if err != nil {
    fmt.Printf("query fail, err:%v\n", err)
    return
}
defer rows.Close()
```

### 钩子函数

```go
// BeforeCreate 钩子
func (u *User) BeforeCreate(tx *gorm.DB) error {
    // 在创建记录前执行
    fmt.Println("before create user")
    return nil
}

// AfterCreate 钩子
func (u *User) AfterCreate(tx *gorm.DB) error {
    // 在创建记录后执行
    fmt.Println("after create user")
    return nil
}
```

## 第六步：性能优化

### 批量操作

```go
// 批量插入
var users []User
for i := 0; i < 1000; i++ {
    users = append(users, User{
        Username: fmt.Sprintf("user%d", i),
        Email:    fmt.Sprintf("user%d@example.com", i),
        Age:      20 + i%50,
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
    db.Create(&batch)
}
```

### 索引优化

```go
// 定义索引
type User struct {
    ID       uint   `gorm:"primaryKey"`
    Username string `gorm:"size:50;uniqueIndex:idx_username"`
    Email    string `gorm:"size:100;index:idx_email"`
    Age      int    `gorm:"index:idx_age"`
    Status   string `gorm:"index:idx_status,priority:1"`
}
```

### 查询优化

```go
// 使用 Select 查询特定字段
db.Select("id", "username", "email").Find(&users)

// 使用 Omit 忽略字段
db.Omit("content").Find(&articles)

// 使用 Preload 预加载关联
db.Preload("User").Find(&articles)

// 使用 Joins 连接查询
db.Joins("User").Find(&articles)
```

## 第七步：多数据源配置

### 读写分离

```go
import (
    "gorm.io/gorm"
    "gorm.io/plugin/dbresolver"
)

// 配置读写分离
db.Use(dbresolver.Register(dbresolver.Config{
    Sources:  []gorm.Dialector{xggorm.Open("IP=192.168.1.100;DB=SYSTEM;...")},
    Replicas: []gorm.Dialector{
        xggorm.Open("IP=192.168.1.101;DB=SYSTEM;..."),
        xggorm.Open("IP=192.168.1.102;DB=SYSTEM;..."),
    },
    Policy: dbresolver.RandomPolicy{},
}))
```

### 多数据库连接

```go
// 创建多个数据库连接
db1, _ := gorm.Open(xggorm.Open("IP=192.168.1.100;DB=SYSTEM;..."), &gorm.Config{})
db2, _ := gorm.Open(xggorm.Open("IP=192.168.1.101;DB=SYSTEM;..."), &gorm.Config{})

// 使用不同的数据库连接
db1.Find(&users1)
db2.Find(&users2)
```

## 第八步：测试验证

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
sqlDB, err := db.DB()
if err != nil {
    fmt.Printf("get sql.DB fail, err:%v\n", err)
    return
}

err = sqlDB.Ping()
if err != nil {
    fmt.Printf("ping fail, err:%v\n", err)
    return
}

fmt.Println("database connection success")
```

### 验证 CRUD 操作

```go
// 测试创建
user := User{Username: "test", Email: "test@example.com", Age: 25}
result := db.Create(&user)
if result.Error != nil {
    fmt.Printf("create fail, err:%v\n", result.Error)
    return
}
fmt.Printf("created user id: %d\n", user.ID)

// 测试查询
var foundUser User
db.First(&foundUser, user.ID)
fmt.Printf("found user: %v\n", foundUser)

// 测试更新
db.Model(&foundUser).Update("age", 30)
fmt.Printf("updated user age: %d\n", foundUser.Age)

// 测试删除
db.Delete(&foundUser)
fmt.Printf("deleted user id: %d\n", foundUser.ID)
```

## 常见问题排查

### 1. 模块找不到

**现象：** `NO REQUIRED MODULE PROVIDES PACKAGE GORM.IO/GORM/CALLBACKS`

**解决：** 使用 `go get gorm.io/gorm` 安装 GORM

### 2. 方言包找不到

**现象：** `PACKAGE XGGORM IS NOT IN STD`

**解决：** 将 `xggorm` 目录移动到 Go 的包搜索路径中，或将其添加到 `GOPATH`

### 3. 驱动未导入

**现象：** `UNKNOWN DRIVER "XUGU" (FORGOTTEN IMPORT?)`

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
- [GORM 配置详解](references/gorm-configuration.md)
- [GORM 官方文档](https://gorm.io/zh_CN/docs/)
- [虚谷数据库 GORM 适配文档](https://help.xugudb.com/content/ecosystem/orm/go/gorm)
- [虚谷数据库 Go 驱动文档](https://docs.xugudb.com/content/development/go/go)