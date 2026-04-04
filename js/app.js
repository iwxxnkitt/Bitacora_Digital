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
    const [images, setImages] = useState([]);
    const [isSaved, setIsSaved] = useState(false);
    const [toast, setToast] = useState(null);
    const [showResetModal, setShowResetModal] = useState(false);

    // Estado inicial de la bitácora
    const [formData, setFormData] = useState({
        folio: "Cargando...",
        fecha: new Date().toISOString().slice(0, 10),
        dia: "", 
        entrada: "09:00",
        salida: "14:00",
        nombre: "KITZYA MINERVA LUNA GUADARRAMA",
        supervisor: "JAVIER TERRAZAS",
        departamento: "Área de Reclutamiento",
        actividades: "",
        pendientes: ""
    });

    // --- EFECTO: TRAER EL SIGUIENTE FOLIO AUTOMÁTICAMENTE ---
    useEffect(() => {
        const bitacoraRef = database.ref('bitacoras');
        bitacoraRef.limitToLast(1).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Si ya hay registros, tomamos el último y le sumamos 1
                const registros = Object.values(data);
                const ultimoFolio = parseInt(registros.folio);
                const siguiente = String(ultimoFolio + 1).padStart(3, '0');
                setFormData(prev => ({ ...prev, folio: siguiente }));
            } else {
                // Si la base de datos está vacía, empezamos en 001
                setFormData(prev => ({ ...prev, folio: "001" }));
            }
        });
        
        if (window.lucide) window.lucide.createIcons();
    }, []);

    // --- FUNCIÓN PARA GUARDAR EN LA NUBE ---
    const handleSave = () => {
        if (!formData.actividades.trim()) {
            setToast({ type: 'error', title: 'Error', message: 'Escribe las actividades primero.' });
            return;
        }

        // GUARDAR EN FIREBASE
        database.ref('bitacoras/' + formData.folio).set({
            ...formData,
            fechaRegistro: new Date().toLocaleString()
        }).then(() => {
            setIsSaved(true);
            setToast({ type: 'success', title: '¡Sincronizado!', message: 'Bitácora guardada en la nube con éxito.' });
            
            // Opcional: Limpiar después de guardar (descomenta si quieres)
            // setFormData(prev => ({ ...prev, actividades: "", pendientes: "" }));
        }).catch(err => {
            setToast({ type: 'error', title: 'Error', message: 'No se pudo conectar con la nube.' });
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setIsSaved(false);
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

    // Función para exportar a Excel
    const handleExportExcel = () => {
        const dataToExport = [{
            Folio: formData.folio,
            Fecha: formData.fecha,
            Día: formData.dia,
            Entrada: formData.entrada,
            Salida: formData.salida,
            Nombre: formData.nombre,
            Supervisor: formData.supervisor,
            Departamento: formData.departamento,
            Actividades: formData.actividades,
            Pendientes: formData.pendientes
        }];
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bitácora");
        XLSX.writeFile(wb, `Bitacora_${formData.folio}.xlsx`);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-200" ref={printRef}>
                {/* ENCABEZADO */}
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">BITÁCORA DIARIA DE ACTIVIDADES</h1>
                        <p className="text-slate-400 text-sm">Digital Shop Center - Área de Reclutamiento</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs uppercase text-slate-500 font-bold">Folio de Control</div>
                        <div className="text-3xl font-mono text-amber-400">#{formData.folio}</div>
                    </div>
                </div>

                {/* CUERPO DE LA BITÁCORA */}
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Fecha</label>
                            <input type="date" name="fecha" value={formData.fecha} onChange={handleInputChange} className="w-full border-b-2 border-gray-200 py-2 focus:border-slate-900 outline-none transition-colors" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Hora Entrada</label>
                            <input type="time" name="entrada" value={formData.entrada} onChange={handleInputChange} className="w-full border-b-2 border-gray-200 py-2 focus:border-slate-900 outline-none transition-colors" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Hora Salida</label>
                            <input type="time" name="salida" value={formData.salida} onChange={handleInputChange} className="w-full border-b-2 border-gray-200 py-2 focus:border-slate-900 outline-none transition-colors" />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Descripción de Actividades</label>
                            <textarea name="actividades" value={formData.actividades} onChange={handleInputChange} rows="6" placeholder="¿Qué se realizó hoy?" className="w-full p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg focus:border-slate-900 outline-none transition-all resize-none"></textarea>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Pendientes para mañana</label>
                            <textarea name="pendientes" value={formData.pendientes} onChange={handleInputChange} rows="3" placeholder="Tareas sin concluir..." className="w-full p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg focus:border-slate-900 outline-none transition-all resize-none"></textarea>
                        </div>
                    </div>
                </div>

                {/* PIE DE FIRMAS */}
                <div className="p-8 border-t border-gray-100 grid grid-cols-2 gap-12">
                    <div className="text-center space-y-2">
                        <div className="h-16 flex items-end justify-center font-mono italic text-gray-400">Firma Digital</div>
                        <div className="border-t-2 border-slate-900 pt-2 font-bold text-sm uppercase">{formData.nombre}</div>
                        <div className="text-xs text-gray-500">Colaborador</div>
                    </div>
                    <div className="text-center space-y-2">
                        <div className="h-16 flex items-end justify-center text-gray-300">_________________</div>
                        <div className="border-t-2 border-slate-900 pt-2 font-bold text-sm uppercase">{formData.supervisor}</div>
                        <div className="text-xs text-gray-500">Supervisor Responsable</div>
                    </div>
                </div>
            </div>

            {/* BOTONES DE ACCIÓN (Fuera del área de impresión) */}
            <div className="max-w-4xl mx-auto mt-8 flex flex-wrap gap-4 justify-center no-print">
                <button onClick={handleSave} className={`px-8 py-4 rounded-full font-bold flex items-center gap-2 shadow-lg transition-all ${isSaved ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:scale-105 active:scale-95'}`}>
                    {isSaved ? '✓ GUARDADO EN NUBE' : '💾 GUARDAR Y REGISTRAR'}
                </button>
                <button onClick={handlePrint} className="px-8 py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-full font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                    🖨️ EXPORTAR PDF
                </button>
                <button onClick={handleExportExcel} className="px-8 py-4 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-all flex items-center gap-2">
                    📊 EXPORTAR EXCEL
                </button>
            </div>

            {/* NOTIFICACIÓN TOAST */}
            {toast && (
                <div className={`fixed bottom-8 right-8 p-4 rounded-lg shadow-2xl text-white animate-bounce ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    <div className="font-bold">{toast.title}</div>
                    <div className="text-sm">{toast.message}</div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
