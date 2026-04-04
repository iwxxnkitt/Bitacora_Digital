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
                const ultimo = parseInt(registros.folio, 10);
                const siguiente = String(ultimo + 1).padStart(3, '0');
                setDbFolio(siguiente);
                setFormData(prev => ({ ...prev, folio: siguiente }));
            } else {
                setDbFolio("001");
                setFormData(prev => ({ ...prev, folio: "001" }));
            }
        });
    }, []);

    useEffect(() => {
        localStorage.setItem('bitacorasRegistro', JSON.stringify(bitacorasLog));
    }, [bitacorasLog]);

    const validateFields = () => {
        const { folio, nombre, actividades } = formData;
        if (folio === "..." || !nombre.trim() || !actividades.trim()) {
            setToast({ type: 'error', title: 'Datos Faltantes', message: 'Nombre y Actividades son obligatorios.', icon: 'alert-circle' });
            return false;
        }
        return true;
    };

    // --- FUNCIÓN DE GUARDADO CON VERIFICACIÓN DE FIREBASE ---
    const handleSave = () => {
        if (validateFields()) {
            const folioID = formData.folio;
            
            // INTENTO DE ESCRITURA FORZADA
            database.ref('bitacoras/' + folioID).set(formData, (error) => {
                if (error) {
                    setToast({ type: 'error', title: 'Error de Base de Datos', message: 'Firebase rechazó el guardado. Revisa las reglas de seguridad.', icon: 'cloud-off' });
                } else {
                    setIsSaved(true);
                    setToast({ type: 'success', title: '¡Éxito Total!', message: `Bitácora ${folioID} guardada en la nube.`, icon: 'cloud-check' });
                    
                    setBitacorasLog(prev => {
                        const existingIndex = prev.findIndex(item => item.folio === folioID);
                        const newData = [...prev];
                        const row = {
                            folio: folioID,
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
                }
            });

            setTimeout(() => setToast(null), 5000);
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
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl bg-white border-l-8 ${toast.type === 'error' ? 'border-red-500' : 'border-green-500'} animate-bounce`}>
                    <div className="font-black text-xs uppercase tracking-tighter">{toast.title}: {toast.message}</div>
                </div>
            )}

            {/* PANEL LATERAL */}
            <div className="form-panel no-print p-8 w-[450px] bg-white shadow-2xl flex flex-col h-full border-l overflow-y-auto">
                <header className="border-b-2 border-slate-100 pb-6 mb-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Panel de Control</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronización en Tiempo Real</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={exportToExcel} className="p-3 bg-green-50 text-green-600 rounded-xl hover:scale-110 transition-transform"><i data-lucide="table"></i></button>
                        <button onClick={handleReset} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 transition-colors"><i data-lucide="refresh-ccw"></i></button>
                    </div>
                </header>

                <div className={`space-y-6 flex-1 ${isSaved ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Folio</label>
                            <input type="text" value={formData.folio} className="w-full p-3 bg-indigo-50 border-2 border-indigo-100 rounded-xl font-black text-indigo-600 text-center" readOnly />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Colaborador</label>
                            <input ref={nombreRef} type="text" value={formData.nombre} className="w-full p-3 border-2 border-slate-100 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all" onChange={e => setFormData({...formData, nombre: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Fecha</label>
                            <input ref={fechaRef} type="date" value={formData.fecha} className="w-full p-3 border-2 border-slate-100 rounded-xl text-sm font-bold" onChange={handleFechaChange} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Entrada</label>
                            <input type="time" value={formData.entrada} className="w-full p-3 border-2 border-blue-100 bg-blue-50/30 text-blue-600 rounded-xl text-sm font-black" onChange={handleEntradaChange} />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Actividades Realizadas</label>
                        <textarea ref={actividadesRef} value={formData.actividades} className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm h-48 resize-none focus:border-blue-500 outline-none leading-relaxed" placeholder="Describe tus labores..." onChange={e => setFormData({ ...formData, actividades: e.target.value })} />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-orange-400 uppercase mb-2 block">Pendientes Especiales</label>
                        <textarea value={formData.pendientes} className="w-full p-4 border-2 border-orange-50 bg-orange-50/20 rounded-2xl text-sm h-20 resize-none outline-none" onChange={e => setFormData({ ...formData, pendientes: e.target.value })} />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Cargar Evidencias (JPG/PNG)</label>
                        <input type="file" multiple onChange={handleImageUpload} className="w-full text-[10px] file:bg-slate-900 file:text-white file:rounded-xl file:px-4 file:py-2 file:border-0 cursor-pointer" />
                    </div>
                </div>

                <div className="pt-8 border-t-2 border-slate-50 mt-auto">
                    {!isSaved ? (
                        <button onClick={handleSave} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 shadow-2xl transform hover:-translate-y-2 transition-all">
                             Sincronizar con Firebase
                        </button>
                    ) : (
                        <div className="flex gap-4">
                            <button onClick={handleEdit} className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200">Editar</button>
                            <button onClick={downloadPDF} className="flex- bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-2xl transition-shadow">Descargar Bitácora PDF</button>
                        </div>
                    )}
                </div>
            </div>

            {/* VISTA PREVIA */}
            <div className="preview-panel flex-1 bg-slate-200 overflow-y-auto p-16 custom-scrollbar">
                <div id="print-area" className="flex flex-col w-full items-center">
                    <div ref={printRef} className="letter-sheet bg-white p-20 shadow-2xl flex flex-col justify-between overflow-hidden" style={{width: '215.9mm', minHeight: '279.4mm'}}>
                        <div className="w-full">
                            <header className="flex justify-between border-b-8 border-slate-900 pb-10 mb-12">
                                <div>
                                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Bitácora</h1>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mt-4">Digital Shop Center | México</p>
                                </div>
                                <div className="text-right">
                                    <div className="bg-slate-900 text-white px-8 py-3 font-black text-2xl rounded-sm mb-4">FOLIO: {formData.folio}</div>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Fecha: {formData.fecha}</p>
                                    <p className="text-sm font-black text-slate-400 uppercase italic tracking-widest">{formData.dia}</p>
                                </div>
                            </header>

                            <div className="grid grid-cols-2 gap-10 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] p-10 text-xs uppercase mb-12">
                                <div><span className="font-black text-slate-400 block text-[10px] mb-2 tracking-widest">Responsable:</span><span className="font-black text-slate-900 text-lg leading-none">{formData.nombre}</span></div>
                                <div><span className="font-black text-slate-400 block text-[10px] mb-2 tracking-widest">Supervisor Asignado:</span><span className="font-black text-slate-900 text-lg leading-none">{formData.supervisor}</span></div>
                                <div><span className="font-black text-slate-400 block text-[10px] mb-2 tracking-widest">Área de Trabajo:</span><span className="font-black text-slate-900">{formData.departamento}</span></div>
                                <div><span className="font-black text-slate-400 block text-[10px] mb-2 tracking-widest">Jornada Laboral:</span><span className="font-black text-blue-700 bg-white px-4 py-1.5 border-2 rounded-full inline-block mt-1">{formData.entrada} - {formData.salida}</span></div>
                            </div>

                            <section className="mb-12">
                                <h3 className="text-sm font-black uppercase text-slate-900 border-b-4 border-slate-900 pb-3 mb-6 tracking-widest">Resumen de Actividades</h3>
                                <div className="text-base text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[150px] font-medium">{formData.actividades || "Pendiente de registro..."}</div>
                            </section>

                            <section>
                                <h3 className="text-sm font-black uppercase text-slate-900 border-b-4 border-slate-900 pb-3 mb-8 tracking-widest">Anexos Fotográficos</h3>
                                <div className="grid grid-cols-2 gap-8">
                                    {images.map((img, i) => (
                                        <div key={img.id || i} className="border-8 border-slate-50 rounded-[2rem] overflow-hidden aspect-video bg-slate-100 flex items-center justify-center shadow-lg">
                                            <img src={img.url || img} className="max-h-full object-contain" />
                                        </div>
                                    ))}
                                    {images.length === 0 && <div className="col-span-2 border-4 border-dashed border-slate-100 rounded-3xl p-10 text-center font-black text-slate-200 uppercase tracking-widest">Sin Evidencia Cargada</div>}
                                </div>
                            </section>
                        </div>

                        <footer className="mt-24 flex justify-around border-t-8 border-slate-900 pt-12">
                            <div className="text-center w-1/3">
                                <div className="border-t-2 border-slate-300 pt-6"><p className="text-xs font-black uppercase tracking-[0.3em] text-slate-800">Firma Colaborador</p></div>
                            </div>
                            <div className="text-center w-1/3">
                                <div className="border-t-2 border-slate-300 pt-6"><p className="text-xs font-black uppercase tracking-[0.3em] text-slate-800">Firma Autorización</p></div>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {showResetModal && (
                <div className="fixed inset-0 z- bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
                    <div className="bg-white rounded-[4rem] p-16 max-w-md w-full text-center shadow-[0_40px_100px_rgba(0,0,0,0.5)] border-t-8 border-red-500">
                        <div className="bg-red-50 text-red-500 p-8 rounded-full w-fit mx-auto mb-10 ring-[1rem] ring-red-50/50"><i data-lucide="trash-2" className="w-16 h-16"></i></div>
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 italic">¿Deseas Reiniciar?</h3>
                        <p className="text-xs font-black text-slate-400 uppercase mb-12 leading-loose tracking-widest italic opacity-60">Se eliminará el progreso de esta bitácora actual de forma permanente.</p>
                        <div className="flex gap-6 uppercase font-black text-xs tracking-[0.2em]">
                            <button onClick={() => setShowResetModal(false)} className="flex-1 py-6 bg-slate-100 rounded-[2rem] text-slate-500 hover:bg-slate-200 transition-all">Cancelar</button>
                            <button onClick={confirmReset} className="flex-1 py-6 bg-red-600 rounded-[2rem] text-white hover:bg-red-700 shadow-2xl transform hover:-translate-y-2 transition-all">Sí, Borrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);t.getElementById('root'));
root.render(<App />);
