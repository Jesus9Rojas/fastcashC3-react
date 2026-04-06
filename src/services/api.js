import axios from 'axios';

// 1. DETECCIÓN INTELIGENTE (Tu misma lógica)
const esLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' || 
                window.location.hostname === '127.0.0.2' || 
                window.location.protocol === 'file:';

const BASE_URL = esLocal 
    ? 'http://localhost:8080/api' 
    : 'https://fastcash-backendc3-production.up.railway.app/api';

// 2. CONFIGURACIÓN DE AXIOS
const api = axios.create({
    baseURL: BASE_URL
});

// Interceptor para agregar el token a TODAS las peticiones automáticamente
api.interceptors.request.use((config) => {
    const sesionStr = localStorage.getItem('usuarioSesion');
    if (sesionStr) {
        const usuario = JSON.parse(sesionStr);
        if (usuario && usuario.token) {
            config.headers.Authorization = `Bearer ${usuario.token}`;
        }
    }
    return config;
});

export default api;