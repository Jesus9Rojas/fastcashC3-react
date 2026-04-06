import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';
import ContadorAnimado from '../components/ContadorAnimado'; // <-- Importamos tu animación

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const DashboardGraficos = () => {
    const { usuario } = useContext(AuthContext);

    const [cargando, setCargando] = useState(false);
    
    // Estados para los gráficos y el total animado
    const [datosCategoria, setDatosCategoria] = useState({ labels: [], datasets: [] });
    const [datosPagos, setDatosPagos] = useState({ labels: [], datasets: [] });
    const [totalDia, setTotalDia] = useState(0); // <-- Nuevo estado para el total

    const esAdmin = String(usuario?.rol || '').toUpperCase() === 'ADMINISTRADOR';

    const cargarDatosDashboard = async () => {
        setCargando(true);
        try {
            const uid = usuario?.usuarioID || usuario?.UsuarioID;
            const res = await api.get(`/ventas/historial/${uid}`);
            const ventas = res.data;

            const resumenCategorias = {};
            const resumenPagos = {};
            let sumaTotal = 0; // <-- Variable para ir sumando todo el dinero

            ventas.forEach(v => {
                const estado = String(v.estado || v.Estado || '').toUpperCase();
                if (estado === 'ANULADO') return;

                const categoria = v.familia || v.Familia || 'Varios';
                const formaPago = String(v.formapago || v.FormaPago || v.formaPago || 'Efectivo').toUpperCase();
                const monto = parseFloat(v.importetotal || v.ImporteTotal || v.monto || v.Monto || 0);

                sumaTotal += monto; // Sumamos al total

                resumenCategorias[categoria] = (resumenCategorias[categoria] || 0) + monto;
                
                let pagoAgrupado = formaPago;
                if (formaPago === 'QR' || formaPago === 'YAPE' || formaPago === 'PLIN') pagoAgrupado = 'DIGITAL (Yape/Plin)';
                else if (formaPago === 'TARJETA') pagoAgrupado = 'TARJETA (POS)';
                else if (formaPago === 'TRANSFERENCIA') pagoAgrupado = 'TRANSFERENCIA';
                
                resumenPagos[pagoAgrupado] = (resumenPagos[pagoAgrupado] || 0) + monto;
            });

            // Guardamos el total final para la animación
            setTotalDia(sumaTotal);

            const paletaColores = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
            
            setDatosCategoria({
                labels: Object.keys(resumenCategorias),
                datasets: [{
                    data: Object.values(resumenCategorias),
                    backgroundColor: paletaColores.slice(0, Object.keys(resumenCategorias).length),
                    borderWidth: 1,
                }]
            });

            setDatosPagos({
                labels: Object.keys(resumenPagos),
                datasets: [{
                    label: 'Ingresos (S/)',
                    data: Object.values(resumenPagos),
                    backgroundColor: '#2563eb',
                    borderRadius: 6,
                }]
            });

        } catch (error) {
            console.error("Error cargando dashboard:", error);
            Swal.fire('Error', 'No se pudieron cargar los datos del dashboard', 'error');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (esAdmin) cargarDatosDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [esAdmin]);

    if (!esAdmin) {
        return (
            <section className="vista-seccion activa">
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <i className="fa-solid fa-lock" style={{ fontSize: '4rem', color: '#ef4444', marginBottom: '1rem' }}></i>
                    <h2>Acceso Denegado</h2>
                    <p>Esta sección es exclusiva para Administradores.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="vista-seccion activa">
            <div className="contenedor-tabla-registro">

                <div className="cabecera-tabla">
                    <div className="titulo-seccion">
                        <h2><i className="fa-solid fa-chart-line" style={{ color: '#2563eb' }}></i> Dashboard Financiero (Hoy)</h2>
                        <p>Resumen visual de las operaciones del día.</p>
                    </div>
                    <button className="btn-refresh-moderno" onClick={cargarDatosDashboard} disabled={cargando}>
                        <span className="icono-refresh"><i className={`fa-solid fa-rotate-right ${cargando ? 'fa-spin' : ''}`}></i></span> Actualizar Datos
                    </button>
                </div>

                {cargando ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                        <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
                        <p style={{ marginTop: '10px' }}>Calculando estadísticas...</p>
                    </div>
                ) : datosCategoria.labels.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                        <i className="fa-solid fa-box-open fa-2x" style={{ color: '#cbd5e1' }}></i>
                        <p style={{ marginTop: '10px' }}>No hay ventas registradas el día de hoy para graficar.</p>
                    </div>
                ) : (
                    <>
                        {/* --- NUEVA TARJETA DE TOTAL ANIMADA --- */}
                        <div style={{ 
                            background: '#22c55e', 
                            color: 'white', 
                            padding: '2rem', 
                            borderRadius: '16px', 
                            textAlign: 'center', 
                            marginBottom: '2rem', 
                            marginTop: '1.5rem',
                            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' 
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', opacity: 0.9, fontWeight: 'normal' }}>Ingresos Totales del Día</h3>
                            <h1 style={{ margin: '10px 0 0 0', fontSize: '3.5rem', fontWeight: 'bold' }}>
                                S/ <ContadorAnimado valorFinal={totalDia} duracion={1500} />
                            </h1>
                        </div>

                        {/* --- GRÁFICOS --- */}
                        <div className="grid-graficos" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            
                            <div className="card-grafico" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#374151' }}>Ventas por Categoría</h3>
                                <div className="canvas-wrapper" style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                                    <Pie data={datosCategoria} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                                </div>
                            </div>

                            <div className="card-grafico" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#374151' }}>Ingresos por Medio de Pago</h3>
                                <div className="canvas-wrapper" style={{ height: '300px' }}>
                                    <Bar data={datosPagos} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
                                </div>
                            </div>

                        </div>
                    </>
                )}

            </div>
        </section>
    );
};

export default DashboardGraficos;