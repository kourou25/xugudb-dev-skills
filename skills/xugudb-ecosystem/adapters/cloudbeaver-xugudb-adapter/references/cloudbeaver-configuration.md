# CloudBeaver 云数据库管理器虚谷数据库配置指南

## 概述

本文档提供 CloudBeaver 云数据库管理器适配虚谷数据库(XuguDB)的完整配置指南，包括部署安装、驱动配置、连接管理、用户权限等。

## 一、核心配置信息

### 1.1 JDBC 驱动类
```
com.xugu.cloudjdbc.Driver
```

### 1.2 连接 URL 格式
```
jdbc:xugu://<host>:<port>/<database>?current_schema=<schema>&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

**参数说明：**
- `<host>`: 数据库服务器地址
- `<port>`: 数据库端口（默认5138）
- `<database>`: 数据库名（如SYSTEM）
- `<schema>`: 模式名（如RY）
- `CHAR_SET=UTF8`: 字符集配置
- `COMPATIBLE_MODE=MYSQL`: MySQL兼容模式

### 1.3 示例 URL
```
jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

## 二、CloudBeaver 部署安装

### 2.1 环境准备

**系统要求：**
- 操作系统：Linux/Windows/macOS（推荐 Ubuntu 20.04+）
- Java 环境：JDK 8 或更高（推荐 JDK 11+）
- 内存：最低 2GB RAM，推荐 4GB+
- 存储：最低 1GB，推荐 5GB
- Docker：版本 19.03+（推荐 20.10+）

**环境验证：**
```bash
java -version
docker --version
docker-compose --version
```

### 2.2 Docker Compose 部署（推荐）

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  cloudbeaver:
    image: dbeaver/cloudbeaver:latest
    container_name: cloudbeaver
    ports:
      - "8978:8978"
    volumes:
      - "./logs:/opt/cloudbeaver/logs"
      - "./workspace:/opt/cloudbeaver/workspace"
      - "./drivers:/opt/cloudbeaver/drivers"
    environment:
      - JAVA_OPTS=-Xmx2g -Xms1g
    restart: unless-stopped
```

**启动服务：**
```bash
docker-compose up -d
```

### 2.3 源码编译安装

**克隆项目：**
```bash
git clone https://github.com/dbeaver/cloudbeaver.git
cd cloudbeaver
```

**构建前端：**
```bash
cd webapp
npm install
npm run build
```

**编译启动后端：**
```bash
cd ../server
./run-server.sh
```

### 2.4 验证安装

**检查端口：**
```bash
netstat -tulpn | grep 8978
```

**查看日志：**
```bash
tail -f logs/cloudbeaver.log
```

**Web 访问：**
- 地址：http://localhost:8978
- 默认账号：admin/admin

## 三、虚谷数据库驱动配置

### 3.1 下载虚谷 JDBC 驱动

1. 访问虚谷数据库官网：https://www.xugudb.com/
2. 下载 JDBC 驱动包：`xugu-jdbc-12.3.4.jar`
3. 保存到 CloudBeaver 的 `drivers` 目录

### 3.2 配置驱动

1. 登录 CloudBeaver 管理界面
2. 进入 **设置** -> **驱动管理**
3. 点击 **添加驱动**
4. 填写驱动信息：
   - **驱动名称**: XuguDB
   - **驱动类名**: `com.xugu.cloudjdbc.Driver`
   - **URL 模板**: `jdbc:xugu://{host}:{port}/{database}`
   - **默认端口**: 5138
5. 上传驱动 JAR 文件
6. 保存配置

### 3.3 驱动属性配置

在驱动管理中，可以配置以下属性：

| 属性 | 说明 | 推荐值 |
|------|------|--------|
| `connectTimeout` | 连接超时时间（毫秒） | 30000 |
| `socketTimeout` | 套接字超时时间（毫秒） | 60000 |
| `useSSL` | 是否使用 SSL | false |
| `characterEncoding` | 字符编码 | UTF-8 |

## 四、数据库连接配置

### 4.1 创建连接

1. 在 CloudBeaver 主界面，点击 **新建连接**
2. 选择 **XuguDB** 驱动
3. 填写连接信息：
   - **主机**: 数据库服务器地址
   - **端口**: 5138
   - **数据库**: SYSTEM
   - **用户名**: SYSDBA
   - **密码**: SYSDBA

### 4.2 JDBC URL 配置

```
jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

**参数说明：**
- `current_schema=RY`: 指定当前模式名
- `CHAR_SET=UTF8`: 字符集配置
- `COMPATIBLE_MODE=MYSQL`: MySQL兼容模式

### 4.3 连接测试

1. 点击 **测试连接** 按钮
2. 验证连接是否成功
3. 如果连接失败，检查驱动配置和连接参数

## 五、用户权限管理

### 5.1 用户管理

1. 进入 **设置** -> **用户管理**
2. 可以创建、编辑、删除用户
3. 为用户分配角色和权限

### 5.2 角色管理

1. 进入 **设置** -> **角色管理**
2. 可以创建、编辑、删除角色
3. 为角色分配权限

### 5.3 权限配置

1. **连接权限**: 控制用户可以访问哪些数据库连接
2. **操作权限**: 控制用户可以执行哪些操作（查询、编辑、导出等）
3. **数据权限**: 控制用户可以访问哪些数据

## 六、SQL 编辑器使用

### 6.1 打开 SQL 编辑器

1. 在连接列表中，选择数据库连接
2. 点击 **SQL 编辑器** 按钮
3. 或右键点击连接 -> **SQL 编辑器**

### 6.2 执行 SQL 语句

```sql
-- 查询表结构
SELECT table_name, comments 
FROM all_tables 
WHERE schema_id = (SELECT schema_id FROM all_schemas WHERE schema_name = 'RY');

