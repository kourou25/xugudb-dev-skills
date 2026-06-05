# DataEase 适配虚谷数据库配置指南

## 概述

DataEase 是人人可用的开源 BI（商业智能）工具，支持丰富的数据源连接，能够通过拖拉拽方式快速制作图表。本指南介绍如何将 DataEase 适配到虚谷数据库（XuguDB），实现数据可视化分析。

## 1. DataEase 简介

### 1.1 核心特性

- **开源开放**：零门槛，线上快速获取和安装，按月迭代
- **简单易用**：极易上手，通过鼠标点击和拖拽即可完成分析
- **多数据源支持**：支持 MySQL、PostgreSQL、Oracle、SQL Server 等 20+ 种数据源
- **丰富的图表类型**：支持柱状图、折线图、饼图、地图、仪表盘等多种图表
- **安全分享**：支持仪表板和数据大屏的安全分享
- **AI 智能问数**：支持自然语言查询数据

### 1.2 支持的数据源

**关系型数据库：**
- MySQL、PostgreSQL、Oracle、SQL Server、MariaDB
- TiDB、达梦（DM）、KingBase、虚谷数据库（XuguDB）

**数据仓库与 OLAP：**
- ClickHouse、Doris、StarRocks、AWS Redshift、Impala

**NoSQL 数据库：**
- MongoDB（通过 BI 连接器）

**其他数据源：**
- Elasticsearch、API 接口、Excel/CSV 文件

## 2. 安装部署

### 2.1 Docker 部署（推荐）

```bash
# 拉取 DataEase 镜像
docker pull dataease/dataease:latest

# 启动 DataEase 容器
docker run -d \
  --name dataease \
  -p 80:80 \
  -v /opt/dataease:/opt/dataease \
  -e JAVA_OPTS="-Xms2g -Xmx4g" \
  dataease/dataease:latest
```

### 2.2 1Panel 部署

1. 登录 1Panel 管理面板
2. 进入应用商店，搜索 DataEase
3. 点击安装，配置相关参数
4. 完成安装后访问 DataEase

### 2.3 手动部署

```bash
# 克隆 DataEase 源码
git clone https://github.com/dataease/dataease.git

# 进入项目目录
cd dataease

# 构建项目
mvn clean package -DskipTests

# 部署到 Tomcat 或其他 Web 服务器
```

## 3. 虚谷数据库驱动配置

### 3.1 获取虚谷数据库驱动

**驱动文件：** `xugu-jdbc-12.3.4.jar`

**下载方式：**
1. 从虚谷数据库官网下载
2. 从 Maven Central 下载：`com.xugudb:xugu-jdbc:12.3.4`

### 3.2 上传驱动到 DataEase

#### 方式一：通过 DataEase 界面上传

1. 登录 DataEase 系统
2. 进入【系统管理】→【驱动管理】
3. 点击【新建驱动】
4. 填写驱动信息：
   - **驱动名称**：虚谷数据库驱动
   - **驱动类型**：MySQL（选择 MySQL 兼容模式）
   - **驱动类名**：`com.xugu.cloudjdbc.Driver`
   - **驱动文件**：上传 `xugu-jdbc-12.3.4.jar`
5. 点击【保存】

#### 方式二：手动部署驱动文件

```bash
# 将驱动文件复制到 DataEase 的驱动目录
cp xugu-jdbc-12.3.4.jar /opt/dataease/drivers/

# 重启 DataEase 服务
docker restart dataease
```

### 3.3 驱动类名配置

| 数据库 | 驱动类名 |
|--------|----------|
| 虚谷数据库 | `com.xugu.cloudjdbc.Driver` |
| MySQL | `com.mysql.jdbc.Driver` |
| PostgreSQL | `org.postgresql.Driver` |
| Oracle | `oracle.jdbc.driver.OracleDriver` |
| SQL Server | `com.microsoft.sqlserver.jdbc.SQLServerDriver` |
| 达梦（DM） | `dm.jdbc.driver.DmDriver` |

