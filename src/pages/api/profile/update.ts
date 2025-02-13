import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { AuthProfile } from '@/lib/auth/database';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pubkey } = req.user!;
    const updates: Partial<AuthProfile> = req.body;

    // Validate the updates
    if (updates.pubkey) {
      return res.status(400).json({ error: 'Cannot update pubkey' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('pubkey', pubkey)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Username already taken' });
      }
      throw error;
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

export default withAuth(handler); 