import { Router } from 'express';
import { authAdminClient } from '../services/authAdminClient';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.delete('/account', requireAuth, async (req, res) => {
  const userId = req.user!.id; // requireAuth guarantees this is set

  try {
    const { error } = await authAdminClient.admin.deleteUser(userId);

    if (error) {
      console.error('Account deletion failed:', error);
      return res.status(500).json({ error: 'Failed to delete account. Please try again.' });
    }

    return res.status(200).json({ message: 'Account deleted successfully.' });

  } 
  
  
  catch (err) {
    console.error('Unexpected error during account deletion:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

export default router;