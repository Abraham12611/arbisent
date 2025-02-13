import { NextApiRequest, NextApiResponse } from 'next';
import { solanaAuth } from '@/lib/auth/config';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    pubkey: string;
  };
}

export async function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' });
      }

      const token = authHeader.split(' ')[1];
      const isValid = await solanaAuth.verifyToken(token);
      
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const decoded = await solanaAuth.decodeToken(token);
      req.user = { pubkey: decoded.sub };

      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };
} 