import { NextApiRequest, NextApiResponse } from 'next';
import { solanaAuth } from '@/lib/auth/config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pubkey, signature } = req.body;
    if (!pubkey || !signature) {
      return res.status(400).json({ error: 'Public key and signature are required' });
    }

    // Verify signature and generate token
    const result = await solanaAuth.verifySignature(pubkey, signature);
    if (!result.success) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Generate auth token
    const token = await solanaAuth.generateToken(pubkey);
    
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(500).json({ 
      error: 'Failed to verify signature',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 