import { Request, Response, NextFunction } from 'express';

const sanitizeString = (value: any): any => {
  if (typeof value === 'string') {
    return value
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }
  
  if (Array.isArray(value)) {
    return value.map(sanitizeString);
  }
  
  if (value && typeof value === 'object') {
    const sanitized: any = {};
    for (const key in value) {
      sanitized[key] = sanitizeString(value[key]);
    }
    return sanitized;
  }
  
  return value;
};

export const inputSanitization = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) {
    req.body = sanitizeString(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeString(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeString(req.params);
  }
  
  next();
};
