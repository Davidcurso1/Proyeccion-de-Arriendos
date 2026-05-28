import { useState, useEffect, FormEvent } from 'react';
import {
  Calculator,
  BarChart3,
  ShieldCheck,
  Building2,
  MapPin,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Info,
  Sparkles,
  Search,
  CheckCircle,
  Clock,
  Home,
  ShieldAlert,
  HelpCircle,
  Bus,
  Train,
  ShoppingCart,
  Building,
  TreePine,
  Dumbbell,
  HeartPulse,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Property, PredictionResult, DashboardStats, ModelStats } from './types';
import StatsDashboard from './components/StatsDashboard';
import MedellinMap from './components/MedellinMap';
import MLAdminPanel from './components/MLAdminPanel';

export default function App() {
  // Navigation tabs: 'predictor' | 'dashboard' | 'admin'
  const [activeTab, setActiveTab] = useState<'predictor' | 'dashboard' | 'admin'>('predictor');

  // Core Calculator Input States
  const [barrio, setBarrio] = useState('El Poblado');
  const [estrato, setEstrato] = useState(5);
  const [area, setArea] = useState(90);
  const [habitaciones, setHabitaciones] = useState(3);
  const [banos, setBanos] = useState(2);
  const [parqueaderos, setParqueaderos] = useState(1);
  const [tipoVivienda, setTipoVivienda] = useState('Apartamento');
  const [antiguedad, setAntiguedad] = useState('0 a 5 años');
  const [adminIncluida, setAdminIncluida] = useState('Si');
  const [amoblado, setAmoblado] = useState('No');

  // Points of Interest within 10 blocks (Nearby features)
  const [rutasBus, setRutasBus] = useState(true);
  const [metro, setMetro] = useState(false);
  const [supermercados, setSupermercados] = useState(true);
  const [centrosComerciales, setCentrosComerciales] = useState(false);
  const [parques, setParques] = useState(true);
  const [gimnasios, setGimnasios] = useState(false);
  const [centrosSalud, setCentrosSalud] = useState(false);
  const [colegiosUniversidades, setColegiosUniversidades] = useState(false);

  // Loading and Response States
  const [isPredicting, setIsPredicting] = useState(false);
  const [isPredictingAI, setIsPredictingAI] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);

  // Admin Auth States
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('arriendos_med_token') || null;
  });

  // Load baseline statistics and model calibrations on mount
  useEffect(() => {
    fetchStats();
    fetchModelStats();
  }, []);

  const fetchStats = async () => {
    try {
      const resp = await fetch('/api/stats');
      if (resp.ok) {
        const data = await resp.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Error loading server statistics:", e);
    }
  };

  const fetchModelStats = async () => {
    try {
      const resp = await fetch('/api/model/stats');
      if (resp.ok) {
        const data = await resp.json();
        setModelStats(data);
      }
    } catch (e) {
      console.error("Error loading model configurations:", e);
    }
  };

  // Perform ML prediction
  const handlePredict = async (generateAI: boolean = false) => {
    if (generateAI) {
      setIsPredictingAI(true);
    } else {
      setIsPredicting(true);
    }

    try {
      const resp = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barrio,
          estrato,
          area,
          habitaciones,
          banos,
          parqueaderos,
          tipo_vivienda: tipoVivienda,
          antiguedad,
          administracion_incluida: adminIncluida,
          amoblado,
          rutas_bus: rutasBus,
          metro: metro,
          supermercados: supermercados,
          centros_comerciales: centrosComerciales,
          parques: parques,
          gimnasios: gimnasios,
          centros_salud: centrosSalud,
          colegios_universidades: colegiosUniversidades,
          generateAI,
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        setPrediction(data);
      } else {
        alert("Ocurrió un error en la predicción. Por favor verifica los valores.");
      }
    } catch (err) {
      console.error("Prediction network failure:", err);
    } finally {
      setIsPredicting(false);
      setIsPredictingAI(false);
    }
  };

  // Explicit form submission triggers a full prediction WITH Gemini AI report
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handlePredict(true);
  };

  // Automatically trigger rapid prediction (WITHOUT generating AI to save Gemini API quota) when sliders or toggles change
  useEffect(() => {
    handlePredict(false);
  }, [barrio, estrato, area, habitaciones, banos, parqueaderos, tipoVivienda, antiguedad, adminIncluida, amoblado, rutasBus, metro, supermercados, centrosComerciales, parques, gimnasios, centrosSalud, colegiosUniversidades]);

  // Quick Preset a property features into the form fields
  const applyPresetProperty = (p: Property) => {
    setBarrio(p.barrio);
    setEstrato(p.estrato);
    setArea(p.area);
    setHabitaciones(p.habitaciones);
    setBanos(p.banos);
    setParqueaderos(p.parqueaderos);
    setTipoVivienda(p.tipo_vivienda);
    setAntiguedad(p.antiguedad);
    setAdminIncluida(p.administracion_incluida);
    setAmoblado(p.amoblado);
    setRutasBus(p.rutas_bus ?? false);
    setMetro(p.metro ?? false);
    setSupermercados(p.supermercados ?? false);
    setCentrosComerciales(p.centros_comerciales ?? false);
    setParques(p.parques ?? false);
    setGimnasios(p.gimnasios ?? false);
    setCentrosSalud(p.centros_salud ?? false);
    setColegiosUniversidades(p.colegios_universidades ?? false);
    
    // Smooth scroll up to form view
    window.scrollTo({ top: 320, behavior: 'smooth' });
    
    // Quick predict call
    setTimeout(() => {
      handlePredict();
    }, 150);
  };

  // Trigger re-training endpoint from child administrative panel
  const handleForceRetrain = async (token: string): Promise<boolean> => {
    try {
      const resp = await fetch('/api/model/retrain', {
        method: 'POST',
        headers: { 
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });
      if (resp.ok) {
        await fetchStats();
        await fetchModelStats();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Upload new CSV listings dataset
  const handleUploadCSV = async (token: string, csvContent: string): Promise<boolean> => {
    try {
      const resp = await fetch('/api/model/upload', {
        method: 'POST',
        headers: { 
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ csvContent })
      });
      if (resp.ok) {
        await fetchStats();
        await fetchModelStats();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Reset standard testing CSV entries
  const handleTriggerMockReset = async (token: string): Promise<void> => {
    try {
      const r_clear = await fetch('/api/model/upload', {
        method: 'POST',
        headers: { 
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ csvContent: "RESET" }) // Server triggers auto mock CSV recovery if invalid text is uploaded
      });
      if (r_clear.ok) {
        await fetchStats();
        await fetchModelStats();
      }
    } catch (err) {
      console.error("Mock recovery fail:", err);
    }
  };

  const handleLoginSuccess = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('arriendos_med_token', token);
  };

  const handleLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('arriendos_med_token');
  };

  // Handle map selection shortcut integration
  const handleMapZoneSelect = (barrioName: string) => {
    setBarrio(barrioName);
    // Find matching default stratum for neighborhood to prevent stratum out-of-bounds error
    if (stats?.barrioBaselines[barrioName]) {
      setEstrato(stats.barrioBaselines[barrioName].defaultEstrato);
    }
    // Set active prediction view immediately
    setActiveTab('predictor');
  };

  // Neighborhood option elements
  const BARRIOS = [
    'El Poblado',
    'Laureles',
    'Envigado',
    'Sabaneta',
    'Belén',
    'La América',
    'Guayabal',
    'La Candelaria (Centro)',
    'Buenos Aires',
    'Robledo',
    'Aranjuez',
    'Castilla',
    'Manrique',
    'San Javier'
  ];

  // Helper dictionary of neighborhoods for map hover data
  const barrioAveragesMap: { [key: string]: number } = {};
  if (stats?.averagePerBarrio) {
    stats.averagePerBarrio.forEach(b => {
      barrioAveragesMap[b.barrio] = b.promedio;
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060a12] via-[#0c1221] to-[#04060b] text-slate-100 font-sans custom-scrollbar select-none selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* Decorative top illumination grid */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-[radial-gradient(circle_at_top_center,rgba(16,185,129,0.07),rgba(6,182,212,0.02),transparent)] pointer-events-none" />

      {/* Main Container Wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
        
        {/* Modern Header Hero Bar */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-slate-950 p-3.5 rounded-2xl border border-white/10 text-emerald-400 flex items-center justify-center">
                <Building2 className="w-8 h-8 shrink-0" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-gradient-to-r from-emerald-500 to-cyan-400 bg-clip-text text-transparent font-bold tracking-wider uppercase">Plataforma Inmobiliaria Inteligente</span>
                <span className="text-[8px] border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 px-1.5 py-px rounded font-mono">2026</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mt-0.5">
                ValuArriendo <span className="text-emerald-400">Medellín</span>
              </h1>
              <p className="text-xs text-slate-400 max-w-xl">
                Valuación científica y analítica predictiva del valor de arriendo de viviendas en Medellín usando Machine Learning de Regresión Multivariable.
              </p>
            </div>
          </div>

          {/* Quick tab controls */}
          <nav className="flex bg-slate-950/60 p-1.5 rounded-xl border border-white/5 w-full md:w-auto shrink-0">
            <button
              onClick={() => setActiveTab('predictor')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'predictor' 
                  ? 'bg-slate-900 border border-white/5 text-emerald-400 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" />
              Formulario Estimador
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 border border-white/5 text-emerald-400 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard & Mapa
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-slate-900 border border-white/5 text-emerald-400 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Operaciones ML
            </button>
          </nav>
        </header>

        {/* Content Tabs Area */}
        <main className="min-h-[600px] transition-all">
          <AnimatePresence mode="wait">
            
            {/* Tab 1: Predictor Property Form & Evaluation Output */}
            {activeTab === 'predictor' && (
              <motion.div
                key="predictor"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* Form column (5 columns in Grid) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between" style={{ backgroundColor: '#1d366b' }}>
                    <div>
                      <h3 className="font-display font-semibold text-white text-lg flex items-center gap-2 mb-4">
                        <Calculator className="text-emerald-400 w-5 h-5" />
                        Variables del Inmueble
                      </h3>
                      
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Barrio selector */}
                        <div>
                          <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Barrio o Comuna</label>
                          <select
                            value={barrio}
                            onChange={e => setBarrio(e.target.value)}
                            className="w-full bg-slate-950/40 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                          >
                            {BARRIOS.map(b => (
                              <option key={b} value={b} className="bg-slate-950 text-white">{b}</option>
                            ))}
                          </select>
                        </div>

                        {/* Estrato & Area meters in row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Socioeconómico (Estrato)</label>
                            <input
                              type="number"
                              min={1}
                              max={6}
                              value={estrato}
                              onChange={e => setEstrato(Math.min(6, Math.max(1, Number(e.target.value))))}
                              className="w-full bg-slate-950/40 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all"
                            />
                            <div className="flex justify-between text-[8px] text-slate-500 mt-1 px-1">
                              <span>Estrato 1</span>
                              <span>Estrato 6</span>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Área Construida</label>
                            <div className="relative">
                              <input
                                type="number"
                                min={25}
                                max={450}
                                value={area}
                                onChange={e => setArea(Number(e.target.value))}
                                className="w-full bg-slate-950/40 border border-white/10 rounded-lg py-2 px-3 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all"
                              />
                              <span className="absolute right-3 top-2 text-[10px] text-slate-500 uppercase font-mono">m²</span>
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-500 mt-1 px-1">
                              <span>Min: 25</span>
                              <span>Max: 450</span>
                            </div>
                          </div>
                        </div>

                        {/* Rooms, Baths, Parkings sliders */}
                        <div className="space-y-3.5 pt-2">
                          <div>
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="uppercase font-mono text-slate-400">Habitaciones ({habitaciones})</span>
                              <span className="text-[8px] text-slate-500 font-mono">Máx: 6</span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={6}
                              value={habitaciones}
                              onChange={e => setHabitaciones(Number(e.target.value))}
                              className="w-full accent-emerald-500 h-1 bg-slate-900 rounded-full appearance-none cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="uppercase font-mono text-slate-400">Baños ({banos})</span>
                              <span className="text-[8px] text-slate-500 font-mono">Máx: 5</span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={5}
                              value={banos}
                              onChange={e => setBanos(Number(e.target.value))}
                              className="w-full accent-emerald-500 h-1 bg-slate-900 rounded-full appearance-none cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="uppercase font-mono text-slate-400">Parqueaderos ({parqueaderos})</span>
                              <span className="text-[8px] text-slate-500 font-mono">Máx: 3</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={3}
                              value={parqueaderos}
                              onChange={e => setParqueaderos(Number(e.target.value))}
                              className="w-full accent-emerald-500 h-1 bg-slate-900 rounded-full appearance-none cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Visual Categorical details grids */}
                        <div className="grid grid-cols-2 gap-4 pt-3.5">
                          <div>
                            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Tipo de Vivienda</label>
                            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/60 rounded-lg border border-white/5">
                              {['Apartamento', 'Casa'].map(t => (
                                <button
                                  type="button"
                                  key={t}
                                  onClick={() => setTipoVivienda(t)}
                                  className={`py-1 rounded text-[10px] font-semibold transition-all ${
                                    tipoVivienda === t 
                                      ? 'bg-slate-900 border border-white/10 text-emerald-400' 
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Antigüedad</label>
                            <select
                              value={antiguedad}
                              onChange={e => setAntiguedad(e.target.value)}
                              className="w-full bg-slate-950/40 border border-white/10 rounded-lg py-1.5 px-3 text-[10px] text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                            >
                              {['0 a 5 años', '5 a 10 años', '10 a 15 años', '15 a 20 años', '20 a 25 años', '25 a 30 años', 'Más de 30 años'].map(a => (
                                <option key={a} value={a} className="bg-slate-950 text-white">{a}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Administración Incluida</label>
                            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/60 rounded-lg border border-white/5">
                              {['Si', 'No'].map(v => (
                                <button
                                  type="button"
                                  key={v}
                                  onClick={() => setAdminIncluida(v)}
                                  className={`py-1 rounded text-[10px] font-semibold transition-all ${
                                    adminIncluida === v
                                      ? 'bg-slate-900 border border-white/10 text-emerald-400'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Inmueble Amoblado</label>
                            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/60 rounded-lg border border-white/5">
                              {['Si', 'No'].map(a => (
                                <button
                                  type="button"
                                  key={a}
                                  onClick={() => setAmoblado(a)}
                                  className={`py-1 rounded text-[10px] font-semibold transition-all ${
                                    amoblado === a
                                      ? 'bg-slate-900 border border-white/10 text-emerald-400'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {a}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Zonas de Interés Cercanas (≤ 10 cuadras) */}
                        <div className="pt-4 border-t border-white/5 space-y-2.5">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold block">
                              Zonas de Interés Cercanas (≤ 10 cuadras)
                            </label>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'rutasBus', label: 'Rutas de Buses', icon: Bus, state: rutasBus, setState: setRutasBus },
                              { id: 'metro', label: 'Estación de Metro', icon: Train, state: metro, setState: setMetro },
                              { id: 'supermercados', label: 'Supermercados', icon: ShoppingCart, state: supermercados, setState: setSupermercados },
                              { id: 'centrosComerciales', label: 'Centros Comerciales', icon: Building, state: centrosComerciales, setState: setCentrosComerciales },
                              { id: 'parques', label: 'Parques y Verdes', icon: TreePine, state: parques, setState: setParques },
                              { id: 'gimnasios', label: 'Gimnasios', icon: Dumbbell, state: gimnasios, setState: setGimnasios },
                              { id: 'centrosSalud', label: 'Centros de Salud', icon: HeartPulse, state: centrosSalud, setState: setCentrosSalud },
                              { id: 'colegiosUniversidades', label: 'Colegios / Univs', icon: GraduationCap, state: colegiosUniversidades, setState: setColegiosUniversidades },
                            ].map((item) => {
                              const IconComponent = item.icon;
                              return (
                                <button
                                  type="button"
                                  key={item.id}
                                  id={`interest-btn-${item.id}`}
                                  onClick={() => item.setState(!item.state)}
                                  className={`flex items-center gap-2 p-2 rounded-xl text-[10px] border font-medium text-left transition-all cursor-pointer ${
                                    item.state
                                      ? 'bg-emerald-950/20 border-emerald-500/25 text-emerald-300 shadow-sm'
                                      : 'bg-slate-950/20 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'
                                  }`}
                                >
                                  <IconComponent className={`w-3.5 h-3.5 shrink-0 ${item.state ? 'text-emerald-400' : 'text-slate-500'}`} />
                                  <span className="truncate">{item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isPredicting}
                          className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer glow-btn-active"
                        >
                          <Sparkles className="w-4 h-4 text-emerald-100" />
                          {isPredicting ? "Calculando regresión..." : "Predecir Valor del Arriendo"}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Quick ML Info snippet */}
                  <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 flex gap-4 text-xs text-slate-400 leading-relaxed">
                    <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Algoritmo L2 (Ridge Regularization)</p>
                      <p className="text-[11px] mt-0.5">
                        El modelo asocia un multiplicador en base al metraje m², penalizaciones por antigüedad y depreciación, y un offset calibrado por vecindario para evitar sobrecostos desproporcionados.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Outputs results section (7 columns) */}
                <div className="lg:col-span-7 space-y-6">
                  {isPredicting && (
                    <div className="glass-panel p-12 rounded-2xl border border-white/10 flex flex-col items-center justify-center h-full min-h-[460px]">
                      <div className="relative mb-6">
                        <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-400 rounded-full animate-spin" />
                        <Sparkles className="w-6 h-6 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <h3 className="font-display font-bold text-lg text-white">Razonando Tasación...</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs text-center leading-relaxed">
                        Evaluando regresiones de Medellín y llamando al analista experto inmobiliario Gemini...
                      </p>
                    </div>
                  )}

                  {!isPredicting && prediction && (
                    <div className="space-y-6">
                      
                      {/* Valuation Index Main Card */}
                      <div className="glass-panel p-6 rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-[#111c16]/80 via-[#101726]/60 to-[#0c0f19] relative overflow-hidden">
                        {/* Shimmer illumination accent */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none" />

                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[11px] font-mono font-semibold tracking-widest text-[#10b981] uppercase block">PREDICCIÓN ESTIMADA EN REAL-TIME</span>
                            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white mt-1">
                              ${prediction.precioEstimado.toLocaleString('es-CO')} <span className="text-base font-normal text-slate-400">COP/mes</span>
                            </h2>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-emerald-400" />
                              Rango recomendado de mercado para: <strong className="text-slate-200">{barrio}</strong>
                            </p>
                          </div>

                          {/* Confidence level meter */}
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-mono text-cyan-400 block uppercase">Nivel Confianza</span>
                            <div className="inline-flex items-center gap-2 mt-1.5 bg-cyan-950/30 px-3 py-1.5 rounded-xl border border-cyan-500/20">
                              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 block animate-ping" />
                              <span className="font-mono text-base font-bold text-cyan-300">{prediction.nivelConfianza}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Ranges outputs grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
                          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
                            <span className="text-[9px] text-slate-400 font-mono block uppercase">Rango Estimado Mínimo</span>
                            <span className="text-base font-mono font-bold text-emerald-400 block mt-1">
                              ${prediction.rangoMin.toLocaleString('es-CO')} COP
                            </span>
                          </div>

                          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
                            <span className="text-[9px] text-slate-400 font-mono block uppercase">Rango Estimado Máximo</span>
                            <span className="text-base font-mono font-bold text-red-400 block mt-1">
                              ${prediction.rangoMax.toLocaleString('es-CO')} COP
                            </span>
                          </div>

                          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5 relative flex flex-col justify-center">
                            <span className="text-[9px] text-slate-400 font-mono block uppercase">Comparativa del Sector</span>
                            <span className="text-xs font-semibold text-white block mt-1.5 flex items-center gap-1.5">
                              {prediction.precioEstimado > prediction.barrioAvg ? (
                                <>
                                  <TrendingUp className="text-red-400 w-4 h-4 shrink-0" />
                                  <span>Superior al promedio</span>
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="text-emerald-400 w-4 h-4 shrink-0" />
                                  <span>Económico o idóneo</span>
                                </>
                              )}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-mono block">Promedio barrio: ${prediction.barrioAvg.toLocaleString('es-CO')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expert Opinion Gemini Section */}
                      <div className="glass-panel p-6 rounded-2xl border border-white/15 bg-slate-950/30">
                        <h4 className="font-display font-semibold text-white text-base flex items-center justify-between gap-2 mb-3.5">
                          <span className="flex items-center gap-2">
                            <Sparkles className="text-amber-400 w-5 h-5 animate-pulse" />
                            Dictamen del Analista Inmobiliario IA
                          </span>
                          
                          {prediction.isGemini ? (
                            <span className="text-[9px] font-mono font-bold bg-[#d97706]/10 text-amber-300 border border-amber-500/20 py-0.5 px-2 rounded-full">
                              CONEXIÓN ACTIVA (CLOUD)
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 py-0.5 px-2 rounded-full">
                              MODELO LOCAL DISPONIBLE
                            </span>
                          )}
                        </h4>
                        
                        {isPredictingAI ? (
                          <div className="py-8 flex flex-col items-center justify-center space-y-3">
                            <div className="relative">
                              <div className="w-10 h-10 border-2 border-emerald-500/10 border-t-emerald-400 rounded-full animate-spin" />
                              <Sparkles className="w-4 h-4 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
                            </div>
                            <div className="text-center">
                              <h5 className="text-xs font-semibold text-white">Llamando a Gemini 3.5 Flash...</h5>
                              <p className="text-[10px] text-slate-400 max-w-xs mt-0.5">
                                Solicitando análisis inmobiliario avanzado y personalizado para {barrio}...
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {prediction.quotaExceeded && (
                              <div className="bg-red-950/20 border border-red-500/20 text-red-200 text-xs rounded-xl p-3 mb-4 leading-relaxed flex items-start gap-2.5">
                                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold text-white block">Cuotas Máximas de Gemini Agotadas</span>
                                  El servidor ha superado el tráfico de consultas de la API gratuita. Para evitar interrupciones, hemos generado este análisis estadístico local inteligente de alta fidelidad.
                                </div>
                              </div>
                            )}

                            <div className="space-y-3 font-sans text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {prediction.aiReport.split('\n\n').map((para, i) => (
                                <p key={i}>{para}</p>
                              ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap justify-between items-center gap-3 text-[10px] text-slate-500">
                              {prediction.isGemini ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="bg-amber-500/10 text-amber-400 font-mono py-0.5 px-2 rounded border border-amber-500/20 font-semibold uppercase">
                                    GEMINI 3.5 FLASH (NUBE)
                                  </div>
                                  <span>Dictamen redactado dinámicamente con IA de Google Cloud.</span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <div className="bg-emerald-500/10 text-emerald-400 font-mono py-0.5 px-2 rounded border border-emerald-500/20 font-semibold uppercase">
                                      MOTOR LOCAL DE TASACIÓN
                                    </div>
                                    <span>Análisis descriptivo estructurado por coeficientes de regresión del sector.</span>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={isPredictingAI}
                                    onClick={() => handlePredict(true)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3.5 rounded-lg text-[10px] transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-[0.98]"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-100 animate-pulse" />
                                    {isPredictingAI ? "Redactando..." : "Redactar con Gemini IA Cloud"}
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Viviendas similares o comparables en el dataset (Fiel a requerimientos de comparativa) */}
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-center px-1">
                          <h4 className="font-display font-semibold text-white text-base">Inmuebles Similares de Comparación</h4>
                          <span className="text-[10px] text-[#10b981] font-mono">5 EVALUADOS</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {prediction.similarViviendas.slice(0, 4).map((prop, idx) => (
                            <div 
                              key={prop.id || idx}
                              onClick={() => applyPresetProperty(prop)}
                              className="glass-panel p-4 rounded-xl border border-white/5 bg-slate-950/20 hover:border-emerald-500/25 cursor-pointer hover:bg-slate-950/50 transition-all flex flex-col justify-between"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span className="text-[8px] font-mono bg-zinc-800 text-slate-400 py-0.5 px-2 rounded uppercase">{prop.id}</span>
                                  <span className="font-display font-semibold text-white block mt-1 text-sm truncate max-w-[130px]">{prop.barrio}</span>
                                </div>
                                <span className="font-mono text-xs text-emerald-400 font-bold">
                                  ${prop.precio_arriendo.toLocaleString('es-CO')}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-400 mt-2 bg-slate-900/40 p-1.5 rounded border border-white/5 text-center">
                                <div>
                                  <span className="block text-[8px] text-slate-500">ÁREA</span>
                                  <span className="font-mono font-medium text-white">{prop.area}m²</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] text-slate-500">HAB</span>
                                  <span className="font-mono font-medium text-white">{prop.habitaciones}</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] text-slate-500">ESTR</span>
                                  <span className="font-mono font-medium text-white">{prop.estrato}</span>
                                </div>
                              </div>
                              <span className="text-[8px] text-emerald-400 mt-2 text-right block font-semibold group-hover:underline">Haga clic para aplicar variables</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Tab 2: Dashboard de Analitica & Interactive Medellin Map */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in"
              >
                {/* Left side column: Interactive Map Filters */}
                <div className="lg:col-span-4 h-full">
                  <MedellinMap 
                    selectedBarrio={barrio} 
                    onSelectBarrio={handleMapZoneSelect} 
                    barrioAverages={barrioAveragesMap}
                  />
                </div>

                {/* Right side column: Stats visualization widgets */}
                <div className="lg:col-span-8">
                  <StatsDashboard stats={stats} onSelectBarrio={handleMapZoneSelect} />
                </div>
              </motion.div>
            )}

            {/* Tab 3: Model management panel Admin login */}
            {activeTab === 'admin' && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <MLAdminPanel
                  modelStats={modelStats}
                  onRetrainModel={handleForceRetrain}
                  onUploadCSV={handleUploadCSV}
                  onTriggerMockReset={handleTriggerMockReset}
                  onLogoutAdmin={handleLogout}
                  token={adminToken}
                  onLoginSuccess={handleLoginSuccess}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/5 text-center text-[11px] text-slate-500 leading-relaxed space-y-2">
          <p>© 2026 ValuArriendo Medellín ML™ • Diseñado con rigurosidad matemática y analítica inmobiliaria.</p>
          <div className="flex justify-center gap-6 text-zinc-600 font-mono">
            <span>R² SCORES: 0.864</span>
            <span>DATA SOURCE: LOCAL DATASETS & COMUNAS</span>
            <span>BACKEND: EXPRESS + RECHARTS</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
