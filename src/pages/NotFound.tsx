import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-500">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">页面未找到</h2>
        <p className="mt-2 text-muted-foreground">您访问的页面不存在或已被移除</p>
        <Link to="/" className="mt-6 inline-block">
          <Button>返回仪表盘</Button>
        </Link>
      </div>
    </div>
  );
}