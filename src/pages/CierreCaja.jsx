import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ContadorAnimado from '../components/ContadorAnimado';
import api from '../services/api';
import Swal from 'sweetalert2';
import html2pdf from 'html2pdf.js';
import logoTicket from '../assets/img/img/LogoMas1.png';
import yapeIcon from '../assets/img/icon/codigo-qr-icon.png'
import tarjetaIcon from '../assets/img/icon/tarjeta-icon.png';  
import transfIcon from '../assets/img/icon/transferencia-movil.png'

const CierreCaja = () => {
    const { usuario, logout, cajaAbierta, setCajaAbierta } = useContext(AuthContext);
    const navigate = useNavigate();
    const ticketRef = useRef(null);

    const [resumen, setResumen] = useState({
        yape: 0, tarjeta: 0, transferencia: 0, anulado: 0, total: 0, saldoEsperado: 0
    });
    const [detalles, setDetalles] = useState([]);
    const [mostrarDetallesTicket, setMostrarDetallesTicket] = useState(false);
    
    const [cargando, setCargando] = useState(true);
    const [procesandoCierre, setProcesandoCierre] = useState(null); // 'RESUMEN' o 'DETALLE'

    // 1. Cargar Datos del Cierre al iniciar
    useEffect(() => {
        const cargarDatos = async () => {
            if (!cajaAbierta) {
                setCargando(false);
                return;
            }

            try {
                const uid = usuario?.usuarioID || usuario?.UsuarioID;
                const res = await api.get(`/reportes/cierre-actual/${uid}`);
                const d = res.data;

                // Omni-lectura de montos
                setResumen({
                    yape: parseFloat(d.ventasQR || d.VentasQR || d.ventasqr || 0),
                    tarjeta: parseFloat(d.ventasTarjeta || d.VentasTarjeta || d.ventastarjeta || 0),
                    transferencia: parseFloat(d.ventasTransferencia || d.VentasTransferencia || d.ventastransferencia || 0),
                    anulado: parseFloat(d.totalAnulado || d.TotalAnulado || d.totalanulado || 0),
                    total: parseFloat(d.totalVendido || d.TotalVendido || d.totalvendido || 0),
                    saldoEsperado: parseFloat(d.saldoEsperadoEnCaja || d.SaldoEsperadoEnCaja || d.saldoesperadoencaja || 0)
                });
            } catch (error) {
                console.error("Error al cargar cierre:", error);
                Swal.fire('Error', 'No se pudo cargar el resumen del día', 'error');
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cajaAbierta]);

    // 2. Función de Cierre Centralizada
    const procesarCierre = async (tipo) => {
        if (!cajaAbierta) {
            Swal.fire('Aviso', 'La caja ya se encuentra cerrada.', 'info');
            return;
        }

        const esDetallado = tipo === 'DETALLE';
        const txtConfirm = esDetallado 
            ? "⚠️ ¿Estás seguro de realizar el CIERRE DE CAJA (DETALLADO)?\n\nEsta acción finalizará tu turno, descargará un PDF, imprimirá el ticket con el detalle de las ventas y cerrará tu sesión."
            : "⚠️ ¿Estás seguro de realizar el CIERRE DE CAJA (RESUMEN)?\n\nEsta acción finalizará tu turno, descargará un PDF, imprimirá el ticket y cerrará tu sesión.";

        const confirmacion = await Swal.fire({
            title: 'Confirmar Cierre',
            text: txtConfirm,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, Cerrar Caja'
        });

        if (!confirmacion.isConfirmed) return;

        setProcesandoCierre(tipo);

        try {
            const uid = usuario?.usuarioID || usuario?.UsuarioID;
            const nomCajero = usuario?.nombreCompleto || usuario?.NombreCompleto || usuario?.username || "CAJERO";

            // Si es detallado, bajamos los detalles y activamos la tabla en el ticket
            if (esDetallado) {
                const resDetalle = await api.get(`/reportes/cierre-detalle/${uid}`);
                setDetalles(resDetalle.data);
            }
            setMostrarDetallesTicket(esDetallado);

            // POST a la API para cerrar la caja
            await api.post('/caja/cerrar', {
                usuarioID: parseInt(uid),
                usuarioId: parseInt(uid),
                saldoFinalReal: resumen.saldoEsperado,
                saldofinalreal: resumen.saldoEsperado
            });

            // Esperamos un instante (100ms) para que React dibuje los detalles en el HTML del Ticket si los hay
            await new Promise(resolve => setTimeout(resolve, 100));

            // Generar PDF
            const fechaParaNombre = new Date().toISOString().slice(0, 10);
            const altoTicketera = esDetallado && detalles.length > 10 ? 200 + (detalles.length * 10) : 250;
            const nombrePDF = `Cierre_${esDetallado ? 'Detallado' : 'Resumen'}_${nomCajero.replace(/\s+/g, '_')}_${fechaParaNombre}.pdf`;

            const opt = {
                margin: 0.1,
                filename: nombrePDF,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: [80, altoTicketera], orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(ticketRef.current).save();

            // Disparar Impresión y Desloguear
            setTimeout(() => {
                window.print();
                Swal.fire({ title: 'Caja Cerrada', text: 'Se cerrará la sesión ahora', icon: 'success', timer: 2000, showConfirmButton: false });
                
                setTimeout(() => {
                    setCajaAbierta(false);
                    logout();
                    navigate('/login');
                }, 1500);
            }, 800);

        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.mensaje || error.response?.data?.error || "Error al cerrar la caja";
            Swal.fire('Error Crítico', msg, 'error');
            setProcesandoCierre(null);
        }
    };

    if (!cajaAbierta) {
        return (
            <section className="vista-seccion activa">
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <i className="fa-solid fa-lock" style={{ fontSize: '4rem', color: '#6b7280', marginBottom: '1rem' }}></i>
                    <h2>Caja Cerrada</h2>
                    <p>Abre la caja desde la barra superior para iniciar tu turno.</p>
                </div>
            </section>
        );
    }

    if (cargando) {
        return <div style={{ textAlign: 'center', padding: '4rem' }}>⏳ Cargando resumen del día...</div>;
    }

    const fechaHoy = new Date().toLocaleDateString('es-PE');
    const horaHoy = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const nomCajero = (usuario?.nombreCompleto || usuario?.NombreCompleto || usuario?.username || "CAJERO").toUpperCase();

    return (
        <section className="vista-seccion activa">
            <div className="dashboard-cierre">

                <header className="header-dashboard">
                    <div className="titulo-area">
                        <div className="icono-header"><i className="fa-solid fa-flag-checkered"></i></div>
                        <div>
                            <h2>Cierre de Turno</h2>
                            <p>Resumen de operaciones del día</p>
                        </div>
                    </div>
                    <div className="chip-fecha">
                        <i className="fa-regular fa-calendar-days"></i> <span>{fechaHoy}</span>
                    </div>
                </header>

                {/* --- TARJETAS DASHBOARD --- */}
                <div className="grid-stats">
                    <div className="stat-card digital" style={{ borderLeft: '4px solid rgb(230, 0, 35)' }}>
                        <div className="stat-icon"><img src={yapeIcon} alt="Yape" /></div>
                        <div className="stat-info">
                            <span className="stat-label">Billeteras Digitales</span>
                            <h3 className="stat-value">S/ <ContadorAnimado valorFinal={resumen.yape} /></h3>
                        </div>
                        <div className="stat-trend">Yape / Plin</div>
                    </div>

                    <div className="stat-card card" style={{ borderLeft: '4px solid #3b82f6' }}>
                       <div className="stat-icon"><img src={tarjetaIcon} alt="Tarjeta" /></div>
                        <div className="stat-info">
                            <span className="stat-label">Cobros con Tarjeta</span>
                            <h3 className="stat-value">S/ <ContadorAnimado valorFinal={resumen.tarjeta} /></h3>
                        </div>
                        <div className="stat-trend">Visa / Master</div>
                    </div>

                    <div className="stat-card transf" style={{ borderLeft: '4px solid rgb(5, 150, 105)' }}>
                        <div className="stat-icon"><img src={transfIcon} alt="Transferencia" /></div>
                        <div className="stat-info">
                            <span className="stat-label">Transferencias</span>
                            <h3 className="stat-value">S/ <ContadorAnimado valorFinal={resumen.transferencia} /></h3>
                        </div>
                        <div className="stat-trend">Bancos Directos</div>
                    </div>

                    <div className="stat-card total-highlight">
                        <div className="stat-icon"><i className="fa-solid fa-money-bill-wave"></i></div>
                        <div className="stat-info">
                            <span className="stat-label">Venta Total Real</span>
                            <h1 className="stat-value-big">S/ <ContadorAnimado valorFinal={resumen.total} /></h1>
                        </div>
                        <div className="stat-bg-decoration"></div>
                    </div>
                </div>

                {/* --- ÁREA DE TICKET --- */}
                <div className="area-accion-final">
                    <div className="ticket-preview-wrapper">
                        <div className="ticket-visual-header"><i className="fa-regular fa-file-lines"></i> Previsualización de Impresión</div>

                        {/* Contenedor exacto del ticket para el PDF */}
                        <div ref={ticketRef} id="ticketImpresion" className="ticket-paper">
                            <div className="ticket-header">
                                <img src={logoTicket} className="logo-ticket" alt="Logo" />
                                <h3>ROJAS MÁS</h3>
                                <p>RUC: 20495031307</p>
                                <p>Jirón Arica 125/Jirón Arica 129</p>
                                <div className="separator-dashed"></div>
                                <h4>CIERRE DE TURNO</h4>
                                <div className="ticket-meta">
                                    <p><span>Fecha:</span> <span>{fechaHoy}</span></p>
                                    <p><span>Hora:</span> <span>{horaHoy}</span></p>
                                    <p><span>Cajero:</span> <span>{nomCajero}</span></p>
                                </div>
                                <div className="separator-dashed"></div>
                            </div>
                            
                            <div className="ticket-body">
                                <div className="fila-ticket"><span>YAPE/PLIN:</span><span>S/ {resumen.yape.toFixed(2)}</span></div>
                                <div className="fila-ticket"><span>TARJETAS:</span><span>S/ {resumen.tarjeta.toFixed(2)}</span></div>
                                <div className="fila-ticket"><span>TRANSF:</span><span>S/ {resumen.transferencia.toFixed(2)}</span></div>
                                <div className="fila-ticket danger"><span>(-) ANULADO:</span><span>S/ {resumen.anulado.toFixed(2)}</span></div>
                                
                                <div className="separator-dashed" style={{marginTop: '5px'}}></div>
                                <div className="fila-ticket" style={{fontWeight: 'bold', fontSize: '1.2em'}}><span>TOTAL VENDIDO:</span><span>S/ {resumen.total.toFixed(2)}</span></div>

                                {/* Zona de Detalles (Solo visible al presionar Cierre Detallado) */}
                                {mostrarDetallesTicket && (
                                    <div style={{ marginTop: '10px', paddingBottom: '5px' }}>
                                        <div className="separator-dashed" style={{ marginBottom: '5px' }}></div>
                                        <h4 style={{ textAlign: 'center', margin: '0 0 5px 0', fontSize: '11px' }}>DETALLE DE TRANSACCIONES</h4>
                                        <table style={{ width: '100%', fontSize: '10px', textAlign: 'left', borderCollapse: 'collapse', fontFamily: 'monospace', lineHeight: '1.2' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px dashed black' }}>
                                                    <th style={{ padding: '2px 0', width: '22%' }}>HORA</th>
                                                    <th style={{ padding: '2px 2px', width: '50%' }}>OP/REF</th>
                                                    <th style={{ textAlign: 'right', padding: '2px 0', width: '28%' }}>MONTO</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detalles.length === 0 ? (
                                                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '5px 0' }}>Sin transacciones</td></tr>
                                                ) : (
                                                    detalles.map((d, i) => {
                                                        const fechaStr = d.fechaemision || d.fechaEmision || d.FechaEmision;
                                                        const formaPago = String(d.formapago || d.formaPago || d.FormaPago || '').toUpperCase();
                                                        const entidad = String(d.entidadbancaria || d.entidadBancaria || d.EntidadBancaria || '-').toUpperCase();
                                                        const numOp = d.numerooperacion || d.numeroOperacion || d.NumeroOperacion || '-';
                                                        const monto = parseFloat(d.montopagado || d.montoPagado || d.MontoPagado || 0).toFixed(2);
                                                        
                                                        const hr = new Date(fechaStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
                                                        
                                                        let infoOp = 'EFECTIVO';
                                                        if (formaPago !== 'EFECTIVO') {
                                                            let prefijo = formaPago;
                                                            if (formaPago === 'TARJETA' && entidad !== '-') prefijo = entidad;
                                                            else if (formaPago === 'TRANSFERENCIA') prefijo = 'TRANSF';
                                                            else if (formaPago === 'QR' || formaPago === 'YAPE' || formaPago === 'PLIN') {
                                                                prefijo = `QR ${entidad !== '-' ? entidad : ''}`.trim();
                                                            }
                                                            infoOp = `${prefijo}: ${numOp}`;
                                                        }

                                                        return (
                                                            <tr key={i}>
                                                                <td style={{ padding: '2px 0', verticalAlign: 'top' }}>{hr}</td>
                                                                <td style={{ padding: '2px 2px', wordBreak: 'break-all', verticalAlign: 'top' }}>{infoOp}</td>
                                                                <td style={{ padding: '2px 0', textAlign: 'right', verticalAlign: 'top' }}>S/ {monto}</td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                        <div className="separator-dashed" style={{ marginTop: '5px' }}></div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="ticket-footer">
                                <p>• Firma Conforme •</p>
                            </div>
                        </div>
                    </div>

                    {/* --- BOTONES DE ACCIÓN --- */}
                    <div className="botones-cierre" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '20px', justifyContent: 'center', width: '100%' }}>
                        
                        <button 
                            className="btn-imprimir-cierre btn-cerrar-caja-pro" 
                            onClick={() => procesarCierre('RESUMEN')} 
                            disabled={procesandoCierre !== null}
                            style={{ flex: 1, minWidth: '250px' }}
                        >
                            <span className="icon-btn"><i className={`fa-solid ${procesandoCierre === 'RESUMEN' ? 'fa-spinner fa-spin' : 'fa-print'}`}></i></span>
                            <span>{procesandoCierre === 'RESUMEN' ? 'CERRANDO...' : 'CERRAR CAJA (RESUMEN)'}</span>
                        </button>

                        <button 
                            className="btn-imprimir-cierre-detallado btn-cerrar-caja-pro" 
                            onClick={() => procesarCierre('DETALLE')} 
                            disabled={procesandoCierre !== null}
                            style={{ flex: 1, minWidth: '250px', backgroundColor: '#374151', borderColor: '#1f2937' }}
                        >
                            <span className="icon-btn"><i className={`fa-solid ${procesandoCierre === 'DETALLE' ? 'fa-spinner fa-spin' : 'fa-file-invoice-dollar'}`}></i></span>
                            <span>{procesandoCierre === 'DETALLE' ? 'PROCESANDO...' : 'CERRAR CAJA (DETALLADO)'}</span>
                        </button>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default CierreCaja;