# TypeORM 虚谷数据库配置参考

## 连接配置

### 基础连接参数

```typescript
{
  type: "xugudb",           // 数据库类型
  host: "127.0.0.1",       // 数据库主机地址
  port: 5138,              // 数据库端口
  username: "SYSDBA",      // 用户名
  password: "SYSDBA",      // 密码
  database: "SYSTEM",      // 数据库名
  schema: "SYSDBA",        // 模式名（可选）
}
```

### 高级连接配置

```typescript
{
  // 基础配置
  type: "xugudb",
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT) || 5138,
  username: process.env.DB_USERNAME || "SYSDBA",
  password: process.env.DB_PASSWORD || "SYSDBA",
  database: process.env.DB_DATABASE || "SYSTEM",
  
  // 连接池配置
  poolSize: 10,
  extra: {
    connectionLimit: 20,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    maxReconnects: 3,
    reconnectInterval: 2000
  },
  
  // SSL 配置
  ssl: {
    rejectUnauthorized: false,
    ca: fs.readFileSync("path/to/ca.pem").toString(),
    key: fs.readFileSync("path/to/client-key.pem").toString(),
    cert: fs.readFileSync("path/to/client-cert.pem").toString()
  },
  
  // 日志配置
  logging: ["query", "error", "schema", "warn", "info", "log"],
  logger: "advanced-console",
  
  // 实体和迁移
  entities: ["src/entity/**/*.ts"],
  migrations: ["src/migration/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"],
  
  // 同步配置（开发环境）
  synchronize: false,
  dropSchema: false,
  
  // 缓存配置
  cache: {
    type: "redis",
    options: {
      host: "localhost",
      port: 6379
    },
    duration: 30000
  }
}
```

## 数据源工厂模式

### 环境配置分离

```typescript
// config/database.ts
import { DataSource, DataSourceOptions } from "typeorm";
import * as fs from "fs";

export const getDatabaseConfig = (): DataSourceOptions => {
  const env = process.env.NODE_ENV || "development";
  
  const baseConfig: DataSourceOptions = {
    type: "xugudb",
    entities: ["src/entity/**/*.ts"],
    migrations: ["src/migration/**/*.ts"],
    subscribers: ["src/subscriber/**/*.ts"],
    logging: env === "development",
    synchronize: env === "development",
  };
  
  switch (env) {
    case "production":
      return {
        ...baseConfig,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        ssl: {
          rejectUnauthorized: false,
          ca: fs.readFileSync(process.env.DB_SSL_CA).toString(),
        },
        poolSize: 20,
        logging: false,
        synchronize: false,
        cache: {
          type: "redis",
          options: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
          },
          duration: 60000,
        },
      };
      
    case "test":
      return {
        ...baseConfig,
        host: "localhost",
        port: 5138,
        username: "TEST_USER",
        password: "TEST_PASS",
        database: "TEST_DB",
        synchronize: true,
        dropSchema: true,
      };
      
    default: // development
      return {
        ...baseConfig,
        host: "localhost",
        port: 5138,
        username: "SYSDBA",
        password: "SYSDBA",
        database: "SYSTEM",
        synchronize: true,
        logging: true,
      };
  }
};

export const AppDataSource = new DataSource(getDatabaseConfig());
```

## 实体装饰器参考

### 列类型映射

| TypeORM 类型 | 虚谷数据库类型 | 说明 |
|-------------|--------------|------|
| `int` | `INT` | 整数 |
| `int2` | `SMALLINT` | 短整数 |
| `int4` | `INT` | 整数 |
| `int8` | `BIGINT` | 长整数 |
| `float` | `FLOAT` | 单精度浮点 |
| `float4` | `FLOAT` | 单精度浮点 |
| `float8` | `DOUBLE` | 双精度浮点 |
| `numeric` | `NUMERIC` | 精确数值 |
| `decimal` | `DECIMAL` | 精确数值 |
| `boolean` | `BOOLEAN` | 布尔值 |
| `bool` | `BOOLEAN` | 布尔值 |
| `varchar` | `VARCHAR` | 变长字符串 |
| `char` | `CHAR` | 定长字符串 |
| `text` | `TEXT` | 文本 |
| `date` | `DATE` | 日期 |
| `time` | `TIME` | 时间 |
| `timestamp` | `TIMESTAMP` | 时间戳 |
| `timestamptz` | `TIMESTAMP WITH TIME ZONE` | 带时区时间戳 |
| `json` | `JSON` | JSON 数据 |
| `jsonb` | `JSONB` | 二进制 JSON |
| `blob` | `BLOB` | 二进制大对象 |
| `uuid` | `UUID` | UUID |
| `enum` | `VARCHAR` | 枚举（存储为字符串） |
| `simple-array` | `TEXT` | 简单数组（逗号分隔） |
| `simple-json` | `TEXT` | 简单 JSON（字符串存储） |