## 4. 数据源连接配置

### 4.1 新建数据源连接

1. 登录 DataEase 系统
2. 进入【数据准备】→【数据源】
3. 点击【新建数据源】
4. 选择数据源类型：
   - 如果已配置虚谷数据库驱动，选择【虚谷数据库】
   - 如果未配置专用驱动，选择【MySQL】（兼容模式）

### 4.2 配置连接参数

**基本配置：**

```
数据源名称：虚谷数据库
数据库类型：MySQL（兼容模式）或 虚谷数据库
IP 地址：127.0.0.1
端口：5138
数据库名称：SYSTEM
用户名：SYSDBA
密码：SYSDBA
```

**高级配置：**

```
查询超时时间：60（秒）
字符集：UTF-8
时区：Asia/Shanghai
```

**连接字符串示例：**

```
jdbc:xugu://127.0.0.1:5138/SYSTEM?current_schema=PUBLIC&CHAR_SET=UTF8&COMPATIBLE_MODE=MYSQL
```

### 4.3 配置 Schema

1. 在数据源配置页面，点击【获取 Schema】
2. 选择目标 Schema（如 `PUBLIC`）
3. 点击【校验】验证连接
4. 校验成功后点击【保存】

## 5. 数据集配置

### 5.1 创建数据集

1. 进入【数据准备】→【数据集】
2. 点击【新建数据集】
3. 选择数据源：虚谷数据库
4. 选择数据表或编写 SQL 查询

### 5.2 数据表选择

```sql
-- 选择单表
SELECT * FROM users

-- 多表关联查询
SELECT 
    u.name AS 用户名,
    u.email AS 邮箱,
    o.order_date AS 订单日期,
    o.amount AS 订单金额
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 1
```

### 5.3 自定义 SQL 查询

```sql
-- 聚合查询
SELECT 
    DATE_FORMAT(create_time, '%Y-%m') AS 月份,
    COUNT(*) AS 用户数量,
    SUM(amount) AS 总金额
FROM orders
WHERE create_time >= '2024-01-01'
GROUP BY DATE_FORMAT(create_time, '%Y-%m')
ORDER BY 月份
```

## 6. 仪表板创建

### 6.1 新建仪表板

1. 进入【仪表板】
2. 点击【新建仪表板】
3. 选择模板或空白仪表板
4. 配置仪表板名称和描述

### 6.2 添加图表组件

1. 从组件库拖拽图表到画布
2. 选择数据集
3. 绑定数据字段：
   - **维度**：分类字段（如用户类型、产品类别）
   - **指标**：数值字段（如金额、数量）
4. 配置图表样式和交互

### 6.3 常用图表类型

**柱状图：**
- 适用场景：比较不同类别的数据
- 配置示例：X 轴为产品类别，Y 轴为销售额

**折线图：**
- 适用场景：展示数据趋势
- 配置示例：X 轴为时间，Y 轴为用户增长数

**饼图：**
- 适用场景：展示占比关系
- 配置示例：展示不同渠道的销售占比

**地图：**
- 适用场景：展示地理分布数据
- 配置示例：展示各省份的销售分布

### 6.4 过滤组件配置

**时间过滤器：**
- 配置时间范围选择
- 支持相对时间和绝对时间

**文本过滤器：**
- 配置文本搜索条件
- 支持模糊匹配和精确匹配

**数字过滤器：**
- 配置数值范围筛选
- 支持大于、小于、等于等条件

## 7. 数据大屏创建

### 7.1 新建数据大屏

1. 进入【数据大屏】
2. 点击【新建数据大屏】
3. 选择模板或空白大屏
4. 配置画布尺寸（如 1920x1080）

### 7.2 布局设计

**标题区域：**
- 添加标题文本组件
- 配置字体、颜色、大小

**数据展示区域：**
- 添加图表组件
- 配置数据绑定和样式

**装饰元素：**
- 添加边框、背景、装饰线
- 配置动画效果

