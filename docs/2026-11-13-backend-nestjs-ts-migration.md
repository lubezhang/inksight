# InkSight 后端迁移方案：`backend` → `services` / NestJS + TypeScript

- 日期：2026-11-13
- 状态：迁移设计稿
- 基线分支：`migration/backend-nestjs-ts`
- 基线提交：`4d8c673`
- 目标目录：`services/`
- 适用范围：InkSight 后端全部业务逻辑、运行时脚本、测试、调试和部署入口

## 1. 目标与边界

本次迁移将当前 `backend/` 中由 FastAPI、Python 和 `aiosqlite` 承载的后端业务迁移到 `services/`，技术栈改为 NestJS + TypeScript。迁移完成后，设备、WebApp、移动端和运维脚本继续通过现有 API 协议访问服务，调用方不需要同步修改协议。

“全部业务逻辑”包含 HTTP 路由背后的认证、配置、设备状态、渲染、模式、LLM、天气、缓存、统计、语音、OTA、上传、调度和词汇复习逻辑，也包含数据库迁移、运行时资源加载和后端联调脚本。字体、模式 JSON、艺术图和运行时上传文件属于服务运行资源，应迁移到 `services/resources/` 或由部署卷挂载；WebApp 和固件仍是独立工程。

本方案先保证行为兼容，再进行内部重构。`/api` 与 `/api/v1` 两个前缀、设备认证头、用户 Cookie、管理端鉴权、JSON 字段、HTTP 状态码、BMP/PNG 输出、SSE 事件和 WebSocket 消息都作为迁移契约冻结。迁移期间不删除原 `backend/`，只有在双跑、回滚和数据核验完成后才清理旧入口。

## 2. 现状基线

当前 FastAPI 入口为 `backend/api/index.py`，启动生命周期初始化主数据库、统计表、缓存数据库、静态表和设备状态兼容列。路由在 `backend/api/routes/__init__.py` 注册，并分别挂载到 `/api` 和 `/api/v1`。

### 2.1 API 业务域

| 现有模块 | 主要职责 | NestJS 目标模块 |
| --- | --- | --- |
| `render.py` | 设备渲染、浏览器预览、流式预览、缓存清理 | `render` |
| `device.py` | 心跳、状态、刷新、模式切换、收藏、历史、习惯、告警、绑定和分享 | `device`、`device-alert`、`device-content` |
| `config.py` | 配置保存、读取、历史、激活、专注监听 | `device-config` |
| `admin_devices.py` | root 管理员设备列表和配置编辑 | `admin-devices` |
| `admin_pairing.py` | 配对码查询、创建、失效 | `admin-pairing` |
| `admin_analytics.py` | 页面访问记录、后台概览和历史统计 | `admin-analytics` |
| `auth.py` | 注册、登录、登出、重置密码、邀请兑换、当前用户 | `auth` |
| `user.py` | 用户资料、设备成员、设备请求、邮箱、用户模型配置 | `user` |
| `mobile.py` | 今日内容、偏好、推送令牌、小组件数据 | `mobile` |
| `modes.py` | 模式目录、预览、创建、删除、AI 生成 | `modes` |
| `discover.py` | 共享模式发布和安装 | `discover` |
| `voice.py` | 用户/设备语音会话、SSE、音频和图片、设备 WebSocket | `voice` |
| `firmware.py` | 固件健康检查、GitHub Releases、校验和下载代理 | `firmware` |
| `device_ota.py` | OTA 触发、状态、取消、进度 | `device-ota` |
| `stats.py` | 统计概览、设备统计、渲染历史 | `stats` |
| `uploads.py` | 图片上传、元数据、下载和清理 | `uploads` |
| `locations.py` | 地点搜索 | `locations` |
| `pages.py` | 兼容页面、控制台、静态资源和缩略图 | `compat-pages` |

迁移后的 Controller 只做参数解析、响应编码和鉴权组合；所有查询、状态变更、渲染和外部调用放在 Service、领域服务或 Repository 中。

### 2.2 核心业务域

