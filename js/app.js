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

// Inicializar conexión con la nube
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
        entrada: "09:00",
        salida: "14:00",
        nombre: "KITZYA MINERVA LUNA GUADARRAMA",
        supervisor: "JAVIER TERRAZAS",
        departamento: "Área de Reclutamiento",
        actividades: "",
        pendientes: ""
    });

    // TRAER EL SIGUIENTE FOLIO AUTOMÁTICAMENTE
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
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setIsSaved(false);
    };

    const handleSave = () => {
        if (!formData.actividades.trim()) {
            setToast({ type: 'error', title: 'Error', message: 'Escribe las actividades.' });
            return;
        }

        database.ref('bitacoras/' + formData.folio).set({
            ...formData,
            fechaRegistro: new Date().toLocaleString()
        }).then(() => {
            setIsSaved(true);
            setToast({ type: 'success', title: '¡Sincronizado!', message: 'Guardado en la nube.' });
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

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
            <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200" ref={printRef}>
                {/* ENCABEZADO PRO */}
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center border-b-4 border-amber-400">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Bitácora Diaria</h1>
                        <p className="text-slate-400 font-medium">Digital Shop Center | Reclutamiento</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">Folio de Control</div>
                        <div className="text-4xl font-mono font-bold">#{formData.folio}</div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* INFO BÁSICA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Actividad</label>
                            <input type="date" name="fecha" value={formData.fecha} onChange={handleInputChange} className="w-full border-b-2 border-slate-100 py-2 focus:border-amber-400 outline-none font-bold text-lg transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora Entrada</label>
                            <input type="time" name="entrada" value={formData.entrada} onChange={handleInputChange} className="w-full border-b-2 border-slate-100 py-2 focus:border-amber-400 outline-none font-bold text-lg transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora Salida</label>
                            <input type="time" name="salida" value={formData.salida} onChange={handleInputChange} className="w-full border-b-2 border-slate-100 py-2 focus:border-amber-400 outline-none font-bold text-lg transition-all" />
                        </div>
                    </div>

                    {/* TEXT AREAS */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción de Actividades</label>
                            <textarea name="actividades" value={formData.actividades} onChange={handleInputChange} rows="5" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-amber-400 outline-none transition-all resize-none font-medium leading-relaxed" placeholder="Describe lo que hiciste hoy..."></textarea>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendientes para Mañana</label>
                            <textarea name="pendientes" value={formData.pendientes} onChange={handleInputChange} rows="2" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-amber-400 outline-none transition-all resize-none font-medium text-slate-600" placeholder="¿Qué quedó pendiente?"></textarea>
                        </div>
                    </div>

                    {/* FIRMAS */}
                    <div className="grid grid-cols-2 gap-12 pt-8">
                        <div className="text-center">
                            <div className="h-12 border-b-2 border-slate-900 mx-auto w-48 mb-2"></div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Colaborador</p>
                            <p className="font-bold text-xs uppercase">{formData.nombre}</p>
                        </div>
                        <div className="text-center">
                            <div className="h-12 border-b-2 border-slate-900 mx-auto w-48 mb-2"></div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Supervisor</p>
                            <p className="font-bold text-xs uppercase">{formData.supervisor}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTONES */}
            <div className="max-w-4xl mx-auto mt-8 flex flex-wrap gap-4 justify-center">
                <button onClick={handleSave} className={`px-10 py-4 rounded-xl font-black uppercase tracking-tighter shadow-xl transition-all ${isSaved ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-amber-500'}`}>
                    {isSaved ? '✓ Guardado' : 'Guardar en Nube'}
                </button>
                <button onClick={handlePrint} className="px-10 py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-xl font-black uppercase tracking-tighter hover:bg-slate-50 transition-all">
                    Descargar PDF
                </button>
            </div>

            {/* TOAST */}
            {toast && (
                <div className={`fixed bottom-10 right-10 p-4 rounded-lg shadow-2xl text-white font-bold animate-slide-in ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
