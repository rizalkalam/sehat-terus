import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  id: string;
  email: string;
  peran: string;
  faskes_id: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.st_auth;
  if (!token) {
    res.status(401).json({ error: 'Tidak terautentikasi.' });
    return;
  }
  try {
    const secret = process.env.JWT_SECRET || 'st-jwt-secret-2026';
    req.user = jwt.verify(token, secret) as AuthPayload;
    next();
  } catch {
    res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
}
