import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';

const UsuariosTurnos = () => {
    const { usuario } = useContext(AuthContext);

    const [usuariosLista, setUsuariosLista] = useState([]);
    const [cargando, setCargando] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [animacionModal, setAnimacionModal] = useState('');
    
    const [formId, setFormId] = useState('');
    const [formNombre, setFormNombre] = useState('');
    const [formUsername, setFormUsername] = useState('');
    const [formRol, setFormRol] = useState('CAJERO');
    const [formEstado, setFormEstado] = useState('true');
    const [formTurno, setFormTurno] = useState('1'); 
    const [formPassword, setFormPassword] = useState('');

    const esAdmin = String(usuario?.rol || '').toUpperCase() === 'ADMINISTRADOR';

    // 1. CARGAR USUARIOS (Idéntico a admin.js)
    const cargarUsuarios = async () => {
        setCargando(true);
        try {
            // Agregamos un timestamp para evitar que el navegador cachee la respuesta y la deje en blanco
            const res = await api.get('/admin/usuarios', { params: { t: new Date().getTime() } });
            setUsuariosLista(res.data);
        } catch (error) {
            console.error("Error cargando usuarios:", error);
            Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (esAdmin) cargarUsuarios();
    }, [esAdmin]);

    // 2. MODAL NUEVO
    const abrirModalNuevo = () => {
        setModoEdicion(false);
        setFormId('');
        setFormNombre('');
        setFormUsername('');
        setFormRol('CAJERO');
        setFormEstado('true');
        setFormTurno('1');
        setFormPassword('');
        setAnimacionModal('mostrar');
        setModalVisible(true);
    };

    // 3. MODAL EDITAR (Mapeo exacto de tu admin.js)
    const abrirModalEditar = (item) => {
        setModoEdicion(true);
        
        setFormId(item.usuarioId || item.usuarioID || item.UsuarioID || item.usuarioid || item.id);
        setFormNombre(item.nombreCompleto || item.NombreCompleto || item.nombrecompleto);
        setFormUsername(item.username || item.Username);
        
        const rolMayus = String(item.rol || item.Rol || 'CAJERO').toUpperCase();
        setFormRol(rolMayus.includes('ADMIN') ? 'ADMINISTRADOR' : 'CAJERO');
        
        const activo = item.activo === true || item.Activo === true || String(item.activo) === 'true';
        setFormEstado(activo ? 'true' : 'false');
        
        // Aquí estaba el error del turno
        const turnoId = item.turnoId || item.TurnoID || item.turnoid || 1;
        setFormTurno(String(turnoId));
        
        setFormPassword(''); 
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

    // 4. GUARDAR USUARIO (Misma lógica y endpoints de admin.js)
    const handleGuardar = async (e) => {
        e.preventDefault();

        if (!modoEdicion && (!formPassword || formPassword.trim() === '')) {
            Swal.fire('Atención', 'Debe ingresar una contraseña para el nuevo usuario', 'warning');
            return;
        }

        let rolParseado = (formRol === 'ADMINISTRADOR') ? 1 : 2;

        // Payload duplicado para máxima compatibilidad con Spring Boot
        const payload = {
            nombreCompleto: formNombre,
            username: formUsername,
            rolId: rolParseado,
            rolID: rolParseado,
            turnoId: parseInt(formTurno),
            turnoID: parseInt(formTurno)
        };

        if (formPassword && formPassword.trim() !== '') {
            payload.password = formPassword;
        }

        try {
            if (modoEdicion) {
                payload.usuarioId = parseInt(formId);
                payload.usuarioID = parseInt(formId);
                payload.activo = formEstado === 'true';
                
                // NOTA: Tu código original hace un PUT a /admin/usuario (singular)
                await api.put('/admin/usuario', payload);
                Swal.fire('Actualizado', 'Usuario actualizado correctamente', 'success');
            } else {
                const uidActual = usuario?.usuarioID || usuario?.UsuarioID;
                payload.adminId = parseInt(uidActual);
                payload.adminID = parseInt(uidActual);
                payload.activo = true;
                
                // NOTA: Tu código original hace un POST a /admin/usuario (singular)
                await api.post('/admin/usuario', payload);
                Swal.fire('Creado', 'Usuario registrado correctamente', 'success');
            }
            
            cerrarModal();
            cargarUsuarios(); 
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.mensaje || error.response?.data?.error || 'Error al guardar el usuario';
            Swal.fire('Error', msg, 'error');
        }
    };

    // 5. DESACTIVAR USUARIO (Como tu eliminarUsuario en admin.js)
    const handleEliminar = async (idUsuario) => {
        const confirmacion = await Swal.fire({
            title: '¿Desactivar Usuario?',
            text: 'El usuario quedará inhabilitado para entrar al sistema.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, Desactivar'
        });

        if (confirmacion.isConfirmed) {
            try {
                // Tu código original usa DELETE para desactivar
                await api.delete(`/admin/usuario/${idUsuario}`);
                Swal.fire('Éxito', 'Usuario Desactivado', 'success');
                cargarUsuarios();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'No se pudo desactivar el usuario', 'error');
            }
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
                            <h2><i className="fa-solid fa-users"></i> Gestión de Usuarios</h2>
                            <p>Crea y administra accesos y turnos.</p>
                        </div>
                        <button className="btn-nuevo-usuario" onClick={abrirModalNuevo}>
                            + Nuevo Usuario
                        </button>
                    </div>

                    <div className="tabla-responsive">
                        <table className="tabla-transacciones">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Usuario</th>
                                    <th>Turno</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>⏳ Cargando usuarios...</td></tr>
                                ) : usuariosLista.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No hay usuarios registrados.</td></tr>
                                ) : (
                                    usuariosLista.map(u => {
                                        // Variables exactas de admin.js
                                        const uid = u.usuarioId || u.usuarioID || u.UsuarioID || u.usuarioid || u.id; 
                                        const rolNombre = u.rol || u.Rol || 'CAJERO';
                                        const rolClase = (String(rolNombre).toUpperCase().includes('ADMIN')) ? 'admin' : 'cajero';
                                        const esActivo = (u.activo === true || u.Activo === true || String(u.activo) === "true");
                                        const nombre = u.nombreCompleto || u.NombreCompleto || u.nombrecompleto;
                                        const uname = u.username || u.Username;
                                        const turno = u.turnoActual || u.TurnoActual || u.turnoactual || '-';

                                        if (!uid) return null;

                                        return (
                                            <tr key={uid} style={{ opacity: esActivo ? 1 : 0.5 }}>
                                                <td style={{ color: '#333' }}>{uid}</td>
                                                <td style={{ fontWeight: 'bold', color: '#333' }}>{nombre}</td>
                                                <td style={{ color: '#333' }}><strong>{uname}</strong></td>
                                                <td style={{ color: '#333' }}>{turno}</td>
                                                <td><span className={`badge-rol ${rolClase}`}>{rolNombre}</span></td>
                                                <td style={{ color: '#333', fontWeight: 'bold' }}>{esActivo ? '🟢 Activo' : '🔴 Inactivo'}</td>
                                               <td style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginLeft: '-46px' }}>
                                                    <button className="btn-accion-tabla editar" onClick={() => abrirModalEditar(u)} title="Editar Usuario">✏️</button>
                                                    {esActivo && (
                                                        <button className="btn-accion-tabla eliminar" onClick={() => handleEliminar(uid)} title="Desactivar Usuario">🗑️</button>
                                                    )}
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

            {/* --- MODAL (FIJO Y CENTRADO, FUERA DE LA TABLA) --- */}
            {modalVisible && (
                <div 
                    className={`modal ${animacionModal}`} 
                    style={{ 
                        display: 'flex', 
                        position: 'fixed', 
                        top: 0, left: 0, width: '100vw', height: '100vh', 
                        zIndex: 99999, 
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center', alignItems: 'center'
                    }}
                >
                    <div className="modal-contenido-bonito" style={{ margin: 'auto', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h2>{modoEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                            <span className="cerrar-modal" onClick={cerrarModal}>&times;</span>
                        </div>

                        <form onSubmit={handleGuardar}>
                            
                            <div className="form-group">
                                <label>Nombre Completo:</label>
                                <input type="text" className="input-moderno" placeholder="Ej: Juan Perez" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} required style={{ width: '100%', padding: '10px' }} />
                            </div>

                            <div className="form-group">
                                <label>Usuario (Login):</label>
                                <input type="text" className="input-moderno" placeholder="Ej: jperez" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} required style={{ width: '100%', padding: '10px' }} autoComplete="off" />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Rol:</label>
                                    <select className="input-select-modal" value={formRol} onChange={(e) => setFormRol(e.target.value)} style={{ width: '100%' }}>
                                        <option value="CAJERO">Cajero</option>
                                        <option value="ADMINISTRADOR">Administrador</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Estado:</label>
                                    <select className="input-select-modal" value={formEstado} onChange={(e) => setFormEstado(e.target.value)} style={{ width: '100%' }}>
                                        <option value="true">Activo</option>
                                        <option value="false">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Turno Asignado:</label>
                                <select className="input-select-modal" value={formTurno} onChange={(e) => setFormTurno(e.target.value)} style={{ width: '100%' }}>
                                    <option value="1">☀️ MAÑANA</option>
                                    <option value="2">🌙 TARDE</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label>Contraseña {modoEdicion && <span style={{fontSize:'0.8rem', color:'#666'}}>(Dejar vacío para no cambiarla)</span>}:</label>
                                <input type="text" className="input-moderno" placeholder={modoEdicion ? "••••••••" : "Ingrese contraseña"} value={formPassword} onChange={(e) => setFormPassword(e.target.value)} style={{ width: '100%', padding: '10px' }} autoComplete="new-password" />
                            </div>

                            <div className="modal-footer">
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

export default UsuariosTurnos;