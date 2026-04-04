// 1. CONFIGURACIÓN DE TU BASE DE DATOS FIREBASE
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
    const [images, setImages] = useState([]);
    const [isSaved, setIsSaved] = useState(false);
    const [toast, setToast] = useState(null);
    const [showResetModal, setShowResetModal] = useState(false);

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
            } else {
                setFormData(prev => ({ ...prev, folio: "001" }));
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
            setToast({ type: 'error', title: 'Error', message: 'Escribe las actividades primero.' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        database.ref('bitacoras/' + formData.folio).set({
            ...formData,
            fechaRegistro: new Date().toLocaleString()
        }).then(() => {
            setIsSaved(true);
            setToast({ type: 'success', title: '¡Sincronizado!', message: 'Guardado en la nube con éxito.' });
            setTimeout(() => setToast(null), 3000);
        }).catch(err => {
            setToast({ type: 'error', title: 'Error', message: 'No se pudo guardar.' });
            setTimeout(() => setToast(null), 3000);
        });
    };

    const handlePrint = () => {
        const element = printRef.current;
        const opt = {
            margin: 0,
            filename: `Bitacora_${formData.folio}_${formData.fecha}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
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
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
            <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200" ref={printRef}>
                {/* ENCABEZADO DISEÑO ORIGINAL */}
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center border-b-4 border-amber-400">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-400 p-3 rounded-xl text-slate-900">
                            <i data-lucide="clipboard-list" className="w-8 h-8"></i>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter uppercase italic">Bitácora Diaria</h1>
                            <p className="text-slate-400 font-medium tracking-tight">Digital Shop Center | Reclutamiento</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Folio de Control</div>
                        <div className="text-4xl font-mono font-bold bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                            #{formData.folio}
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* INFO BÁSICA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i data-lucide="calendar" className="w-3 h-3 text-amber-500"></i> Fecha de Actividad
                            </label>
                            <input type="date" name="fecha" value={formData.fecha} onChange={handleInputChange} className="w-full border-b-2 border-slate-100 py-2 focus:border-amber-400 outline-none font-bold text-lg transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i data-lucide="clock" className="w-3 h-3 text-amber-500"></i> Hora Entrada
                            </label>
                            <input type="time" name="entrada" value={formData.entrada} onChange={handleInputChange} className="w-full border-b-2 border-slate-100 py-2 focus:border-amber-400 outline-none font-bold text-lg transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i data-lucide="clock-8" className="w-3 h-3 text-amber-500"></i> Hora Salida
                            </label>
                            <input type="time" name="salida" value={formData.salida} onChange={handleInputChange} className="w-full border-b-2 border-slate-100 py-2 focus:border-amber-400 outline-none font-bold text-lg transition-all" />
                        </div>
                    </div>

                    {/* ÁREAS DE TEXTO */}
                    <div className="space-y-6">
                        <div className="group space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i data-lucide="file-text" className="w-3 h-3 text-amber-500"></i> Descripción de Actividades
                            </label>
                            <textarea name="actividades" value={formData.actividades} onChange={handleInputChange} rows="6" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all resize-none font-medium text-slate-700 leading-relaxed" placeholder="Describe a detalle tus labores..."></textarea>
                        </div>
                        <div className="group space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i data-lucide="list-todo" className="w-3 h-3 text-amber-500"></i> Pendientes para Mañana
                            </label>
                            <textarea name="pendientes" value={formData.pendientes} onChange={handleInputChange} rows="3" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all resize-none font-medium text-slate-600 italic" placeholder="¿Qué quedó pendiente?"></textarea>
                        </div>
                    </div>

                    {/* FIRMAS */}
                    <div className="grid grid-cols-2 gap-12 pt-10">
                        <div className="text-center space-y-3">
                            <div className="h-16 flex items-end justify-center font-mono italic text-slate-300 text-sm">Firma Digital Registrada</div>
                            <div className="border-t-2 border-slate-900 pt-3">
                                <p className="font-black text-sm uppercase tracking-tighter">{formData.nombre}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Colaborador</p>
                            </div>
                        </div>
                        <div className="text-center space-y-3">
                            <div className="h-16 flex items-end justify-center font-mono italic text-slate-300 text-sm">_________________</div>
                            <div className="border-t-2 border-slate-900 pt-3">
                                <p className="font-black text-sm uppercase tracking-tighter">{formData.supervisor}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supervisor Responsable</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTONES ORIGINALES RECUPERADOS */}
            <div className="max-w-4xl mx-auto mt-10 flex flex-wrap gap-5 justify-center no-print">
                <button onClick={handleSave} className={`group px-10 py-5 rounded-2xl font-black uppercase tracking-tighter shadow-2xl transition-all flex items-center gap-3 ${isSaved ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-amber-500 hover:-translate-y-1'}`}>
                    <i data-lucide={isSaved ? "check-circle" : "cloud-upload"} className="w-5 h-5"></i>
                    {isSaved ? '¡Sincronizado!' : 'Guardar en Nube'}
                </button>
                <button onClick={handlePrint} className="px-10 py-5 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl font-black uppercase tracking-tighter hover:bg-slate-50 shadow-xl flex items-center gap-3 transition-all hover:-translate-y-1">
                    <i data-lucide="file-down" className="w-5 h-5"></i> Descargar PDF
                </button>
                <button onClick={handleExportExcel} className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-tighter hover:bg-emerald-700 shadow-xl flex items-center gap-3 transition-all hover:-translate-y-1">
                    <i data-lucide="file-spreadsheet" className="w-5 h-5"></i> Excel
                </button>
            </div>

            {/* TOAST RECUPERADO */}
            {toast && (
                <div className={`fixed bottom-10 right-10 p-5 rounded-2xl shadow-2xl text-white font-bold animate-bounce flex items-center gap-3 z-50 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    <i data-lucide={toast.type === 'success' ? "check" : "alert-circle"}></i>
                    {toast.message}
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
