import { Router } from 'express';
import { analyzeDiseaseData } from '../controllers/ai';

const router = Router();

router.post('/analyze', analyzeDiseaseData);

export default router;