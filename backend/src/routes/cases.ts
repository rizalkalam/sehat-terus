import { Router } from 'express';
import { getSpatialCases, getTemporalCases, getRegionDetail } from '../controllers/cases';

const router = Router();

router.get('/spatial', getSpatialCases);
router.get('/temporal', getTemporalCases);
router.get('/region/:name', getRegionDetail);

export default router;
