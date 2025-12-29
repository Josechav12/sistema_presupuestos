import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import viewRoutes from './src/api/routes/view.routes.js';

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.resolve(__dirname, 'src', 'public');
const viewsPath = path.resolve(__dirname, 'src', 'views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicPath)); 

app.set('views', viewsPath);
app.set('view engine', 'ejs');

// --- RUTAS PRINCIPALES ---
app.use('/', viewRoutes);

// --- MANEJO DE ERRORES 404 (Al final) ---
app.use((req, res) => {
    res.status(404).render('404', { title: 'Página no encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,'0.0.0.0',() => {
    console.log(`\n🚀 Servidor corriendo en: http://localhost:${PORT}`);
});