-- 查询列信息
SELECT col_name, type_name, comments 
FROM ALL_COLUMNS 
WHERE table_id = (SELECT table_id FROM all_tables WHERE table_name = 'USERS');

-- 创建表
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.3 使用代码补全

1. 在 SQL 编辑器中输入表名或列名的前几个字符
2. 按 `Ctrl+Space` 触发代码补全
3. 从列表中选择正确的选项

### 6.4 执行计划分析

1. 在 SQL 编辑器中输入查询语句
2. 点击工具栏的 **执行计划** 按钮
3. 查看查询执行计划

## 七、数据管理

### 7.1 数据查看

1. 在数据库导航器中，展开表节点
2. 双击表名查看数据
3. 或右键点击表 -> **查看数据**

### 7.2 数据编辑

1. 在数据查看界面中，直接编辑单元格
2. 点击 **保存** 按钮提交更改
3. 或使用 `Ctrl+S` 快捷键

### 7.3 数据导入

1. 右键点击表 -> **导入数据**
2. 选择导入格式（CSV、Excel、JSON 等）
3. 配置导入选项
4. 执行导入

### 7.4 数据导出

1. 在数据查看界面中，点击 **导出数据** 按钮
2. 选择导出格式（CSV、Excel、JSON、SQL 等）
3. 配置导出选项
4. 执行导出

## 八、高级配置

### 8.1 安全配置

**启用 HTTPS：**
```json
{
  "server": {
    "forceHttps": true
  }
}
```

**访问控制：**
```json
{
  "security": {
    "allowedIPs": ["192.168.1.0/24"],
    "blockedIPs": ["10.0.0.1"]
  }
}
```

**会话管理：**
```json
{
  "session": {
    "timeout": 3600
  }
}
```

### 8.2 性能优化

**连接池配置：**
```json
{
  "database": {
    "minIdleConnections": 4,
    "maxConnections": 100
  }
}
```

**JVM 参数：**
```bash
JAVA_OPTS="-Xmx4g -Xms2g -XX:+UseG1GC"
```

### 8.3 日志配置

**日志级别：**
```json
{
  "logging": {
    "level": "INFO",
    "file": "logs/cloudbeaver.log"
  }
}
```

## 九、常见问题排查

### 1. 驱动类找不到

**现象：** 连接时报错 `Driver class not found`

**原因：** JDBC 驱动未正确配置

**解决：** 
- 检查驱动管理中是否添加了虚谷 JDBC 驱动
- 确保驱动 JAR 文件路径正确

### 2. 连接 URL 错误

**现象：** 连接时报错 `Invalid connection URL`

**原因：** URL 参数错误

**解决：** 确保使用正确的 URL 格式

```
jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=RY&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

### 3. 认证失败

**现象：** 连接时报错 `Authentication failed`

**原因：** 用户名或密码错误

**解决：** 
- 检查用户名和密码是否正确
- 确保用户有连接权限

### 4. 表不存在

**现象：** 查询时报错 `Table not found`

**原因：** 模式名未正确设置

**解决：** 
- 在连接 URL 中添加 `current_schema=RY`
- 或在连接后执行 `SET CURRENT_SCHEMA = RY`

### 5. 字符编码问题

**现象：** 数据显示乱码

**原因：** 字符编码不匹配

**解决：** 
- 在连接 URL 中添加 `CHAR_SET=UTF8`
- 检查 CloudBeaver 的字符编码设置

### 6. 权限不足

**现象：** 操作时报错 `Permission denied`

**原因：** 用户权限不足

**解决：** 
- 确保用户有相应权限
- 使用 DBA 权限用户连接

### 7. 性能问题

**现象：** 查询响应缓慢

**原因：** 查询优化不足

**解决：** 
- 使用执行计划分析查询
- 创建合适的索引
- 优化 SQL 语句

### 8. 端口冲突

**现象：** 启动失败，报端口被占用

**原因：** 端口 8978 被其他服务占用

**解决：** 
- 修改配置文件中的 `serverPort`
- 或停止占用端口的服务

## 十、最佳实践

### 1. 部署建议
- 使用 Docker Compose 部署，便于管理和维护
- 配置合适的 JVM 参数，确保性能
- 定期备份 `workspace` 目录

### 2. 安全建议
- 启用 HTTPS 加密传输
- 配置访问控制，限制访问来源
- 设置强密码策略
- 定期更新系统补丁

### 3. 性能建议
- 根据并发数调整连接池参数
- 监控系统资源使用情况
- 优化 SQL 查询性能

### 4. 运维建议
- 定期查看日志，及时发现和解决问题
- 监控系统状态，确保服务稳定
- 建立完善的备份和恢复机制

## 十一、参考资源

### 11.1 官方文档
- [CloudBeaver 官方文档](https://dbeaver.com/docs/cloudbeaver/)
- [虚谷数据库官方文档](https://docs.xugudb.com/)
- [虚谷数据库 JDBC 驱动文档](https://docs.xugudb.com/content/reference/jdbc)

### 11.2 示例项目
- [虚谷 CloudBeaver 示例](https://gitee.com/XuguDB/xugu-cloudbeaver-demo)
- [CloudBeaver 示例项目](https://github.com/dbeaver/cloudbeaver)

### 11.3 社区资源
- [虚谷数据库社区](https://www.xugudb.com/)
- [CloudBeaver 社区](https://dbeaver.io/community/)