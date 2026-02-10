import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  if (err.message.includes('already registered')) {
    return res.status(409).json({ error: err.message });
  }

  if (err.message.includes('Invalid email or password')) {
    return res.status(401).json({ error: err.message });
  }

  if (err.message.includes('locked')) {
    return res.status(423).json({ error: err.message });
  }

  if (err.message.includes('not found')) {
    return res.status(404).json({ error: err.message });
  }

  res.status(500).json({ error: 'An unexpected error occurred' });
}
