import express, { type Request, type Response, type NextFunction } from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverRouter from '../server/routes';

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.use(serverRouter);

app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as unknown as Request, res as unknown as Response);
}
