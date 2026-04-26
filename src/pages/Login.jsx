import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/login.css';
import logo from '../assets/img/img/LogoMas1.png'; 

function sanitizarEntrada(texto) {
    if (!texto) return '';
    const elemento = document.createElement('div');
    elemento.innerText = texto;
    return elemento.innerHTML;
}

const Login = () => {
    const { login } = useContext(AuthContext); 
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPass, setMostrarPass] = useState(false);
    const [chkRemember, setChkRemember] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [errorVisual, setErrorVisual] = useState(false); 

    const [toast, setToast] = useState({ visible: false, mensaje: '', tipo: 'info' });

    useEffect(() => {
        const savedUser = localStorage.getItem('fastcash_saved_user');
        if (savedUser) {
            setUsername(savedUser);
            setChkRemember(true);
        }
    }, []);

    const mostrarToast = (mensaje, tipo = 'info') => {
        setToast({ visible: true, mensaje, tipo });
        setTimeout(() => setToast({ visible: false, mensaje: '', tipo: 'info' }), 3000);
    };

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

            const idLeido = data.usuarioID || data.UsuarioID;
            const nombreLeido = data.nombreCompleto || data.NombreCompleto;
            const rolLeido = data.rol || data.Rol;
            const userLeido = data.username || data.Username;
            const tokenLeido = data.token || data.Token || 'token-temporal';

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

            if (chkRemember) {
                localStorage.setItem('fastcash_saved_user', userSanitizado);
            } else {
                localStorage.removeItem('fastcash_saved_user');
            }

            mostrarToast(`¡Bienvenido, ${sessionData.nombreCompleto}!`, 'success');
            
            setTimeout(() => {
                login(sessionData); 
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
            {/* TOAST DE NOTIFICACIONES */}
            {toast.visible && (
                <div className="toast-notificacion" style={{ background: toast.tipo === 'error' ? '#ef4444' : '#10b981' }}>
                    <i className={`fas ${toast.tipo === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'}`}></i>
                    {toast.mensaje}
                </div>
            )}
            
            {/* CONTENEDOR PRINCIPAL CON IMAGEN DE FONDO */}
            <div className="login-modern-layout">
                
                <div className="login-content-wrapper">
                    
                    {/* PANEL IZQUIERDO: TEXTOS E INFORMACIÓN FLOTANTE */}
                    <div className="login-info-panel">
                        <div className="branding-modern">
                            <h1>Sistema de Gestión<br/><span>Comercial</span></h1>
                            <p>Control integral de ventas, inventarios y finanzas.</p>
                        </div>

                        <div className="features-modern">
                            <div className="feature-item-modern">
                                <div className="icon-glass-modern"><i className="fas fa-shield-alt"></i></div>
                                <div className="feature-text">
                                    <h4>Seguridad Bancaria</h4>
                                    <span>Encriptación de datos SSL</span>
                                </div>
                            </div>
                            <div className="feature-item-modern">
                                <div className="icon-glass-modern"><i className="fas fa-bolt"></i></div>
                                <div className="feature-text">
                                    <h4>Tiempo Real</h4>
                                    <span>Sincronización instantánea</span>
                                </div>
                            </div>
                            <div className="feature-item-modern">
                                <div className="icon-glass-modern"><i className="fas fa-chart-line"></i></div>
                                <div className="feature-text">
                                    <h4>Analítica Avanzada</h4>
                                    <span>Reportes inteligentes</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PANEL DERECHO: FORMULARIO GLASSMORPHISM */}
                    <div className="login-form-panel">
                        <div className="login-glass-card" style={{ opacity: cargando ? 0.8 : 1, transform: cargando ? 'scale(0.98)' : 'scale(1)' }}>
                            
                            <div className="login-header-modern">
                                <div className="logo-container-modern">
                                    <img src={logo} className="logo-login-modern" alt="Logo Rojas Más" />
                                </div>
                                <h2>Iniciar Sesión</h2>
                                <p>Ingresa tus credenciales para acceder</p>
                            </div>

                            <form onSubmit={handleLogin} autoComplete="off" className="login-form-modern">
                                
                                <div className="input-group-modern">
                                    <label htmlFor="username">Usuario</label>
                                    <div className={`input-field-modern ${errorVisual ? 'error-shake' : ''}`}>
                                        <i className="fas fa-user icon-modern"></i>
                                        <input 
                                            type="text" 
                                            id="username" 
                                            placeholder="Ej: admin" 
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            style={{ borderColor: errorVisual ? '#ef4444' : '' }}
                                            required 
                                        />
                                    </div>
                                </div>

                                <div className="input-group-modern">
                                    <label htmlFor="password">Contraseña</label>
                                    <div className={`input-field-modern ${errorVisual ? 'error-shake' : ''}`}>
                                        <i className="fas fa-lock icon-modern"></i>
                                        <input 
                                            type={mostrarPass ? "text" : "password"} 
                                            id="password" 
                                            placeholder="••••••••" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            style={{ borderColor: errorVisual ? '#ef4444' : '' }}
                                            required 
                                        />
                                        <button 
                                            type="button"
                                            className="toggle-pass-modern"
                                            onClick={() => setMostrarPass(!mostrarPass)}
                                            title="Ver contraseña"
                                        >
                                            <i className={`far ${mostrarPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="options-row-modern">
                                    <label className="remember-checkbox">
                                        <input 
                                            type="checkbox" 
                                            checked={chkRemember}
                                            onChange={(e) => setChkRemember(e.target.checked)}
                                        />
                                        <div className="checkbox-box">
                                            <i className="fas fa-check"></i>
                                        </div>
                                        <span>Recordar mi usuario</span>
                                    </label>
                                </div>

                                <button type="submit" className="btn-login-modern" disabled={cargando}>
                                    {cargando ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            <span>Verificando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Ingresar al Sistema</span>
                                            <i className="fas fa-arrow-right"></i>
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="login-footer-modern">
                                <p>© {new Date().getFullYear()} Rojas Más. Todos los derechos reservados.</p>
                            </div>
                            
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default Login;