### 列选项

```typescript
@Column({
  type: "varchar",
  length: 200,
  nullable: false,
  default: "default value",
  unique: true,
  primary: false,
  update: true,
  insert: true,
  select: true,
  comment: "列注释",
  precision: 10,
  scale: 2,
  transformer: {
    to: (value) => value.toLowerCase(),
    from: (value) => value.toUpperCase()
  }
})
columnName: string;
```

### 关系装饰器

```typescript
// 一对一
@OneToOne(() => Profile, profile => profile.user, {
  eager: true,
  cascade: true,
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
  nullable: true,
  persistence: true
})
@JoinColumn()
profile: Profile;

// 一对多
@OneToMany(() => Photo, photo => photo.user, {
  eager: false,
  cascade: true,
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
})
photos: Photo[];

// 多对一
@ManyToOne(() => User, user => user.photos, {
  eager: false,
  cascade: false,
  onDelete: "SET NULL",
  onUpdate: "CASCADE"
})
@JoinColumn({ name: "user_id" })
user: User;

// 多对多
@ManyToMany(() => Category, category => category.questions, {
  eager: false,
  cascade: true,
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
})
@JoinTable({
  name: "question_categories",
  joinColumn: { name: "question_id", referencedColumnName: "id" },
  inverseJoinColumn: { name: "category_id", referencedColumnName: "id" }
})
categories: Category[];
```

## 查询构建器高级用法

### 子查询

```typescript
const subQuery = dataSource
  .createQueryBuilder()
  .select("photo.userId")
  .from(Photo, "photo")
  .where("photo.isPublished = true");

const users = await dataSource
  .createQueryBuilder(User, "user")
  .where(`user.id IN (${subQuery.getQuery()})`)
  .setParameters(subQuery.getParameters())
  .getMany();
```

### 原生 SQL 查询

```typescript
// 原生查询
const users = await dataSource.query(
  "SELECT * FROM users WHERE status = $1 AND created_at > $2",
  [1, new Date("2024-01-01")]
);

// 带命名参数
const users = await dataSource.query(
  "SELECT * FROM users WHERE status = :status AND name LIKE :name",
  { status: 1, name: "%张%" }
);
```

### 聚合查询

```typescript
const stats = await dataSource
  .createQueryBuilder(User, "user")
  .select("COUNT(*)", "totalCount")
  .addSelect("AVG(user.age)", "averageAge")
  .addSelect("MIN(user.createdAt)", "earliestRegistration")
  .addSelect("MAX(user.createdAt)", "latestRegistration")
  .where("user.status = :status", { status: 1 })
  .getRawOne();
```

### 分页查询

```typescript
const getPaginatedUsers = async (page: number, limit: number) => {
  const [users, total] = await dataSource
    .createQueryBuilder(User, "user")
    .leftJoinAndSelect("user.profile", "profile")
    .where("user.status = :status", { status: 1 })
    .orderBy("user.createdAt", "DESC")
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();
  
  return {
    data: users,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};
```

## 事务管理配置

### 事务隔离级别

```typescript
const queryRunner = dataSource.createQueryRunner();
await queryRunner.connect();

// 设置事务隔离级别
await queryRunner.startTransaction("SERIALIZABLE");
// 或 "READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ"

try {
  // 事务操作
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

### 嵌套事务

```typescript
const queryRunner = dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  await queryRunner.manager.save(User, userData);
  
  // 创建保存点
  await queryRunner.query("SAVEPOINT sp1");
  
  try {
    await queryRunner.manager.save(Profile, profileData);
  } catch (error) {
    // 回滚到保存点
    await queryRunner.query("ROLLBACK TO sp1");
  }
  
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

## 性能优化配置

### 批量操作配置

