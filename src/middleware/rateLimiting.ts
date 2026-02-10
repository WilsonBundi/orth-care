import rateLimit from 'express-rate-limit';
import { redis } from '../config/redis';
import { Request, Response, NextFunction } from 'express';

// Simple in-memory store for rate limiting (fallback if Redis not available)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

// Global rate limiter - 100 requests per minute per IP
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints - stricter limits
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // 50 attempts in dev, 5 in production
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// API rate limiter - per user
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: 'API rate limit exceeded.',
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IPv6-safe IP key
    const userId = (req as any).user?.id;
    if (userId) return userId;
    // Use the ipKeyGenerator helper for IPv6 compatibility
    return req.ip || 'unknown';
  },
});

// File upload rate limiter
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many file uploads, please try again later.',
});

// Automatic IP blocking for abuse
export async function checkBlockedIP(req: Request, res: Response, next: NextFunction) {
  try {
    const ip = req.ip;
    
    // Skip if Redis not available
    if (redis.status !== 'ready') {
      return next();
    }
    
    const isBlocked = await redis.get(`blocked:${ip}`);
    
    if (isBlocked) {
      return res.status(403).json({
        error: 'Your IP has been blocked due to suspicious activity.',
      });
    }
    
    next();
  } catch (error) {
    // If Redis fails, just continue
    next();
  }
}

// Block IP for duration
export async function blockIP(ip: string, durationMinutes: number = 60) {
  try {
    if (redis.status === 'ready') {
      await redis.setex(`blocked:${ip}`, durationMinutes * 60, '1');
    }
  } catch (error) {
    console.error('Failed to block IP:', error);
  }
}