| 现有文件 | 迁移职责 |
| --- | --- |
| `config_store.py`、`static_store.py`、`db.py` | 数据访问、配置历史、设备状态、用户和设备关系 |
| `pipeline.py`、`content.py`、`json_content.py`、`context.py` | 内容生成、天气/日期上下文、LLM、外部数据和模式调度 |
| `mode_registry.py`、`mode_catalog.py`、`mode_generator.py`、`layout_presets.py` | 模式加载、校验、目录、布局 DSL 和 AI 生成 |
| `renderer.py`、`json_renderer.py`、`image_processing.py` | 文本/图片布局、字体、图像处理、BMP/PNG 输出 |
| `native_dither.py`、`native/eink_dither.cpp` | Atkinson 黑白/调色板抖动 |
| `cache.py` | 内存缓存、SQLite 持久化缓存、预生成、TTL 和缓存失效 |
| `voice_service.py` | 语音会话、ASR/TTS、LLM 流式响应、Opus、临时图片和音频 |
| `auth.py`、`crypto.py`、`i18n.py`、`errors.py` | JWT、设备令牌、root 权限、API Key 加密、多语言错误 |
| `stats_store.py`、`activity_store.py` | 心跳、渲染、内容历史、页面活动和统计聚合 |
| `scheduler.py` | 每日/每周内容任务和运行时调度 |
| `vocab_store.py` | 词库、复习进度和设备复习会话 |

### 2.3 存储与资源

- `inksight.db`：主业务 SQLite 数据库。
- `cache.db`：图像和黄历缓存 SQLite 数据库。
- `backend/migrations/__init__.py`：主库递增迁移和 `schema_versions` 记录。
- `runtime_uploads/`：用户上传图片与元数据，需要持久化卷。
- `fonts/`、`static/`、`core/modes/`、`core/vocab_data/`：服务运行时资源。
- `.env.example`：LLM、语音、天气、翻译、SMTP、鉴权、数据库、上传、字体和调试配置。

当前数据库使用 WAL 和 busy timeout，并存在多次增列、兼容旧表、活动记录、推送、共享模式和词汇复习迁移。迁移不能通过重新建空库替代数据迁移。

## 3. 目标目录结构

```text
services/
├── package.json
├── package-lock.json
├── tsconfig.json
├── nest-cli.json
├── eslint.config.mjs
├── jest.config.ts
├── .env.example
├── src/
│   ├── main.ts                 # HTTP、WebSocket、全局管道、过滤器、CORS、Host
│   ├── app.module.ts           # 根模块与生命周期
│   ├── config/                 # 环境变量 schema、默认值和配置访问
│   ├── common/                 # request id、日志、错误、限流、响应辅助
│   ├── auth/                   # JWT、Cookie、设备令牌、root/user/device guards
│   ├── database/               # SQLite 连接、Repository、迁移、备份/健康检查
│   ├── render/                 # render、preview、widget、SSE
│   ├── content/                # pipeline、LLM、外部数据、上下文
│   ├── modes/                  # registry、catalog、JSON schema、custom/discover
│   ├── layout/                 # 布局 DSL 与渲染块
│   ├── image/                  # sharp/SVG、字体、BMP/PNG、抖动、缩放
│   ├── cache/                  # 内存/SQLite cache、TTL、预生成
│   ├── device/                 # 设备状态、心跳、配置、成员、告警、收藏、历史
│   ├── voice/                  # HTTP、SSE、WebSocket、ASR/TTS、会话清理
│   ├── firmware/               # Releases、下载、OTA、设备在线判断
│   ├── user/                   # 用户资料、偏好、推送、额度
│   ├── stats/                  # 统计、活动、管理概览
│   ├── uploads/                # 上传、访问、清理、元数据
│   ├── locations/              # 地点搜索
│   ├── scheduler/              # 定时任务和单实例/租约控制
│   └── compat-pages/           # 旧版页面与静态文件兼容入口
├── resources/
│   ├── modes/builtin/          # 原 core/modes/builtin
│   ├── modes/custom/           # 原 custom 目录，继续由忽略规则保护
│   ├── vocab_data/
│   ├── fonts/
│   └── static/
├── migrations/                 # 可审计的 TypeScript/SQL 迁移
├── scripts/                    # 迁移、字体、词库、抖动、联调脚本
└── test/
    ├── unit/
    ├── integration/
    ├── contract/
    ├── golden-render/
    └── e2e/
```

目标代码不得通过 `import` 依赖 `backend`。迁移期间若需要复用资源，应复制到 `services/resources` 并由测试验证内容哈希；不得形成反向运行时依赖。

## 4. 技术栈建议

