import { useContext, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Tus importaciones exactas
import logo from '../assets/img/img/LogoMas1.png';
import avatar from '../assets/img/icon/mujer.png';
import transferencia from '../assets/img/icon/transferencia-movil.png';
import tarjeta from '../assets/img/icon/tarjeta-icon.png';
import anular from '../assets/img/icon/anular-icon.png';
import configuracion from '../assets/img/icon/configuracion-web.png';
import reportes from '../assets/img/icon/reporte-icon.png';

const Sidebar = ({ colapsado, mobileOpen, onNavigate }) => {
    const { usuario } = useContext(AuthContext);
    const location = useLocation();
    
    // Estado para controlar la visibilidad del modal del perfil
    const [showModalPerfil, setShowModalPerfil] = useState(false);

    // Función para verificar si la ruta está activa y aplicarlo al <li>
    const esActivo = (path) => location.pathname === path ? 'activo' : '';

    return (
        <>
            <nav className={`sidebar ${colapsado ? 'colapsado' : ''} ${mobileOpen ? 'mobile-open' : ''}`} id="sidebar">
                <div className="sidebar-header">
                    <div className="logo-contenedor">
                        <img src={logo} className="logo-sistema" alt="Rojas Más" />
                    </div>
                    
                    {/* SECCIÓN DE PERFIL CLICKABLE PARA ABRIR MODAL */}
                    <div 
                        className="perfil-caja" 
                        onClick={() => setShowModalPerfil(true)}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        title="Ver mi perfil"
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <div className="avatar-placeholder">
                            <img src={avatar} alt="Foto" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        </div>
                        <div className="info-usuario-sidebar">
                            <span className="nombre-cajero">{usuario?.nombreCompleto || 'Cargando...'}</span>
                            <span className="rol-cajero">{usuario?.rol || '...'}</span> 
                        </div>
                    </div>
                </div>

                <ul className="lista-menu">
                    <li className="titulo-seccion-menu">OPERACIONES</li>
                    
                    <li className={`item-menu ${esActivo('/yape')}`}>
                        <NavLink to="/yape" onClick={onNavigate}>
                            <div className="icono-wrapper"><i className="fa-solid fa-qrcode" style={{fontSize: '1.2rem'}}></i></div>
                            <span className="texto-menu">Venta Yape/Plin</span>
                        </NavLink>
                    </li>
                    
                    <li className={`item-menu ${esActivo('/tarjeta')}`}>
                        <NavLink to="/tarjeta" onClick={onNavigate}>
                            <div className="icono-wrapper"><img src={tarjeta} alt="Tarjeta" className="icon-foto" /></div>
                            <span className="texto-menu">Venta Tarjeta</span>
                        </NavLink>
                    </li>

                    <li className={`item-menu ${esActivo('/transferencia')}`}>
                        <NavLink to="/transferencia" onClick={onNavigate}>
                            <div className="icono-wrapper"><img src={transferencia} alt="Transferencia" className="icon-foto" /></div>
                            <span className="texto-menu">Transferencias</span>
                        </NavLink>
                    </li>

                    <li className={`item-menu ${esActivo('/historial')}`}>
                        <NavLink to="/historial" onClick={onNavigate}>
                            <div className="icono-wrapper"><img src={anular} alt="Anular" className="icon-foto" /></div>
                            <span className="texto-menu">Historial / Anular</span>
                        </NavLink>
                    </li>

                    {String(usuario?.rol || '').toUpperCase() === 'ADMINISTRADOR' && (
                        <>
                            <li className="titulo-seccion-menu admin">ADMINISTRACIÓN</li>
                            
                            <li className={`item-menu admin ${esActivo('/configuracion')}`}>
                                <NavLink to="/configuracion" onClick={onNavigate}>
                                    <div className="icono-wrapper"><img src={configuracion} alt="Configuración" className="icon-foto" /></div>
                                    <span className="texto-menu">Configuración</span>
                                </NavLink>
                            </li>

                            <li className={`item-menu admin ${esActivo('/reportes')}`}>
                                <NavLink to="/reportes" onClick={onNavigate}>
                                    <div className="icono-wrapper"><img src={reportes} alt="Reportes" className="icon-foto" /></div>
                                    <span className="texto-menu">Reportes</span>
                                </NavLink>
                            </li>
                            
                            <li className={`item-menu admin ${esActivo('/usuarios')}`}>
                                <NavLink to="/usuarios" onClick={onNavigate}>
                                    <div className="icono-wrapper"><i className="fa-solid fa-users" style={{fontSize: '1.2rem'}}></i></div>
                                    <span className="texto-menu">Usuarios & Turnos</span>
                                </NavLink>
                            </li>
                            
                            <li className={`item-menu admin ${esActivo('/dashboard')}`}>
                                <NavLink to="/dashboard" onClick={onNavigate}>
                                    <div className="icono-wrapper"><i className="fa-solid fa-chart-line" style={{fontSize: '1.2rem'}}></i></div>
                                    <span className="texto-menu">Gráficos Dashboard</span>
                                </NavLink>
                            </li>
                        </>
                    )}
                    
                    <li className={`item-menu cierre ${esActivo('/cierre')}`}>
                        <NavLink to="/cierre" onClick={onNavigate}>
                            <div className="icono-wrapper"><i className="fa-solid fa-cash-register" style={{fontSize: '1.2rem'}}></i></div>
                            <span className="texto-menu">Cierre de Caja</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>

            {/* MODAL DE PERFIL FLOTANTE */}
            {showModalPerfil && (
                <div className="modal-perfil-overlay" onClick={() => setShowModalPerfil(false)}>
                    <div className="modal-perfil-content" onClick={e => e.stopPropagation()}>
                        
                        <div className="modal-perfil-header">
                            <h3>Mi Perfil de Usuario</h3>
                            <button className="btn-close-modal" onClick={() => setShowModalPerfil(false)}>&times;</button>
                        </div>
                        
                        <div className="modal-perfil-body">
                            <div className="perfil-avatar-big">
                                <img src={avatar} alt="Avatar Grande" style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--color-primario)', objectFit: 'cover' }} />
                            </div>
                            
                            <div className="perfil-info-grid">
                                <div className="info-item">
                                    <label>Nombre Completo</label>
                                    <p>{usuario?.nombreCompleto || 'No definido'}</p>
                                </div>
                                <div className="info-item">
                                    <label>Rol de Sistema</label>
                                    <p className="badge-role">{usuario?.rol || 'Personal'}</p>
                                </div>
                                <div className="info-item">
                                    <label>Turno Asignado</label>
                                    <p>{usuario?.turno || 'General'}</p>
                                </div>
                                <div className="info-item">
                                    <label>Estado de la Cuenta</label>
                                    <p className="status-active">
                                        <span className="dot"></span> Activo y Operativo
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-perfil-footer">
                            <button className="btn-entendido" onClick={() => setShowModalPerfil(false)}>
                                <i className="fa-solid fa-check"></i> Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ESTILOS CSS DEL MODAL */}
            <style>
                {`
                    .modal-perfil-overlay {
                        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                        background: rgba(0,0,0,0.6); display: flex; align-items: center;
                        justify-content: center; z-index: 9999; backdrop-filter: blur(5px);
                    }
                    .modal-perfil-content {
                        background: var(--color-header); width: 90%; max-width: 400px;
                        border-radius: 20px; overflow: hidden; animation: slideUp 0.3s ease;
                        border: 1px solid var(--border-color); box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    }
                    .modal-perfil-header {
                        padding: 1.2rem 1.5rem; background: var(--color-primario); color: white;
                        display: flex; justify-content: space-between; align-items: center;
                    }
                    .modal-perfil-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; }
                    .btn-close-modal { 
                        background: none; border: none; color: white; font-size: 1.5rem; 
                        cursor: pointer; opacity: 0.8; transition: opacity 0.2s; padding: 0;
                    }
                    .btn-close-modal:hover { opacity: 1; }
                    .perfil-avatar-big {
                        text-align: center; margin: 1.5rem 0 0.5rem 0;
                    }
                    .perfil-info-grid { padding: 1rem 1.5rem 1.5rem; display: grid; gap: 1.2rem; }
                    .info-item label { 
                        display: block; font-size: 0.75rem; color: var(--texto-secundario);
                        margin-bottom: 0.3rem; font-weight: 600; text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .info-item p { font-weight: 700; color: var(--texto-principal); margin: 0; font-size: 1.1rem; }
                    .badge-role { color: var(--color-primario) !important; }
                    .status-active { color: #10b981 !important; display: flex; align-items: center; gap: 8px; font-weight: bold; }
                    .dot { width: 10px; height: 10px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; }
                    .modal-perfil-footer {
                        padding: 0 1.5rem 1.5rem; text-align: center;
                    }
                    .btn-entendido {
                        background: #111827; color: white; border: none;
                        padding: 0.8rem 2rem; border-radius: 12px; font-weight: 600; cursor: pointer;
                        transition: all 0.2s; width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px;
                    }
                    .btn-entendido:hover { background: #1f2937; transform: translateY(-2px); }
                    
                    @keyframes slideUp {
                        from { transform: translateY(30px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}
            </style>
        </>
    );
};

export default Sidebar;