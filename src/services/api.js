import axios from 'axios';

// La URL vendrá de las variables de entorno. 
// (Nota: Si usas Vite, cambia process.env.REACT_APP_API_URL por import.meta.env.VITE_API_URL)
const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: BASE_URL
});

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