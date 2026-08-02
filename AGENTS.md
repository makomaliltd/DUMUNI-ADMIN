# 项目上下文

## 项目名称
DUMUNI Admin Dashboard - 管理后台

## 技术栈

- **核心**: Vite 7, React 18, TypeScript
- **UI**: Tailwind CSS 3, Radix UI (shadcn/ui 风格)
- **数据请求**: TanStack React Query v5
- **路由**: React Router v6
- **后端**: Express
- **数据库/认证**: Supabase (Auth + 数据库)

## 目录结构

```
├── scripts/              # 构建与启动脚本
│   ├── build.sh          # 构建脚本
│   ├── dev.sh            # 开发环境启动脚本
│   ├── prepare.sh        # 预处理脚本
│   └── start.sh          # 生产环境启动脚本
├── server/               # 服务端逻辑
│   ├── routes/           # API 路由
│   │   ├── index.ts      # 路由入口
│   │   └── supabase-config.ts  # Supabase 配置接口
│   ├── src/storage/database/
│   │   └── supabase-client.ts   # Supabase 客户端
│   ├── server.ts         # Express 服务入口
│   └── vite.ts           # Vite 中间件集成
├── src/                  # 前端源码
│   ├── components/       # 可复用组件
│   │   ├── ui/           # 基础 UI 组件(button, input, card, avatar)
│   │   ├── Layout.tsx    # 主布局
│   │   ├── Sidebar.tsx   # 侧边栏导航
│   │   ├── Header.tsx    # 顶部栏
│   │   └── ProtectedRoute.tsx  # 受保护路由
│   ├── contexts/         # React Context
│   │   └── AuthContext.tsx  # 认证状态管理
│   ├── hooks/            # 自定义 Hooks
│   ├── lib/              # 工具函数与配置
│   │   ├── utils.ts      # cn() 工具函数
│   │   ├── supabase-config-inject.tsx  # Supabase 配置注入
│   │   └── supabase-browser.ts  # 浏览器端 Supabase 客户端
│   ├── pages/            # 页面组件
│   │   ├── Login.tsx     # 登录页
│   │   ├── Dashboard.tsx # 仪表盘
│   │   ├── Analytics.tsx # 数据分析
│   │   ├── Content.tsx   # 内容管理
│   │   ├── Users.tsx     # 用户管理
│   │   ├── Settings.tsx  # 系统设置
│   │   └── NotFound.tsx  # 404 页面
│   ├── store/            # 状态管理
│   ├── types/            # TypeScript 类型定义
│   │   └── index.ts      # 类型定义
│   ├── App.tsx           # 应用主组件（路由配置）
│   ├── index.css         # 全局样式 + CSS 变量
│   ├── index.tsx         # React 入口
│   └── main.ts           # 兼容文件
├── index.html            # 入口 HTML
├── package.json          # 项目依赖管理
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 配置
├── tailwind.config.js    # Tailwind CSS 配置
├── DESIGN.md             # 设计规范
└── AGENTS.md             # 本项目规范
```

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。

## 开发规范

- 使用 Tailwind CSS 进行样式开发
- 使用 CSS 变量体系（HSL）管理主题色
- 遵循 shadcn/ui 组件设计规范

### 认证规范

- 使用 Supabase Auth 进行用户认证
- 认证配置通过 `/api/supabase-config` 后端接口动态获取
- 前端使用 `SupabaseConfigProvider` 注入配置
- 受保护路由使用 `ProtectedRoute` 组件包裹
- 角色权限控制 (admin / editor / viewer)
- 登录态通过 `x-session` header 传递

### 编码规范

- 默认按 TypeScript `strict` 心智写代码
- 禁止隐式 `any` 和 `as any`
- 函数参数、返回值、事件对象必须有明确类型
- 使用 `@/` 路径别名导入模块