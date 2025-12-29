import db from '../database/db.js';

export const MovimientoModel = {
    buscarTodos: async (filtros) => {
        const { tipo, search, categoria } = filtros;

        let query = `
            SELECT m.id, m.monto, m.fecha_operacion, m.descripcion, m.categoria_id, m.activo,
            c.nombre AS categoria, t.nombre AS tipo
            FROM movimientos m
            JOIN categorias c ON m.categoria_id = c.id
            JOIN tipos t ON c.tipo_id = t.id
            WHERE 1=1
        `;

        const params = [];

        if (tipo && tipo !== '') {
            query += " AND t.nombre = ?";
            params.push(tipo);
        }

        if (categoria && categoria !== '') {
            query += " AND c.id = ?";
            params.push(categoria);
        }

        if (search && search.trim() !== '') {
            query += " AND (m.descripcion LIKE ? OR c.nombre LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        query += " ORDER BY m.fecha_operacion DESC, m.id DESC";

        const [rows] = await db.query(query, params);
        return rows;
    },

    getCategoriasAgrupadas: async () => {
        const [rows] = await db.query(`
            SELECT c.id, c.nombre, t.nombre AS tipo_nombre 
            FROM categorias c 
            JOIN tipos t ON c.tipo_id = t.id 
            ORDER BY t.nombre, c.nombre
        `);
        return rows;
    },

    crear: async (datos) => {
        const { categoria_id, monto, fecha_operacion, descripcion } = datos;
        return await db.query(
            'INSERT INTO movimientos (categoria_id, monto, fecha_operacion, descripcion, activo) VALUES (?, ?, ?, ?, 1)',
            [categoria_id, monto, fecha_operacion, descripcion]
        );
    },

    anularYReemplazar: async (id_original, nuevosDatos) => {
        const { monto, categoria_id, descripcion } = nuevosDatos;
        // 1. Anulamos el original
        await db.query('UPDATE movimientos SET activo = 0 WHERE id = ?', [id_original]);

        // 2. Recuperamos la fecha original para que no cambie el historial
        const [original] = await db.query('SELECT fecha_operacion FROM movimientos WHERE id = ?', [id_original]);
        const fecha = original[0].fecha_operacion;

        // 3. Limpiamos descripción para no acumular el prefijo [MODIFICADO]
        const limpiaDesc = descripcion.replace('[MODIFICADO] - ', '');
        const nuevaDesc = `[MODIFICADO] - ${limpiaDesc}`;

        return await db.query(
            'INSERT INTO movimientos (monto, categoria_id, fecha_operacion, descripcion, activo) VALUES (?, ?, ?, ?, 1)',
            [monto, categoria_id, fecha, nuevaDesc]
        );
    },

    getResumenDashboard: async () => {
        const [rows] = await db.query(`
            SELECT t.nombre AS tipo, SUM(m.monto) AS total
            FROM movimientos m
            JOIN categorias c ON m.categoria_id = c.id
            JOIN tipos t ON c.tipo_id = t.id
            WHERE m.activo = 1
            GROUP BY t.nombre
        `);
        return rows;
    },

    getDatosGraficoMensual: async () => {
        const [rows] = await db.query(`
        SELECT 
            DATE_FORMAT(m.fecha_operacion, '%b') AS mes,
            SUM(CASE WHEN t.nombre = 'Ingreso' THEN m.monto ELSE 0 END) AS ingresos,
            SUM(CASE WHEN t.nombre IN ('Gasto', 'Egreso') THEN m.monto ELSE 0 END) AS gastos
        FROM movimientos m
        JOIN categorias c ON m.categoria_id = c.id
        JOIN tipos t ON c.tipo_id = t.id
        WHERE m.fecha_operacion >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) AND m.activo = 1
        GROUP BY YEAR(m.fecha_operacion), MONTH(m.fecha_operacion), mes
        ORDER BY YEAR(m.fecha_operacion) ASC, MONTH(m.fecha_operacion) ASC -- Ordenamos por las columnas agrupadas
    `);
        return rows;
    },

    getDatosGraficoDiario: async () => {
        const [rows] = await db.query(`
        SELECT 
            DATE_FORMAT(m.fecha_operacion, '%d/%m') AS etiqueta,
            SUM(CASE WHEN t.nombre = 'Ingreso' THEN m.monto ELSE 0 END) AS ingresos,
            SUM(CASE WHEN t.nombre IN ('Gasto', 'Egreso') THEN m.monto ELSE 0 END) AS gastos
        FROM movimientos m
        JOIN categorias c ON m.categoria_id = c.id
        JOIN tipos t ON c.tipo_id = t.id
        WHERE m.fecha_operacion >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND m.activo = 1
        GROUP BY etiqueta, m.fecha_operacion -- Agregamos fecha_operacion al grupo para poder ordenar por ella
        ORDER BY m.fecha_operacion ASC
    `);
        return rows;
    },

    getDatosPorCategoria: async (tipo = 'Ingreso') => {
        const [rows] = await db.query(`
            SELECT c.nombre AS categoria, SUM(m.monto) AS total 
            FROM movimientos m
            JOIN categorias c ON m.categoria_id = c.id
            JOIN tipos t ON c.tipo_id = t.id
            WHERE t.nombre = ? AND m.activo = 1
            GROUP BY c.nombre
        `, [tipo]);
        return rows;
    },

    getUltimosMovimientos: async (limit = 5) => {
        const [rows] = await db.query(`
            SELECT m.monto, m.fecha_operacion, m.descripcion, c.nombre AS categoria, t.nombre AS tipo
            FROM movimientos m
            JOIN categorias c ON m.categoria_id = c.id
            JOIN tipos t ON c.tipo_id = t.id
            WHERE m.activo = 1
            ORDER BY m.fecha_operacion DESC, m.id DESC
            LIMIT ?
        `, [limit]);
        return rows;
    }
};