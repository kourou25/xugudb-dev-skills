# Entity Framework 6 虚谷数据库配置指南

## 概述

本文档提供 Entity Framework 6 (EF6) 适配虚谷数据库(XuguDB)的完整配置流程。虚谷数据库通过 XuguClient ADO.NET 驱动支持 EF6 框架，需要手动配置提供程序和连接字符串。

## 前置条件

1. 已安装 .NET Framework 4.5 或更高版本
2. 已安装 Visual Studio 2013 或更高版本
3. 已获取 XuguClient 驱动程序（`XuguClient.dll` 和 `xugusql.dll`）
4. 已创建虚谷数据库实例并获取连接信息

## 第一步：安装 NuGet 包

### Entity Framework 6 核心包

```bash
# 通过 NuGet 包管理器安装
Install-Package EntityFramework -Version 6.4.4

# 或通过 .NET CLI
dotnet add package EntityFramework --version 6.4.4
```

### XuguClient 驱动安装

#### 方式一：手动引用（推荐）

1. 将 `XuguClient.dll` 和 `xugusql.dll` 文件复制到项目目录
2. 在项目中添加对 `XuguClient.dll` 的引用
3. 将 `xugusql.dll` 设置为"如果较新则复制"或"始终复制"

#### 方式二：NuGet 包（如果可用）

```bash
# 搜索并安装 XuguClient NuGet 包
Install-Package XuguClient
```

## 第二步：配置 DbProviderFactory

### 注册 XuguClient 提供程序

在 `app.config` 或 `web.config` 文件中添加以下配置：

```xml
<configuration>
  <system.data>
    <DbProviderFactories>
      <add name="XuguClient Data Provider" 
           invariant="XuguClient" 
           description=".NET Framework Data Provider for XuguDB" 
           type="XuguClient.XuguClientFactory, XuguClient, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null" />
    </DbProviderFactories>
  </system.data>
</configuration>
```

### 验证提供程序注册

```csharp
using System.Data.Common;

// 获取 XuguClient 工厂
DbProviderFactory factory = DbProviderFactories.GetFactory("XuguClient");
Console.WriteLine("XuguClient 提供程序已注册");
```

## 第三步：配置连接字符串

### 连接字符串格式

虚谷数据库连接字符串格式（分号分隔键值对）：

```
IP=127.0.0.1;PORT=5138;DB=SYSTEM;USER=SYSDBA;PWD=SYSDBA;CHAR_SET=UTF8
```

### 在配置文件中定义连接字符串

```xml
<configuration>
  <connectionStrings>
    <add name="XuguConnection" 
         connectionString="IP=127.0.0.1;PORT=5138;DB=SYSTEM;USER=SYSDBA;PWD=SYSDBA;CHAR_SET=UTF8" 
         providerName="XuguClient" />
  </connectionStrings>
</configuration>
```

### 连接字符串参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| IP | 服务器 IP 地址 | 127.0.0.1 |
| IPS | 多 IP 负载均衡（逗号分隔） | - |
| PORT | 端口号 | 5138 |
| DB/DBNAME | 数据库名 | SYSTEM |
| USER | 用户名 | SYSDBA |
| PASSWORD/PWD | 密码 | - |
| CHAR_SET | 字符集（GBK/UTF8） | GBK |
| USESSL | 是否启用 SSL（TRUE/FALSE） | FALSE |
| CONNECT_TIMEOUT | 连接超时时间（秒） | 30 |

## 第四步：配置 EF6 提供程序服务

### 方式一：配置文件配置

在 `app.config` 或 `web.config` 中添加 EF6 配置节：

```xml
<configuration>
  <configSections>
    <section name="entityFramework" type="System.Data.Entity.Internal.ConfigFile.EntityFrameworkSection, EntityFramework, Version=6.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089" requirePermission="false" />
  </configSections>
  
  <entityFramework>
    <providers>
      <provider invariantName="XuguClient" type="XuguClient.XuguProviderServices, XuguClient" />
    </providers>
    <defaultConnectionFactory type="XuguClient.XuguConnectionFactory, XuguClient" />
  </entityFramework>
</configuration>
```

### 方式二：代码配置（DbConfiguration 类）

