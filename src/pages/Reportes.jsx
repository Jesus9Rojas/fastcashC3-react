import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';
import XLSX from 'xlsx-js-style';
import html2pdf from 'html2pdf.js';

const Reportes = () => {
    const { usuario } = useContext(AuthContext);

    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [usuarioFiltro, setUsuarioFiltro] = useState('');
    const [usuariosLista, setUsuariosLista] = useState([]);
    const [cargando, setCargando] = useState(null); // 'EXCEL-GENERAL', 'PDF-CAJAS', etc.

    const esAdmin = String(usuario?.rol || '').toUpperCase() === 'ADMINISTRADOR';

    // Cargar cajeros para el filtro (solo si es admin)
    useEffect(() => {
        const cargarUsuarios = async () => {
            if (!esAdmin) return;
            try {
                const res = await api.get('/admin/usuarios');
                setUsuariosLista(res.data);
            } catch (error) {
                console.error("Error cargando usuarios:", error);
            }
        };
        cargarUsuarios();
    }, [esAdmin]);

    // Función para armar los parámetros de la consulta
    const obtenerParametros = () => {
        const params = {};
        if (fechaInicio) params.inicio = fechaInicio;
        if (fechaFin) params.fin = fechaFin;
        
        if (esAdmin && usuarioFiltro) {
            params.usuarioID = usuarioFiltro;
        } else if (!esAdmin) {
            params.usuarioID = usuario?.usuarioID || usuario?.UsuarioID;
        }
        return params;
    };

    // ==========================================
    // 1. GENERAR REPORTE EXCEL (Con Estilos)
    // ==========================================
    const generarExcel = async (tipo) => {
        setCargando(`EXCEL-${tipo}`);
        try {
            const endpoint = tipo === 'CAJAS' ? '/reportes/cajas' : '/reportes/ventas';
            const res = await api.get(endpoint, { params: obtenerParametros() });
            const data = res.data;

            if (!data || data.length === 0) {
                Swal.fire('Atención', 'No hay datos para exportar en estas fechas.', 'warning');
                return;
            }

            let totalGeneral = 0;
            data.forEach(row => {
               const monto = row["Monto Total"] || row["TotalVendido"] || row["totalvendido"] || row["ImporteTotal"] || row["importetotal"] || row["Monto"] || row["monto"] || row["Saldo Final"] || row["saldofinal"] || row["SaldoFinal"] || row["Total"] || row["total"] || 0;
               totalGeneral += parseFloat(monto);
            });

            const wb = XLSX.utils.book_new();
            const sTitulo = { font: { sz: 16, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "B91C1C" } }, alignment: { horizontal: "center", vertical: "center" } };
            const sSubTitulo = { font: { sz: 11, bold: true, color: { rgb: "333333" } }, alignment: { horizontal: "left" } };
            const sHeaderTabla = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1E293B" } }, border: { bottom: { style: "medium", color: { rgb: "000000" } } }, alignment: { horizontal: "center", vertical: "center" } };
            const sCeldaData = { border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }, alignment: { horizontal: "center", vertical: "center" } };
            const sMoneda = { border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: '"S/" #,##0.00' };

            const nombreGenerador = usuario?.nombreCompleto || 'Sistema';
            const textoInicio = fechaInicio || 'Hoy';
            const textoFin = fechaFin || textoInicio;

            const wsData = [
                ["REPORTE OFICIAL - TIENDA ROJAS"], 
                [`📅 Rango: ${textoInicio} al ${textoFin}`],  
                [`👤 Generado por: ${nombreGenerador}`], 
                [`💰 MONTO TOTAL DEL REPORTE: S/ ${totalGeneral.toFixed(2)}`], 
                [""], 
                Object.keys(data[0]) 
            ];

            data.forEach(row => wsData.push(Object.values(row)));

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            const range = XLSX.utils.decode_range(ws['!ref']);
            const lastCol = range.e.c;

            ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } }, { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }];
            ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 5, c: 0 }, e: { r: range.e.r, c: lastCol } }) };

            const headers = Object.keys(data[0]); 
            const colWidths = Array(lastCol + 1).fill({ wch: 15 });

            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
                    if (!ws[cellAddress]) continue;

                    if (R === 0) ws[cellAddress].s = sTitulo; 
                    else if (R >= 1 && R <= 3) {
                        ws[cellAddress].s = sSubTitulo;
                        if(R === 3) ws[cellAddress].s = { ...sSubTitulo, font: { bold: true, color: { rgb: "B91C1C" }, sz: 12 } };
                    }
                    else if (R === 5) ws[cellAddress].s = sHeaderTabla;
                    else if (R > 5) {
                        const valor = ws[cellAddress].v;
                        const headerName = (headers[C] || "").toUpperCase();
                        
                       if (headerName.includes("MONTO") || headerName.includes("TOTAL") || headerName.includes("VENDIDO") || headerName.includes("ANULADO") || headerName.includes("SALDO")) {
                            ws[cellAddress].t = 'n';
                            ws[cellAddress].v = parseFloat(valor) || 0;
                            ws[cellAddress].s = sMoneda;
                        } else {
                            ws[cellAddress].s = sCeldaData;
                            ws[cellAddress].t = 's'; 
                        }
                        
                        // Auto-ajustar ancho (básico)
                        const len = String(valor).length;
                        if (len + 2 > colWidths[C].wch) colWidths[C].wch = Math.min(len + 2, 40);
                    }
                }
            }
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, "Reporte");
            
            const nombreDoc = `Reporte_${tipo}_${textoInicio}${textoInicio !== textoFin ? '_al_' + textoFin : ''}.xlsx`;
            
            // 1. Generamos el archivo en código binario (ArrayBuffer) en lugar de intentar guardarlo directo
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            
            // 2. Creamos un "Blob" (Objeto de Archivo Nativo del Navegador)
            const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            // 3. Forzamos la descarga nativa con JavaScript
            const url = window.URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', nombreDoc);
            document.body.appendChild(link);
            link.click(); // Simulamos el clic de descarga
            
            // 4. Limpiamos la memoria
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            Swal.fire({ title: '¡Excel Descargado!', icon: 'success', timer: 1500, showConfirmButton: false });

        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Ocurrió un error al generar el Excel', 'error');
        } finally {
            setCargando(null);
        }
    };

    // ==========================================
    // 2. GENERAR REPORTE PDF
    // ==========================================
    const generarPDF = async (tipo) => {
        setCargando(`PDF-${tipo}`);
        try {
            const endpoint = tipo === 'CAJAS' ? '/reportes/cajas' : '/reportes/ventas';
            const res = await api.get(endpoint, { params: obtenerParametros() });
            const data = res.data;

            if (!data || data.length === 0) {
                Swal.fire('Atención', 'No hay datos para exportar en estas fechas.', 'warning');
                return;
            }

            // Crear HTML virtual para el PDF
            const container = document.createElement('div');
            container.style.padding = '20px';
            container.style.fontFamily = 'Arial, sans-serif';

            const titulo = document.createElement('h2');
            titulo.style.textAlign = 'center';
            titulo.style.color = '#B91C1C';
            titulo.innerText = `REPORTE OFICIAL - ${tipo === 'CAJAS' ? 'CIERRES DE CAJA' : 'VENTAS'}`;
            container.appendChild(titulo);

            const nombreGenerador = usuario?.nombreCompleto || 'Sistema';
            const textoInicio = fechaInicio || 'Hoy';
            const textoFin = fechaFin || textoInicio;
            
            const subtitulo = document.createElement('p');
            subtitulo.style.textAlign = 'center';
            subtitulo.style.fontSize = '12px';
            subtitulo.style.color = '#333';
            subtitulo.innerText = `Rango: ${textoInicio} al ${textoFin} | Generado por: ${nombreGenerador}`;
            container.appendChild(subtitulo);

            const tabla = document.createElement('table');
            tabla.style.width = '100%';
            tabla.style.borderCollapse = 'collapse';
            tabla.style.marginTop = '20px';
            tabla.style.fontSize = '9px';

            const thead = document.createElement('thead');
            const trHead = document.createElement('tr');
            const headers = Object.keys(data[0]);
            
            headers.forEach(h => {
                const th = document.createElement('th');
                th.innerText = h.toUpperCase();
                th.style.border = '1px solid #000';
                th.style.backgroundColor = '#1E293B';
                th.style.color = '#FFF';
                th.style.padding = '6px 4px';
                th.style.textAlign = 'center';
                trHead.appendChild(th);
            });
            thead.appendChild(trHead);
            tabla.appendChild(thead);

            const tbody = document.createElement('tbody');
            let sumaFinal = 0;

            data.forEach((row, index) => {
                const tr = document.createElement('tr');
                if (index % 2 !== 0) tr.style.backgroundColor = '#f8fafc';

                headers.forEach(h => {
                    const td = document.createElement('td');
                    td.style.border = '1px solid #cbd5e1';
                    td.style.padding = '5px 4px';
                    
                    let valor = row[h];
                    const headerName = h.toUpperCase();
                    
                    if (headerName.includes("MONTO") || headerName.includes("TOTAL") || headerName.includes("VENDIDO") || headerName.includes("ANULADO") || headerName.includes("SALDO")) {
                        td.innerText = `S/ ${parseFloat(valor || 0).toFixed(2)}`;
                        td.style.textAlign = 'right';
                    } else {
                        td.innerText = valor || '-';
                        td.style.textAlign = 'center';
                    }
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);

                const monto = row["Monto Total"] || row["TotalVendido"] || row["totalvendido"] || row["ImporteTotal"] || row["importetotal"] || row["Monto"] || row["monto"] || row["Saldo Final"] || row["saldofinal"] || row["SaldoFinal"] || row["Total"] || row["total"] || 0;
                sumaFinal += parseFloat(monto);
            });
            
            tabla.appendChild(tbody);
            container.appendChild(tabla);

            const totalText = document.createElement('h3');
            totalText.style.textAlign = 'right';
            totalText.style.marginTop = '15px';
            totalText.style.color = '#1E293B';
            totalText.innerText = `TOTAL GENERAL: S/ ${sumaFinal.toFixed(2)}`;
            container.appendChild(totalText);

            const opt = {
                margin:       0.3,
                filename:     `Reporte_${tipo}_${textoInicio}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(container).save();
            Swal.fire({ title: '¡PDF Descargado!', icon: 'success', timer: 1500, showConfirmButton: false });

        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Ocurrió un error al generar el PDF', 'error');
        } finally {
            setCargando(null);
        }
    };

    return (
        <section className="vista-seccion activa">
            <div className="contenedor-tabla-registro" style={{ background: 'transparent', boxShadow: 'none', border: 'none', padding: 0 }}>

                <div className="titulo-seccion" style={{ marginBottom: '1.5rem' }}>
                    <h2><i className="fa-solid fa-chart-column"></i> Centro de Reportes</h2>
                    <p>Genera y descarga información histórica en Excel y PDF Profesional.</p>
                </div>

                <div className="filtros-reporte-unificados" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '2rem', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <div className="grupo-filtro" style={{ flex: '1 1 200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}><i className="fa-regular fa-calendar-days"></i> Fecha Inicio</label>
                        <input 
                            type="date" 
                            className="input-moderno" 
                            value={fechaInicio} 
                            onChange={e => setFechaInicio(e.target.value)} 
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                        />
                    </div>
                    <div className="grupo-filtro" style={{ flex: '1 1 200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}><i className="fa-regular fa-calendar-days"></i> Fecha Fin</label>
                        <input 
                            type="date" 
                            className="input-moderno" 
                            value={fechaFin} 
                            onChange={e => setFechaFin(e.target.value)} 
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                        />
                    </div>

                    {esAdmin && (
                        <div className="grupo-filtro" style={{ flex: '1 1 250px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}><i className="fa-regular fa-user"></i> Filtrar por Cajero</label>
                            <select 
                                className="input-moderno" 
                                value={usuarioFiltro} 
                                onChange={e => setUsuarioFiltro(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                            >
                                <option value="">-- Todos los Cajeros --</option>
                               {usuariosLista.map((u, index) => {
                                    // Lectura súper robusta + un index de respaldo por si acaso
                                    const uid = u.usuarioID || u.UsuarioID || u.usuarioId || u.usuarioid || u.id || `cajero-${index}`;
                                    const nombre = u.nombreCompleto || u.NombreCompleto || u.nombrecompleto || u.username || 'Usuario';
                                    return <option key={uid} value={uid}>{nombre}</option>;
                                })}
                            </select>
                        </div>
                    )}
                </div>

                <div className="grid-reportes" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    
                    {/* Tarjeta: Reporte de Ventas */}
                    <div className="card-reporte-accion" style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="icono-grande" style={{ fontSize: '3rem', color: '#2563eb', textAlign: 'center' }}><i className="fa-solid fa-file-invoice"></i></div>
                        <h3 style={{ textAlign: 'center', fontSize: '1.2rem', color: '#1f2937' }}>Reporte de Ventas Detallado</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.5', textAlign: 'center', flexGrow: 1 }}>
                            Exporta cada transacción individual incluyendo método de pago, número de operación y categorías.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                            <button 
                                onClick={() => generarExcel('GENERAL')} 
                                disabled={cargando}
                                style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                {cargando === 'EXCEL-GENERAL' ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-file-excel"></i>} Excel
                            </button>
                            <button 
                                onClick={() => generarPDF('GENERAL')} 
                                disabled={cargando}
                                style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                {cargando === 'PDF-GENERAL' ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-file-pdf"></i>} PDF
                            </button>
                        </div>
                    </div>

                    {/* Tarjeta: Reporte de Cierres de Caja */}
                    <div className="card-reporte-accion" style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="icono-grande" style={{ fontSize: '3rem', color: '#f59e0b', textAlign: 'center' }}><i className="fa-solid fa-box-archive"></i></div>
                        <h3 style={{ textAlign: 'center', fontSize: '1.2rem', color: '#1f2937' }}>Historial de Cierres de Caja</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.5', textAlign: 'center', flexGrow: 1 }}>
                            Visualiza aperturas y cierres de turno, montos iniciales, finales y cuadres de caja por usuario.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                            <button 
                                onClick={() => generarExcel('CAJAS')} 
                                disabled={cargando}
                                style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                {cargando === 'EXCEL-CAJAS' ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-file-excel"></i>} Excel
                            </button>
                            <button 
                                onClick={() => generarPDF('CAJAS')} 
                                disabled={cargando}
                                style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                {cargando === 'PDF-CAJAS' ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-file-pdf"></i>} PDF
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Reportes;