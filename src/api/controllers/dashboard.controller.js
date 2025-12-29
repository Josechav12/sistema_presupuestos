import { MovimientoModel } from '../models/movimientoModel.js';

export const getDashboard = async (req, res) => {
    try {
        const [resumen, chartMes, chartDia, catIng, catGas, catEgr, ultimos] = await Promise.all([
            MovimientoModel.getResumenDashboard(),
            MovimientoModel.getDatosGraficoMensual(),
            MovimientoModel.getDatosGraficoDiario(),
            MovimientoModel.getDatosPorCategoria('Ingreso'),
            MovimientoModel.getDatosPorCategoria('Gasto'),
            MovimientoModel.getDatosPorCategoria('Egreso'),
            MovimientoModel.getUltimosMovimientos(5)
        ]);

        const ingresos = Number(resumen.find(r => r.tipo === 'Ingreso')?.total || 0);
        const egresos  = Number(resumen.find(r => r.tipo === 'Egreso')?.total || 0);
        const gastos   = Number(resumen.find(r => r.tipo === 'Gasto')?.total || 0);

        const metrics = {
            ingresos,
            gastos,
            egresos,
            disponible: ingresos - (gastos + egresos)
        };

        res.render('dashboard/index', {
            metrics,
            chartData: chartMes || [],
            chartDayData: chartDia || [],
            catIng: catIng || [],
            catGas: catGas || [],
            catEgr: catEgr || [],
            ultimosMovimientos: ultimos || []
        });
    } catch (error) {
        console.error("Error en Dashboard:", error);
        res.status(500).send("Error");
    }
};