// ABOUTME: Vite integration for Express server
// ABOUTME: Handles dev middleware and production static file serving

import type { Application, Request, Response } from 'express';
import express from 'express';
import path from 'path';
import fs from 'fs';
import type { Server } from 'http';
import type { UserConfig } from 'vite';
import { createServer as createViteServer } from 'vite';
import viteConfig from '../vite.config';

const isDev = process.env.COZE_PROJECT_ENV !== 'PROD';

/** resolve Vite config (it can be a function via defineConfig) */
function resolveViteConfig(mode: 'development' | 'production'): UserConfig {
  return typeof viteConfig === 'function'
    ? (viteConfig as (env: { mode: string; command: 'serve' | 'build' }) => UserConfig)({
        mode,
        command: isDev ? 'serve' : 'build',
      })
    : (viteConfig as UserConfig);
}

/**
 * 集成 Vite 开发服务器（中间件模式）
 * 传入 httpServer 以便 Vite HMR WebSocket 复用同一端口
 */
export async function setupViteMiddleware(app: Application, httpServer: Server) {
  const cfg = resolveViteConfig('development') as Record<string, unknown> & {
    server?: Record<string, unknown> & { hmr?: Record<string, unknown> };
  };
  const vite = await createViteServer({
    ...cfg,
    server: {
      ...cfg.server,
      middlewareMode: true,
      hmr: {
        ...(cfg.server?.hmr ?? {}),
        server: httpServer,
      },
    },
    appType: 'spa',
  } as Parameters<typeof createViteServer>[0]);

  // 使用 Vite middleware
  app.use(vite.middlewares);

  console.log('🚀 Vite dev server initialized');
}

/**
 * 设置生产环境静态文件服务
 */
export function setupStaticServer(app: Application) {
  const distPath = path.resolve(process.cwd(), 'dist');

  if (!fs.existsSync(distPath)) {
    console.error('❌ dist folder not found. Please run "pnpm build" first.');
    process.exit(1);
  }

  // 1. 服务静态文件（如果存在对应文件则直接返回）
  app.use(express.static(distPath));

  // 2. SPA fallback - 所有未处理的请求返回 index.html
  // 到达这里的请求说明：
  //   - 不是 API 请求（已被前面注册的路由处理）
  //   - 不是静态文件（express.static 未找到对应文件）
  //   - 需要返回 index.html 让前端路由处理
  app.use((_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  console.log('📦 Serving static files from dist/');
}

/**
 * 根据环境设置 Vite
 */
export async function setupVite(app: Application, httpServer: Server) {
  if (isDev) {
    await setupViteMiddleware(app, httpServer);
  } else {
    setupStaticServer(app);
  }
}
