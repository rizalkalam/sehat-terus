import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getUsers, createUser, updateUser, deleteUser,
  getFaskes,
} from '../controllers/admin';

const router = Router();

// Semua route admin butuh auth
router.use(requireAuth);

// Users
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Faskes
router.get('/faskes', getFaskes);

export default router;