### 4.1 应用运行时

- Node.js 20 LTS（或在实施开始时统一决定 Node 22 LTS），CI、开发和生产保持同一主版本。
- NestJS、TypeScript strict、`@nestjs/config`、`@nestjs/platform-express`。
- 初期使用 Express 适配器，降低现有中间件、SSE、二进制响应和代理行为差异；性能稳定后再评估 Fastify。
- `pino`/Nest Logger 输出结构化日志，保留 request id、设备 MAC、路由、状态码和耗时，禁止打印令牌、Cookie 和 API Key。

### 4.2 数据库

建议先采用 Drizzle ORM + `better-sqlite3`，使用类型化 Repository 和显式 SQL 迁移。迁移前用渲染、语音、批量预生成和并发心跳压测验证同步 SQLite 驱动是否阻塞事件循环；如不满足，再切换异步 SQLite 驱动，Repository 接口保持不变。

所有迁移脚本必须：

1. 支持现有 `inksight.db` 和 `cache.db` 的备份后原地升级。
2. 保留表名、主键、索引、唯一约束、默认值和时间字段语义。
3. 记录迁移版本、名称和时间，并提供失败恢复信息。
4. 提供只读校验命令，对比表数量、记录数量、关键聚合、配置哈希和最新心跳。

### 4.3 鉴权与加密

- JWT 继续使用 HS256，并保持 `ink_session` Cookie、`sub`、`username`、过期时间和 `SameSite=Lax` 语义。
- `X-Device-Token`、root 管理员 Bearer Token、用户 Cookie/Bearer 兼容现有路由。
- MAC 地址校验、设备成员角色、owner/root 规则迁移为 Guards + Policy Service。
- 现有 Fernet 加密 API Key 不能简单改成 AES-GCM；Node 端需实现与现有 Fernet 兼容的解密/加密适配器，先用固定测试向量验证，再切换写入。
- `ENCRYPTION_KEY`、`JWT_SECRET`、`ADMIN_TOKEN` 只从运行环境或受保护文件读取，不进入仓库和日志。

### 4.4 LLM、外部服务与调度

- 文本模型使用 npm `openai` 的 OpenAI-compatible client，按 provider 配置保留 DeepSeek、DashScope、Moonshot 和用户自定义配置。
- 天气、GitHub Releases、地点、翻译、邮件等外部调用统一封装为带超时、重试、取消和错误分类的 Provider。
- `@nestjs/schedule` 可替换 APScheduler；生产多实例必须加入租约/分布式锁，防止每日和每周任务重复执行。
- DashScope ASR/TTS WebSocket 使用独立 adapter，明确 upstream 连接超时、最大事件大小、心跳、取消和关闭时清理规则。

### 4.5 图像、字体与抖动

- 首选 `sharp` 负责图片读取、缩放、格式转换；文字布局可通过 SVG overlay 或经验证的 Canvas/Skia 实现。
- TTF 继续作为矢量字体来源；PCF 点阵字体需要保留兼容读取路径或在迁移阶段转换为服务可读格式。
- 黑白、三色、四色调色板和 BMP 字节协议必须以现有输出为黄金样本。
- 原生 Atkinson 抖动先通过 N-API/WASM/独立 worker adapter 接入；纯 TypeScript 实现只在性能和像素差异达到门槛后替代。
- 大图渲染放入 worker thread 或队列，避免阻塞 NestJS 事件循环。

## 5. API 兼容契约

迁移阶段固定以下行为：

| 契约 | 兼容要求 |
| --- | --- |
| 基础路径 | 同时提供 `/api` 和 `/api/v1` |
| 设备认证 | 继续读取 `X-Device-Token`，区分缺失和无效 Token |
| 用户认证 | 继续读写 `ink_session` Cookie，并接受用户 Bearer Token |
| 管理认证 | 保留 root 用户会话与 `ADMIN_TOKEN` 兼容逻辑，逐步收敛后再移除旧方式 |
| 内容响应 | 保持 `image/bmp`、`image/png`、`application/json`、SSE 的 Content-Type 和状态码 |
| 设备响应头 | 保留 `X-Pending-Refresh`、`X-Content-Fallback`、`X-Preview-Push` 等现有语义 |
| 流式响应 | 保持事件名、JSON 字段、结束事件和错误事件顺序 |
| WebSocket | 保持 `/api/device/{mac}/voice/ws` 路径、消息格式、关闭码和音频分片语义 |
| 错误 | 把领域错误映射为现有 `{error, message}` 结构，错误状态码不因框架切换改变 |
| 资源地址 | 上传、缩略图、静态资源和 WebApp 代理地址保持可访问 |

