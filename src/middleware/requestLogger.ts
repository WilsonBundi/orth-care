import { Request, Response, NextFunction } from 'express';
import { generateCorrelationId, logRequest, logResponse } from '../config/logger';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      startTime?: number;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  req.correlationId = generateCorrelationId();
  req.startTime = Date.now();
  
  logRequest(req, req.correlationId);
  
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - (req.startTime || 0);
    logResponse(req, res.statusCode, req.correlationId!, duration);
    return originalSend.call(this, data);
  };
  
  next();
};
