---
name: efcore-xugudb-adapter
description: Entity Framework Core (EF Core) 适配虚谷数据库(XuguDB)的完整指南。当用户需要将基于 EF Core 的 .NET 项目配置或适配到虚谷数据库时使用此技能，包括 NuGet 包安装、DbContext 配置、连接字符串、迁移配置等。适用于从 SQL Server/MySQL 迁移或新建虚谷数据库项目。
---

# Entity Framework Core 虚谷数据库适配指南

## 概述

本技能提供 Entity Framework Core (EF Core) 适配虚谷数据库(XuguDB)的完整流程。虚谷数据库通过提供专用的 EF Core 提供程序，可以无缝集成 EF Core 框架的各种功能，包括数据访问、迁移、查询优化等。

## 适配流程

在开始适配前，按以下顺序检查和修改：

```
1. NuGet 包安装 → 2. DbContext 配置 → 3. 实体配置 → 4. 迁移配置 → 5. 查询优化 → 6. 测试验证
```

## 第一步：安装 NuGet 包

### 虚谷数据库提供程序

```bash
# 安装虚谷数据库 EF Core 提供程序
dotnet add package Xugu.EntityFrameworkCore --version 1.0.0

# 或使用 Package Manager Console
Install-Package Xugu.EntityFrameworkCore -Version 1.0.0
```

### EF Core 核心包

```bash
# 安装 EF Core 核心包
dotnet add package Microsoft.EntityFrameworkCore --version 8.0.0

# 安装 EF Core 设计时包
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.0

# 安装 EF Core 工具
dotnet add package Microsoft.EntityFrameworkCore.Tools --version 8.0.0
```

## 第二步：配置 DbContext

### 基本配置

```csharp
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Order> Orders { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseXugu(
                "Server=127.0.0.1;Port=5138;Database=SYSTEM;Uid=SYSDBA;Pwd=SYSDBA;current_schema=RY;CHAR_SET=UTF8;COMPATIBLE_MODE=MYSQL"
            );
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 配置实体映射
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("USERS");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.Username).HasColumnName("USERNAME");
            entity.Property(e => e.Email).HasColumnName("EMAIL");
            entity.Property(e => e.CreatedTime).HasColumnName("CREATED_TIME");
        });
    }
}
```

### 依赖注入配置

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        // 配置 DbContext
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseXugu(
                "Server=127.0.0.1;Port=5138;Database=SYSTEM;Uid=SYSDBA;Pwd=SYSDBA;current_schema=RY;CHAR_SET=UTF8;COMPATIBLE_MODE=MYSQL"
            );
            
            // 配置日志
            options.UseLoggerFactory(LoggerFactory.Create(builder =>
            {
                builder.AddConsole();
            }));
            
            // 启用敏感数据日志（开发环境）
            options.EnableSensitiveDataLogging();
            
            // 启用详细错误
            options.EnableDetailedErrors();
        });
        
        // 注册其他服务
        services.AddControllers();
    }
}
```

## 第三步：配置实体

### 数据注解方式

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("USERS")]
public class User
{
    [Key]
    [Column("ID")]
    public long Id { get; set; }

    [Required]
    [StringLength(50)]
    [Column("USERNAME")]
    public string Username { get; set; }

    [StringLength(100)]
    [Column("EMAIL")]
    public string Email { get; set; }

    [Column("CREATED_TIME")]
    public DateTime CreatedTime { get; set; } = DateTime.Now;

    [Column("UPDATED_TIME")]
    public DateTime UpdatedTime { get; set; } = DateTime.Now;
}
```

### Fluent API 方式

```csharp
public class ApplicationDbContext : DbContext
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            // 表名映射
            entity.ToTable("USERS");
            
            // 主键配置
            entity.HasKey(e => e.Id);
            
            // 列映射
            entity.Property(e => e.Id)
                .HasColumnName("ID")
                .HasColumnType("BIGINT");
            
            entity.Property(e => e.Username)
                .HasColumnName("USERNAME")
                .HasColumnType("VARCHAR(50)")
                .IsRequired();
            
            entity.Property(e => e.Email)
                .HasColumnName("EMAIL")
                .HasColumnType("VARCHAR(100)");
            
            entity.Property(e => e.CreatedTime)
                .HasColumnName("CREATED_TIME")
                .HasColumnType("TIMESTAMP")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.Property(e => e.UpdatedTime)
                .HasColumnName("UPDATED_TIME")
                .HasColumnType("TIMESTAMP")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // 索引配置
            entity.HasIndex(e => e.Username)
                .HasDatabaseName("IDX_USERS_USERNAME")
                .IsUnique();
            
            entity.HasIndex(e => e.Email)
                .HasDatabaseName("IDX_USERS_EMAIL");
        });
    }
}
```

