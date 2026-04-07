import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';

const Configuracion = () => {
    const { usuario } = useContext(AuthContext);
    
    const [tabActiva, setTabActiva] = useState('categorias'); 
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [animacionModal, setAnimacionModal] = useState(''); 
    
    const [formId, setFormId] = useState('');
    const [formNombre, setFormNombre] = useState('');
    const [formActivo, setFormActivo] = useState('true');
    const [formTipo, setFormTipo] = useState('BANCO');
    
    // 👇 Variables en memoria para no perder el icono ni el color al editar
    const [formIcono, setFormIcono] = useState('📦');
    const [formColor, setFormColor] = useState('#E60023');

    const esAdmin = String(usuario?.rol || '').toUpperCase() === 'ADMINISTRADOR';

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const endpoint = tabActiva === 'categorias' ? '/maestros/categorias' : '/maestros/entidades';
            const res = await api.get(endpoint);
            setDatos(res.data);
        } catch (error) {
            console.error("Error cargando datos:", error);
            Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (esAdmin) cargarDatos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabActiva, esAdmin]);

    const abrirModalNuevo = () => {
        setModoEdicion(false);
        setFormId('');
        setFormNombre('');
        setFormActivo('true');
        setFormTipo('BANCO');
        setFormIcono('📦');
        setFormColor('#E60023');
        setAnimacionModal('mostrar');
        setModalVisible(true);
    };

    const abrirModalEditar = (item) => {
        setModoEdicion(true);
        if (tabActiva === 'categorias') {
            setFormId(item.categoriaID || item.CategoriaID);
            setFormNombre(item.nombre || item.Nombre);
            const activo = item.activo === true || item.Activo === true || String(item.activo) === 'true';
            setFormActivo(activo ? 'true' : 'false');
            
            // 👇 Capturamos el icono que tiene actualmente
            setFormIcono(item.icono || item.Icono || '📦');
            setFormColor(item.colorHex || item.ColorHex || '#E60023');
        } else {
            setFormId(item.entidadID || item.EntidadID);
            setFormNombre(item.nombre || item.Nombre);
            setFormTipo(item.tipo || item.Tipo || 'BANCO');
            const activo = item.activo === true || item.Activo === true || String(item.activo) === 'true';
            setFormActivo(activo ? 'true' : 'false');
        }
        setAnimacionModal('mostrar');
        setModalVisible(true);
    };

    const cerrarModal = () => {
        setAnimacionModal('saliendo');
        setTimeout(() => {
            setModalVisible(false);
            setAnimacionModal('');
        }, 300);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        
        const payload = {
            nombre: formNombre,
            activo: formActivo === 'true'
        };

        if (tabActiva === 'entidades') {
            payload.tipo = formTipo;
        } else {
            // 👇 Enviamos los datos originales que capturamos, no cajitas por defecto
            payload.colorHex = formColor;
            payload.icono = formIcono;
        }

        try {
            const endpoint = tabActiva === 'categorias' ? '/maestros/categorias' : '/maestros/entidades';
            
            if (modoEdicion) {
                await api.put(`${endpoint}/${formId}`, payload);
                Swal.fire('Actualizado', 'Registro actualizado correctamente', 'success');
            } else {
                await api.post(endpoint, payload);
                Swal.fire('Creado', 'Nuevo registro guardado', 'success');
            }
            
            cerrarModal();
            cargarDatos(); 
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo guardar el registro', 'error');
        }
    };

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
        <>
            <section className="vista-seccion activa">
                <div className="contenedor-tabla-registro">
                    
                    <div className="cabecera-tabla">
                        <div className="titulo-seccion">
                            <h2><i className="fa-solid fa-gear"></i> Configuración del Sistema</h2>
                            <p>Gestiona Categorías y Entidades Financieras</p>
                        </div>
                    </div>

                    <div className="admin-container">
                        
                        <div className="admin-tabs" style={{ marginBottom: '20px' }}>
                            <button className={`btn-tab ${tabActiva === 'categorias' ? 'activo' : ''}`} onClick={() => setTabActiva('categorias')}>
                                <i className="fa-solid fa-box"></i> Categorías
                            </button>
                            <button className={`btn-tab ${tabActiva === 'entidades' ? 'activo' : ''}`} onClick={() => setTabActiva('entidades')}>
                                <i className="fa-solid fa-building-columns"></i> Bancos y Billeteras
                            </button>
                        </div>
                        <hr style={{ border: 0, borderTop: '1px solid var(--color-border)', marginBottom: '20px' }} />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                            <button className="btn-nuevo-usuario" onClick={abrirModalNuevo}>+ Nuevo Registro</button>
                        </div>

                        <div className="tabla-responsive">
                            <table className="tabla-transacciones">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        {tabActiva === 'entidades' && <th>Tipo</th>}
                                        <th>Estado</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cargando ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td></tr>
                                    ) : datos.length === 0 ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No hay registros.</td></tr>
                                    ) : (
                                        datos.map(item => {
                                            const id = tabActiva === 'categorias' ? (item.categoriaID || item.CategoriaID) : (item.entidadID || item.EntidadID);
                                            const nombre = item.nombre || item.Nombre;
                                            const activo = item.activo === true || item.Activo === true || String(item.activo) === 'true';
                                            
                                            return (
                                                <tr key={id}>
                                                    <td>{id}</td>
                                                    <td style={{ fontWeight: 'bold' }}>{nombre}</td>
                                                    {tabActiva === 'entidades' && <td>{item.tipo || item.Tipo}</td>}
                                                    <td>
                                                        <span className={`badge-estado ${activo ? 'completado' : 'anulado'}`}>
                                                            {activo ? 'ACTIVO' : 'INACTIVO'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="btn-nuevo-usuario" onClick={() => abrirModalEditar(item)} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                                            <i className="fa-solid fa-pen-to-square"></i> Editar
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
                </div>
            </section>

            {modalVisible && (
                <div className={`modal ${animacionModal}`} style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="modal-contenido-bonito" style={{ margin: 'auto', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h2>{modoEdicion ? 'Editar Registro' : 'Nuevo Registro'}</h2>
                            <span className="cerrar-modal" onClick={cerrarModal}>&times;</span>
                        </div>

                        <form onSubmit={handleGuardar}>
                            <div className="form-group">
                                <label>Nombre:</label>
                                <input type="text" className="input-moderno" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} required style={{ width: '100%', padding: '10px' }} />
                            </div>

                            {tabActiva === 'entidades' && (
                                <div className="form-group">
                                    <label>Tipo:</label>
                                    <select className="input-select-modal" value={formTipo} onChange={(e) => setFormTipo(e.target.value)} style={{ width: '100%' }}>
                                        <option value="BANCO">Banco</option>
                                        <option value="BILLETERA">Billetera Digital</option>
                                        <option value="OTRO">Otro</option>
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Estado:</label>
                                <select className="input-select-modal" value={formActivo} onChange={(e) => setFormActivo(e.target.value)} style={{ width: '100%' }}>
                                    <option value="true">Activo</option>
                                    <option value="false">Inactivo</option>
                                </select>
                            </div>

                            <div className="modal-footer" style={{ marginTop: '20px' }}>
                                <button type="button" className="btn-cancelar" onClick={cerrarModal}>Cancelar</button>
                                <button type="submit" className="btn-guardar">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Configuracion;