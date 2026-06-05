# Entity Framework Core 虚谷数据库配置指南

## 概述

本文档提供 Entity Framework Core (EF Core) 适配虚谷数据库(XuguDB)的完整配置指南，包括 NuGet 包安装、DbContext 配置、连接字符串、迁移配置等。

## 一、核心配置信息

### 1.1 连接字符串格式
```
Server=<host>;Port=<port>;Database=<database>;Uid=<username>;Pwd=<password>;current_schema=<schema>;CHAR_SET=UTF8;COMPATIBLE_MODE=MYSQL
```

**参数说明：**
- `<host>`: 数据库服务器地址
- `<port>`: 数据库端口（默认5138）
- `<database>`: 数据库名（如SYSTEM）
- `<username>`: 数据库用户名
- `<password>`: 数据库密码
- `<schema>`: 模式名（如RY）
- `CHAR_SET=UTF8`: 字符集配置
- `COMPATIBLE_MODE=MYSQL`: MySQL兼容模式

### 1.2 示例连接字符串
```
Server=127.0.0.1;Port=5138;Database=SYSTEM;Uid=SYSDBA;Pwd=SYSDBA;current_schema=RY;CHAR_SET=UTF8;COMPATIBLE_MODE=MYSQL
```

## 二、NuGet 包安装

### 2.1 虚谷数据库提供程序

```bash
# 安装虚谷数据库 EF Core 提供程序
dotnet add package Xugu.EntityFrameworkCore --version 1.0.0

# 或使用 Package Manager Console
Install-Package Xugu.EntityFrameworkCore -Version 1.0.0
```

### 2.2 EF Core 核心包

```bash
# 安装 EF Core 核心包
dotnet add package Microsoft.EntityFrameworkCore --version 8.0.0

# 安装 EF Core 设计时包
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.0

# 安装 EF Core 工具
dotnet add package Microsoft.EntityFrameworkCore.Tools --version 8.0.0
```

### 2.3 其他依赖包

```bash
# 安装连接池包
dotnet add package Microsoft.Data.SqlClient --version 5.1.0

# 安装日志包
dotnet add package Microsoft.Extensions.Logging.Console --version 8.0.0
```

## 三、DbContext 配置

### 3.1 基本配置

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

### 3.2 依赖注入配置

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

### 3.3 高级配置

```csharp
public class ApplicationDbContext : DbContext
{
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseXugu(
            "Server=127.0.0.1;Port=5138;Database=SYSTEM;Uid=SYSDBA;Pwd=SYSDBA;current_schema=RY;CHAR_SET=UTF8;COMPATIBLE_MODE=MYSQL",
            options =>
            {
                // 命令超时时间
                options.CommandTimeout(30);
                
                // 重试策略
                options.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null
                );
                
                // 最小批处理大小
                options.MinBatchSize(1);
                
                // 最大批处理大小
                options.MaxBatchSize(100);
            }
        );
    }
}
```

## 四、实体配置

### 4.1 数据注解方式

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

### 4.2 Fluent API 方式

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

## 五、迁移配置

### 5.1 创建迁移

```bash
# 创建迁移
dotnet ef migrations add InitialCreate

# 更新数据库
dotnet ef database update

# 生成 SQL 脚本
dotnet ef migrations script
```

### 5.2 迁移配置

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

### 5.3 迁移回滚

```bash
# 回滚到指定迁移
dotnet ef database update PreviousMigrationName

# 回滚所有迁移
dotnet ef database update 0
```

## 六、查询优化

### 6.1 查询过滤器

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

### 6.2 索引优化

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

## 七、事务配置

### 7.1 显式事务

```csharp
using var context = new ApplicationDbContext();
using var transaction = context.Database.BeginTransaction();

try
{
    // 执行操作
    context.Users.Add(new User { Username = "test" });
    context.SaveChanges();
    
    // 提交事务
    transaction.Commit();
}
catch
{
    // 回滚事务
    transaction.Rollback();
    throw;
}
```

### 7.2 隐式事务

```csharp
public class ApplicationDbContext : DbContext
{
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // 配置自动事务
        optionsBuilder.UseXugu(
            connectionString,
            options =>
            {
                // 启用自动事务
                options.UseTransactionAutoBehavior(true);
            }
        );
    }
}
```

## 八、性能优化

### 8.1 批量操作

```csharp
// 批量插入
var users = new List<User>();
for (int i = 0; i < 1000; i++)
{
    users.Add(new User { Username = $"user{i}", Email = $"user{i}@example.com" });
}

context.Users.AddRange(users);
context.SaveChanges();
```

### 8.2 原始 SQL 查询

```csharp
// 原始 SQL 查询
var users = context.Users
    .FromSqlRaw("SELECT * FROM USERS WHERE USERNAME LIKE {0}", "%test%")
    .ToList();

// 原始 SQL 执行
context.Database.ExecuteSqlRaw("UPDATE USERS SET EMAIL = {0} WHERE ID = {1}", "new@example.com", 1);
```

### 8.3 分页查询

```csharp
// 分页查询
var pageSize = 10;
var pageNumber = 1;

var users = context.Users
    .OrderBy(u => u.Id)
    .Skip((pageNumber - 1) * pageSize)
    .Take(pageSize)
    .ToList();
```

## 九、常见问题排查

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

## 十、最佳实践

### 1. 连接管理
- 使用连接池提高性能
- 及时释放数据库连接
- 使用依赖注入管理 DbContext

### 2. 查询优化
- 创建合适的索引
- 使用查询过滤器
- 避免 N+1 查询问题
- 使用分页查询

### 3. 事务管理
- 使用显式事务控制
- 合理设置事务隔离级别
- 及时提交或回滚事务

### 4. 迁移管理
- 定期创建迁移
- 测试迁移脚本
- 备份数据库后再迁移

### 5. 安全建议
- 使用参数化查询
- 避免 SQL 注入
- 使用最小权限原则
- 定期更新依赖包

## 十一、参考资源

### 11.1 官方文档
- [EF Core 官方文档](https://learn.microsoft.com/en-us/ef/core/)
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [虚谷数据库 .NET 驱动文档](https://docs.xugudb.com/content/reference/dotnet)

### 11.2 示例项目
- [虚谷 EF Core 示例](https://gitee.com/XuguDB/xugu-efcore-demo)
- [EF Core 示例项目](https://github.com/dotnet/efcore)

### 11.3 社区资源
- [虚谷数据库社区](https://www.xugudb.com/)
- [EF Core 社区](https://github.com/dotnet/efcore/discussions)