### 7.3 交互配置

**联动效果：**
- 配置图表间的联动关系
- 实现点击筛选功能

**定时刷新：**
- 配置数据自动刷新
- 设置刷新间隔时间

## 8. 报表与分享

### 8.1 创建报表

1. 进入【报表】
2. 点击【新建报表】
3. 选择数据集
4. 设计报表布局

### 8.2 分享配置

**公开分享：**
- 生成分享链接
- 设置访问密码
- 配置有效期

**嵌入分享：**
- 生成嵌入代码
- 集成到其他系统
- 配置单点登录

### 8.3 定时报告

1. 进入【定时报告】
2. 配置报告任务
3. 设置发送时间
4. 配置接收人

## 9. 性能优化

### 9.1 数据库优化

**索引优化：**
```sql
-- 为常用查询字段创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_create_time ON orders(create_time);

-- 复合索引
CREATE INDEX idx_orders_status_time ON orders(status, create_time);
```

**查询优化：**
```sql
-- 使用覆盖索引
SELECT id, name, email FROM users WHERE email = 'test@example.com';

-- 避免 SELECT *
SELECT name, email, phone FROM users WHERE status = 1;

-- 使用分页查询
SELECT * FROM users ORDER BY id LIMIT 100 OFFSET 0;
```

### 9.2 DataEase 配置优化

**缓存配置：**
- 启用查询缓存
- 配置缓存过期时间

**连接池配置：**
- 调整最大连接数
- 配置连接超时时间

**查询超时配置：**
- 设置合理的查询超时时间
- 避免长时间运行的查询

### 9.3 硬件优化

**内存配置：**
- 增加 DataEase 的 JVM 内存
- 配置数据库服务器内存

**存储优化：**
- 使用 SSD 存储
- 配置 RAID 阵列

**网络优化：**
- 使用高速网络连接
- 配置负载均衡

## 10. 常见问题与解决方案

### 10.1 连接失败

**问题**：无法连接到虚谷数据库。

**解决方案**：
- 检查数据库服务是否启动
- 验证网络连接和防火墙设置
- 确认用户名和密码是否正确
- 检查驱动类名是否正确

### 10.2 驱动加载失败

**问题**：驱动类名不正确或驱动文件损坏。

**解决方案**：
- 确认驱动类名：`com.xugu.cloudjdbc.Driver`
- 重新下载驱动文件
- 检查驱动文件版本兼容性

### 10.3 查询超时

**问题**：查询执行时间过长。

**解决方案**：
- 优化查询 SQL 语句
- 创建合适的索引
- 增加查询超时时间
- 使用分页查询

### 10.4 数据类型不兼容

**问题**：某些数据类型映射不正确。

**解决方案**：
- 使用 CAST 函数进行类型转换
- 在 SQL 查询中处理类型转换
- 检查虚谷数据库的数据类型文档

### 10.5 中文乱码

**问题**：中文字符显示为乱码。

**解决方案**：
- 确保连接字符串中包含 `CHAR_SET=UTF8`
- 检查数据库字符集配置
- 验证 DataEase 的字符编码设置

## 11. 最佳实践

1. **数据源管理**：使用统一的命名规范管理数据源
2. **权限控制**：为不同用户配置不同的数据访问权限
3. **性能优化**：为常用查询创建索引，优化查询语句
4. **缓存策略**：合理配置缓存，提高查询性能
5. **监控告警**：配置查询性能监控和告警
6. **备份恢复**：定期备份仪表板和数据集配置
7. **版本管理**：及时更新 DataEase 和数据库驱动版本
8. **安全防护**：配置访问控制和数据脱敏

## 12. 相关资源

- [DataEase 官方文档](https://www.dataease.cn/docs/v2/)
- [DataEase GitHub 仓库](https://github.com/dataease/dataease)
- [虚谷数据库官方文档](https://www.xugudb.com)
- [DataEase 社区论坛](https://bbs.fit2cloud.com/)