## 第四步：配置迁移

### 创建迁移

```bash
# 创建迁移
dotnet ef migrations add InitialCreate

# 更新数据库
dotnet ef database update

# 生成 SQL 脚本
dotnet ef migrations script
```

### 迁移配置

```csharp
public class ApplicationDbContext : DbContext
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 配置序列
        modelBuilder.HasSequence<long>("USERS_SEQ")
            .StartsAt(1)
            .IncrementsBy(1);
        
        // 配置默认值
        modelBuilder.Entity<User>()
            .Property(e => e.Id)
            .HasDefaultValueSql("USERS_SEQ.NEXTVAL");
        
        // 配置注释
        modelBuilder.Entity<User>()
            .HasComment("用户表");
        
        modelBuilder.Entity<User>()
            .Property(e => e.Id)
            .HasComment("用户ID");
    }
}
```

## 第五步：查询优化

### 查询过滤器

```csharp
public class ApplicationDbContext : DbContext
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 全局查询过滤器
        modelBuilder.Entity<User>()
            .HasQueryFilter(e => !e.IsDeleted);
        
        // 多租户过滤器
        modelBuilder.Entity<User>()
            .HasQueryFilter(e => e.TenantId == GetCurrentTenantId());
    }
}
```

### 索引优化

```csharp
public class ApplicationDbContext : DbContext
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 复合索引
        modelBuilder.Entity<User>()
            .HasIndex(e => new { e.Username, e.Email })
            .HasDatabaseName("IDX_USERS_USERNAME_EMAIL");
        
        // 包含索引
        modelBuilder.Entity<User>()
            .HasIndex(e => e.Username)
            .HasDatabaseName("IDX_USERS_USERNAME_INCLUDE")
            .IncludeProperties(e => new { e.Email, e.CreatedTime });
        
        // 过滤索引
        modelBuilder.Entity<User>()
            .HasIndex(e => e.Email)
            .HasDatabaseName("IDX_USERS_EMAIL_ACTIVE")
            .HasFilter("IS_DELETED = 0");
    }
}
```

## 第六步：测试验证

### 编译打包

```bash
# 编译项目
dotnet build

# 运行项目
dotnet run
```

### 验证数据库连接

```csharp
using var context = new ApplicationDbContext();

// 测试连接
if (context.Database.CanConnect())
{
    Console.WriteLine("数据库连接成功");
}
else
{
    Console.WriteLine("数据库连接失败");
}

// 执行查询
var users = context.Users.ToList();
Console.WriteLine($"查询到 {users.Count} 个用户");
```

## 常见问题排查

### 1. 驱动类找不到

**现象：** 启动时报错 `Driver class not found`

**原因：** NuGet 包未正确安装

**解决：** 
- 检查 `Xugu.EntityFrameworkCore` 包是否已安装
- 确保包版本与 .NET 版本兼容

### 2. 连接字符串错误

**现象：** 连接时报错 `Invalid connection string`

**原因：** 连接字符串参数错误

**解决：** 确保使用正确的连接字符串格式

```
Server=127.0.0.1;Port=5138;Database=SYSTEM;Uid=SYSDBA;Pwd=SYSDBA;current_schema=RY;CHAR_SET=UTF8;COMPATIBLE_MODE=MYSQL
```

### 3. 迁移失败

**现象：** 迁移时报错 `Migration failed`

**原因：** SQL 语法不兼容

**解决：** 
- 检查虚谷数据库 SQL 语法
- 使用虚谷数据库兼容的函数和语法
- 参考虚谷数据库 SQL 语法文档

### 4. 查询性能问题

**现象：** 查询响应缓慢

**原因：** 查询优化不足

**解决：** 
- 创建合适的索引
- 使用查询过滤器
- 优化 LINQ 查询

### 5. 事务问题

**现象：** 事务提交失败

**原因：** 事务配置错误

**解决：** 
- 检查事务隔离级别
- 确保事务正确提交或回滚

### 6. 字符编码问题

**现象：** 数据显示乱码

**原因：** 字符编码不匹配

**解决：** 
- 在连接字符串中添加 `CHAR_SET=UTF8`
- 检查数据库字符集配置

## 参考文档

详细的配置和使用说明请参考：
- [EF Core 配置详解](references/efcore-configuration.md)
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [EF Core 官方文档](https://learn.microsoft.com/en-us/ef/core/)
