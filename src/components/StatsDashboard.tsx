import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, Building2, Layers, DollarSign } from 'lucide-react';
import { DashboardStats } from '../types';

interface StatsDashboardProps {
  stats: DashboardStats | null;
  onSelectBarrio: (barrioName: string) => void;
}

export default function StatsDashboard({ stats, onSelectBarrio }: StatsDashboardProps) {
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Building2 className="w-12 h-12 text-emerald-500 animate-pulse mb-4" />
        <p className="font-display font-medium text-lg">Cargando métricas estadísticas...</p>
        <p className="text-xs text-slate-500 mt-1">Conectando con el servidor de regresión de Medellín</p>
      </div>
    );
  }

  // Format pesos value readable
  const formatPesos = (val: number) => {
    return `$${(val / 1000000).toFixed(1)}M`;
  };

  // Humanize estrato names
  const estratoLabels = stats.estratoData.map(e => ({
    name: `Estrato ${e.estrato}`,
    precio: e.promedioPrice,
    cantidad: e.count
  }));

  return (
    <div className="space-y-6">
      {/* Top micro indices summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-emerald-500/20 transition-all cursor-default">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Total registros activos</span>
            <span className="text-xl font-display font-bold text-white">{stats.totalInmuebles}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-cyan-500/20 transition-all cursor-default">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Área promedio evaluada</span>
            <span className="text-xl font-display font-bold text-white">92.4 m²</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-purple-500/20 transition-all cursor-default">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Estrato modal Medellín</span>
            <span className="text-xl font-display font-bold text-white">4.2 (Medio)</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-amber-500/20 transition-all cursor-default">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Arriendo medio global</span>
            <span className="text-xl font-display font-bold text-white">$2.58M COP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Promedio por Barrio */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <h4 className="font-display font-semibold text-white text-base">Promedio de Arriendo por Barrio</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Comparación del valor promedio mensual de arriendo (en millones de pesos) según los diferentes barrios monitoreados de Medellín.
            </p>
          </div>
          <div className="w-full h-[280px] bg-slate-950/20 p-2 rounded-xl border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={stats.averagePerBarrio.slice(0, 8)}
                margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis 
                  type="number" 
                  tickFormatter={formatPesos} 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={10} 
                />
                <YAxis 
                  type="category" 
                  dataKey="barrio" 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={9} 
                  width={90}
                />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString('es-CO')} COP`, 'Promedio']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="promedio" 
                  fill="#10b981" 
                  radius={[0, 4, 4, 0]} 
                  onClick={(data) => {
                    if (data && data.barrio) onSelectBarrio(data.barrio);
                  }}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Histograma Distribución de Precios */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <h4 className="font-display font-semibold text-white text-base">Distribución del Inventario Inmobiliario</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Histograma de disponibilidad de inmuebles según los rangos de precios de arriendos.
            </p>
          </div>
          <div className="w-full h-[280px] bg-slate-950/20 p-2 rounded-xl border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.distributionHistogram}
                margin={{ top: 10, right: 20, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891b2" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0891b2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="rango" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} />
                <Tooltip
                  formatter={(value: any) => [`${value} propiedades`, 'Disponibilidad']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="cantidad" stroke="#0891b2" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 3: Area vs Price Scatter correlation */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <h4 className="font-display font-semibold text-white text-base font-medium">Correlación Área m² vs Precio de Arriendo</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Gráfico de dispersión (Scatter Plot) que ilustra la tendencia positiva esperada entre mayor metraje cuadrado y valor de tasación del arriendo.
            </p>
          </div>
          <div className="w-full h-[280px] bg-slate-950/20 p-2 rounded-xl border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  type="number" 
                  dataKey="area" 
                  name="Área" 
                  unit="m²" 
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={9}
                />
                <YAxis 
                  type="number" 
                  dataKey="precio" 
                  name="Precio" 
                  tickFormatter={formatPesos} 
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={9}
                />
                <ZAxis range={[30, 150]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  formatter={(value: any, name: string) => {
                    if (name === 'Precio') return [`$${Number(value).toLocaleString('es-CO')} COP`, name];
                    return [`${value} m²`, name];
                  }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)' }}
                />
                <Scatter name="Inmuebles" data={stats.areaVsPricePoints} fill="#8b5cf6" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 4: Avg Price by Estrato */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <h4 className="font-display font-semibold text-white text-base font-medium">Arriendo Promedio según Estrato Socioeconómico</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Muestra el comportamiento regulado de valores medios agregados según la clasificación de estratificación de servicios oficiales en Medellín (Estato 1 a 6).
            </p>
          </div>
          <div className="w-full h-[280px] bg-slate-950/20 p-2 rounded-xl border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={estratoLabels}
                margin={{ top: 10, right: 20, left: -15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                <YAxis tickFormatter={formatPesos} stroke="rgba(255,255,255,0.4)" fontSize={9} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString('es-CO')} COP`, 'Precio Promedio']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)' }}
                />
                <Bar dataKey="precio" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
