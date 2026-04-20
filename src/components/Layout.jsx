import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
    const [sidebarColapsado, setSidebarColapsado] = useState(false);
    const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setSidebarMobileOpen(!sidebarMobileOpen);
        } else {
            setSidebarColapsado(!sidebarColapsado);
        }
    };

    // Función para cerrar el menú al hacer clic en una opción (solo en mobile)
    const cerrarMobile = () => setSidebarMobileOpen(false);

    return (
        <div className="layout-principal" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            
            <Sidebar 
                colapsado={sidebarColapsado} 
                mobileOpen={sidebarMobileOpen} 
                onNavigate={cerrarMobile} 
            />

            <div className="contenedor-derecho" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                <Header toggleSidebar={toggleSidebar} isMobileOpen={sidebarMobileOpen} />

                <main className="area-trabajo" style={{ padding: '2rem', overflowY: 'auto' }}>
                    <Outlet />
                </main>
                
            </div>
        </div>
    );
};

export default Layout;