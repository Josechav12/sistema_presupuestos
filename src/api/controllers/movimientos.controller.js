import ExcelJS from 'exceljs';
import { MovimientoModel } from '../models/movimientoModel.js'; 

// LISTAR MOVIMIENTOS
export const getMovimientos = async (req, res) => {
    try {
        const { tipo, search, categoria } = req.query;

        const movimientos = await MovimientoModel.buscarTodos({ tipo, search, categoria });
        const categoriasRows = await MovimientoModel.getCategoriasAgrupadas();

        const categoriasAgrupadas = {
            Ingreso: categoriasRows.filter(c => c.tipo_nombre === 'Ingreso'),
            Egreso: categoriasRows.filter(c => c.tipo_nombre === 'Egreso'),
            Gasto: categoriasRows.filter(c => c.tipo_nombre === 'Gasto')
        };

        res.render('movimientos/historial', {
            movimientos,
            categorias: categoriasAgrupadas,
            filtros: { tipo, search, categoria }
        });
    } catch (error) {
        console.error("Error al obtener movimientos:", error);
        res.status(500).send("Error interno del servidor");
    }
};

// VISTA PARA NUEVA OPERACIÓN (Esta es la que faltaba y causaba el error)
export const renderNuevoMovimiento = async (req, res) => {
    try {
        const categoriasRows = await MovimientoModel.getCategoriasAgrupadas();

        const categoriasAgrupadas = {
            Ingreso: categoriasRows.filter(c => c.tipo_nombre === 'Ingreso'),
            Egreso: categoriasRows.filter(c => c.tipo_nombre === 'Egreso'),
            Gasto: categoriasRows.filter(c => c.tipo_nombre === 'Gasto')
        };

        res.render('movimientos/nuevo', { categorias: categoriasAgrupadas });
    } catch (error) {
        console.error("Error al renderizar:", error);
        res.status(500).send("Error al cargar el formulario");
    }
};

// PROCESAR CREACIÓN
export const createMovimiento = async (req, res) => {
    try {
        await MovimientoModel.crear(req.body);
        res.redirect('/movimientos');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error");
    }
};

// PROCESAR MODIFICACIÓN
export const modificarMovimiento = async (req, res) => {
    try {
        const { id_original, monto, categoria_id, descripcion } = req.body;
        await MovimientoModel.anularYReemplazar(id_original, { monto, categoria_id, descripcion });
        res.redirect('/movimientos');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error");
    }
};

export const exportarMovimientos = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte Financiero');

        // 1. Columnas con Categoria más ancha (width: 30)
        worksheet.columns = [
            { header: 'FECHA', key: 'fecha', width: 15 },
            { header: 'DESCRIPCIÓN', key: 'descripcion', width: 35 },
            { header: 'CATEGORÍA', key: 'categoria', width: 30 }, // Más ancha
            { header: 'TIPO', key: 'tipo', width: 15 },
            { header: 'MONTO', key: 'monto', width: 18 }
        ];

        const movimientos = await MovimientoModel.buscarTodos({});

        if (!movimientos || movimientos.length === 0) {
            return res.status(404).send("No hay datos para exportar");
        }

        // 2. Cargar datos con Lógica de Negativos
        movimientos.forEach(mov => {
            const rawDate = mov.fecha || mov.fecha_movimiento;
            const tipo = (mov.tipo || mov.tipo_nombre || '').toUpperCase();
            let valorMonto = parseFloat(mov.monto) || 0;

            // Si es Gasto o Egreso, lo convertimos a negativo para la suma total
            if (tipo === 'GASTO' || tipo === 'EGRESO') {
                valorMonto = valorMonto * -1;
            }

            worksheet.addRow({
                fecha: rawDate ? new Date(rawDate) : new Date(),
                descripcion: mov.descripcion?.toUpperCase() || 'SIN DETALLE',
                categoria: (mov.categoria || mov.categoria_nombre || 'GENERAL').toUpperCase(),
                tipo: tipo,
                monto: valorMonto
            });
        });

        // 3. Formatos de Columna (Moneda ARG y Fecha)
        worksheet.getColumn('fecha').numFmt = 'dd/mm/yyyy';
        worksheet.getColumn('monto').numFmt = '"$"#,##0.00;[Red]"-$"#,##0.00'; // Formato contable: negativos en rojo

        // 4. Estilos y Alineación Centrada
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                // Alineación general centrada
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                
                // La descripción la dejamos a la izquierda para que sea más legible
                if (cell.address.includes('B') && rowNumber > 1) {
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                }

                // Estilo para el encabezado
                if (rowNumber === 1) {
                    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: '1E293B' }
                    };
                } else {
                    // Bordes para las celdas de datos
                    cell.border = {
                        bottom: { style: 'thin', color: { argb: 'E5E7EB' } }
                    };
                }
            });

            // Filas alternas
            if (rowNumber > 1 && rowNumber % 2 === 0) {
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } };
            }
        });

        // 5. Enviar archivo
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Reporte_Financiero.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("ERROR AL EXPORTAR:", error);
        res.status(500).json({ error: error.message });
    }
};