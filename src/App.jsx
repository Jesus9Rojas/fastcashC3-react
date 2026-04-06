import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

import Login from './pages/Login';
import Layout from './components/Layout';
import Bienvenida from './pages/Bienvenido';
import VentaYape from './pages/VentaYape';
import VentaTarjeta from './pages/VentaTarjeta';
import VentaTransferencia from './pages/VentaTransferencia';
import HistorialVentas from './pages/HistorialVentas';
import Configuracion from './pages/Configuracion'; 
import Reportes from './pages/Reportes'; 
import UsuariosTurnos from './pages/UsuariosTurnos';
import DashboardGraficos from './pages/DashboardGraficos';

import './styles/styles/base.css';
import './styles/styles/layout.css';
import './styles/styles/ventas.css';
import './styles/styles/admin-reportes.css';
import './styles/styles/media-queries.css';
import './styles/styles/tablas-modales.css';
import CierreCaja from './pages/CierreCaja';

function App() {
  const { usuario } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/login" element={!usuario ? <Login /> : <Navigate to="/" />} />

        <Route path="/" element={usuario ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Bienvenida />} />
          
          {/* 👇 3. CONECTAMOS LA PANTALLA A LA RUTA 👇 */}
          <Route path="yape" element={<VentaYape />} />
          <Route path="tarjeta" element={<VentaTarjeta />} />
          <Route path="transferencia" element={<VentaTransferencia />} />
          <Route path="historial" element={<HistorialVentas />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="usuarios" element={<UsuariosTurnos />} />
          <Route path="dashboard" element={<DashboardGraficos />} />
          <Route path="cierre" element={<CierreCaja />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;