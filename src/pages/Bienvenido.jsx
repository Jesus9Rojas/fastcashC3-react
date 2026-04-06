import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Bienvenida = () => {
    const { usuario } = useContext(AuthContext);

    return (
        <div style={{ textAlign: 'center', marginTop: '10vh' }}>
            <h1 style={{ fontSize: '3rem', color: '#1E293B', marginBottom: '1rem' }}>
                ¡Hola, {usuario?.nombreCompleto}! 👋
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#64748B' }}>
                Bienvenido al sistema. Selecciona una opción en el menú izquierdo para comenzar a operar.
            </p>
        </div>
    );
};

export default Bienvenida;