```typescript
// 批量插入优化
await userRepository.save(users, { chunk: 1000 });

// 批量更新
await userRepository
  .createQueryBuilder()
  .update(User)
  .set({ status: 0 })
  .where("id IN (:...ids)", { ids: [1, 2, 3, 4, 5] })
  .execute();

// 批量删除
await userRepository
  .createQueryBuilder()
  .delete()
  .from(User)
  .where("id IN (:...ids)", { ids: [1, 2, 3] })
  .execute();
```

### 索引配置

```typescript
@Entity("users")
@Index(["email", "name"]) // 复合索引
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index() // 单列索引
  email: string;

  @Column()
  @Index({ unique: true }) // 唯一索引
  username: string;

  @Column()
  name: string;
}
```

### 查询缓存配置

```typescript
const users = await userRepository
  .createQueryBuilder("user")
  .where("user.status = :status", { status: 1 })
  .cache(true) // 启用查询缓存
  .getMany();

// 自定义缓存
const users = await userRepository
  .createQueryBuilder("user")
  .where("user.status = :status", { status: 1 })
  .cache("users_active", 60000) // 缓存 key 和持续时间（毫秒）
  .getMany();
```

## 监听器和订阅者

### 实体监听器

```typescript
@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
  }

  @BeforeUpdate()
  beforeUpdate() {
    this.updatedAt = new Date();
  }

  @AfterLoad()
  afterLoad() {
    // 实体加载后的逻辑
  }

  @AfterInsert()
  afterInsert() {
    // 插入后的逻辑
  }

  @AfterUpdate()
  afterUpdate() {
    // 更新后的逻辑
  }

  @AfterRemove()
  afterRemove() {
    // 删除后的逻辑
  }
}
```

### 订阅者

```typescript
import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent, RemoveEvent } from "typeorm";

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    console.log("Before User Insert:", event.entity);
  }

  afterInsert(event: InsertEvent<User>) {
    console.log("After User Insert:", event.entity);
  }

  beforeUpdate(event: UpdateEvent<User>) {
    console.log("Before User Update:", event.entity);
  }

  afterUpdate(event: UpdateEvent<User>) {
    console.log("After User Update:", event.entity);
  }

  beforeRemove(event: RemoveEvent<User>) {
    console.log("Before User Remove:", event.entity);
  }

  afterRemove(event: RemoveEvent<User>) {
    console.log("After User Remove:", event.entity);
  }
}
```

## 迁移配置

