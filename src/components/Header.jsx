import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';

// 1. ÚNICA DECLARACIÓN DE ICONOS MODERNOS (Reemplaza a los emojis)
const iconosTema = {
    'light': <i className="fa-solid fa-sun" style={{ color: '#f59e0b' }}></i>,
    'dark': <i className="fa-solid fa-moon" style={{ color: '#cbd5e1' }}></i>,
    'pink': <i className="fa-solid fa-spa" style={{ color: '#ec4899' }}></i>,
    'red': <i className="fa-solid fa-fire" style={{ color: '#ef4444' }}></i>
};

const Header = ({ toggleSidebar, isMobileOpen }) => {
    const { usuario, logout, cajaAbierta, setCajaAbierta } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [menuTemaActivo, setMenuTemaActivo] = useState(false);
    const [abriendo, setAbriendo] = useState(false);
    
    // Estados nuevos para Reloj y Tema
    const [horaActual, setHoraActual] = useState('');
    const [temaActual, setTemaActual] = useState(localStorage.getItem('temaFastCash') || 'light');

    // RELOJ EN TIEMPO REAL
    useEffect(() => {
        const actualizarReloj = () => {
            const ahora = new Date();
            const texto = ahora.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
            setHoraActual(texto);
        };
        actualizarReloj();
        const intervalo = setInterval(actualizarReloj, 1000);
        return () => clearInterval(intervalo);
    }, []);

    // APLICAR TEMA AL CARGAR LA PÁGINA
    useEffect(() => {
        document.body.setAttribute('data-theme', temaActual);
    }, [temaActual]);

    // Verificar Caja
    useEffect(() => {
        const verificarCaja = async () => {
            try {
                const uid = usuario?.usuarioID || usuario?.UsuarioID;
                const res = await api.get(`/caja/estado/${uid}`);
                const estadoReal = res.data.estado || res.data.Estado;
                setCajaAbierta(estadoReal === 'ABIERTO');
            } catch (e) {
                console.error("Error verificando caja", e);
                setCajaAbierta(false);
            }
        };
        if (usuario) verificarCaja();
    }, [usuario, setCajaAbierta]);

    const handleAbrirCaja = async () => {
        setAbriendo(true);
        try {
            const uid = usuario?.usuarioID || usuario?.UsuarioID;
            await api.post('/caja/abrir', { 
                usuarioID: parseInt(uid), 
                usuarioId: parseInt(uid), 
                saldoInicial: 0.00 
            });
            
            setCajaAbierta(true);
            
            Swal.fire({ 
                title: '¡Turno Iniciado!', 
                text: 'Caja Abierta Correctamente.', 
                icon: 'success', 
                timer: 2000, 
                showConfirmButton: false 
            });
            
        } catch (error) {
            const msg = error.response?.data?.mensaje || error.response?.data?.error || "Error al abrir caja";
            Swal.fire('Error', msg, 'error');
        } finally {
            setAbriendo(false);
        }
    };

    // 2. FUNCIÓN PARA CAMBIAR Y GUARDAR EL TEMA (Faltaba en tu código)
    const cambiarTema = (nuevoTema) => {
        setTemaActual(nuevoTema);
        localStorage.setItem('temaFastCash', nuevoTema); // Guarda la preferencia del usuario
        setMenuTemaActivo(false); // Cierra el menú al hacer clic
    };

    return (
        <header className="header-sistema">
            <div className="header-izquierda">
                <button 
                    className={`btn-hamburguesa ${isMobileOpen ? 'activo' : ''}`} 
                    onClick={toggleSidebar}
                >
                    <span className="linea linea-1"></span>
                    <span className="linea linea-2"></span>
                    <span className="linea linea-3"></span>
                </button>
                
                {/* SELECTOR DE TEMAS */}
                <div className="selector-tema-wrapper" style={{ position: 'relative' }}>
                    <button className="btn-tema" onClick={() => setMenuTemaActivo(!menuTemaActivo)} title="Cambiar Tema">
                        <span id="iconoTemaActual">{iconosTema[temaActual] || <i className="fa-solid fa-palette"></i>}</span>
                    </button>
                    {menuTemaActivo && (
                        <div className="menu-temas mostrar" style={{ display: 'block' }}>
                            <button className="opcion-tema" onClick={() => cambiarTema('light')}><span className="color-dot light"></span> Modo Claro</button>
                            <button className="opcion-tema" onClick={() => cambiarTema('dark')}><span className="color-dot dark"></span> Modo Oscuro</button>
                            <button className="opcion-tema" onClick={() => cambiarTema('pink')}><span className="color-dot pink"></span> Modo Pink</button>
                            <button className="opcion-tema" onClick={() => cambiarTema('red')}><span className="color-dot red"></span> Modo Rojo</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="header-derecha">
                <div className="turno-info">
                    <span className="turno-actual fecha-hora-reloj">{horaActual}</span>
                </div>
                
                {!cajaAbierta && (
                    <button className="btn-abrir-caja" onClick={handleAbrirCaja} disabled={abriendo}>
                        <span className="icono-btn"><i className="fa-solid fa-box-open"></i></span> 
                        {abriendo ? 'Abriendo...' : 'Abrir Caja'}
                    </button>
                )}

                <button className="btn-cerrar-sesion" onClick={() => { logout(); navigate('/login'); }}>
                    <span className="icono-btn"><i className="fa-solid fa-arrow-right-from-bracket"></i></span> Salir
                </button>
            </div>
        </header>
    );
};

export default Header;