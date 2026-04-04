const firebaseConfig = {
  apiKey: "AIzaSyCwLE85BsJw5FwFtjUGLSCxHPJLXB8t4Nk",
  authDomain: "bitacora-db.firebaseapp.com",
  projectId: "bitacora-db",
  storageBucket: "bitacora-db.firebasestorage.app",
  messagingSenderId: "661079601361",
  appId: "1:661079601361:web:837756ba7a91a576cad5f8",
  databaseURL: "https://bitacora-db-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const { useState, useEffect, useRef } = React;

const MAX_IMAGES_PER_PAGE = 4;

function App() {
    const printRef = useRef(null);
    const [images, setImages] = useState([]);
    const [isSaved, setIsSaved] = useState(false);
    const [toast, setToast] = useState(null);
    const [showResetModal, setShowResetModal] = useState(false);

    const nombreRef = useRef(null);
    const fechaRef = useRef(null);
    const entradaRef = useRef(null);
    const salidaRef = useRef(null);
    const actividadesRef = useRef(null);

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 10);
    const horaActualStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    const calcularSalida = (entrada) => {
        if (!entrada) return "";
        let [h, m] = entrada.split(':').map(Number);
        let hSalida = (h + 5) % 24;
        return `${String(hSalida).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const getNombreDia = (fechaIsoString) => {
        if (!fechaIsoString) return "";
        const [year, month, day] = fechaIsoString.split('-');
        const dateObj = new Date(year, month - 1, day);
        const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        return dias[dateObj.getDay()];
    };

    // LOCAL STORAGE: Cargar o iniciar matriz de Logs
    const [bitacorasLog, setBitacorasLog] = useState(() => {
        try { return JSON.parse(localStorage.getItem('bitacorasRegistro')) || []; }
        catch (e) { return []; }
    });

    // Buscamos el folio en la nube al cargar
    const [dbFolio, setDbFolio] = useState("...");

    // --- MODIFICACIÓN 1: Definición de formData movida arriba para evitar pantalla en blanco ---
    const [formData, setFormData] = useState({
        folio: "...", 
        fecha: localISOTime,
        dia: getNombreDia(localISOTime),
        entrada: horaActualStr,
        salida: calcularSalida(horaActualStr),
        nombre: "KITZYA MINERVA LUNA GUADARRAMA",
        supervisor: "JAVIER TERRAZAS",
        departamento: "Área de Reclutamiento",
        actividades: "",
        pendientes: ""
    });

    useEffect(() => {
        const bitacoraRef = database.ref('bitacoras');
        bitacoraRef.limitToLast(1).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const registros = Object.values(data);
                // --- MODIFICACIÓN 2: Se añade para evitar el error NaN ---
                const ultimo = parseInt(registros.folio, 10);
                setDbFolio(String(ultimo + 1).padStart(3, '0'));
            } else {
                setDbFolio("001");
            }
        });
    }, []);

    // Efecto para sincronizar el folio de la DB con el formulario
    useEffect(() => {
        if (dbFolio !== "...") {
            setFormData(prev => ({ ...prev, folio: dbFolio }));
        }
    }, [dbFolio]);

    // Sincronizar Logs al caché del navegador al instante si bitacorasLog cambia
    useEffect(() => {
        localStorage.setItem('bitacorasRegistro', JSON.stringify(bitacorasLog));
    }, [bitacorasLog]);

    // --- MODIFICACIÓN 3: Agregada función getNextFolioStr que faltaba para el Reset ---
    const getNextFolioStr = (log) => {
        if (!log || log.length === 0) return "001";
        const folios = log.map(item => parseInt(item.folio, 10)).filter(num => !isNaN(num));
        if (folios.length === 0) return "001";
        const max = Math.max(...folios);
        return String(max + 1).padStart(3, '0');
    };

    // --- FIN MOTOR DE PAGINACIÓN ---
    const pagesResult = []; 

    // Funciones de validación
    const validateFields = () => {
        const { folio, nombre, fecha, entrada, salida, actividades } = formData;
        const actividadesLimpias = actividades.replace(/[0-9.\s]/g, "");

        if (!folio || folio === "...") {
            setToast({ type: 'error', title: 'Falta el Folio', message: 'Cargando folio desde la base de datos...', icon: 'hash' });
            return false;
        }
        if (!nombre.trim()) {
            setToast({ type: 'error', title: 'Falta el Nombre', message: 'Por favor, ingresa el nombre del colaborador.', icon: 'user-x' });
            nombreRef.current?.focus();
            return false;
        }
        if (!fecha) {
            setToast({ type: 'error', title: 'Falta la Fecha', message: 'Por favor, selecciona la fecha.', icon: 'calendar-x' });
            fechaRef.current?.focus();
            return false;
        }
        if (!entrada) {
            setToast({ type: 'error', title: 'Falta Horario', message: 'Por favor, especifica la hora de entrada.', icon: 'clock' });
            entradaRef.current?.focus();
            return false;
        }
        if (!salida) {
            setToast({ type: 'error', title: 'Falta Horario', message: 'Por favor, verifica la hora de salida.', icon: 'clock' });
            salidaRef.current?.focus();
            return false;
        }
        if (!actividadesLimpias) {
            setToast({ type: 'error', title: 'Faltan Actividades', message: 'Asegúrate de registrar al menos una actividad realizada.', icon: 'list-x' });
            actividadesRef.current?.focus();
            return false;
        }
        return true;
    };

    const handleSave = () => {
        if (validateFields()) {
            setIsSaved(true);
            database.ref('bitacoras/' + formData.folio).set(formData);

            setBitacorasLog(prev => {
                const existingIndex = prev.findIndex(item => item.folio === formData.folio);
                const newData = [...prev];
                const row = {
                    folio: formData.folio,
                    fecha: formData.fecha,
                    dia: formData.dia,
                    colaborador: formData.nombre,
                    departamento: formData.departamento,
                    supervisor: formData.supervisor,
                    entrada: formData.entrada,
                    salida: formData.salida,
                    actividades: formData.actividades.replace(/\n/g, " "), 
                    pendientes: formData.pendientes.replace(/\n/g, " ")
                };
                if (existingIndex >= 0) {
                    newData[existingIndex] = row; 
                } else {
                    newData.push(row);     
                }
                return newData;
            });

            setToast({
                type: 'success',
                title: '¡Bitácora Guardada!',
                message: 'Registro añadido al historial y bloqueado para PDF.',
                icon: 'check-circle'
            });
            setTimeout(() => setToast(null), 5000);
        }
    };

    const handleEdit = () => {
        setIsSaved(false);
        setToast({
            type: 'info',
            title: 'Modo Edición',
            message: 'Ahora puedes modificar libremente tu bitácora.',
            icon: 'edit-2'
        });
        setTimeout(() => setToast(null), 3000);
    };

    const handleReset = () => {
        setShowResetModal(true);
    };

    const confirmReset = () => {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const currentIso = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 10);
        const currentHoraStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        setFormData({
            folio: getNextFolioStr(bitacorasLog), 
            fecha: currentIso,
            dia: getNombreDia(currentIso),
            entrada: currentHoraStr,
            salida: calcularSalida(currentHoraStr),
            nombre: "KITZYA MINERVA LUNA GUADARRAMA",
            supervisor: "JAVIER TERRAZAS",
            departamento: "Área de Reclutamiento",
            actividades: "1. \n2. \n3. ",
            pendientes: ""
        });
        setImages([]);
        setIsSaved(false);
        setShowResetModal(false);

        setToast({ type: 'success', title: 'Bitácora Nueva', message: 'El formulario ha sido limpiado para crear una nueva bitácora.', icon: 'refresh-ccw' });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => { if(window.lucide) lucide.createIcons(); }, [isSaved, toast, images, formData, showResetModal]);

    const handleFechaChange = (e) => {
        const nuevaFecha = e.target.value;
        setFormData({ ...formData, fecha: nuevaFecha, dia: getNombreDia(nuevaFecha) });
    };

    const handleEntradaChange = (e) => {
        const entrada = e.target.value;
        setFormData({ ...formData, entrada, salida: calcularSalida(entrada) });
    };

    const handleSalidaChange = (e) => {
        setFormData({ ...formData, salida: e.target.value });
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const espacioDisponible = 4 - images.length;

        if (espacioDisponible <= 0) {
            setToast({ type: 'error', title: 'Límite alcanzado', message: 'Solo puedes agregar un máximo de 4 evidencias fotográficas.', icon: 'x-circle' });
            e.target.value = null;
            return;
        }

        const archivosPermitidos = files.slice(0, espacioDisponible);
        archivosPermitidos.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setImages(prev => [...prev, { id: Date.now() + Math.random(), url: reader.result }]);
            reader.readAsDataURL(file);
        });
        e.target.value = null;
    };

    const removeImage = (idToRemove) => {
        setImages(prev => prev.filter(img => (img.id || img) !== idToRemove));
    };

    const downloadPDF = async () => {
        setToast({ type: 'info', title: 'Generando PDF', message: 'Ajustando dimensiones exactas...', icon: 'loader' });
        const element = printRef.current;
        const opt = {
            margin: 0,
            filename: `Bitacora_${formData.nombre.replace(/ /g, '_')}_${formData.fecha}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0, scrollX: 0 },
            jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait', compress: true }
        };

        try {
            await html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf) => {
                const totalPages = pdf.internal.getNumberOfPages();
                if (totalPages > 1) {
                    for (let i = totalPages; i > 1; i--) { pdf.deletePage(i); }
                }
            }).save();
            setToast({ type: 'success', title: '¡PDF Creado!', message: 'Documento generado estrictamente en una hoja.', icon: 'check-circle' });
        } catch (err) {
            setToast({ type: 'error', title: 'Error', message: 'No se pudo generar el PDF.', icon: 'x-circle' });
        }
        setTimeout(() => setToast(null), 3000);
    };

    const exportToExcel = () => {
        if (!bitacorasLog || bitacorasLog.length === 0) {
            setToast({ type: 'error', title: 'Historial Vacío', message: 'No hay bitácoras para exportar.', icon: 'alert-circle' });
            return;
        }
        try {
            const wb = XLSX.utils.book_new();
            const excelData = bitacorasLog.map(log => ({
                "FOLIO": log.folio, "FECHA": log.fecha, "DÍA": log.dia,
                "NOMBRE COLABORADOR": log.colaborador, "DEPARTAMENTO": log.departamento,
                "SUPERVISOR": log.supervisor, "ENTRADA": log.entrada, "SALIDA": log.salida,
                "ACTIVIDADES REALIZADAS": log.actividades, "PENDIENTES": log.pendientes
            }));
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wscols = Object.keys(excelData).map(key => ({ wch: 20 }));
            ws['!cols'] = wscols;
            XLSX.utils.book_append_sheet(wb, ws, "Historial_Bitacoras");
            XLSX.writeFile(wb, `Registro_Bitacoras_DSC.xlsx`);
            setToast({ type: 'success', title: '¡Excel Exportado!', message: 'Descarga exitosa.', icon: 'table' });
        } catch (e) { console.error(e); }
    };

    return (
        <div className="main-layout flex-row-reverse relative h-screen bg-slate-100 overflow-hidden">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 transform transition-all duration-500 ease-out flex items-center gap-4 px-5 py-4 min-w-[320px] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border-l-4 bg-white
                                ${toast.type === 'error' ? 'border-red-500 text-red-900 translate-y-0 opacity-100' :
                        toast.type === 'success' ? 'border-green-500 text-green-900' : 'border-blue-500 text-blue-900'}`}>
                    <div className={`p-2 rounded-full ${toast.type === 'error' ? 'bg-red-100/50' : toast.type === 'success' ? 'bg-green-100/50' : 'bg-blue-100/50'}`}>
                        <i data-lucide={toast.icon} className={`w-6 h-6 ${toast.type === 'error' ? 'text-red-500' : toast.type === 'success' ? 'text-green-500' : 'text-blue-500'}`}></i>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-black mb-0.5">{toast.title}</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{toast.message}</p>
                    </div>
                    <button onClick={() => setToast(null)} className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors self-start">
                        <i data-lucide="x" className="w-4 h-4"></i>
                    </button>
                </div>
            )}

            <div className="form-panel no-print p-6 space-y-5 shadow-[-5px_0_15px_rgba(0,0,0,0.05)] z-10 w-[420px] bg-white flex flex-col h-full border-l border-slate-200 overflow-y-auto">
                <header className="border-b pb-4 shrink-0 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Panel de Bitácora</h2>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Digital Shop Center</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={exportToExcel} className="flex flex-col items-center justify-center gap-1 bg-green-50 hover:bg-green-100 text-green-600 p-2 rounded-lg transition-colors group shadow-sm">
                            <i data-lucide="table" className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5"></i>
                            <span className="text-[9px] font-black uppercase tracking-tighter">Excel</span>
                        </button>
                        <button onClick={handleReset} className="flex flex-col items-center justify-center gap-1 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 p-2 rounded-lg transition-colors group shadow-sm">
                            <i data-lucide="refresh-ccw" className="w-5 h-5 transition-transform duration-300 group-hover:-rotate-90"></i>
                            <span className="text-[9px] font-black uppercase tracking-tighter">Nuevo</span>
                        </button>
                    </div>
                </header>

                <div className={`space-y-4 flex-1 transition-opacity duration-300 ${isSaved ? 'opacity-50' : 'opacity-100'}`}>
                    <div className="flex gap-2">
                        <div className="w-1/3">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Folio <span className="text-red-500">*</span></label>
                            <input type="text" value={formData.folio} className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-indigo-50 font-black text-indigo-900 outline-none" readOnly />
                        </div>
                        <div className="w-2/3">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Colaborador <span className="text-red-500">*</span></label>
                            <input ref={nombreRef} type="text" value={formData.nombre} className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-blue-50 font-bold outline-none" onChange={e => setFormData({...formData, nombre: e.target.value})} readOnly={isSaved} />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Fecha <span className="text-red-500">*</span></label>
                            <input ref={fechaRef} type="date" value={formData.fecha} className="w-full p-2 border border-slate-300 rounded-lg text-sm font-semibold outline-none" onChange={handleFechaChange} readOnly={isSaved} />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Día</label>
                            <input type="text" value={formData.dia} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-100 font-bold text-slate-600 outline-none select-none pointer-events-none" readOnly />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Entrada <span className="text-red-500">*</span></label>
                            <input ref={entradaRef} type="time" value={formData.entrada} className="w-full p-2 border border-blue-300 rounded-lg text-sm font-bold text-blue-800 bg-blue-50 outline-none" onChange={handleEntradaChange} readOnly={isSaved} />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Salida <span className="text-red-500">*</span></label>
                            <input ref={salidaRef} type="time" value={formData.salida} className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold text-blue-600 bg-white outline-none" onChange={handleSalidaChange} readOnly={isSaved} />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Actividades Realizadas <span className="text-red-500">*</span></label>
                        <textarea ref={actividadesRef} value={formData.actividades} className="w-full p-2 border border-slate-300 rounded-lg text-sm h-32 leading-relaxed outline-none resize-none" placeholder="Enumera aquí tus actividades..." onChange={e => setFormData({ ...formData, actividades: e.target.value })} readOnly={isSaved} />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold uppercase text-orange-500 mb-1 block">Pendientes / Notas</label>
                        <textarea value={formData.pendientes} className="w-full p-2 border border-orange-200 bg-orange-50 rounded-lg text-sm h-20 outline-none resize-none" placeholder="¿Qué tareas quedaron para después?" onChange={e => setFormData({ ...formData, pendientes: e.target.value })} readOnly={isSaved} />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 flex justify-between">
                            <span>Evidencias Fotográficas</span>
                            {!isSaved && <span className="text-[10px] text-blue-500 font-black px-2 bg-blue-50 rounded italic uppercase tracking-tighter">Opcional</span>}
                        </label>
                        <input type="file" multiple accept="image/*" className="text-xs w-full mt-2 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white hover:file:bg-blue-600 file:transition-all cursor-pointer bg-slate-50 border border-slate-200 rounded-lg" onChange={handleImageUpload} disabled={isSaved} />
                    </div>
                </div>

                <div className="shrink-0 pt-4 border-t border-slate-100 bg-white">
                    {!isSaved ? (
                        <button onClick={handleSave} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm tracking-tight">
                            <i data-lucide="save" className="w-4 h-4"></i> GUARDAR BITÁCORA
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={handleEdit} className="w-1/3 bg-slate-200 text-slate-800 py-3.5 rounded-xl font-black hover:bg-slate-300 transition-colors flex items-center justify-center gap-2 text-[10px] uppercase tracking-tighter">
                                <i data-lucide="edit-2" className="w-4 h-4"></i> Editar
                            </button>
                            <button onClick={downloadPDF} className="w-2/3 bg-slate-900 text-white py-3.5 rounded-xl font-black hover:bg-black hover:shadow-lg transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest">
                                <i data-lucide="download" className="w-4 h-4"></i> Descargar PDF
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* PANEL IZQUIERDO: VISTA PREVIA PDF */}
            <div className="preview-panel flex-1 bg-slate-200 overflow-y-auto p-10 custom-scrollbar">
                <div id="print-area" className="flex flex-col w-full items-center">
                    <div ref={printRef} className="letter-sheet border-none shadow-2xl flex flex-col justify-between overflow-hidden bg-white p-12">
                        <div className="w-full">
                            {/* Encabezado */}
                            <div className="shrink-0 flex justify-between border-b-2 border-black pb-6 mb-8">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter leading-none uppercase">Bitácora de Trabajo</h1>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Digital Shop Center | Página 1</p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className="bg-slate-800 text-white px-4 py-1.5 rounded-sm text-sm font-black mb-2 tracking-widest">
                                        FOLIO: {formData.folio}
                                    </div>
                                    <p className="text-xs uppercase whitespace-nowrap"><span className="font-bold text-slate-500 tracking-wider">Fecha:</span> <span className="font-black text-slate-800 ml-1">{formData.fecha || localISOTime}</span></p>
                                    <p className="text-xs uppercase whitespace-nowrap mt-1"><span className="font-bold text-slate-500 tracking-wider">Día:</span> <span className="font-black text-slate-800 ml-1">{formData.dia || 'N/A'}</span></p>
                                </div>
                            </div>

                            {/* Datos Colaborador */}
                            <div className="shrink-0 mb-8 bg-slate-50 border border-slate-200 rounded-xl p-5 grid grid-cols-2 gap-x-8 gap-y-4 text-[11px] uppercase">
                                <div><span className="font-bold text-slate-400 block mb-1 tracking-wider text-[9px]">Colaborador:</span> <span className="font-black text-slate-800 break-words leading-tight">{formData.nombre || 'N/A'}</span></div>
                                <div><span className="font-bold text-slate-400 block mb-1 tracking-wider text-[9px]">Supervisor:</span> <span className="font-black text-slate-800">{formData.supervisor || 'N/A'}</span></div>
                                <div><span className="font-bold text-slate-400 block mb-1 tracking-wider text-[9px]">Área / Depto:</span> <span className="font-black text-slate-800">{formData.departamento || 'N/A'}</span></div>
                                <div><span className="font-bold text-slate-400 block mb-1 tracking-wider text-[9px]">Turno Registrado:</span> <span className="font-black text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 tracking-widest">{formData.entrada || '--:--'} a {formData.salida || '--:--'}</span></div>
                            </div>

                            {/* Actividades */}
                            <div className="shrink-0 mb-8">
                                <h3 className="text-xs font-black uppercase text-slate-800 mb-3 border-b-2 border-slate-100 pb-1 tracking-widest">1. Actividades Realizadas:</h3>
                                <div className="text-[12px] text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[80px]">
                                    {formData.actividades || 'No se registraron actividades en este periodo.'}
                                </div>
                            </div>

                            {/* Pendientes */}
                            {formData.pendientes && (
                                <div className="shrink-0 mb-8">
                                    <h3 className="text-xs font-black uppercase text-red-600 mb-3 border-b-2 border-red-50 pb-1 tracking-widest">2. Temas Pendientes / Notas:</h3>
                                    <div className="text-[11px] text-red-700 whitespace-pre-wrap leading-relaxed bg-red-50/50 p-4 rounded-lg border border-red-100 italic">
                                        {formData.pendientes}
                                    </div>
                                </div>
                            )}

                            {/* Evidencias */}
                            <div className="flex-1">
                                <h3 className="text-xs font-black uppercase text-slate-800 mb-3 border-b-2 border-slate-100 pb-1 tracking-widest">Evidencia Fotográfica:</h3>
                                {images.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-6 mt-4">
                                        {images.map((imgObj, i) => (
                                            <div key={imgObj.id || i} className="relative border-2 border-slate-100 p-1.5 aspect-video flex items-center justify-center bg-white shadow-sm overflow-hidden rounded-lg group">
                                                <img src={imgObj.url || imgObj} className="max-w-full max-h-full object-contain" />
                                                {!isSaved && (
                                                    <button onClick={() => removeImage(imgObj.id || imgObj)} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 no-print font-black text-[10px] uppercase tracking-widest">
                                                        <i data-lucide="trash-2" className="w-6 h-6"></i> Eliminar
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-slate-400 italic mt-2 tracking-wide uppercase">No se adjuntaron evidencias gráficas.</p>
                                )}
                            </div>
                        </div>

                        {/* Firmas */}
                        <div className="w-full pt-10 border-t-2 border-slate-800 flex justify-between shrink-0 mt-auto px-12">
                            <div className="text-center w-2/5">
                                <div className="border-t border-slate-300 pt-3 mt-10">
                                    <p className="text-[10px] font-black uppercase text-slate-800 tracking-[0.15em]">Firma del Colaborador</p>
                                </div>
                            </div>
                            <div className="text-center w-2/5">
                                <div className="border-t border-slate-300 pt-3 mt-10">
                                    <p className="text-[10px] font-black uppercase text-slate-800 tracking-[0.15em]">Firma del Supervisor</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL RESET */}
            {showResetModal && (
                <div className="fixed inset-0 z- flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-[2rem] p-10 w-full max-w-sm shadow-2xl border border-slate-100 flex flex-col items-center text-center">
                        <div className="bg-red-50 text-red-500 p-5 rounded-full mb-6 ring-8 ring-red-50">
                            <i data-lucide="trash-2" className="w-10 h-10"></i>
                        </div>
                        <h3 className="text-2xl font-black tracking-tight text-slate-800 mb-3 uppercase tracking-tighter">¿Limpiar Todo?</h3>
                        <p className="text-[10px] text-slate-400 font-bold mb-8 leading-relaxed uppercase tracking-widest">
                            Se borrarán los datos actuales y las fotos de esta sesión. <br/> Esta acción no se puede deshacer.
                        </p>
                        <div className="flex w-full gap-4 font-black uppercase text-[10px] tracking-widest">
                            <button onClick={() => setShowResetModal(false)} className="flex-1 py-4 rounded-2xl text-slate-400 bg-slate-100 hover:bg-slate-200 transition-colors">
                                Cancelar
                            </button>
                            <button onClick={confirmReset} className="flex-1 py-4 rounded-2xl text-white bg-red-600 hover:bg-red-700 shadow-lg transition-all transform hover:-translate-y-1">
                                Sí, Borrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
