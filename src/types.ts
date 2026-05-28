export interface Property {
  id: string;
  barrio: string;
  estrato: number;
  area: number;
  habitaciones: number;
  banos: number;
  parqueaderos: number;
  tipo_vivienda: string;
  antiguedad: string;
  administracion_incluida: string;
  amoblado: string;
  latitud: number;
  longitud: number;
  rutas_bus: boolean;
  metro: boolean;
  supermercados: boolean;
  centros_comerciales: boolean;
  parques: boolean;
  gimnasios: boolean;
  centros_salud: boolean;
  colegios_universidades: boolean;
  precio_arriendo: number;
}

export interface PredictionResult {
  precioEstimado: number;
  rangoMin: number;
  rangoMax: number;
  nivelConfianza: number;
  barrioAvg: number;
  aiReport: string;
  isGemini?: boolean;
  quotaExceeded?: boolean;
  similarViviendas: Property[];
}

export interface BarrioStats {
  barrio: string;
  promedio: number;
  conteo: number;
  latitud: number;
  longitud: number;
}

export interface DashboardStats {
  totalInmuebles: number;
  averagePerBarrio: BarrioStats[];
  estratoData: {
    estrato: number;
    promedioPrice: number;
    count: number;
  }[];
  distributionHistogram: {
    rango: string;
    cantidad: number;
  }[];
  areaVsPricePoints: {
    area: number;
    precio: number;
    barrio: string;
    estrato: number;
  }[];
}

export interface ModelStats {
  weights?: {
    intercept: number;
    coef_area: number;
    coef_estrato: number;
    coef_habitaciones: number;
    coef_banos: number;
    coef_parqueaderos: number;
    coef_tipo_casa: number;
    weights_antiguedad: any;
    coef_admin_incluida: number;
    coef_amoblado: number;
    coef_barrios: { [key: string]: number };
  };
  metrics?: {
    r2: number;
    mae: number;
    rmse: number;
    epochs: number;
    sampleCount: number;
  };
  updatedAt: string;
}

// Interactive map zones structure
export interface MapZone {
  id: string;
  name: string;
  path: string; // SVG path
  cx: number;   // coordinate center for markers
  cy: number;
  accent: string;
  tier: 'Alto' | 'Medio-Alto' | 'Medio' | 'Popular';
}

// SVGs and baseline details for Medellín districts
export const MEDELLIN_MAP_ZONES: MapZone[] = [
  {
    id: "robledo",
    name: "Robledo",
    path: "M 40,50 L 80,40 L 110,65 L 90,100 L 55,90 Z",
    cx: 75,
    cy: 70,
    accent: "rgba(16, 185, 129, 0.65)", // emerald
    tier: "Medio"
  },
  {
    id: "castilla",
    name: "Castilla",
    path: "M 80,40 L 130,30 L 150,55 L 110,65 Z",
    cx: 115,
    cy: 45,
    accent: "rgba(59, 130, 246, 0.65)", // blue
    tier: "Medio"
  },
  {
    id: "aranjuez",
    name: "Aranjuez",
    path: "M 130,30 L 180,35 L 190,65 L 150,55 Z",
    cx: 160,
    cy: 45,
    accent: "rgba(239, 68, 68, 0.65)", // red
    tier: "Popular"
  },
  {
    id: "manrique",
    name: "Manrique",
    path: "M 180,35 L 230,45 L 210,85 L 190,65 Z",
    cx: 200,
    cy: 58,
    accent: "rgba(245, 158, 11, 0.65)", // orange
    tier: "Popular"
  },
  {
    id: "laureles",
    name: "Laureles",
    path: "M 55,90 L 90,100 L 115,125 L 75,145 L 50,115 Z",
    cx: 80,
    cy: 115,
    accent: "rgba(6, 182, 212, 0.65)", // cyan
    tier: "Alto"
  },
  {
    id: "centro",
    name: "La Candelaria (Centro)",
    path: "M 110,65 L 150,55 L 165,105 L 125,120 L 115,85 Z",
    cx: 140,
    cy: 85,
    accent: "rgba(139, 92, 246, 0.65)", // purple
    tier: "Medio"
  },
  {
    id: "buenos_aires",
    name: "Buenos Aires",
    path: "M 165,105 L 210,85 L 235,125 L 175,140 Z",
    cx: 195,
    cy: 115,
    accent: "rgba(236, 72, 153, 0.65)", // pink
    tier: "Medio"
  },
  {
    id: "belen",
    name: "Belén",
    path: "M 50,115 L 75,145 L 90,195 L 45,190 L 35,145 Z",
    cx: 60,
    cy: 160,
    accent: "rgba(20, 184, 166, 0.65)", // teal
    tier: "Medio-Alto"
  },
  {
    id: "guayabal",
    name: "Guayabal",
    path: "M 75,145 L 125,120 L 135,175 L 90,195 Z",
    cx: 105,
    cy: 160,
    accent: "rgba(101, 163, 13, 0.65)", // lime
    tier: "Medio"
  },
  {
    id: "poblado",
    name: "El Poblado",
    path: "M 125,120 L 175,140 L 220,185 L 180,230 L 135,175 Z",
    cx: 165,
    cy: 180,
    accent: "rgba(14, 165, 233, 0.65)", // sky
    tier: "Alto"
  },
  {
    id: "envigado",
    name: "Envigado",
    path: "M 135,175 L 180,230 L 160,275 L 110,240 Z",
    cx: 145,
    cy: 225,
    accent: "rgba(34, 197, 94, 0.65)", // green
    tier: "Alto"
  },
  {
    id: "sabaneta",
    name: "Sabaneta",
    path: "M 110,240 L 160,275 L 130,310 L 85,280 Z",
    cx: 120,
    cy: 275,
    accent: "rgba(168, 85, 247, 0.65)", // purple-light
    tier: "Medio-Alto"
  }
];
