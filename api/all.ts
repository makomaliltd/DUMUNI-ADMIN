import express, { type Request, type Response, type NextFunction } from 'express';
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

/**
 * Vercel ne route vers cette fonction que les chemins `api/` d'un seul segment.
 * `vercel.json` réécrit donc `/api/<reste>` en `/api/all?p=<reste>` ; on
 * reconstruit ici l'URL d'origine avant de la confier au router Express.
 */
app.use((req: Request, _res: Response, next: NextFunction) => {
  const raw = req.url || '';
  const sep = raw.indexOf('?');
  const query = sep >= 0 ? raw.slice(sep + 1) : '';
  const rest = query
    .split('&')
    .find((part) => part.startsWith('p='))
    ?.slice(2);

  if (rest) {
    const decoded = decodeURIComponent(rest);
    const kept = query
      .split('&')
      .filter((part) => part && !part.startsWith('p='))
      .join('&');
    req.url = `/api/${decoded.replace(/^\//, '')}${kept ? `?${kept}` : ''}`;
  }
  next();
});

app.use(serverRouter);

app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Handler serverless Vercel : typage Express, délégation à l'app.
export default function handler(req: unknown, res: unknown) {
  return app(req as Request, res as Response);
}
