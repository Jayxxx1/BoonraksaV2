import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import config from './src/config/config.js';
import { errorHandler } from './src/middleware/error.middleware.js';

// Routes
import productRoutes from './routes/productRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './modules/orders/order.routes.js';
import stockRoutes from './routes/stockRoutes.js';
import blockRoutes from './routes/blockRoutes.js';
import threadRoutes from './routes/threadRoutes.js';
import productionReportRoutes from './routes/productionReportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { getCategories } from './controllers/productController.js';

const app = express();


// --- Security & Production Middleware ---
// --- Security & Production Middleware ---
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows loading images from other origins (S3/Local)
}));
app.use(compression()); // Compress all responses
app.use(express.json({ limit: '10mb' })); // Limit body size for security
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging: Combined format for production, dev format for development
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS: Configurable whitelist from environment
const corsOptions = {
  origin: true, // Allow all origins for dev or specify yours
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// --- API Routes ---
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.NODE_ENV
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/products', productRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/production-reports', productionReportRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api/upload', uploadRoutes);

// Serves static files in development (fallback for NIPA/S3)
if (config.NODE_ENV === 'development') {
  app.use('/uploads', express.static('uploads'));
}

app.get('/api/categories', getCategories);

// --- 404 & Error Handling ---

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global Error Handler (Production-safe)
app.use(errorHandler);

// --- Server Startup ---
const server = app.listen(config.PORT, () => {
  console.log(`
  🚀 Server is running in ${config.NODE_ENV} mode
  🔗 Access: http://localhost:${config.PORT}
  🛠️  Health: http://localhost:${config.PORT}/health
  `);
});

// Graceful Shutdown for PM2
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.info('HTTP server closed');
  });
});
