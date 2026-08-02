import { Router } from 'express';
import supabaseConfigRouter from './supabase-config';
import usersRouter from './users';
import restaurantsRouter from './restaurants';
import driversRouter from './drivers';
import ordersRouter from './orders';
import financeRouter from './finance';
import contentRouter from './content';
import reportsRouter from './reports';
import settingsRouter from './settings';

const router = Router();

// Supabase config route
router.use(supabaseConfigRouter);

// User management routes
router.use(usersRouter);

// Restaurant & seller routes
router.use(restaurantsRouter);

// Driver management routes
router.use(driversRouter);

// Order management routes
router.use(ordersRouter);

// Financial management routes
router.use(financeRouter);

// Content management routes
router.use(contentRouter);

// Settings & admin management routes
router.use(settingsRouter);

// Reports & analytics routes
router.use('/api/reports', reportsRouter);

// Health check
router.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: process.env.COZE_PROJECT_ENV,
    timestamp: new Date().toISOString(),
  });
});

export default router;