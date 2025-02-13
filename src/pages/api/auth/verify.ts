import { NextApiRequest, NextApiResponse } from 'next';
import { solanaAuth } from '@/lib/auth/config';
import { AuthDatabase } from '@/lib/auth/database';

const authDb = new AuthDatabase();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pubkey, signature, nonce } = req.body;

  if (!pubkey || !signature || !nonce) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify the stored nonce matches
    const storedNonce = await solanaAuth.getNonce(pubkey);
    if (storedNonce !== nonce) {
      return res.status(401).json({ error: 'Invalid nonce' });
    }

    // Verify the signature
    const isValid = await solanaAuth.verify(pubkey, signature, nonce);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Generate auth token
    const token = await solanaAuth.generateToken(pubkey);

    // Create or get existing profile
    const profile = await authDb.createProfile(pubkey);

    return res.status(200).json({
      token,
      profile
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 