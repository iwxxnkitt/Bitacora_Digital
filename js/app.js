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

    const [bitacorasLog, setBitacorasLog] = useState(() => {
        try { return JSON.parse(localStorage.getItem('bitacorasRegistro')) || []; }
        catch (e) { return []; }
    });

    const [dbFolio, setDbFolio] = useState("...");

    // ESTADO DEL FORMULARIO
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

    // ESCUCHA DE FIREBASE PARA EL FOLIO
    useEffect(() => {
        const bitacoraRef = database.ref('bitacoras');
        bitacoraRef.limitToLast(1).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const registros = Object.values(data);
                const ultimo = parseInt(registros.folio, 10);
                setDbFolio(String(ultimo + 1).padStart(3, '0'));
            } else {
                setDbFolio("001");
            }
        });
    }, []);

    useEffect(() => {
        if (dbFolio !== "...") {
            setFormData(prev => ({ ...prev, folio: dbFolio }));
        }
    }, [dbFolio]);

    useEffect(() => {
        localStorage.setItem('bitacorasRegistro', JSON.stringify(bitacorasLog));
    }, [bitacorasLog]);

    const getNextFolioStr = (log) => {
        if (!log || log.length === 0) return "001";
        const folios = log.map(item => parseInt(item.folio, 10)).filter(num => !isNaN(num));
        return String(Math.max(...folios, 0) + 1).padStart(3, '0');
    };

    const validateFields = () => {
        const { folio, nombre, actividades } = formData;
        if (!folio || folio === "...") return false;
        if (!nombre.trim() || !actividades.trim()) {
            setToast({ type: 'error', title: 'Campos Vacíos', message: 'Nombre y Actividades son obligatorios.', icon: 'alert-circle' });
            return false;
        }
        return true;
    };

    // FUNCIÓN DE GUARDADO CORREGIDA (Conecta a Firebase de nuevo)
    const handleSave = () => {
        if (validateFields()) {
            setIsSaved(true);
            
            // MANDAR A FIREBASE REALTIME DATABASE
            database.ref('bitacoras/' + formData.folio).set(formData)
                .then(() => {
                    setToast({ type: 'success', title: '¡Sincronizado!', message: 'Datos guardados en la nube con éxito.', icon: 'cloud-check' });
                })
                .catch((error) => {
                    setToast({ type: 'error', title: 'Error Cloud', message: 'No se pudo subir a Firebase.', icon: 'cloud-off' });
                });

            // ACTUALIZAR HISTORIAL LOCAL PARA EXCEL
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
                if (existingIndex >= 0) newData[existingIndex] = row;
                else newData.push(row);
                return newData;
            });

            setTimeout(() => setToast(null), 4000);
        }
    };

    const handleEdit = () => setIsSaved(false);
    const handleReset = () => setShowResetModal(true);
    const confirmReset = () => window.location.reload();

    useEffect(() => { if(window.lucide) lucide.createIcons(); }, [isSaved, toast, images, formData, showResetModal]);

    const handleFechaChange = (e) => {
        const nuevaFecha = e.target.value;
        setFormData({ ...formData, fecha: nuevaFecha, dia: getNombreDia(nuevaFecha) });
    };

    const handleEntradaChange = (e) => {
        const entrada = e.target.value;
        setFormData({ ...formData, entrada, salida: calcularSalida(entrada) });
    };

    const handleSalidaChange = (e) => setFormData({ ...formData, salida: e.target.value });

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 4) return;
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setImages(prev => [...prev, { id: Date.now() + Math.random(), url: reader.result }]);
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (idToRemove) => setImages(prev => prev.filter(img => (img.id || img) !== idToRemove));

    const downloadPDF = async () => {
        const element = printRef.current;
        const opt = {
            margin: 0,
            filename: `Bitacora_${formData.nombre}_${formData.folio}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
        };
        await html2pdf().set(opt).from(element).save();
    };

    const exportToExcel = () => {
        if (!bitacorasLog.length) return;
        const ws = XLSX.utils.json_to_sheet(bitacorasLog);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Historial");
        XLSX.writeFile(wb, `Bitacoras_DSC.xlsx`);
    };

    return (
        <div className="main-layout flex-row-reverse relative h-screen bg-slate-100 overflow-hidden">
            {toast && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-4 px-5 py-4 rounded-xl shadow-2xl bg-white border-l-4 border-blue-500 animate-bounce">
                    <div className="font-black text-xs uppercase tracking-widest">{toast.title}: {toast.message}</div>
                </div>
            )}

            {/* PANEL FORMULARIO */}
            <div className="form-panel no-print p-6 w-[420px] bg-white shadow-xl flex flex-col h-full border-l overflow-y-auto">
                <header className="border-b pb-4 mb-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Panel Digital</h2>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Digital Shop Center</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={exportToExcel} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><i data-lucide="table" className="w-5 h-5"></i></button>
                        <button onClick={handleReset} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-500"><i data-lucide="refresh-ccw" className="w-5 h-5"></i></button>
                    </div>
                </header>

                <div className={`space-y-4 flex-1 transition-opacity ${isSaved ? 'opacity-50' : 'opacity-100'}`}>
                    <div className="flex gap-2">
                        <div className="w-1/3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Folio</label>
                            <input type="text" value={formData.folio} className="w-full p-2 bg-indigo-50 font-black rounded-lg text-indigo-900 border border-indigo-100" readOnly />
                        </div>
                        <div className="w-2/3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Colaborador</label>
                            <input ref={nombreRef} type="text" value={formData.nombre} className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" onChange={e => setFormData({...formData, nombre: e.target.value})} readOnly={isSaved} />
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha</label>
                            <input ref={fechaRef} type="date" value={formData.fecha} className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" onChange={handleFechaChange} readOnly={isSaved} />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Horario</label>
                            <input type="time" value={formData.entrada} className="w-full p-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold" onChange={handleEntradaChange} readOnly={isSaved} />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Actividades del Día</label>
                        <textarea ref={actividadesRef} value={formData.actividades} className="w-full p-3 border border-slate-200 rounded-xl text-sm h-40 resize-none focus:ring-2 focus:ring-blue-500 outline-none" placeholder="1. Actividad..." onChange={e => setFormData({ ...formData, actividades: e.target.value })} readOnly={isSaved} />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-orange-500 uppercase block mb-1">Notas / Pendientes</label>
                        <textarea value={formData.pendientes} className="w-full p-3 border border-orange-100 bg-orange-50 rounded-xl text-sm h-20 resize-none outline-none" placeholder="Opcional..." onChange={e => setFormData({ ...formData, pendientes: e.target.value })} readOnly={isSaved} />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Evidencias (Max 4)</label>
                        <input type="file" multiple onChange={handleImageUpload} disabled={isSaved} className="w-full text-[10px] mt-1 file:bg-slate-800 file:text-white file:rounded-lg file:px-3 file:py-2 file:border-0 cursor-pointer" />
                    </div>
                </div>

                <div className="pt-6 border-t mt-4">
                    {!isSaved ? (
                        <button onClick={handleSave} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg transform hover:-translate-y-1 transition-all">
                            <i data-lucide="save" className="w-4 h-4 inline-block mr-2"></i> Guardar en Base de Datos
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button onClick={handleEdit} className="flex-1 bg-slate-200 text-slate-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all">Editar</button>
                            <button onClick={downloadPDF} className="flex- bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black shadow-xl transition-all">Descargar PDF</button>
                        </div>
                    )}
                </div>
            </div>

            {/* VISTA PREVIA PDF */}
            <div className="preview-panel flex-1 bg-slate-200 overflow-y-auto p-12 custom-scrollbar">
                <div id="print-area" className="flex flex-col w-full items-center">
                    <div ref={printRef} className="letter-sheet bg-white p-16 shadow-2xl flex flex-col justify-between overflow-hidden" style={{width: '215.9mm', minHeight: '279.4mm'}}>
                        <div className="w-full">
                            <header className="flex justify-between border-b-4 border-slate-800 pb-6 mb-10">
                                <div>
                                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Bitácora Laboral</h1>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Digital Shop Center | Registro Oficial</p>
                                </div>
                                <div className="text-right">
                                    <div className="bg-slate-900 text-white px-5 py-2 font-black text-lg rounded-sm mb-2 tracking-tighter">FOLIO: {formData.folio}</div>
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-widest leading-loose">Fecha: {formData.fecha}</p>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest italic">{formData.dia}</p>
                                </div>
                            </header>

                            <div className="grid grid-cols-2 gap-8 bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 text-[11px] uppercase mb-10">
                                <div><span className="font-black text-slate-400 block text-[9px] mb-1">Colaborador:</span><span className="font-black text-slate-900 text-sm">{formData.nombre}</span></div>
                                <div><span className="font-black text-slate-400 block text-[9px] mb-1">Supervisor:</span><span className="font-black text-slate-900 text-sm">{formData.supervisor}</span></div>
                                <div><span className="font-black text-slate-400 block text-[9px] mb-1">Departamento:</span><span className="font-black text-slate-900">{formData.departamento}</span></div>
                                <div><span className="font-black text-slate-400 block text-[9px] mb-1">Horario Turno:</span><span className="font-black text-blue-700 bg-white px-2 py-1 border rounded">{formData.entrada} a {formData.salida}</span></div>
                            </div>

                            <section className="mb-10">
                                <h3 className="text-xs font-black uppercase text-slate-900 border-b-2 border-slate-100 pb-2 mb-4 tracking-widest">1. Actividades Realizadas</h3>
                                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[120px]">{formData.actividades || "Sin registro."}</div>
                            </section>

                            {formData.pendientes && (
                                <section className="mb-10">
                                    <h3 className="text-xs font-black uppercase text-red-600 border-b-2 border-red-50 pb-2 mb-4 tracking-widest">2. Pendientes / Observaciones</h3>
                                    <div className="text-xs text-red-800 bg-red-50/50 p-4 rounded-xl border border-red-100 italic">{formData.pendientes}</div>
                                </section>
                            )}

                            <section>
                                <h3 className="text-xs font-black uppercase text-slate-900 border-b-2 border-slate-100 pb-2 mb-6 tracking-widest">Evidencias Fotográficas</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    {images.map((img, i) => (
                                        <div key={img.id || i} className="border-4 border-slate-50 rounded-xl overflow-hidden aspect-video bg-slate-100 flex items-center justify-center">
                                            <img src={img.url || img} className="max-h-full object-contain" />
                                        </div>
                                    ))}
                                    {images.length === 0 && <p className="text-xs text-slate-300 uppercase font-bold italic">No se adjuntaron imágenes.</p>}
                                </div>
                            </section>
                        </div>

                        <footer className="mt-20 flex justify-around border-t-4 border-slate-900 pt-10">
                            <div className="text-center w-1/3">
                                <div className="border-t border-slate-300 pt-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Firma Colaborador</p></div>
                            </div>
                            <div className="text-center w-1/3">
                                <div className="border-t border-slate-300 pt-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Firma Supervisor</p></div>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>

            {/* MODAL RESET */}
            {showResetModal && (
                <div className="fixed inset-0 z- bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl border border-slate-100">
                        <div className="bg-red-50 text-red-500 p-6 rounded-full w-fit mx-auto mb-6 ring-8 ring-red-50"><i data-lucide="trash-2" className="w-10 h-10"></i></div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">¿Reiniciar?</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 leading-relaxed">Se perderán los datos actuales. <br/>Empezarás una bitácora nueva.</p>
                        <div className="flex gap-4 uppercase font-black text-[10px] tracking-widest">
                            <button onClick={() => setShowResetModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl text-slate-500 hover:bg-slate-200 transition-all">No</button>
                            <button onClick={confirmReset} className="flex-1 py-4 bg-red-600 rounded-2xl text-white hover:bg-red-700 shadow-xl transition-all transform hover:-translate-y-1">Sí, Borrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
