import express from 'express';
import { getDashboard } from '../controllers/dashboard.controller.js';
import { 
    getMovimientos, 
    createMovimiento, 
    modificarMovimiento, 
    renderNuevoMovimiento,
    exportarMovimientos 
} from '../controllers/movimientos.controller.js';

const router = express.Router();

// DASHBOARD
router.get('/', getDashboard);

// HISTORIAL
router.get('/movimientos', getMovimientos);

// Nueva ruta para exportar
router.get('/movimientos/exportar', exportarMovimientos);

router.get('/movimientos/nuevo', renderNuevoMovimiento);

// PROCESAMIENTO
router.post('/movimientos/crear', createMovimiento);
router.post('/movimientos/modificar', modificarMovimiento);

export default router;