迁移前应从现有 FastAPI 测试、`docs/api.md`、WebApp API Route 和固件请求代码生成一份契约清单。NestJS 的 Swagger 输出只能作为辅助，最终以请求/响应快照和设备实测为准。

## 6. 数据迁移方案

### 6.1 迁移前保护

1. 停止写入或进入短暂维护窗口。
2. 复制并校验 `inksight.db`、`cache.db`、`runtime_uploads/`、字体和模式资源。
3. 记录 SQLite schema、`schema_versions`、记录数、最新设备心跳、配置版本和用户数。
4. 备份当前 `.env`、JWT secret 文件和部署环境变量名称；凭据本身不写入迁移文档或 Git。

### 6.2 主库迁移

先让 NestJS 直接读取原表结构，完成只读查询和统计对账，再执行结构改造。首个 TypeScript migration 应兼容现有 `schema_versions`，必要时把既有版本标记为已应用，避免重复执行旧迁移。

关键对象包括：

- `configs`、`device_state`、配置历史和模式覆盖。
- `users`、`user_devices`、`device_memberships`、`device_access_requests`。
- `device_claim_tokens`、`invitation_codes`、`api_quotas`、`user_llm_config`。
- `user_preferences`、`push_tokens`、`shared_modes`、`custom_modes`。
- `render_logs`、`device_heartbeats`、`content_history`、`habit_records`。
- `user_activity_events`、`vocab_items`、`vocab_progress`、`vocab_session_state`。

缓存库可以在切换时清空并按策略预热，但主库、上传文件和模式定义不得丢失。清空缓存必须有显式命令和日志。

### 6.3 双写、对账与回滚

迁移早期只读双跑：同一请求分别调用旧服务和 NestJS，比较状态码、关键 JSON 字段、图像摘要和数据库副作用。需要写入时采用旧服务主写、NestJS 镜像写入；镜像失败应告警并可重放，不能阻塞旧服务。

切换条件满足后再改为 NestJS 主写。保留旧服务和数据库备份，设定明确回滚窗口；回滚前必须确认没有由新结构写入旧服务无法理解的数据。

## 7. 调试、脚本与开发体验

### 7.1 `services/package.json` 脚本

建议至少提供：

```text
npm run dev                 # Nest watch mode
npm run build               # 编译 dist
npm run start               # 生产进程
npm run start:debug         # inspector + debug 日志
npm run lint                # ESLint
npm run format:check        # Prettier 检查
npm run typecheck           # tsc --noEmit
npm test                    # 单元测试
npm run test:integration    # SQLite/HTTP/外部服务 stub
npm run test:contract       # API 契约回归
npm run test:golden         # 图像黄金样本
npm run db:migrate         # 执行迁移
npm run db:status           # 查看迁移状态
npm run db:backup           # 备份主库、缓存库和上传资源
npm run assets:fonts        # 下载/校验字体
npm run assets:vocab        # 下载/生成词库数据
npm run native:dither       # 构建或检查原生抖动适配器
npm run debug:focus-alert   # 专注告警联调
npm run debug:device        # 设备心跳/渲染/状态检查
```

脚本应支持 `--base-url`、`--mac`、`--token`、`--json` 等参数，默认不打印敏感值。设备联调脚本需要明确区分模拟请求和真实设备请求。

### 7.2 日志和本地调试

- 默认监听 `0.0.0.0:8080`，保持 WebApp 的 `INKSIGHT_BACKEND_API_BASE` 默认值不变。
- 开发环境允许局域网 CORS 和详细日志，生产环境使用明确 Host/Origin 白名单。
- 为每个请求附加 request id；设备 MAC、用户 id 和 route 可记录，Token、Cookie、API Key 和音频内容不得记录。
- 为 render、preview、voice、OTA、upload 提供可控 debug flag 和耗时指标。
- 为上游 LLM、天气、GitHub、DashScope 提供 mock adapter，单元测试不能依赖真实 Key 或网络。

### 7.3 旧 Python 脚本处理

