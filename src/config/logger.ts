import winston from 'winston';
import { Request } from 'express';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'patient-portal' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

export const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const logRequest = (req: Request, correlationId: string): void => {
  logger.info('Incoming request', {
    correlationId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
};

export const logResponse = (req: Request, statusCode: number, correlationId: string, duration: number): void => {
  logger.info('Response sent', {
    correlationId,
    method: req.method,
    path: req.path,
    statusCode,
    duration: `${duration}ms`,
  });
};

export const logError = (error: Error, correlationId: string, req?: Request): void => {
  logger.error('Error occurred', {
    correlationId,
    error: error.message,
    stack: error.stack,
    method: req?.method,
    path: req?.path,
  });
};
