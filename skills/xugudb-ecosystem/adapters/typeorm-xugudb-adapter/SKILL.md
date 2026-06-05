---
name: typeorm-xugudb-adapter
description: TypeORM 框架适配虚谷数据库（XuguDB）的完整指南。当用户需要将基于 TypeORM 的 TypeScript/JavaScript 项目配置或适配到虚谷数据库时使用此技能，包括驱动配置、连接管理、实体定义、查询构建、事务管理等。适用于 Node.js、浏览器、Electron 等环境的 TypeScript/JavaScript 应用。
---

# TypeORM 虚谷数据库适配指南

## 概述

本技能提供 TypeORM 框架适配虚谷数据库（XuguDB）的完整配置指南。TypeORM 是一个 TypeScript/JavaScript ORM 框架，支持 MySQL、PostgreSQL、MariaDB、SQLite、MS SQL Server、Oracle 等多种数据库，现在可以通过虚谷数据库驱动支持虚谷数据库。

**适用场景：**
- Node.js 后端应用开发
- TypeScript/JavaScript 全栈应用
- Electron 桌面应用
- 浏览器端数据库操作
- 微服务架构中的数据访问层

**核心特性：**
- 支持 Active Record 和 Data Mapper 模式
- 自动生成数据库表结构
- 支持数据库迁移
- 强大的查询构建器
- 支持关系映射（一对一、一对多、多对多）
- 支持事务管理
- 支持监听器和订阅者

## 快速开始

### 1. 安装依赖

**使用 npm：**
```bash
npm install typeorm reflect-metadata @xugudb/xugu-jdbc
```

**使用 yarn：**
```bash
yarn add typeorm reflect-metadata @xugudb/xugu-jdbc
```

**使用 pnpm：**
```bash
pnpm add typeorm reflect-metadata @xugudb/xugu-jdbc
```

### 2. TypeScript 配置

在 `tsconfig.json` 中添加以下配置：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. 基础配置

**创建数据源配置文件 `data-source.ts`：**

```typescript
import { DataSource } from "typeorm";
import { User } from "./entity/User";

export const AppDataSource = new DataSource({
    type: "xugudb", // 或使用 "mysql" 兼容模式
    host: "127.0.0.1",
    port: 5138,
    username: "SYSDBA",
    password: "SYSDBA",
    database: "SYSTEM",
    synchronize: true, // 开发环境自动同步实体到数据库
    logging: true,
    entities: [User],
    migrations: [],
    subscribers: [],
    extra: {
        // 虚谷数据库特定配置
        charset: "utf8",
        timezone: "+08:00"
    }
});
```

### 4. 初始化数据源

**在应用入口文件中初始化：**

```typescript
import "reflect-metadata";
import { AppDataSource } from "./data-source";

AppDataSource.initialize()
    .then(() => {
        console.log("数据源已初始化");
        // 启动应用
    })
    .catch((error) => console.log("数据源初始化失败:", error));
```

## 实体定义

### 1. 基础实体

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column({ length: 200, unique: true })
    email: string;

    @Column({ length: 20, nullable: true })
    phone: string;

    @Column({ type: "tinyint", default: 1 })
    status: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
```

### 2. 关系映射

**一对一关系：**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { Profile } from "./Profile";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(() => Profile, profile => profile.user)
    @JoinColumn()
    profile: Profile;
}

@Entity("profiles")
export class Profile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    bio: string;

    @OneToOne(() => User, user => user.profile)
    user: User;
}
```

**一对多关系：**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Photo } from "./Photo";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(() => Photo, photo => photo.user)
    photos: Photo[];
}

@Entity("photos")
export class Photo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @ManyToOne(() => User, user => user.photos)
    user: User;
}
```

**多对多关系：**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { Category } from "./Category";

@Entity("questions")
export class Question {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToMany(() => Category)
    @JoinTable()
    categories: Category[];
}

@Entity("categories")
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(() => Question, question => question.categories)
    questions: Question[];
}
```

## 数据操作

### 1. 基础 CRUD 操作

**保存实体：**
```typescript
import { AppDataSource } from "./data-source";
import { User } from "./entity/User";

const userRepository = AppDataSource.getRepository(User);

// 创建新用户
const user = new User();
user.name = "张三";
user.email = "zhangsan@example.com";
user.phone = "13800138000";
await userRepository.save(user);

// 或使用 create + save
const newUser = userRepository.create({
    name: "李四",
    email: "lisi@example.com"
});
await userRepository.save(newUser);
```

**查询数据：**
```typescript
// 查询所有用户
const allUsers = await userRepository.find();

// 查询单个用户
const user = await userRepository.findOneBy({ id: 1 });

// 条件查询
const activeUsers = await userRepository.findBy({ status: 1 });

// 查询并排序
const sortedUsers = await userRepository.find({
    order: { createdAt: "DESC" }
});

// 分页查询
const paginatedUsers = await userRepository.find({
    skip: 0,
    take: 10
});
```