以下脚本需要迁移为 TypeScript 或 Node CLI，并在文档中改写调用方式：

- `backend/scripts/setup_fonts.py` → `services/scripts/setup-fonts.ts`
- `backend/scripts/import_kylebing_vocab.py` → `services/scripts/import-vocab.ts`
- `backend/scripts/build_native_dither.py` → `services/scripts/build-native-dither.ts`（调用 node-gyp/CMake 或检查构建产物）
- `backend/scripts/test_focus_alert.py` → `services/scripts/test-focus-alert.ts`

词库和字体的外部下载应增加 URL、校验和、超时、断点/临时文件和重复执行保护。迁移期间可保留 Python 工具作为一次性资源生成器，但运行时和 CI 不能再依赖 Python 后端。

## 8. CI、部署和发布改造

### 8.1 CI

将 `.github/workflows/ci.yml` 的后端任务替换为 Node 任务，同时保留 WebApp 和固件任务：

1. `actions/setup-node` 固定 Node 主版本。
2. 在 `services/` 执行 `npm ci`，缓存 `services/package-lock.json`。
3. 运行 lint、format check、typecheck、unit、integration、contract 和 golden-render。
4. 使用临时 SQLite 文件、模拟外部 Provider 和测试环境变量。
5. 迁移期间保留 Python pytest 作为 parity job；当所有测试等价迁移并完成切换后删除。
6. 在 PR 中上传 API 契约差异、图像黄金样本差异和数据库对账报告。

### 8.2 本地部署

更新 `docs/deploy.md`、`docs/en/deploy.md`、`docs/faq.md`、`CONTRIBUTING.md`、README 和语音文档：

```bash
cd services
npm ci
npm run db:migrate
npm run dev
```

本地入口仍为 `http://127.0.0.1:8080`。WebApp 的 `INKSIGHT_BACKEND_API_BASE`、移动端的 `EXPO_PUBLIC_INKSIGHT_API_BASE` 和固件服务地址继续指向同一 API 基地址。

### 8.3 生产部署

现有 `backend/vercel.json` 是 `@vercel/python` 入口，迁移后不能继续作为 NestJS 生产入口。推荐使用常驻 Node 进程或容器：

- 构建阶段执行 `npm ci`、`npm run build`、资源校验和数据库迁移检查。
- 运行阶段执行 `node dist/main.js`，通过反向代理提供 HTTPS、压缩、超时和 WebSocket 转发。
- 主库和 `runtime_uploads` 使用持久化卷；容器实例不能把本地临时盘当作唯一存储。
- 语音 WebSocket、SSE 和 OTA 下载需要设置足够的连接/读取超时，并验证代理不会缓冲流式响应。
- 调度任务只在一个 worker 或获得租约的实例中运行。
- 发布采用蓝绿或 canary；健康检查至少覆盖 `/api/health`、数据库读取、模式加载和上传目录可写性。

如果必须继续使用 Vercel，应把短请求 API 与长期 WebSocket/流式语音拆分，Node Serverless 只承载无状态短请求，realtime 服务单独部署，并更新 WebApp 和固件的路由配置。

### 8.4 回滚

发布包保留上一版本 `dist`、锁文件、迁移版本、数据库备份和资源清单。回滚顺序为：停止新实例 → 恢复旧服务 → 验证主库和设备心跳 → 恢复 WebApp 代理 → 再处理新版本产生的可重放写入。禁止使用 `git reset --hard` 或删除数据库文件作为回滚手段。

## 9. 分阶段实施计划

- [ ] **阶段 0：契约冻结**。收集现有测试、API 文档、WebApp 代理和固件请求；建立 JSON/SSE/WebSocket/图像黄金样本。
- [ ] **阶段 1：NestJS 骨架**。创建 `services/`、配置、日志、异常、CORS、Host、限流、健康检查和双前缀路由。
- [ ] **阶段 2：数据库与鉴权**。接入 SQLite、迁移状态、Repository、JWT、Cookie、设备令牌、root/user/member 权限；只读对账通过。
- [ ] **阶段 3：配置、设备和统计**。迁移设备状态、配置历史、心跳、收藏、历史、习惯、活动、配对、成员和统计。
- [ ] **阶段 4：模式、内容和渲染**。迁移 JSON 模式 registry、上下文、LLM provider、pipeline、布局、字体、图片、BMP/PNG 和缓存；黄金样本通过。
- [ ] **阶段 5：设备扩展能力**。迁移 OTA、固件 Releases、上传、地点、移动端、小组件、discover 和后台页面。
- [ ] **阶段 6：语音与后台任务**。迁移 HTTP/SSE/WebSocket、ASR/TTS、LLM 流式、Opus、会话清理和调度租约。
- [ ] **阶段 7：脚本、CI 与部署**。迁移资源脚本、联调 CLI、CI、生产入口、监控、备份和回滚。
- [ ] **阶段 8：双跑和切换**。执行读请求 diff、镜像写入、真实设备验证、灰度流量和回滚演练。
- [ ] **阶段 9：清理**。确认旧服务无流量、数据和资源已迁移，删除 Python 运行入口和过期文档引用，保留迁移记录和最终备份。

