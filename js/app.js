// 1. CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCwLE85BsJw5FwFtjUGLSCxHPJLXB8t4Nk",
  authDomain: "bitacora-db.firebaseapp.com",
  projectId: "bitacora-db",
  storageBucket: "bitacora-db.firebasestorage.app",
  messagingSenderId: "661079601361",
  appId: "1:661079601361:web:837756ba7a91a576cad5f8",
  databaseURL: "https://bitacora-db-default-rtdb.firebaseio.com/"
};

// Inicializar conexión
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const { useState, useEffect, useRef } = React;

function App() {
    const printRef = useRef(null);
    const [isSaved, setIsSaved] = useState(false);
    const [toast, setToast] = useState(null);

    const [formData, setFormData] = useState({
        folio: "001",
        fecha: new Date().toISOString().slice(0, 10),
        dia: new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(new Date()), 
        entrada: "09:00",
        salida: "14:00",
        nombre: "KITZYA MINERVA LUNA GUADARRAMA",
        supervisor: "JAVIER TERRAZAS",
        departamento: "Área de Reclutamiento",
        actividades: "",
        pendientes: ""
    });

    // EFECTO: Traer el último folio de Firebase al iniciar
    useEffect(() => {
        const bitacoraRef = database.ref('bitacoras');
        bitacoraRef.limitToLast(1).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const registros = Object.values(data);
                const ultimoFolio = parseInt(registros.folio);
                const siguiente = String(ultimoFolio + 1).padStart(3, '0');
                setFormData(prev => ({ ...prev, folio: siguiente }));
            }
        });
        if (window.lucide) window.lucide.createIcons();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setIsSaved(false);
    };

    const handleSave = () => {
        if (!formData.actividades.trim()) {
            setToast({ type: 'error', message: 'Escribe las actividades primero.' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        database.ref('bitacoras/' + formData.folio).set({
            ...formData,
            fechaRegistro: new Date().toLocaleString()
        }).then(() => {
            setIsSaved(true);
            setToast({ type: 'success', message: '¡Guardado en la nube!' });
            setTimeout(() => setToast(null), 3000);
        }).catch(() => {
            setToast({ type: 'error', message: 'Error al conectar.' });
            setTimeout(() => setToast(null), 3000);
        });
    };

    const handlePrint = () => {
        const element = printRef.current;
        const opt = {
            margin: 0,
            filename: `Bitacora_${formData.folio}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const handleExportExcel = () => {
        const ws = XLSX.utils.json_to_sheet([formData]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bitácora");
        XLSX.writeFile(wb, `Bitacora_${formData.folio}.xlsx`);
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-10 font-sans">
            <div className="max-w-4xl mx-auto bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden border border-slate-200" ref={printRef}>
                {/* HEADER PRO */}
                <div className="bg-[#0f172a] p-10 text-white flex justify-between items-center border-b-[6px] border-amber-400">
                    <div className="flex items-center gap-5">
                        <div className="bg-amber-400 p-4 rounded-2xl text-slate-900 shadow-lg">
                            <i data-lucide="clipboard-check" className="w-10 h-10"></i>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Bitácora Diaria</h1>
                            <p className="text-slate-400 font-bold tracking-widest text-sm mt-1">DIGITAL SHOP CENTER | RECLUTAMIENTO</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em] mb-2">Folio de Control</div>
                        <div className="text-5xl font-mono font-black text-white bg-slate-800/50 px-6 py-3 rounded-2xl border border-slate-700 shadow-inner">
                            #{formData.folio}
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-10">
                    {/* FILA 1: FECHA Y HORAS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="group space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i data-lucide="calendar" className="w-4 h-4 text-amber-500"></i> Fecha de Actividad
                            </label>
                            <input type="date" name="fecha" value={formData.fecha} onChange={handleInputChange} className="w-full border-b-2 border-slate-100 py-3 focus:border-amber-400 outline-none font-black text-xl transition-all bg-transparent" />
                        </div>
                        <div className="group space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i data-lucide="clock" className="w-4 h-4 text-amber-500"></i> Hora Entrada
                            </label>
                            <input type="time" name="entrada" value={formData.entrada} onChange={handleInputChange} className="w-full border-b-2 border-slate-100 py-3 focus:border-amber-400 outline-none font-black text-xl transition-all bg-transparent" />
                        </div>
                        <div className="group space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i data-lucide="clock-9" className="w-4 h-4 text-amber-500"></i> Hora Salida
                            </label>
                            <input type="time" name="salida" value={formData.salida} onChange={handleInputChange} className="w-full border-b-2 border-slate-100 py-3 focus:border-amber-400 outline-none font-black text-xl transition-all bg-transparent" />
                        </div>
                    </div>

                    {/* DESCRIPCIÓN */}
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i data-lucide="align-left" className="w-4 h-4 text-amber-500"></i> Descripción detallada de Actividades
                            </label>
                            <textarea name="actividades" value={formData.actividades} onChange={handleInputChange} rows="6" className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:bg-white focus:border-amber-400 focus:ring-[12px] focus:ring-amber-50 outline-none transition-all resize-none font-bold text-slate-700 leading-relaxed shadow-inner" placeholder="Escribe aquí tus labores del día..."></textarea>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i data-lucide="alert-circle" className="w-4 h-4 text-amber-500"></i> Pendientes para la siguiente jornada
                            </label>
                            <textarea name="pendientes" value={formData.pendientes} onChange={handleInputChange} rows="3" className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:bg-white focus:border-amber-400 outline-none transition-all resize-none font-bold text-slate-500 italic shadow-inner" placeholder="¿Qué quedó pendiente?"></textarea>
                        </div>
                    </div>

                    {/* FIRMAS */}
                    <div className="grid grid-cols-2 gap-20 pt-10">
                        <div className="text-center space-y-4">
                            <div className="h-20 flex items-end justify-center font-mono italic text-slate-300 text-xs">FIRMA ELECTRÓNICA</div>
                            <div className="border-t-4 border-slate-900 pt-4">
                                <p className="font-black text-base uppercase tracking-tighter">{formData.nombre}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Colaborador / Reclutamiento</p>
                            </div>
                        </div>
                        <div className="text-center space-y-4">
                            <div className="h-20 flex items-end justify-center text-slate-200 font-black">___________________________</div>
                            <div className="border-t-4 border-slate-900 pt-4">
                                <p className="font-black text-base uppercase tracking-tighter">{formData.supervisor}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Supervisor Responsable</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="max-w-4xl mx-auto mt-12 flex flex-wrap gap-6 justify-center no-print">
                <button onClick={handleSave} className={`px-12 py-6 rounded-2xl font-black uppercase tracking-tighter shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all flex items-center gap-4 hover:-translate-y-2 active:translate-y-0 ${isSaved ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-amber-500'}`}>
                    <i data-lucide={isSaved ? "check-circle-2" : "cloud-upload"} className="w-6 h-6"></i>
                    {isSaved ? '¡REGISTRADO EN NUBE!' : 'GUARDAR EN NUBE'}
                </button>
                <button onClick={handlePrint} className="px-12 py-6 bg-white border-4 border-slate-900 text-slate-900 rounded-2xl font-black uppercase tracking-tighter hover:bg-slate-50 shadow-xl flex items-center gap-4 transition-all hover:-translate-y-2 active:translate-y-0">
                    <i data-lucide="file-type-2" className="w-6 h-6"></i> DESCARGAR PDF
                </button>
                <button onClick={handleExportExcel} className="px-12 py-6 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-tighter hover:bg-emerald-700 shadow-xl flex items-center gap-4 transition-all hover:-translate-y-2 active:translate-y-0">
                    <i data-lucide="sheet" className="w-6 h-6"></i> EXPORTAR EXCEL
                </button>
            </div>

            {/* TOAST FLOTANTE */}
            {toast && (
                <div className={`fixed bottom-12 right-12 p-6 rounded-2xl shadow-2xl text-white font-black animate-bounce flex items-center gap-4 z-50 border-b-4 border-black/20 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    <i data-lucide={toast.type === 'success' ? "check" : "alert-triangle"}></i>
                    {toast.message}
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
