import { createContext, useState } from 'react';

// Esta línea apaga la advertencia roja de Vite para este archivo
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Inicializamos el estado leyendo el localStorage directamente (Mejor práctica)
    const [usuario, setUsuario] = useState(() => {
        const sesion = localStorage.getItem('usuarioSesion');
        return sesion ? JSON.parse(sesion) : null;
    });
    
    const [cajaAbierta, setCajaAbierta] = useState(false);

    const login = (datosUsuario) => {
        localStorage.setItem('usuarioSesion', JSON.stringify(datosUsuario));
        setUsuario(datosUsuario);
    };

    const logout = () => {
        localStorage.removeItem('usuarioSesion');
        setUsuario(null);
        setCajaAbierta(false);
    };

    return (
        <AuthContext.Provider value={{ usuario, login, logout, cajaAbierta, setCajaAbierta }}>
            {children}
        </AuthContext.Provider>
    );
};