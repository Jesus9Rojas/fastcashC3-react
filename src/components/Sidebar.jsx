import { useContext } from 'react';
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

    // Función para verificar si la ruta está activa y aplicarlo al <li>
    const esActivo = (path) => location.pathname === path ? 'activo' : '';

    return (
        // Agregamos la clase mobile-open dinámica
        <nav className={`sidebar ${colapsado ? 'colapsado' : ''} ${mobileOpen ? 'mobile-open' : ''}`} id="sidebar">
            <div className="sidebar-header">
                <div className="logo-contenedor">
                    <img src={logo} className="logo-sistema" alt="Rojas Más" />
                </div>
                
                <div className="perfil-caja">
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
    );
};

export default Sidebar;