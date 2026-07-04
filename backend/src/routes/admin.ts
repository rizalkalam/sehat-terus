import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getUsers, createUser, updateUser, deleteUser,
  getObat, createObat, updateObat, deleteObat,
  getStokAdmin, updateStok, getFaskes,
} from '../controllers/admin';

const router = Router();

// Semua route admin butuh auth
router.use(requireAuth);

// Users
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Obat
router.get('/obat', getObat);
router.post('/obat', createObat);
router.put('/obat/:id', updateObat);
router.delete('/obat/:id', deleteObat);

// Stok
router.get('/stok', getStokAdmin);
router.put('/stok/:id', updateStok);

// Faskes
router.get('/faskes', getFaskes);

export default router;