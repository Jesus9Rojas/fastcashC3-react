import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';

const HistorialVentas = () => {
    const { usuario, cajaAbierta } = useContext(AuthContext);
    
    const [ventas, setVentas] = useState([]);
    const [cargando, setCargando] = useState(false);
    
    // Estados para el filtro de Administrador
    const [usuariosFiltro, setUsuariosFiltro] = useState([]);
    const [filtroSeleccionado, setFiltroSeleccionado] = useState('');

    // Verificamos de forma segura si el rol es Administrador
    const esAdmin = String(usuario?.rol || '').toUpperCase() === 'ADMINISTRADOR';

    // 1. Cargar Usuarios para el filtro (Solo si es Admin)
    useEffect(() => {
        const cargarUsuariosFiltro = async () => {
            if (!esAdmin) return;
            try {
                const res = await api.get('/admin/usuarios');
                setUsuariosFiltro(res.data);
            } catch (error) {
                console.error("Error cargando usuarios para el filtro", error);
            }
        };
        cargarUsuariosFiltro();
    }, [esAdmin]);

    // 2. Cargar el Historial de la Base de Datos
    const cargarHistorial = async () => {
        setCargando(true);
        try {
            const uid = usuario?.usuarioID || usuario?.UsuarioID;
            
            // La forma correcta y segura de enviar filtros en Axios
            const parametros = {};
            if (esAdmin && filtroSeleccionado) {
                parametros.filtro = filtroSeleccionado;
            }
            
            const res = await api.get(`/ventas/historial/${uid}`, { 
                params: parametros 
            });
            
            setVentas(res.data);
        } catch (error) {
            console.error("Error cargando historial", error);
        } finally {
            setCargando(false);
        }
    };

    // Cargar automáticamente cuando entra a la página o cambia el filtro
    useEffect(() => {
        if (usuario) {
            cargarHistorial();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuario, filtroSeleccionado]);

    // 3. Lógica para Anular una Venta
    const handleAnular = async (ventaID) => {
        if (!cajaAbierta) {
            Swal.fire('Atención', 'La caja está cerrada. No se puede anular.', 'warning');
            return;
        }

        const confirmacion = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Vas a ANULAR esta venta. Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, anular',
            cancelButtonText: 'Cancelar'
        });

        if (confirmacion.isConfirmed) {
            try {
                const uid = usuario?.usuarioID || usuario?.UsuarioID;
                const payload = {
                    ventaID: parseInt(ventaID),
                    ventaId: parseInt(ventaID),
                    usuarioID: parseInt(uid),
                    usuarioId: parseInt(uid),
                    motivo: "Anulación Manual"
                };

                await api.post('/ventas/anular', payload);
                Swal.fire('Anulado', 'La venta fue anulada correctamente.', 'success');
                
                // Recargamos la tabla para ver el cambio instantáneamente
                cargarHistorial();
            } catch (error) {
                const msg = error.response?.data?.mensaje || error.response?.data?.error || "Error al anular la venta";
                Swal.fire('Error', msg, 'error');
            }
        }
    };

    // Helper para pintar bonito el medio de pago (YAPE: BCP, etc)
    const renderMedioPago = (v) => {
        const formaPagoStr = String(v.formapago || v.FormaPago || v.formaPago || '').toUpperCase().trim();
        const entidadStr = String(v.entidad || v.Entidad || v.entidadbancaria || '').toUpperCase().trim();
        
        const sufijoEntidad = (entidadStr && entidadStr !== 'UNDEFINED' && entidadStr !== 'NULL' && entidadStr !== '') 
                            ? `: ${entidadStr}` 
                            : '';

        if (formaPagoStr === 'QR' || formaPagoStr === 'YAPE' || formaPagoStr === 'PLIN') {
            return `📱 ${formaPagoStr}${sufijoEntidad}`;
        }
        if (formaPagoStr === 'TARJETA') return `💳 TARJETA${sufijoEntidad}`;
        if (formaPagoStr === 'TRANSFERENCIA') return `🏦 TRANSF${sufijoEntidad}`;
        if (formaPagoStr !== '') return `💳 ${formaPagoStr}`;
        return '💵 EFECTIVO';
    };

    return (
        <section className="vista-seccion activa">
            <div className="contenedor-tabla-registro">
                
                {/* --- CABECERA --- */}
                <div className="cabecera-tabla">
                    <div className="titulo-seccion">
                        <h2><i className="fa-solid fa-ban" style={{ color: '#ef4444' }}></i> Historial de Ventas (Hoy)</h2>
                        <p>Supervisión y Anulaciones en tiempo real.</p>
                    </div>
                    
                    <div className="controles-derecha" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        
                        {/* El filtro solo se renderiza si el usuario es Administrador */}
                        {esAdmin && (
                            <select 
                                className="input-moderno" 
                                style={{ padding: '0.6rem', minWidth: '150px' }}
                                value={filtroSeleccionado}
                                onChange={(e) => setFiltroSeleccionado(e.target.value)}
                            >
                                <option value="">-- Ver Todos --</option>
                                {usuariosFiltro.map(u => {
                                    // Omni-lectura idéntica a tu JS original
                                    const uid = u.usuarioID || u.UsuarioID || u.usuarioId || u.usuarioid || u.id;
                                    const nombre = u.nombreCompleto || u.NombreCompleto || u.username;
                                    
                                    // Solo renderiza si encontró un ID válido
                                    if (uid !== undefined) {
                                        return <option key={uid} value={uid}>{nombre}</option>;
                                    }
                                    return null;
                                })}
                            </select>
                        )}
                        
                        <button className="btn-refresh-moderno" onClick={cargarHistorial} disabled={cargando}>
                            <span className="icono-refresh"><i className={`fa-solid fa-rotate-right ${cargando ? 'fa-spin' : ''}`}></i></span> Refrescar
                        </button>
                    </div>
                </div>

                {/* --- TABLA --- */}
                <div className="tabla-responsive">
                    <table className="tabla-transacciones">
                        <thead>
                            <tr>
                                <th>Cajero</th>
                                <th>Medio</th>
                                <th>Familia</th>
                                <th>Ref / Op</th>
                                <th>Monto</th>
                                <th>Hora</th>
                                <th>Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cargando ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>⏳ Cargando datos...</td></tr>
                            ) : ventas.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>📭 No hay ventas hoy.</td></tr>
                            ) : (
                                ventas.map(v => {
                                    // Omni-lectura
                                    const vID = v.ventaid || v.VentaID || v.ventaID;
                                    const cajero = v.cajero || v.Cajero || 'Sistema';
                                    const familia = v.familia || v.Familia || 'Varios';
                                    const refOp = v.refoperacion || v.RefOperacion || v.comprobante || v.Comprobante || '-';
                                    const monto = parseFloat(v.importetotal || v.ImporteTotal || v.monto || v.Monto || 0).toFixed(2);
                                    const estado = String(v.estado || v.Estado || '').toUpperCase();
                                    const esAnulado = estado === 'ANULADO';
                                    
                                    // Formatear Hora
                                    const fechaEmision = v.fechaemision || v.FechaEmision || v.fechaEmision;
                                    const horaFormateada = fechaEmision ? new Date(fechaEmision).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '--:--';

                                    return (
                                        <tr key={vID} style={{ opacity: esAnulado ? 0.6 : 1, background: esAnulado ? '#fff5f5' : 'transparent' }}>
                                            <td style={{ fontWeight: 'bold', color: '#444' }}>{cajero}</td>
                                            <td className="col-tipo">{renderMedioPago(v)}</td>
                                            <td>{familia}</td>
                                            <td><div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{refOp}</div></td>
                                            <td className="dato-monto">S/ {monto}</td>
                                            <td>{horaFormateada}</td>
                                            <td>
                                                <span className={`badge-estado ${esAnulado ? 'anulado' : 'completado'}`}>
                                                    {estado}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    className="btn-tabla-anular" 
                                                    onClick={() => handleAnular(vID)} 
                                                    disabled={esAnulado}
                                                >
                                                    🚫 Anular
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </section>
    );
};

export default HistorialVentas;