```csharp
using System.Data.Entity;
using XuguClient;

public class XuguDbConfiguration : DbConfiguration
{
    public XuguDbConfiguration()
    {
        // 注册 XuguClient 提供程序服务
        SetProviderServices("XuguClient", new XuguProviderServices());
        
        // 设置默认连接工厂
        SetDefaultConnectionFactory(new XuguConnectionFactory());
        
        // 设置迁移 SQL 生成器
        SetMigrationSqlGenerator("XuguClient", () => new XuguMigrationSqlGenerator());
    }
}
```

### 在 DbContext 中应用配置

```csharp
[DbConfigurationType(typeof(XuguDbConfiguration))]
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext() : base("name=XuguConnection")
    {
    }
    
    public DbSet<User> Users { get; set; }
    
    protected override void OnModelCreating(DbModelBuilder modelBuilder)
    {
        // 配置实体映射
        modelBuilder.Entity<User>().ToTable("USERS");
        modelBuilder.Entity<User>().HasKey(u => u.Id);
        modelBuilder.Entity<User>().Property(u => u.Id).HasColumnName("ID");
        modelBuilder.Entity<User>().Property(u => u.Username).HasColumnName("USERNAME");
    }
}
```

## 第五步：实体配置

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
    protected override void OnModelCreating(DbModelBuilder modelBuilder)
    {
        // 配置用户实体
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("USERS");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasColumnName("ID")
                .HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            
            entity.Property(e => e.Username)
                .HasColumnName("USERNAME")
                .HasMaxLength(50)
                .IsRequired();
            
            entity.Property(e => e.Email)
                .HasColumnName("EMAIL")
                .HasMaxLength(100);
            
            entity.Property(e => e.CreatedTime)
                .HasColumnName("CREATED_TIME")
                .HasDatabaseGeneratedOption(DatabaseGeneratedOption.Computed);
            
            entity.Property(e => e.UpdatedTime)
                .HasColumnName("UPDATED_TIME")
                .HasDatabaseGeneratedOption(DatabaseGeneratedOption.Computed);
            
            // 索引配置
            entity.HasIndex(e => e.Username)
                .HasName("IDX_USERS_USERNAME")
                .IsUnique();
            
            entity.HasIndex(e => e.Email)
                .HasName("IDX_USERS_EMAIL");
        });
    }
}
```

## 第六步：数据库初始化策略

### 创建数据库初始化器

```csharp
using System.Data.Entity;

public class XuguDbInitializer : CreateDatabaseIfNotExists<ApplicationDbContext>
{
    protected override void Seed(ApplicationDbContext context)
    {
        // 初始化数据
        var users = new List<User>
        {
            new User { Username = "admin", Email = "admin@example.com" },
            new User { Username = "user1", Email = "user1@example.com" }
        };
        
        context.Users.AddRange(users);
        context.SaveChanges();
    }
}
```

### 配置初始化器

```csharp
// 在应用程序启动时配置
Database.SetInitializer(new XuguDbInitializer());

// 或者在 DbContext 构造函数中配置
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext() : base("name=XuguConnection")
    {
        Database.SetInitializer(new XuguDbInitializer());
    }
}
```

## 第七步：迁移配置

### 启用迁移

```bash
# 在 Package Manager Console 中执行
Enable-Migrations

# 或者使用 .NET CLI
dotnet ef migrations add InitialCreate
```

### 配置迁移

```csharp
using System.Data.Entity.Migrations;

public sealed class Configuration : DbMigrationsConfiguration<ApplicationDbContext>
{
    public Configuration()
    {
        // 设置迁移命名空间
        ContextKey = "MyApp.Migrations";
        
        // 设置自动迁移
        AutomaticMigrationsEnabled = true;
        AutomaticMigrationDataLossAllowed = true;
        
        // 设置 SQL 生成器
        SetSqlGenerator("XuguClient", new XuguMigrationSqlGenerator());
    }
    
    protected override void Seed(ApplicationDbContext context)
    {
        // 迁移种子数据
    }
}
```

### 创建迁移 SQL 脚本

```bash
# 生成迁移 SQL 脚本
Update-Database -Script -SourceMigration:0

# 或者使用 .NET CLI
dotnet ef migrations script
```

## 第八步：查询优化

### 查询过滤器

```csharp
public class ApplicationDbContext : DbContext
{
    protected override void OnModelCreating(DbModelBuilder modelBuilder)
    {
        // 全局查询过滤器
        modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);
        
