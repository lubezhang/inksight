# InkSight Services

基于 NestJS 11、Express 和 TypeScript strict 的后端基础工程，使用 Node.js 24。

## 本地启动

```bash
cd services
nvm use
npm ci
cp .env.example .env
npm run dev
```

默认监听 `0.0.0.0:8080`，通过 `HOST` 和 `PORT` 修改。环境变量只从进程环境和 `services/.env` 加载；进程环境优先，配置非法时启动失败。

健康检查支持两个入口：

```bash
curl http://127.0.0.1:8080/api/health
curl http://127.0.0.1:8080/api/v1/health
```

默认响应为 `{"status":"ok","version":"1.1.0"}`。这是进程存活检查，目前不检查数据库、模型服务或业务就绪状态。

## 常用命令

| 命令                   | 用途                                   |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | 开发模式，监听源码变化                 |
| `npm run start:debug`  | 开发模式及 Node Inspector（默认 9229） |
| `npm run build`        | 编译到 `dist/`                         |
| `npm start`            | 运行构建产物，需先执行 build           |
| `npm run typecheck`    | 检查源码和测试类型                     |
| `npm run lint`         | ESLint 检查，不改文件                  |
| `npm run lint:fix`     | 修复可自动处理的 ESLint 问题           |
| `npm run format:check` | 格式检查                               |
| `npm run format`       | 格式化文件                             |
| `npm test`             | 单元测试                               |
| `npm run test:e2e`     | 完整 Nest 应用的 HTTP 集成测试         |
| `npm run test:cov`     | 单元测试覆盖率                         |

## 目录和职责

```text
src/
├── main.ts                  # 启动、监听及优雅退出
├── app.module.ts            # 根模块，注册各业务模块
├── config/                  # ConfigModule、类型化环境配置及校验
├── common/                  # 全局路由、CORS 和参数校验配置
├── infrastructure/
│   ├── database/
│   ├── cache/
│   ├── logging/
│   └── storage/
└── modules/                 # 按迁移文档创建的业务模块
    ├── identity/            # 身份和凭据
    ├── users/               # 资料、偏好和模型配置
    ├── devices/             # 设备状态、成员和告警
    ├── device-config/       # 配置、版本及激活
    ├── pairing/             # 配对和绑定
    ├── billing/             # 额度和邀请兑换
    ├── modes/               # 模式、布局 DSL、发布和安装
    ├── environment/         # 地点、天气和日期
    ├── content/             # 内容生成和降级
    ├── rendering/           # 设备渲染、预览和小组件
    ├── media/               # 上传、字体、图像和编码
    ├── engagement/          # 收藏、历史和习惯
    ├── vocabulary/          # 词库和复习
    ├── voice/               # 语音会话和原生 WebSocket
    ├── firmware/            # 固件和 OTA
    ├── analytics/           # 活动、统计和管理查询
    ├── notifications/       # 邮件和推送
    ├── jobs/                # 调度和任务生命周期
    ├── pages/               # 兼容页面和控制台
    └── health/              # 已实现的 Controller + Service 示例
resources/                  # 内置模式、词库、字体和静态资源
var/                        # 数据库、上传、自定义模式等可写数据
migrations/                 # 后续数据库迁移
scripts/                    # 后续资源、调试及部署工具
test/                       # unit、integration、contract、golden-render、e2e
```

业务模块已创建并注册，其中健康检查具备实际接口，其余模块仅声明模块入口。基础设施、资源和测试目录通过 `.gitkeep` 保留，数据库连接、认证、业务接口和任务调度随后续迁移逐项实现。

新增能力放入相应业务模块，通过 DTO/Pipe 校验参数、Guard/Policy 判断权限、Service 执行业务用例、模块内部 Repository 访问数据。跨模块只依赖公开 Provider。`HealthModule` 可作为 Nest 依赖注入示例。

全局请求配置同时用于开发启动和 E2E 测试，包含 `/api`、`/api/v1` 双前缀、DTO 转换/白名单和带凭据的 CORS 白名单。接口的精确错误格式、权限、Host/Origin 校验及限流将按原业务契约在后续迁移中补齐。

`resources/` 存放构建资源；`var/` 存放可写数据并由忽略规则保护，生产环境应配置持久化卷。当前工程不读取旧后端的数据库、密钥和上传文件。

迁移设计与后续任务见 [迁移文档](../docs/2026-11-13-backend-nestjs-ts-migration.md)。
