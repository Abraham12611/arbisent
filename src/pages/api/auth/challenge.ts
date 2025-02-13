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
    const { pubkey } = req.body;
    if (!pubkey) {
      return res.status(400).json({ error: 'Public key is required' });
    }

    // Generate nonce and save sign-in attempt
    const nonce = await solanaAuth.createSignInAttempt(pubkey);
    
    return res.status(200).json({ nonce });
  } catch (error) {
    console.error('Auth challenge error:', error);
    return res.status(500).json({ 
      error: 'Failed to create auth challenge',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 