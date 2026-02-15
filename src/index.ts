/**
 * Main application entry point
 * Enterprise-grade Express server with Firebase Firestore
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { initializeFirebase, testFirebaseConnection, closeFirebase } from './config/firebase';
import { redis, closeRedis } from './config/redis';
import { securityHeaders, httpsRedirect } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import { inputSanitization } from './middleware/inputSanitization';
import { requestLogger } from './middleware/requestLogger';
import { checkBlockedIP } from './middleware/rateLimiting';
import routes from './routes';

// Load environment variables
dotenv.config();

const app: any = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for Render, Heroku, and other platforms
app.set('trust proxy', 1);

// Initialize Firebase
initializeFirebase();

// Request logging
app.use(requestLogger);

// Security middleware
app.use(httpsRedirect);
app.use(securityHeaders);
app.use(checkBlockedIP);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Input sanitization
app.use(inputSanitization);

// Static files for frontend
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealthy = await testFirebaseConnection();
  const redisHealthy = redis.status === 'ready';
  
  const status = dbHealthy && redisHealthy ? 'healthy' : 'degraded';
  const statusCode = status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    service: 'patient-portal-enterprise',
    checks: {
      database: dbHealthy ? 'up' : 'down',
      redis: redisHealthy ? 'up' : 'down',
    },
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const dbResult = await testFirebaseConnection();
    const redisInfo = redis.status === 'ready' ? await redis.info() : 'disconnected';
    
    res.json({
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbResult ? 'connected' : 'disconnected',
      redis: redisInfo,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Root endpoint - serve landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await closeFirebase();
  await closeRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await closeFirebase();
  await closeRedis();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Test database connection
    console.log('Testing Firebase connection...');
    const dbConnected = await testFirebaseConnection();
    
    if (!dbConnected) {
      console.error('Failed to connect to Firebase. Please check your configuration.');
      process.exit(1);
    }

    // Test Redis connection
    console.log('Testing Redis connection...');
    if (redis.status !== 'ready') {
      console.warn('⚠️  Redis not connected. Caching and rate limiting will be disabled.');
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 Orthopedic's Care Portal Server`);
      console.log(`📍 Running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
      console.log(`\n🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: Firebase Firestore (${process.env.FIREBASE_PROJECT_ID || 'not configured'})`);
      console.log(`🔴 Redis: ${redis.status === 'ready' ? 'Connected' : 'Disconnected'}\n`);
      console.log('📋 Available endpoints:');
      console.log('  Authentication:');
      console.log('    POST /api/auth/register');
      console.log('    POST /api/auth/login');
      console.log('    POST /api/auth/logout');
      console.log('    POST /api/auth/change-password');
      console.log('  MFA:');
      console.log('    POST /api/mfa/setup');
      console.log('    POST /api/mfa/enable');
      console.log('    POST /api/mfa/verify');
      console.log('    POST /api/mfa/disable');
      console.log('  Profile:');
      console.log('    GET  /api/profile');
      console.log('    PUT  /api/profile');
      console.log('  Appointments:');
      console.log('    POST /api/appointments');
      console.log('    GET  /api/appointments/my');
      console.log('    GET  /api/appointments/upcoming');
      console.log('  Dashboard:');
      console.log('    GET  /api/dashboard\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