        // 多租户过滤器
        modelBuilder.Entity<User>().HasQueryFilter(e => e.TenantId == GetCurrentTenantId());
    }
    
    private int GetCurrentTenantId()
    {
        // 获取当前租户ID
        return 1;
    }
}
```

### 索引优化

```csharp
modelBuilder.Entity<User>(entity =>
{
    // 复合索引
    entity.HasIndex(e => new { e.Username, e.Email })
        .HasName("IDX_USERS_USERNAME_EMAIL");
    
    // 包含索引
    entity.HasIndex(e => e.Username)
        .HasName("IDX_USERS_USERNAME_INCLUDE")
        .Include(e => new { e.Email, e.CreatedTime });
    
    // 过滤索引（虚谷数据库支持）
    entity.HasIndex(e => e.Email)
        .HasName("IDX_USERS_EMAIL_ACTIVE")
        .HasFilter("IS_DELETED = 0");
});
```

## 第九步：事务配置

### 显式事务

```csharp
using (var context = new ApplicationDbContext())
{
    using (var transaction = context.Database.BeginTransaction())
    {
        try
        {
            // 执行数据库操作
            var user = new User { Username = "newuser", Email = "new@example.com" };
            context.Users.Add(user);
            context.SaveChanges();
            
            // 提交事务
            transaction.Commit();
        }
        catch (Exception)
        {
            // 回滚事务
            transaction.Rollback();
            throw;
        }
    }
}
```

### 事务隔离级别

```csharp
using (var context = new ApplicationDbContext())
{
    using (var transaction = context.Database.BeginTransaction(IsolationLevel.ReadCommitted))
    {
        // 执行操作
        transaction.Commit();
    }
}
```

## 第十步：性能优化

### 批量操作

```csharp
using (var context = new ApplicationDbContext())
{
    // 禁用自动检测更改
    context.Configuration.AutoDetectChangesEnabled = false;
    
    // 禁用验证
    context.Configuration.ValidateOnSaveEnabled = false;
    
    // 批量添加
    var users = new List<User>();
    for (int i = 0; i < 1000; i++)
    {
        users.Add(new User { Username = $"user{i}", Email = $"user{i}@example.com" });
    }
    
    context.Users.AddRange(users);
    context.SaveChanges();
}
```

### 原始 SQL 查询

```csharp
using (var context = new ApplicationDbContext())
{
    // 原始 SQL 查询
    var users = context.Database.SqlQuery<User>("SELECT * FROM USERS WHERE USERNAME LIKE @p0", "%admin%");
    
    // 执行 SQL 命令
    context.Database.ExecuteSqlCommand("UPDATE USERS SET EMAIL = @p0 WHERE ID = @p1", "new@example.com", 1);
}
```

## 常见问题排查

### 1. 提供程序未找到

**现象：** `No Entity Framework provider found for the ADO.NET provider with invariant name 'XuguClient'`

**解决：** 
- 确保 `XuguClient.dll` 已正确引用
- 检查 `app.config` 中的 `DbProviderFactories` 配置
- 确保 `entityFramework` 配置节中的提供程序类型正确

### 2. 连接失败

**现象：** `Unable to connect to XuguDB server`

**解决：**
- 检查连接字符串参数是否正确
- 确保虚谷数据库服务已启动
- 检查网络连接和防火墙设置

### 3. 迁移失败

**现象：** `Migration failed`

**解决：**
- 检查 SQL 语法兼容性
- 确保迁移脚本中的 SQL 语句符合虚谷数据库语法
- 参考虚谷数据库 SQL 语法文档

### 4. 性能问题

**现象：** 查询响应缓慢

**解决：**
- 创建合适的索引
- 使用查询过滤器
- 优化 LINQ 查询
- 使用批量操作

### 5. 字符编码问题

**现象：** 数据显示乱码

**解决：**
- 在连接字符串中添加 `CHAR_SET=UTF8`
- 检查数据库字符集配置
- 确保应用程序字符编码设置正确

### 6. 事务问题

**现象：** 事务提交失败

**解决：**
- 检查事务隔离级别
- 确保事务正确提交或回滚
- 检查数据库锁状态

## 参考资料

- [Entity Framework 6 官方文档](https://learn.microsoft.com/zh-cn/ef/ef6/)
- [虚谷数据库 C# 开发手册](https://docs.xugudb.com/content/development/csharp/csharp)
- [虚谷数据库 SQL 语法参考](https://docs.xugudb.com/content/sql/sql-syntax)
- [XuguClient ADO.NET 接口参考](https://docs.xugudb.com/content/development/csharp/ado-net)