每个阶段完成后更新本文件的复选框、测试报告、数据对账结果和未解决风险；不能以“编译成功”作为阶段完成条件。

## 10. 验收标准

### API 与客户端

- 所有现有 API 路由在 `/api`、`/api/v1` 下通过契约测试。
- WebApp、移动端和固件无需修改即可完成登录、配置、预览、渲染、心跳、状态、OTA、上传和分享流程。
- 设备在真实硬件上收到与旧服务等价的 BMP；响应头和刷新/缓存语义正确。
- SSE 和语音 WebSocket 能完成正常、超时、取消、断线重连和上游错误场景。

### 数据与安全

- 主库迁移前后表结构、关键记录数、配置和用户关系对账一致。
- 旧 JWT、Cookie、设备令牌和 Fernet 加密 API Key 可以按兼容策略读取。
- 数据库备份、迁移失败恢复和服务回滚演练通过。
- 日志、错误和调试输出不泄露 Token、Cookie、API Key、密码或原始音频。

### 图像与性能

- 黑白、三色、四色、不同尺寸、不同语言和字体引擎的黄金样本通过允许的像素差异阈值。
- 缓存命中、TTL、批量预生成和清理行为保持一致。
- 在目标并发下，数据库、渲染、LLM、语音和上传不会阻塞事件循环或无限增长内存。

### 工程与运维

- CI 通过 lint、格式、类型、单元、集成、契约、黄金图和构建检查。
- 本地、测试、预发布、生产均可用统一 Node 命令启动。
- 健康检查、结构化日志、错误率、请求延迟、WebSocket 活跃数、队列/调度状态和外部 Provider 失败率可观测。
- 部署、灰度、回滚、数据库备份和资源恢复均有可执行脚本和文档。

## 11. 主要风险与处理原则

| 风险 | 处理原则 |
| --- | --- |
| 渲染像素差异或字体缺失 | 先建立黄金图和字体清单，渲染器 adapter 化，逐尺寸/语言验收 |
| Fernet/JWT 兼容失败 | 使用固定向量和真实脱敏数据测试，切换期间只读旧格式 |
| SQLite 同步驱动阻塞 | 先压测；必要时换异步驱动或 worker thread，Repository 接口不变 |
| WebSocket/SSE 被代理缓冲或提前断开 | 单独做长连接测试，配置代理超时和升级头，生产使用常驻服务 |
| 多实例重复调度 | 采用单 worker 或数据库租约/分布式锁，并监测重复执行 |
| 旧 API 隐含行为未记录 | 从测试、客户端、固件和线上访问日志提取契约，使用双跑 diff |
| 上传、字体和数据库使用临时盘 | 使用持久化卷、备份校验和启动时资源检查 |
| 迁移周期过长导致双写漂移 | 每阶段都做数据对账和可回放事件记录，设定明确切换窗口 |

## 12. 当前待决策项

1. 生产 Node 主版本选 20 LTS 还是 22 LTS。
2. 初期 HTTP 适配器是否固定 Express。
3. SQLite 驱动、ORM 和迁移工具的最终组合。
4. 图像文字渲染和原生抖动的实现路径。
5. 生产是否从 Vercel Python 完全迁移到常驻 Node，或拆分 realtime 服务。
6. 迁移期间是否允许旧 Python 服务与 NestJS 服务同时写入，以及镜像写入失败的重放机制。

这些决策应在阶段 0 结束前记录到 ADR，并在阶段 2、4、6 的验收中用实测结果更新，而不是仅凭框架默认行为决定。
