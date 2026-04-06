import { useState, useEffect } from 'react';

const ContadorAnimado = ({ valorFinal, duracion = 1000 }) => {
    const [valor, setValor] = useState(0);

    useEffect(() => {
        let inicio = null;
        const animar = (timestamp) => {
            if (!inicio) inicio = timestamp;
            // Calculamos el progreso de 0 a 1
            const progreso = Math.min((timestamp - inicio) / duracion, 1);
            
            // Efecto de frenado suave (Ease Out)
            const easeOut = 1 - Math.pow(1 - progreso, 4); 
            setValor(valorFinal * easeOut);
            
            if (progreso < 1) {
                window.requestAnimationFrame(animar);
            } else {
                setValor(valorFinal); // Aseguramos el monto exacto al final
            }
        };
        window.requestAnimationFrame(animar);
    }, [valorFinal, duracion]);

    // Retorna el número formateado a 2 decimales
    return <span>{valor.toFixed(2)}</span>;
};

export default ContadorAnimado;