### 迁移文件模板

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1638360000000 implements MigrationInterface {
    name = 'CreateUsersTable1638360000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(100) NOT NULL,
                "email" VARCHAR(200) UNIQUE NOT NULL,
                "phone" VARCHAR(20),
                "status" SMALLINT DEFAULT 1,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_users_email" ON "users" ("email")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_users_status" ON "users" ("status")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_users_status"`);
        await queryRunner.query(`DROP INDEX "IDX_users_email"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
```

### 迁移运行命令

```bash
# 生成迁移
npx typeorm migration:create src/migration/CreateUsersTable

# 自动生成迁移（基于实体变更）
npx typeorm migration:generate src/migration/UpdateUsersTable -d src/data-source.ts

# 运行迁移
npx typeorm migration:run -d src/data-source.ts

# 回滚迁移
npx typeorm migration:revert -d src/data-source.ts

# 显示迁移状态
npx typeorm migration:show -d src/data-source.ts
```

## 日志配置

### 日志级别

```typescript
{
  logging: ["query", "error", "schema", "warn", "info", "log"],
  logger: "advanced-console" // 或 "file", "simple-console"
}
```

### 自定义日志器

```typescript
import { Logger } from "typeorm";

export class CustomLogger implements Logger {
  logQuery(query: string, parameters?: any[]) {
    console.log("Query:", query);
    console.log("Parameters:", parameters);
  }

  logQueryError(error: string, query: string, parameters?: any[]) {
    console.error("Query Error:", error);
    console.error("Query:", query);
    console.error("Parameters:", parameters);
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    console.warn("Slow Query:", time, "ms");
    console.warn("Query:", query);
    console.warn("Parameters:", parameters);
  }

  logSchemaBuild(message: string) {
    console.log("Schema Build:", message);
  }

  logMigration(message: string) {
    console.log("Migration:", message);
  }

  log(level: "log" | "info" | "warn", message: any) {
    console.log(level.toUpperCase(), message);
  }
}

// 使用自定义日志器
{
  logger: new CustomLogger()
}
```

## 错误处理

### 常见错误及解决方案

#### 1. 连接错误

```typescript
try {
  await AppDataSource.initialize();
} catch (error) {
  if (error.code === "ECONNREFUSED") {
    console.error("数据库连接被拒绝，请检查数据库服务是否启动");
  } else if (error.code === "28P01") {
    console.error("认证失败，请检查用户名和密码");
  } else if (error.code === "3D000") {
    console.error("数据库不存在");
  } else {
    console.error("数据库连接错误:", error);
  }
}
```

#### 2. 查询错误

```typescript
try {
  const users = await userRepository.find();
} catch (error) {
  if (error.code === "42P01") {
    console.error("表不存在");
  } else if (error.code === "42703") {
    console.error("列不存在");
  } else if (error.code === "23505") {
    console.error("唯一约束冲突");
  } else {
    console.error("查询错误:", error);
  }
}
```

#### 3. 事务错误

```typescript
const queryRunner = dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  // 事务操作
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  
  if (error.code === "40001") {
    console.error("序列化失败，请重试事务");
  } else if (error.code === "40P01") {
    console.error("死锁检测");
  } else {
    console.error("事务错误:", error);
  }
  
  throw error;
} finally {
  await queryRunner.release();
}
```

## 最佳实践配置

### 生产环境配置

```typescript
export const productionConfig: DataSourceOptions = {
  type: "xugudb",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  
  // 连接池
  poolSize: 20,
  extra: {
    connectionLimit: 50,
    acquireTimeout: 30000,
    timeout: 60000,
    reconnect: true,
    maxReconnects: 5,
    reconnectInterval: 5000
  },
  
  // SSL
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(process.env.DB_SSL_CA).toString(),
  },
  
  // 日志
  logging: false,
  logger: "file",
  
  // 同步
  synchronize: false,
  dropSchema: false,
  
  // 缓存
  cache: {
    type: "redis",
    options: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
    },
    duration: 60000,
  },
  
  // 实体和迁移
  entities: ["dist/entity/**/*.js"],
  migrations: ["dist/migration/**/*.js"],
  subscribers: ["dist/subscriber/**/*.js"],
};
```

### 开发环境配置

```typescript
export const developmentConfig: DataSourceOptions = {
  type: "xugudb",
  host: "localhost",
  port: 5138,
  username: "SYSDBA",
  password: "SYSDBA",
  database: "SYSTEM",
  
  // 连接池
  poolSize: 5,
  extra: {
    connectionLimit: 10,
  },
  
  // 日志
  logging: true,
  logger: "advanced-console",
  
  // 同步
  synchronize: true,
  
  // 实体和迁移
  entities: ["src/entity/**/*.ts"],
  migrations: ["src/migration/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"],
};
```

## 环境变量配置

### .env 文件示例

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5138
DB_USERNAME=SYSDBA
DB_PASSWORD=SYSDBA
DB_DATABASE=SYSTEM
DB_SCHEMA=SYSDBA

# 连接池配置
DB_POOL_SIZE=10
DB_CONNECTION_LIMIT=20
DB_ACQUIRE_TIMEOUT=60000
DB_TIMEOUT=60000

# SSL 配置
DB_SSL_ENABLED=false
DB_SSL_CA=/path/to/ca.pem
DB_SSL_CERT=/path/to/client-cert.pem
DB_SSL_KEY=/path/to/client-key.pem

# 日志配置
DB_LOGGING=true
DB_LOGGER=advanced-console

# 同步配置
DB_SYNCHRONIZE=true
DB_DROP_SCHEMA=false

# Redis 缓存配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 应用配置
NODE_ENV=development
APP_PORT=3000
```

### 环境变量使用

```typescript
import * as dotenv from "dotenv";
dotenv.config();

export const AppDataSource = new DataSource({
  type: "xugudb",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5138,
  username: process.env.DB_USERNAME || "SYSDBA",
  password: process.env.DB_PASSWORD || "SYSDBA",
  database: process.env.DB_DATABASE || "SYSTEM",
  poolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
  logging: process.env.DB_LOGGING === "true",
  synchronize: process.env.DB_SYNCHRONIZE === "true",
  // ... 其他配置
});
```