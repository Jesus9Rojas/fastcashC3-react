import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';

// Configuramos SweetAlert para que actúe como Notificación Flotante (Toast)
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end', // Aparece arriba a la derecha
    showConfirmButton: false,
    timer: 3000, // Desaparece en 3 segundos
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});

const VentaTransferencia = () => {
    const { usuario, cajaAbierta } = useContext(AuthContext);

    const [bancos, setBancos] = useState([]);
    
    const [bancoSeleccionado, setBancoSeleccionado] = useState('');
    const [monto, setMonto] = useState('');
    const [titular, setTitular] = useState('');
    const [numOperacion, setNumOperacion] = useState('');
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const resBancos = await api.get('/maestros/entidades');
                const entidades = resBancos.data;
                
                // Filtramos SOLO BANCOS
                const soloBancos = entidades.filter(b => {
                    const tipo = String(b.tipo || b.Tipo || '').toUpperCase();
                    const estaActivo = b.activo !== false && b.Activo !== false;
                    return estaActivo && tipo === 'BANCO';
                });
                
                setBancos(soloBancos);

                if (soloBancos.length > 0) {
                    const primerBancoID = soloBancos[0].entidadID || soloBancos[0].EntidadID;
                    setBancoSeleccionado(primerBancoID);
                }
            } catch (error) {
                console.error("Error cargando bancos:", error);
            }
        };
        cargarDatos();
    }, []);

    const handleRegistrarVenta = async (e) => {
        e.preventDefault();

        // Validaciones con notificaciones flotantes
        if (!cajaAbierta) {
            return Toast.fire({ icon: 'error', title: 'Caja Cerrada', text: 'Abre turno primero para vender' });
        }
        if (!monto || parseFloat(monto) <= 0) {
            return Toast.fire({ icon: 'warning', title: 'Atención', text: 'Ingresa un monto válido' });
        }
        if (!bancoSeleccionado || !titular || !numOperacion) {
            return Toast.fire({ icon: 'warning', title: 'Atención', text: 'Complete todos los campos' });
        }

        setCargando(true);
        const uid = usuario?.usuarioID || usuario?.UsuarioID;

        // Payload EXACTO para transferencia (Manda Titular y FormaPago "TRANSFERENCIA")
        const payload = {
            usuarioID: parseInt(uid),
            tipoComprobanteID: 2, // Boleta por defecto para transferencias
            clienteDoc: "00000000",
            clienteNombre: titular.toUpperCase(), 
            detalles: [{ CategoriaID: 1, Monto: parseFloat(monto) }], // 1 = Categoría "Varios" por defecto
            pagos: [{
                FormaPago: "TRANSFERENCIA", 
                EntidadID: parseInt(bancoSeleccionado),
                NumOperacion: numOperacion,
                NombreTitular: titular.toUpperCase(),
                Monto: parseFloat(monto)
            }]
        };

        try {
            const res = await api.post('/ventas/registrar', payload);
            
            // ✅ Notificación flotante de éxito
            Toast.fire({
                icon: 'success',
                title: '¡Transferencia Exitosa!',
                text: `Ticket: ${res.data.comprobante || res.data.Comprobante}`
            });

            setMonto(''); 
            setNumOperacion(''); 
            setTitular('');
        } catch (error) {
            const msg = error.response?.data?.mensaje || error.response?.data?.error || 'Error al registrar';
            
            // ❌ Notificación flotante de error (ej. Duplicidad)
            Toast.fire({
                icon: 'error',
                title: 'Error',
                text: msg
            });
        } finally {
            setCargando(false);
        }
    };

    // Función auxiliar para determinar el color del puntito del banco
    const obtenerClaseDot = (nombreBanco) => {
        const nom = String(nombreBanco).toUpperCase();
        if (nom.includes('INTERBANK')) return 'interbank';
        if (nom.includes('SCOTIA')) return 'scotia';
        if (nom.includes('BCP')) return 'bcp';
        if (nom.includes('BBVA')) return 'bbva';
        return 'generic';
    };

    return (
        <section className="vista-seccion activa" style={{ opacity: cajaAbierta ? 1 : 0.5, pointerEvents: cajaAbierta ? 'all' : 'none' }}>
            <div className="contenedor-ventas-pro">
                
                <div className="panel-transaccion-pro" style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
                    
                    <div className="cabecera-simple" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                        <h3><i className="fa-solid fa-building-columns"></i> Venta por Transferencia</h3>
                    </div>

                    <form onSubmit={handleRegistrarVenta} className="form-grid-pro">
                        
                        <div className="col-monto">
                            <h2 className="titulo-pago" style={{ color: '#059669' }}>
                                <i className="fa-solid fa-money-bill-transfer"></i> Monto Transferido
                            </h2>
                            <div className="input-hero">
                                <span className="moneda">S/</span>
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    step="0.01" 
                                    value={monto} 
                                    onChange={e => setMonto(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="col-detalles">
                            <label className="label-separador">Banco de Destino:</label>
                            <div className="selector-bancos wrap-grid">
                                {bancos.length === 0 ? (
                                    <p style={{ fontSize: '0.8rem' }}>Cargando bancos del sistema...</p>
                                ) : (
                                    bancos.map(b => {
                                        const idBan = b.entidadID || b.EntidadID;
                                        const nombreBan = b.nombre || b.Nombre;
                                        const claseDot = obtenerClaseDot(nombreBan);
                                        const estaSeleccionado = bancoSeleccionado === idBan;

                                        return (
                                            <button 
                                                key={idBan} 
                                                type="button"
                                                className={`chip-banco ${estaSeleccionado ? 'seleccionado' : ''}`}
                                                onClick={() => setBancoSeleccionado(idBan)}
                                            >
                                                <span className={`dot ${claseDot}`}></span> {nombreBan}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                            
                            <div className="input-operacion-wrapper" style={{ marginBottom: '0.8rem' }}>
                                <label>Nombre del Titular</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Distribuidora..." 
                                    value={titular} 
                                    onChange={e => setTitular(e.target.value)} 
                                    required 
                                />
                            </div>

                            <div className="input-operacion-wrapper">
                                <label>N° Operación</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: 123456789...." 
                                    maxLength="20" 
                                    value={numOperacion} 
                                    onChange={e => setNumOperacion(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} 
                                    required 
                                />
                            </div>
                            
                            <button type="submit" className="btn-registrar-grande" style={{ background: '#059669' }} disabled={cargando || !cajaAbierta}>
                                {cargando ? 'REGISTRANDO...' : 'CONFIRMAR TRANSFERENCIA'}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </section>
    );
};

export default VentaTransferencia;