**更新数据：**
```typescript
// 更新单个字段
await userRepository.update(1, { name: "新名字" });

// 使用 save 更新
const user = await userRepository.findOneBy({ id: 1 });
if (user) {
    user.name = "更新后的名字";
    await userRepository.save(user);
}
```

**删除数据：**
```typescript
// 按 ID 删除
await userRepository.delete(1);

// 按条件删除
await userRepository.delete({ status: 0 });

// 使用 remove 删除
const user = await userRepository.findOneBy({ id: 1 });
if (user) {
    await userRepository.remove(user);
}
```

### 2. 查询构建器

**基础查询：**
```typescript
const users = await userRepository
    .createQueryBuilder("user")
    .where("user.status = :status", { status: 1 })
    .orderBy("user.createdAt", "DESC")
    .getMany();
```

**复杂查询：**
```typescript
const users = await userRepository
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.photos", "photo")
    .where("user.name LIKE :name", { name: "%张%" })
    .andWhere("user.status = :status", { status: 1 })
    .orderBy("user.id", "DESC")
    .skip(0)
    .take(10)
    .getMany();
```

**聚合查询：**
```typescript
const result = await userRepository
    .createQueryBuilder("user")
    .select("COUNT(*)", "count")
    .addSelect("AVG(user.age)", "avgAge")
    .where("user.status = :status", { status: 1 })
    .getRawOne();
```

### 3. 原生 SQL 查询

```typescript
const users = await AppDataSource.query(
    "SELECT * FROM users WHERE status = ? AND name LIKE ?",
    [1, "%张%"]
);
```

## 事务管理

### 1. 使用 QueryRunner

```typescript
import { AppDataSource } from "./data-source";

const queryRunner = AppDataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
    // 执行事务操作
    await queryRunner.manager.save(User, { name: "用户1" });
    await queryRunner.manager.save(User, { name: "用户2" });
    
    // 提交事务
    await queryRunner.commitTransaction();
} catch (err) {
    // 回滚事务
    await queryRunner.rollbackTransaction();
    throw err;
} finally {
    // 释放连接
    await queryRunner.release();
}
```

### 2. 使用装饰器

```typescript
import { Transaction, TransactionManager, EntityManager } from "typeorm";

class UserService {
    @Transaction()
    async createUser(
        @TransactionManager() manager: EntityManager,
        userData: Partial<User>
    ) {
        const user = manager.create(User, userData);
        return await manager.save(user);
    }
}
```

## 数据库迁移

### 1. 配置迁移

在 `data-source.ts` 中配置迁移：

```typescript
export const AppDataSource = new DataSource({
    // ... 其他配置
    migrations: ["src/migration/*.ts"],
    migrationsTableName: "migrations"
});
```

### 2. 创建迁移

```bash
# 生成迁移文件
npx typeorm migration:create src/migration/CreateUserTable

# 自动生成迁移（基于实体变更）
npx typeorm migration:generate src/migration/UpdateUserTable -d src/data-source.ts
```

### 3. 运行迁移

```bash
# 运行所有待执行的迁移
npx typeorm migration:run -d src/data-source.ts

# 回滚最后一个迁移
npx typeorm migration:revert -d src/data-source.ts
```

### 4. 迁移文件示例

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1638360000000 implements MigrationInterface {
    name = 'CreateUserTable1638360000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(100) NOT NULL,
                "email" VARCHAR(200) UNIQUE NOT NULL,
                "phone" VARCHAR(20),
                "status" TINYINT DEFAULT 1,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
```

## Spring Boot 集成

### 1. Node.js + Express 集成

**安装依赖：**
```bash
npm install express typeorm reflect-metadata @xugudb/xugu-jdbc
npm install -D @types/express
```

**创建应用：**
```typescript
import express from "express";
import { AppDataSource } from "./data-source";
import { User } from "./entity/User";

const app = express();
app.use(express.json());

// 初始化数据源
AppDataSource.initialize().then(() => {
    const userRepository = AppDataSource.getRepository(User);

    // 获取所有用户
    app.get("/users", async (req, res) => {
        const users = await userRepository.find();
        res.json(users);
    });

    // 创建用户
    app.post("/users", async (req, res) => {
        const user = userRepository.create(req.body);
        const result = await userRepository.save(user);
        res.json(result);
    });

    // 启动服务器
    app.listen(3000, () => {
        console.log("服务器运行在 http://localhost:3000");
    });
});
```

### 2. NestJS 集成

**安装依赖：**
```bash
npm install @nestjs/typeorm typeorm reflect-metadata @xugudb/xugu-jdbc
```

**配置模块：**
```typescript
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entity/User";

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: "xugudb",
            host: "127.0.0.1",
            port: 5138,
            username: "SYSDBA",
            password: "SYSDBA",
            database: "SYSTEM",
            entities: [User],
            synchronize: true,
        }),
        TypeOrmModule.forFeature([User]),
    ],
})
export class AppModule {}
```

## 性能优化

### 1. 连接池配置

```typescript
export const AppDataSource = new DataSource({
    // ... 其他配置
    poolSize: 10, // 连接池大小
    extra: {
        connectionLimit: 20,
        acquireTimeout: 60000,
        timeout: 60000,
    }
});
```

### 2. 查询优化

**使用索引：**
```typescript
@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 200 })
    @Index()
    email: string;

    @Column({ length: 100 })
    @Index()
    name: string;
}
```

**批量操作：**
```typescript
// 批量插入
const users = [
    { name: "用户1", email: "user1@example.com" },
    { name: "用户2", email: "user2@example.com" },
    // ...
];
await userRepository.save(users, { chunk: 1000 });

