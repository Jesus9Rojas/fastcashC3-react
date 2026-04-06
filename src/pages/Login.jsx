import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/login.css';
import logo from '../assets/img/img/LogoMas1.png'; 

// --- Función de sanetización básica ---
function sanitizarEntrada(texto) {
    if (!texto) return '';
    const elemento = document.createElement('div');
    elemento.innerText = texto;
    return elemento.innerHTML;
}

const Login = () => {
    const { login } = useContext(AuthContext); 
    
    // Estados del formulario
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPass, setMostrarPass] = useState(false);
    const [chkRemember, setChkRemember] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [errorVisual, setErrorVisual] = useState(false); // Para el borde rojo

    // Estado del Toast (Notificaciones)
    const [toast, setToast] = useState({ visible: false, mensaje: '', tipo: 'info' });

    // --- 1. LÓGICA RECORDAR SESIÓN (AL CARGAR) ---
    useEffect(() => {
        const savedUser = localStorage.getItem('fastcash_saved_user');
        if (savedUser) {
            setUsername(savedUser);
            setChkRemember(true);
        }
    }, []);

    // Helper para mostrar notificaciones
    const mostrarToast = (mensaje, tipo = 'info') => {
        setToast({ visible: true, mensaje, tipo });
        setTimeout(() => setToast({ visible: false, mensaje: '', tipo: 'info' }), 3000);
    };

    // --- LÓGICA LOGIN ---
    const handleLogin = async (e) => {
        e.preventDefault();
        
        const userSanitizado = sanitizarEntrada(username.trim());
        const passLimpio = password.trim();

        if (!userSanitizado || !passLimpio) {
            mostrarToast('Por favor complete todos los campos', 'error');
            return;
        }

        setCargando(true);

        try {
            const response = await api.post('/auth/login', { 
                username: userSanitizado, 
                password: passLimpio 
            });

            const data = response.data;

            // 🚀 LECTURA ROBUSTA: Soportamos camelCase y PascalCase
            const idLeido = data.usuarioID || data.UsuarioID;
            const nombreLeido = data.nombreCompleto || data.NombreCompleto;
            const rolLeido = data.rol || data.Rol;
            const userLeido = data.username || data.Username;
            const tokenLeido = data.token || data.Token || 'token-temporal-hasta-implementar-jwt';

            if (!idLeido) {
                throw new Error("El servidor no devolvió un ID de usuario válido.");
            }

            const sessionData = {
                usuarioID: idLeido,
                nombreCompleto: nombreLeido,
                rol: rolLeido,
                username: userLeido,
                token: tokenLeido 
            };

            // --- 2. LÓGICA RECORDAR SESIÓN (AL GUARDAR) ---
            if (chkRemember) {
                localStorage.setItem('fastcash_saved_user', userSanitizado);
            } else {
                localStorage.removeItem('fastcash_saved_user');
            }

            mostrarToast(`¡Bienvenido, ${sessionData.nombreCompleto}!`, 'success');
            
            // Esperamos un segundo para que se vea el toast antes de entrar
            setTimeout(() => {
                login(sessionData); // Esto actualiza el contexto y hace el cambio de pantalla
            }, 1000);

        } catch (error) {
            console.error("Error en Login:", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Credenciales incorrectas o servidor no disponible';
            
            mostrarToast(errorMsg, 'error');
            setErrorVisual(true);
            
            setTimeout(() => {
                setErrorVisual(false);
            }, 2000);
            
        } finally {
            setCargando(false);
        }
    };

    return (
        <>
            {/* --- COMPONENTE TOAST INTEGRADO --- */}
            {toast.visible && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px',
                    background: toast.tipo === 'error' ? '#ef4444' : '#10b981',
                    color: 'white', padding: '12px 24px', borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontWeight: '600',
                    zIndex: 1000, display: 'flex', alignItems: 'center', gap: '10px',
                    animation: 'slideIn 0.3s ease forwards'
                }}>
                    {toast.mensaje}
                </div>
            )}
            <style>{`
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `}</style>
            
            {/* --- CONTENEDOR PRINCIPAL --- */}
            <div className="contenedor-login" style={{ transition: 'all 0.5s ease', opacity: cargando ? 0.9 : 1 }}>
                
                <div className="panel-izquierdo">
                    <div className="overlay-gradiente"></div>
                    
                    <div className="contenido-panel-izquierdo">
                        <div className="branding">
                            <h1>Sistema de Gestión<br/><span>Comercial</span></h1>
                            <p>Control integral de ventas, inventarios y finanzas.</p>
                        </div>

                        <div className="features-list">
                            <div className="feature">
                                <div className="icon-box"><i className="fas fa-shield-alt"></i></div>
                                <div>
                                    <h4>Seguridad Bancaria</h4>
                                    <small>Encriptación de datos SSL</small>
                                </div>
                            </div>
                            <div className="feature">
                                <div className="icon-box"><i className="fas fa-bolt"></i></div>
                                <div>
                                    <h4>Tiempo Real</h4>
                                    <small>Sincronización instantánea</small>
                                </div>
                            </div>
                            <div className="feature">
                                <div className="icon-box"><i className="fas fa-chart-line"></i></div>
                                <div>
                                    <h4>Analítica Avanzada</h4>
                                    <small>Reportes inteligentes</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="panel-derecho">
                    <div className="form-wrapper">
                        
                        <div className="header-form">
                            <img src={logo} className="logo-login" alt="Logo Rojas Más" />
                            <h2>Bienvenido</h2>
                            <p>Ingresa tus credenciales para acceder</p>
                        </div>

                        <form onSubmit={handleLogin} autoComplete="off">
                            <div className="input-group">
                                <label htmlFor="username">Usuario</label>
                                <div className="input-field">
                                    <i className="fas fa-user input-icon"></i>
                                    <input 
                                        type="text" 
                                        id="username" 
                                        placeholder="Ej: admin" 
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        style={{ borderColor: errorVisual ? 'var(--color-primario)' : '' }}
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="password">Contraseña</label>
                                <div className="input-field">
                                    <i className="fas fa-lock input-icon"></i>
                                    <input 
                                        type={mostrarPass ? "text" : "password"} 
                                        id="password" 
                                        placeholder="••••••••" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ borderColor: errorVisual ? 'var(--color-primario)' : '' }}
                                        required 
                                    />
                                    <i 
                                        className={`far ${mostrarPass ? 'fa-eye-slash' : 'fa-eye'} toggle-pass`} 
                                        title="Ver contraseña"
                                        onClick={() => setMostrarPass(!mostrarPass)}
                                    ></i>
                                </div>
                            </div>
                            
                            <div className="options-login">
                                <label className="remember-me">
                                    <input 
                                        type="checkbox" 
                                        checked={chkRemember}
                                        onChange={(e) => setChkRemember(e.target.checked)}
                                    />
                                    <span className="checkmark"></span>
                                    Recordar mi usuario
                                </label>
                            </div>

                            <button type="submit" className="btn-login" disabled={cargando}>
                                <span>{cargando ? 'Verificando...' : 'Ingresar al Sistema'}</span>
                                {!cargando && <i className="fas fa-arrow-right"></i>}
                                {cargando && <i className="fas fa-spinner fa-spin"></i>}
                            </button>
                        </form>

                        <div className="footer-form">
                            <p>© 2026 Rojas Más. Todos los derechos reservados.</p>
                        </div>
                        
                    </div>
                </div>
                
            </div>
        </>
    );
};

export default Login;