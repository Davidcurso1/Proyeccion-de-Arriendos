import { MapPin, Info } from 'lucide-react';
import { MEDELLIN_MAP_ZONES, MapZone } from '../types';

interface MedellinMapProps {
  selectedBarrio: string;
  onSelectBarrio: (barrioName: string) => void;
  barrioAverages: { [key: string]: number };
}

export default function MedellinMap({ selectedBarrio, onSelectBarrio, barrioAverages }: MedellinMapProps) {
  
  // Maps visual zone categories for standard Medellin listings
  const getSgName = (zoneId: string) => {
    switch (zoneId) {
      case "poblado": return "El Poblado";
      case "laureles": return "Laureles";
      case "envigado": return "Envigado";
      case "sabaneta": return "Sabaneta";
      case "belen": return "Belén";
      case "centro": return "La Candelaria (Centro)";
      case "buenos_aires": return "Buenos Aires";
      case "robledo": return "Robledo";
      case "guayabal": return "Guayabal";
      case "castilla": return "Castilla";
      case "aranjuez": return "Aranjuez";
      case "manrique": return "Manrique";
      default: return zoneId;
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-semibold text-lg text-white flex items-center gap-2">
            <MapPin className="text-emerald-400 w-5 h-5 animate-bounce" />
            Mapa Interactivo de Medellín
          </h3>
          <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
            Zonificación ML
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Haz clic en cualquier comuna o municipio para filtrar automáticamente por barrio y conocer su promedio de mercado actual.
        </p>
      </div>

      {/* SVG Interactive Map Canvas */}
      <div className="relative w-full aspect-[2/3] flex items-center justify-center bg-slate-950/40 rounded-xl p-4 border border-white/5 overflow-hidden">
        <svg
          viewBox="0 0 260 330"
          className="w-full h-full max-h-[360px] drop-shadow-2xl transition-all"
        >
          {/* Background grid pattern */}
          <defs>
            <pattern id="grid" width="15" height="15" patternUnits="userSpaceOnUse">
              <path d="M 15 0 L 0 0 0 15" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" rx="8" />

          {/* Render individual polygon Comunas */}
          {MEDELLIN_MAP_ZONES.map((zone) => {
            const realName = getSgName(zone.id);
            const isSelected = selectedBarrio === realName;
            const avgPrice = barrioAverages[realName] || 0;

            return (
              <g key={zone.id} className="group cursor-pointer" onClick={() => onSelectBarrio(realName)}>
                <path
                  d={zone.path}
                  fill={isSelected ? "rgba(16, 185, 129, 0.45)" : zone.accent}
                  stroke={isSelected ? "#10b981" : "rgba(255, 255, 255, 0.2)"}
                  strokeWidth={isSelected ? 1.8 : 0.8}
                  className="transition-all duration-300 hover:fill-emerald-500/30 hover:stroke-emerald-400/80"
                />
                
                {/* Micro circle markers at zone node centers */}
                <circle
                  cx={zone.cx}
                  cy={zone.cy}
                  r={isSelected ? 3.5 : 2}
                  fill={isSelected ? "#10b981" : "rgba(255, 255, 255, 0.6)"}
                  className="transition-all"
                />

                {/* Lightweight micro SVG text label */}
                <text
                  x={zone.cx}
                  y={zone.cy - 7}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="5.5"
                  fontWeight={isSelected ? "bold" : "normal"}
                  className="pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] opacity-75 group-hover:opacity-100 transition-opacity"
                >
                  {zone.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Float Tooltip overlay details */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 border border-white/10 rounded-lg p-3 backdrop-blur shadow-xl text-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-400 font-mono block">SECTOR SELECCIONADO</span>
            <span className="font-display font-semibold text-white block truncate max-w-[140px]">
              {selectedBarrio || "Selecciona un sector"}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">ARRIENDO PROMEDIO</span>
            <span className="font-mono text-emerald-300 font-semibold block">
              {barrioAverages[selectedBarrio] 
                ? `$${barrioAverages[selectedBarrio].toLocaleString('es-CO')} COP` 
                : "Selec. Comuna"}
            </span>
          </div>
        </div>
      </div>

      {/* Legend categories */}
      <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 ">
          <span className="w-2.5 h-2.5 rounded bg-sky-500/50 block"></span>
          <span>Sectores Alta Plusvalía (Poblado, Laureles, Envigado)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-purple-500/50 block"></span>
          <span>Sectores Intermedios (Belén, Sabaneta, Candelaria)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-500/50 block"></span>
          <span>Sectores Populares (Aranjuez, Robledo, Manrique)</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/40 p-1.5 rounded border border-white/5">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Filtros instantáneos en tiempo real</span>
        </div>
      </div>
    </div>
  );
}