// 批量更新
await userRepository
    .createQueryBuilder()
    .update(User)
    .set({ status: 0 })
    .where("createdAt < :date", { date: "2024-01-01" })
    .execute();
```

### 3. 缓存配置

```typescript
export const AppDataSource = new DataSource({
    // ... 其他配置
    cache: {
        duration: 30000, // 30秒缓存
        type: "redis",
        options: {
            host: "localhost",
            port: 6379,
        }
    }
});
```

## 测试配置

### 1. 单元测试

```typescript
import { DataSource } from "typeorm";
import { User } from "./entity/User";

describe("UserRepository", () => {
    let dataSource: DataSource;

    beforeAll(async () => {
        dataSource = new DataSource({
            type: "xugudb",
            host: "127.0.0.1",
            port: 5138,
            username: "SYSDBA",
            password: "SYSDBA",
            database: "TEST_DB",
            entities: [User],
            synchronize: true,
        });
        await dataSource.initialize();
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    it("should save user", async () => {
        const userRepository = dataSource.getRepository(User);
        const user = userRepository.create({
            name: "测试用户",
            email: "test@example.com"
        });
        const savedUser = await userRepository.save(user);
        expect(savedUser.id).toBeDefined();
    });
});
```

### 2. 集成测试

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserService } from "./user.service";
import { User } from "./entity/User";

describe("UserService", () => {
    let service: UserService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: "xugudb",
                    host: "127.0.0.1",
                    port: 5138,
                    username: "SYSDBA",
                    password: "SYSDBA",
                    database: "TEST_DB",
                    entities: [User],
                    synchronize: true,
                }),
                TypeOrmModule.forFeature([User]),
            ],
            providers: [UserService],
        }).compile();

        service = module.get<UserService>(UserService);
    });

    it("should create user", async () => {
        const user = await service.createUser({
            name: "测试用户",
            email: "test@example.com"
        });
        expect(user).toBeDefined();
        expect(user.id).toBeDefined();
    });
});
```

## 常见问题与解决方案

### 1. 连接失败

**问题**：无法连接到虚谷数据库。

**解决方案**：
- 检查数据库服务是否启动
- 验证连接参数（host、port、username、password）
- 确认驱动已正确安装
- 检查网络连接和防火墙设置

### 2. 实体同步失败

**问题**：`synchronize: true` 无法自动创建表。

**解决方案**：
- 确保数据库用户有创建表的权限
- 检查实体定义是否正确
- 查看日志获取详细错误信息
- 手动执行迁移脚本

### 3. 查询性能问题

**问题**：查询速度慢。

**解决方案**：
- 为常用查询字段创建索引
- 使用查询构建器优化复杂查询
- 启用查询缓存
- 使用分页查询避免大量数据返回

### 4. 事务问题

**问题**：事务不生效或回滚失败。

**解决方案**：
- 确保使用 QueryRunner 管理事务
- 检查数据库连接的自动提交设置
- 在事务中避免长时间操作
- 正确处理异常和回滚

## 最佳实践

### 1. 实体设计
- 使用装饰器定义实体和关系
- 为常用查询字段添加索引
- 使用枚举类型定义状态字段
- 添加创建时间和更新时间字段

### 2. 数据源配置
- 区分开发、测试、生产环境配置
- 使用环境变量管理敏感信息
- 配置合适的连接池大小
- 启用日志记录便于调试

### 3. 迁移管理
- 使用迁移管理数据库变更
- 编写可回滚的迁移脚本
- 在生产环境禁用自动同步
- 定期备份数据库

### 4. 性能优化
- 使用批量操作减少数据库往返
- 避免 N+1 查询问题
- 启用查询缓存
- 定期分析慢查询

### 5. 安全防护
- 使用参数化查询防止 SQL 注入
- 限制数据库访问权限
- 启用 SSL 加密连接
- 定期更新依赖版本

## 相关资源

- [TypeORM 官方文档](https://typeorm.io/)
- [TypeORM GitHub 仓库](https://github.com/typeorm/typeorm)
- [虚谷数据库官方文档](https://www.xugudb.com)
- [TypeORM 虚谷数据库驱动](https://github.com/Xugu-Open-Source/typeorm)

## 参考文档

详细配置信息请参考：`references/typeorm-configuration.md`