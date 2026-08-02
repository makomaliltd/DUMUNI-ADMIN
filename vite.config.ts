import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const define: Record<string, string> = {};
  if (env.COZE_SUPABASE_URL && !env.VITE_SUPABASE_URL) {
    define['import.meta.env.VITE_SUPABASE_URL'] = JSON.stringify(env.COZE_SUPABASE_URL);
  }
  if (env.COZE_SUPABASE_ANON_KEY && !env.VITE_SUPABASE_ANON_KEY) {
    define['import.meta.env.VITE_SUPABASE_ANON_KEY'] = JSON.stringify(env.COZE_SUPABASE_ANON_KEY);
  }

  return {
    define,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5000,
      host: '0.0.0.0',
      allowedHosts: true,
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  };
});
