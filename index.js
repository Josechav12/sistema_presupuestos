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
const viewsPath = path.join(__dirname, 'src', 'views'); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicPath)); 

app.set('views', viewsPath);
app.set('view engine', 'ejs');

// --- RUTAS PRINCIPALES ---
app.use('/', viewRoutes);

// --- MANEJO DE ERRORES 404 ---
app.use((req, res) => {
    // Usamos .send() en lugar de .render() para que no busque archivos ejs
    res.status(404).send('<h1>404 - Página no encontrada</h1><a href="/">Volver al Dashboard</a>');
});

// --- MANEJO DE ERRORES CRÍTICOS (500) ---
app.use((err, req, res, next) => {
    console.error("❌ Error interno:", err.stack);
    res.status(500).send('<h1>500 - Error Interno del Servidor</h1>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,'0.0.0.0',() => {
    console.log(`\n🚀 Servidor corriendo en: http://localhost:${PORT}`);
});