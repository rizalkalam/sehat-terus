import { Router } from 'express';
import { getStok, getStokChart, getStats, getNearExpiry, getSuratPesanan, getAlerts } from '../controllers/logistic';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/stok', requireAuth, getStok);
router.get('/stok/chart', requireAuth, getStokChart);
router.get('/stats', requireAuth, getStats);
router.get('/near-expiry', requireAuth, getNearExpiry);
router.get('/surat-pesanan', requireAuth, getSuratPesanan);
router.get('/alerts', requireAuth, getAlerts);

export default router;  