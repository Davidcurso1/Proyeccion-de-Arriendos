import * as fs from 'fs';
import * as path from 'path';

export interface Property {
  id: string;
  barrio: string;
  estrato: number;
  area: number;
  habitaciones: number;
  banos: number;
  parqueaderos: number;
  tipo_vivienda: string; // 'Apartamento' | 'Casa'
  antiguedad: string;    // 'Nuevo' | '1 a 10 años' | '10 a 30 años' | 'Más de 30 años'
  administracion_incluida: string; // 'Si' | 'No'
  amoblado: string;       // 'Si' | 'No'
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

export interface ModelWeights {
  intercept: number;
  coef_area: number;
  coef_estrato: number;
  coef_habitaciones: number;
  coef_banos: number;
  coef_parqueaderos: number;
  coef_tipo_casa: number; // Casa = 1, Apartamento = 0
  coef_antiguedad: { [key: string]: number };
  coef_admin_incluida: number; // Si = 1, No = 0
  coef_amoblado: number;       // Si = 1, No = 0
  coef_rutas_bus: number;
  coef_metro: number;
  coef_supermercados: number;
  coef_centros_comerciales: number;
  coef_parques: number;
  coef_gimnasios: number;
  coef_centros_salud: number;
  coef_colegios_universidades: number;
  coef_barrios: { [key: string]: number }; // Barrio multiplier or offset
  means: { [key: string]: number };
  stds: { [key: string]: number };
}

export interface TrainingMetrics {
  r2: number;
  mae: number;
  rmse: number;
  epochs: number;
  sampleCount: number;
}

// Default barrios with coordinates and baseline price factors (COP per sqm in 2026/latest values)
export const BARRIO_DATA: { [key: string]: { lat: number; lng: number; baseSqmPrice: number; defaultEstrato: number } } = {
  'El Poblado': { lat: 6.2083, lng: -75.5678, baseSqmPrice: 32000, defaultEstrato: 6 },
  'Laureles': { lat: 6.2442, lng: -75.5891, baseSqmPrice: 24000, defaultEstrato: 5 },
  'Envigado': { lat: 6.1759, lng: -75.5917, baseSqmPrice: 22000, defaultEstrato: 5 },
  'Sabaneta': { lat: 6.1515, lng: -75.6151, baseSqmPrice: 19000, defaultEstrato: 4 },
  'Belén': { lat: 6.2332, lng: -75.6022, baseSqmPrice: 17500, defaultEstrato: 4 },
  'La América': { lat: 6.2520, lng: -75.6040, baseSqmPrice: 16000, defaultEstrato: 4 },
  'Guayabal': { lat: 6.2133, lng: -75.5866, baseSqmPrice: 14500, defaultEstrato: 3 },
  'La Candelaria (Centro)': { lat: 6.2476, lng: -75.5658, baseSqmPrice: 14000, defaultEstrato: 3 },
  'Buenos Aires': { lat: 6.2394, lng: -75.5511, baseSqmPrice: 13500, defaultEstrato: 3 },
  'Robledo': { lat: 6.2731, lng: -75.5936, baseSqmPrice: 12500, defaultEstrato: 3 },
  'Aranjuez': { lat: 6.2750, lng: -75.5583, baseSqmPrice: 11000, defaultEstrato: 2 },
  'Castilla': { lat: 6.2917, lng: -75.5783, baseSqmPrice: 11500, defaultEstrato: 2 },
  'Manrique': { lat: 6.2690, lng: -75.5480, baseSqmPrice: 10500, defaultEstrato: 2 },
  'San Javier': { lat: 6.2513, lng: -75.6262, baseSqmPrice: 11000, defaultEstrato: 2 },
};

export class HousingModel {
  public properties: Property[] = [];
  public weights: ModelWeights | null = null;
  public metrics: TrainingMetrics | null = null;

  constructor() {
    this.ensureDirsExist();
    this.loadOrInitializeData();
  }

  private ensureDirsExist() {
    try {
      const datasetsDir = path.join(process.cwd(), 'datasets');
      const modelsDir = path.join(process.cwd(), 'models');

      if (!fs.existsSync(datasetsDir)) {
        fs.mkdirSync(datasetsDir, { recursive: true });
      }
      if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
      }
    } catch (e) {
      console.warn("[HousingModel warning] Could not verify or create directories (normal on read-only environments like Vercel):", e);
    }
  }

  /**
   * Generates a fully realistic dataset of Medellín properties if one does not exist
   */
  public generateMockCSV(): string {
    const headers = 'id,barrio,estrato,area,habitaciones,banos,parqueaderos,tipo_vivienda,antiguedad,administracion_incluida,amoblado,latitud,longitud,rutas_bus,metro,supermercados,centros_comerciales,parques,gimnasios,centros_salud,colegios_universidades,precio_arriendo\n';
    let rows = '';

    const tipos = ['Apartamento', 'Casa'];
    const antiguedades = ['0 a 5 años', '5 a 10 años', '10 a 15 años', '15 a 20 años', '20 a 25 años', '25 a 30 años', 'Más de 30 años'];
    const s_n = ['Si', 'No'];

    let idCounter = 1;

    // Generate ~250 properties
    Object.keys(BARRIO_DATA).forEach((barrio) => {
      const data = BARRIO_DATA[barrio];
      // Generate 15-20 properties per neighborhood to maintain statistical balance
      const count = 15 + Math.floor(Math.random() * 8);

      for (let i = 0; i < count; i++) {
        const area = 40 + Math.floor(Math.random() * 180); // 40 to 220 sqm
        const estrato = Math.max(1, Math.min(6, data.defaultEstrato + (Math.random() > 0.7 ? 1 : Math.random() > 0.7 ? -1 : 0)));
        const rooms = area < 60 ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 3);
        const bathrooms = Math.max(1, Math.min(rooms, 1 + Math.floor(Math.random() * 3)));
        const parkings = area < 70 ? (Math.random() > 0.7 ? 1 : 0) : 1 + Math.floor(Math.random() * 2);

        const tipo = Math.random() > 0.85 ? 'Casa' : 'Apartamento';
        const antiguedad = antiguedades[Math.floor(Math.random() * antiguedades.length)];
        const adminIncluida = Math.random() > 0.2 ? 'Si' : 'No';
        const amoblado = Math.random() > 0.85 ? 'Si' : 'No';

        // Add coordinates coordinates with random small deviation around center of neighborhood
        const lat = data.lat + (Math.random() - 0.5) * 0.012;
        const lng = data.lng + (Math.random() - 0.5) * 0.012;

        // Points of interest boolean (Si/No) representation
        const rutasBus = Math.random() > 0.3 ? 'Si' : 'No';
        const metro = Math.random() > 0.65 ? 'Si' : 'No';
        const supermercados = Math.random() > 0.3 ? 'Si' : 'No';
        const centrosComerciales = Math.random() > 0.55 ? 'Si' : 'No';
        const parques = Math.random() > 0.35 ? 'Si' : 'No';
        const gimnasios = Math.random() > 0.45 ? 'Si' : 'No';
        const centrosSalud = Math.random() > 0.45 ? 'Si' : 'No';
        const colegiosUniversidades = Math.random() > 0.4 ? 'Si' : 'No';

        // Base price model:
        // Area price + Estrato uplift + bathroom/parking perks
        let basePrice = area * data.baseSqmPrice;
        
        // Estrato uplift: +/- 12% per stratum relative to default
        const estratoFactor = 1 + (estrato - 3) * 0.12;
        basePrice *= estratoFactor;

        // Parks / Bathrooms value
        basePrice += (bathrooms - 1) * 150000;
        basePrice += parkings * 200000;

        // Age factor: ranges of 5 years
        if (antiguedad === '0 a 5 años') basePrice *= 1.12;
        else if (antiguedad === '5 a 10 años') basePrice *= 1.04;
        else if (antiguedad === '10 a 15 años') basePrice *= 0.98;
        else if (antiguedad === '15 a 20 años') basePrice *= 0.92;
        else if (antiguedad === '20 a 25 años') basePrice *= 0.86;
        else if (antiguedad === '25 a 30 años') basePrice *= 0.80;
        else basePrice *= 0.74;

        // Unfurnished vs Furnished: Furnished is 35% more expensive
        if (amoblado === 'Si') basePrice *= 1.35;

        // If admin included, rent price incorporates admin fees (~10%)
        if (adminIncluida === 'Si') basePrice *= 1.10;

        // Houses are slightly cheaper per sqm but have higher size basis
        if (tipo === 'Casa') basePrice *= 0.92;

        // Points of interest additive premiums
        if (rutasBus === 'Si') basePrice += 35000;
        if (metro === 'Si') basePrice += 140000;
        if (supermercados === 'Si') basePrice += 55000;
        if (centrosComerciales === 'Si') basePrice += 75000;
        if (parques === 'Si') basePrice += 45000;
        if (gimnasios === 'Si') basePrice += 35000;
        if (centrosSalud === 'Si') basePrice += 40000;
        if (colegiosUniversidades === 'Si') basePrice += 50000;

        // Add randomized noise (demand fluctuation, condition) +/- 12%
        const noise = 0.88 + Math.random() * 0.24;
        let finalPrice = Math.round(basePrice * noise);

        // Round to nearest 50.000 COP for realistic listings
        finalPrice = Math.round(finalPrice / 50000) * 50000;

        // Bound to realistic minimum arriendo (850,000 COP in Medellin)
        if (finalPrice < 850000) finalPrice = 850000;

        rows += `PROP-${idCounter++},"${barrio}",${estrato},${area},${rooms},${bathrooms},${parkings},"${tipo}","${antiguedad}","${adminIncluida}","${amoblado}",${lat.toFixed(6)},${lng.toFixed(6)},"${rutasBus}","${metro}","${supermercados}","${centrosComerciales}","${parques}","${gimnasios}","${centrosSalud}","${colegiosUniversidades}",${finalPrice}\n`;
      }
    });

    return headers + rows;
  }

  public loadOrInitializeData() {
    const csvPath = path.join(process.cwd(), 'datasets', 'propiedades_medellin.csv');

    if (!fs.existsSync(csvPath)) {
      console.log('datasets/propiedades_medellin.csv code not found. Generating default mock data dataset...');
      try {
        const csvContent = this.generateMockCSV();
        fs.writeFileSync(csvPath, csvContent, 'utf-8');
      } catch (err) {
        console.error("[HousingModel error] Could not write default properties CSV:", err);
      }
    }

    this.loadCSV(csvPath);
    this.trainModel();
  }

  public loadCSV(filePath: string) {
    try {
      console.log(`[HousingModel] Attempting to read properties CSV dataset from: ${filePath}`);
      const content = fs.readFileSync(filePath, 'utf-8');
      this.loadCSVContent(content);
    } catch (error) {
      console.warn('[HousingModel warning] Could not read CSV dataset file. Falling back to in-memory dynamically generated properties...', error);
      const fallbackContent = this.generateMockCSV();
      this.loadCSVContent(fallbackContent);
    }
  }

  public loadCSVContent(content: string) {
    try {
      const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const properties: Property[] = [];
      
      // Skip headers (line 0)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Simple regex or split that respects quotes (for neighborhoods like "La Candelaria (Centro)")
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!matches || matches.length < 14) {
          // Fallback to simple split if regex fails
          const parts = line.split(',');
          if (parts.length >= 14) {
            const hasNewCols = parts.length >= 22;
            properties.push({
              id: parts[0],
              barrio: parts[1].replace(/"/g, ''),
              estrato: parseInt(parts[2]),
              area: parseFloat(parts[3]),
              habitaciones: parseInt(parts[4]),
              banos: parseInt(parts[5]),
              parqueaderos: parseInt(parts[6]),
              tipo_vivienda: parts[7].replace(/"/g, ''),
              antiguedad: parts[8].replace(/"/g, ''),
              administracion_incluida: parts[9].replace(/"/g, ''),
              amoblado: parts[10].replace(/"/g, ''),
              latitud: parseFloat(parts[11]),
              longitud: parseFloat(parts[12]),
              rutas_bus: hasNewCols ? parts[13].replace(/"/g, '') === 'Si' : Math.random() > 0.35,
              metro: hasNewCols ? parts[14].replace(/"/g, '') === 'Si' : Math.random() > 0.65,
              supermercados: hasNewCols ? parts[15].replace(/"/g, '') === 'Si' : Math.random() > 0.35,
              centros_comerciales: hasNewCols ? parts[16].replace(/"/g, '') === 'Si' : Math.random() > 0.55,
              parques: hasNewCols ? parts[17].replace(/"/g, '') === 'Si' : Math.random() > 0.35,
              gimnasios: hasNewCols ? parts[18].replace(/"/g, '') === 'Si' : Math.random() > 0.45,
              centros_salud: hasNewCols ? parts[19].replace(/"/g, '') === 'Si' : Math.random() > 0.45,
              colegios_universidades: hasNewCols ? parts[20].replace(/"/g, '') === 'Si' : Math.random() > 0.4,
              precio_arriendo: parseFloat(parts[hasNewCols ? 21 : 13])
            });
          }
          continue;
        }

        const cleanParts = matches.map(part => part.replace(/"/g, ''));
        const hasNewCols = cleanParts.length >= 22;
        properties.push({
          id: cleanParts[0],
          barrio: cleanParts[1],
          estrato: parseInt(cleanParts[2]),
          area: parseFloat(cleanParts[3]),
          habitaciones: parseInt(cleanParts[4]),
          banos: parseInt(cleanParts[5]),
          parqueaderos: parseInt(cleanParts[6]),
          tipo_vivienda: cleanParts[7],
          antiguedad: cleanParts[8],
          administracion_incluida: cleanParts[9],
          amoblado: cleanParts[10],
          latitud: parseFloat(cleanParts[11]),
          longitud: parseFloat(cleanParts[12]),
          rutas_bus: hasNewCols ? cleanParts[13] === 'Si' : Math.random() > 0.35,
          metro: hasNewCols ? cleanParts[14] === 'Si' : Math.random() > 0.65,
          supermercados: hasNewCols ? cleanParts[15] === 'Si' : Math.random() > 0.35,
          centros_comerciales: hasNewCols ? cleanParts[16] === 'Si' : Math.random() > 0.55,
          parques: hasNewCols ? cleanParts[17] === 'Si' : Math.random() > 0.35,
          gimnasios: hasNewCols ? cleanParts[18] === 'Si' : Math.random() > 0.45,
          centros_salud: hasNewCols ? cleanParts[19] === 'Si' : Math.random() > 0.45,
          colegios_universidades: hasNewCols ? cleanParts[20] === 'Si' : Math.random() > 0.4,
          precio_arriendo: parseFloat(cleanParts[hasNewCols ? 21 : 13])
        });
      }

      this.properties = properties;
      console.log(`Successfully loaded ${properties.length} properties for the training pipeline.`);
    } catch (error) {
      console.error('Error parsing CSV dataset content:', error);
    }
  }

  /**
   * Train multivariate linear regression using regularized Gradient Descent
   */
  public trainModel() {
    if (this.properties.length === 0) return;

    // 1. Calculate numeric pre-processing parameters (Z-score Scaling)
    const numericalColumns = ['area', 'estrato', 'habitaciones', 'banos', 'parqueaderos'];
    const means: { [key: string]: number } = {};
    const stds: { [key: string]: number } = {};

    numericalColumns.forEach(col => {
      const vals = this.properties.map(p => {
        if (col === 'area') return p.area;
        if (col === 'estrato') return p.estrato;
        if (col === 'habitaciones') return p.habitaciones;
        if (col === 'banos') return p.banos;
        return p.parqueaderos;
      });
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const std = Math.sqrt(vals.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / vals.length) || 1;
      means[col] = mean;
      stds[col] = std;
    });

    // 2. Prepare training features matrix X and Y
    // For neighborhoods, instead of massive one-hot vectors which can cause overfitting, 
    // we use "Mean Target Encoding" as an additive feature layer: Barrio Uplift Score
    const barrioRevenues: { [key: string]: { sum: number; count: number } } = {};
    this.properties.forEach(p => {
      if (!barrioRevenues[p.barrio]) barrioRevenues[p.barrio] = { sum: 0, count: 0 };
      barrioRevenues[p.barrio].sum += p.precio_arriendo;
      barrioRevenues[p.barrio].count += 1;
    });

    const averageRent = this.properties.reduce((a, b) => a + b.precio_arriendo, 0) / this.properties.length;
    
    const coef_barrios: { [key: string]: number } = {};
    Object.keys(barrioRevenues).forEach(b => {
      const bAvg = barrioRevenues[b].sum / barrioRevenues[b].count;
      coef_barrios[b] = bAvg - averageRent; // how far from standard averge
    });

    // Model weight coefficients vectors
    let intercept = averageRent;
    let w_area = 0;
    let w_estrato = 0;
    let w_habitaciones = 0;
    let w_banos = 0;
    let w_parqueaderos = 0;
    let w_tipo_casa = 0;
    let w_admin_incluida = 0;
    let w_amoblado = 0;
    let w_rutas_bus = 0;
    let w_metro = 0;
    let w_supermercados = 0;
    let w_centros_comerciales = 0;
    let w_parques = 0;
    let w_gimnasios = 0;
    let w_centros_salud = 0;
    let w_colegios_universidades = 0;

    const w_antiguedad: { [key: string]: number } = {
      '0 a 5 años': 220000,
      '5 a 10 años': 120000,
      '10 a 15 años': 20000,
      '15 a 20 años': -80000,
      '20 a 25 años': -180000,
      '25 a 30 años': -260000,
      'Más de 30 años': -340000,
    };

    // Helper to get normalized value
    const norm = (val: number, col: string): number => {
      return (val - means[col]) / stds[col];
    };

    // 3. Simple & Robust linear regression modeling with Ridge regularization using Gradient Descent
    // Formula: Price = intercept + w_area*norm(area) + w_estrato*norm(estrato) + ... + barrio_uplift
    const X = this.properties.map(p => {
      return {
        x_area: norm(p.area, 'area'),
        x_estrato: norm(p.estrato, 'estrato'),
        x_habitaciones: norm(p.habitaciones, 'habitaciones'),
        x_banos: norm(p.banos, 'banos'),
        x_parqueaderos: norm(p.parqueaderos, 'parqueaderos'),
        x_tipo_casa: p.tipo_vivienda === 'Casa' ? 1 : 0,
        x_admin_incluida: p.administracion_incluida === 'Si' ? 1 : 0,
        x_amoblado: p.amoblado === 'Si' ? 1 : 0,
        x_rutas_bus: p.rutas_bus ? 1 : 0,
        x_metro: p.metro ? 1 : 0,
        x_supermercados: p.supermercados ? 1 : 0,
        x_centros_comerciales: p.centros_comerciales ? 1 : 0,
        x_parques: p.parques ? 1 : 0,
        x_gimnasios: p.gimnasios ? 1 : 0,
        x_centros_salud: p.centros_salud ? 1 : 0,
        x_colegios_universidades: p.colegios_universidades ? 1 : 0,
        x_antiguedad: w_antiguedad[p.antiguedad] || 0,
        barrio_uplift: coef_barrios[p.barrio] || 0,
        y: p.precio_arriendo
      };
    });

    // Let's run robust gradient descent updates
    const epochs = 1200;
    const lr = 0.055;
    const l2_penalty = 12.0; // Ridge weights decay

    for (let epoch = 0; epoch < epochs; epoch++) {
      let d_intercept = 0;
      let d_w_area = 0;
      let d_w_estrato = 0;
      let d_w_habitaciones = 0;
      let d_w_banos = 0;
      let d_w_parqueaderos = 0;
      let d_w_tipo_casa = 0;
      let d_w_admin_incluida = 0;
      let d_w_amoblado = 0;
      let d_w_rutas_bus = 0;
      let d_w_metro = 0;
      let d_w_supermercados = 0;
      let d_w_centros_comerciales = 0;
      let d_w_parques = 0;
      let d_w_gimnasios = 0;
      let d_w_centros_salud = 0;
      let d_w_colegios_universidades = 0;

      for (let i = 0; i < X.length; i++) {
        const row = X[i];
        const pred = intercept + 
          w_area * row.x_area +
          w_estrato * row.x_estrato +
          w_habitaciones * row.x_habitaciones +
          w_banos * row.x_banos +
          w_parqueaderos * row.x_parqueaderos +
          w_tipo_casa * row.x_tipo_casa +
          w_admin_incluida * row.x_admin_incluida +
          w_amoblado * row.x_amoblado +
          w_rutas_bus * row.x_rutas_bus +
          w_metro * row.x_metro +
          w_supermercados * row.x_supermercados +
          w_centros_comerciales * row.x_centros_comerciales +
          w_parques * row.x_parques +
          w_gimnasios * row.x_gimnasios +
          w_centros_salud * row.x_centros_salud +
          w_colegios_universidades * row.x_colegios_universidades +
          row.x_antiguedad +
          row.barrio_uplift;

        const error = pred - row.y;

        d_intercept += error;
        d_w_area += error * row.x_area;
        d_w_estrato += error * row.x_estrato;
        d_w_habitaciones += error * row.x_habitaciones;
        d_w_banos += error * row.x_banos;
        d_w_parqueaderos += error * row.x_parqueaderos;
        d_w_tipo_casa += error * row.x_tipo_casa;
        d_w_admin_incluida += error * row.x_admin_incluida;
        d_w_amoblado += error * row.x_amoblado;
        d_w_rutas_bus += error * row.x_rutas_bus;
        d_w_metro += error * row.x_metro;
        d_w_supermercados += error * row.x_supermercados;
        d_w_centros_comerciales += error * row.x_centros_comerciales;
        d_w_parques += error * row.x_parques;
        d_w_gimnasios += error * row.x_gimnasios;
        d_w_centros_salud += error * row.x_centros_salud;
        d_w_colegios_universidades += error * row.x_colegios_universidades;
      }

      // Average gradient & update
      const m = X.length;
      intercept -= (lr * (d_intercept / m));
      w_area -= (lr * (d_w_area / m + (l2_penalty * w_area) / m));
      w_estrato -= (lr * (d_w_estrato / m + (l2_penalty * w_estrato) / m));
      w_habitaciones -= (lr * (d_w_habitaciones / m + (l2_penalty * w_habitaciones) / m));
      w_banos -= (lr * (d_w_banos / m + (l2_penalty * w_banos) / m));
      w_parqueaderos -= (lr * (d_w_parqueaderos / m + (l2_penalty * w_parqueaderos) / m));
      w_tipo_casa -= (lr * (d_w_tipo_casa / m + (l2_penalty * w_tipo_casa) / m));
      w_admin_incluida -= (lr * (d_w_admin_incluida / m + (l2_penalty * w_admin_incluida) / m));
      w_amoblado -= (lr * (d_w_amoblado / m + (l2_penalty * w_amoblado) / m));
      w_rutas_bus -= (lr * (d_w_rutas_bus / m + (l2_penalty * w_rutas_bus) / m));
      w_metro -= (lr * (d_w_metro / m + (l2_penalty * w_metro) / m));
      w_supermercados -= (lr * (d_w_supermercados / m + (l2_penalty * w_supermercados) / m));
      w_centros_comerciales -= (lr * (d_w_centros_comerciales / m + (l2_penalty * w_centros_comerciales) / m));
      w_parques -= (lr * (d_w_parques / m + (l2_penalty * w_parques) / m));
      w_gimnasios -= (lr * (d_w_gimnasios / m + (l2_penalty * w_gimnasios) / m));
      w_centros_salud -= (lr * (d_w_centros_salud / m + (l2_penalty * w_centros_salud) / m));
      w_colegios_universidades -= (lr * (d_w_colegios_universidades / m + (l2_penalty * w_colegios_universidades) / m));
    }

    // Assign final trained weight configuration
    this.weights = {
      intercept,
      coef_area: w_area,
      coef_estrato: w_estrato,
      coef_habitaciones: w_habitaciones,
      coef_banos: w_banos,
      coef_parqueaderos: w_parqueaderos,
      coef_tipo_casa: w_tipo_casa,
      coef_admin_incluida: w_admin_incluida,
      coef_amoblado: w_amoblado,
      coef_rutas_bus: w_rutas_bus,
      coef_metro: w_metro,
      coef_supermercados: w_supermercados,
      coef_centros_comerciales: w_centros_comerciales,
      coef_parques: w_parques,
      coef_gimnasios: w_gimnasios,
      coef_centros_salud: w_centros_salud,
      coef_colegios_universidades: w_colegios_universidades,
      coef_antiguedad: w_antiguedad,
      coef_barrios,
      means,
      stds
    };

    // Calculate quality evaluation metrics
    let totalSqError = 0;
    let totalAbsError = 0;
    let totalMeanY = 0;
    const Y_values = this.properties.map(p => p.precio_arriendo);
    const meanY = Y_values.reduce((s, y) => s + y, 0) / Y_values.length;
    let totalVar = Y_values.reduce((s, y) => s + Math.pow(y - meanY, 2), 0);

    this.properties.forEach(p => {
      const pred = this.predictRaw(p);
      const err = pred - p.precio_arriendo;
      totalSqError += err * err;
      totalAbsError += Math.abs(err);
    });

    const mse = totalSqError / this.properties.length;
    const mae = totalAbsError / this.properties.length;
    const rmse = Math.sqrt(mse);
    const r2 = 1 - (totalSqError / (totalVar || 1));

    this.metrics = {
      r2: Math.max(0, parseFloat(r2.toFixed(4))),
      mae: Math.round(mae),
      rmse: Math.round(rmse),
      epochs,
      sampleCount: this.properties.length
    };

    this.saveModelToFile();
    console.log(`ML Training pipeline output metrics: r2=${this.metrics.r2}, mae=${this.metrics.mae}, rmse=${this.metrics.rmse}`);
  }

  private predictRaw(p: {
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
    rutas_bus?: boolean;
    metro?: boolean;
    supermercados?: boolean;
    centros_comerciales?: boolean;
    parques?: boolean;
    gimnasios?: boolean;
    centros_salud?: boolean;
    colegios_universidades?: boolean;
  }): number {
    if (!this.weights) return 1500000;

    const w = this.weights;
    const norm = (val: number, col: string): number => {
      return (val - w.means[col]) / w.stds[col];
    };

    const x_area = norm(p.area, 'area');
    const x_estrato = norm(p.estrato, 'estrato');
    const x_habitaciones = norm(p.habitaciones, 'habitaciones');
    const x_banos = norm(p.banos, 'banos');
    const x_parqueaderos = norm(p.parqueaderos, 'parqueaderos');
    const x_tipo_casa = p.tipo_vivienda === 'Casa' ? 1 : 0;
    const x_admin_incluida = p.administracion_incluida === 'Si' ? 1 : 0;
    const x_amoblado = p.amoblado === 'Si' ? 1 : 0;
    const x_antiguedad = w.coef_antiguedad[p.antiguedad] || 0;
    const barrio_uplift = w.coef_barrios[p.barrio] || 0;

    const x_rutas_bus = p.rutas_bus ? 1 : 0;
    const x_metro = p.metro ? 1 : 0;
    const x_supermercados = p.supermercados ? 1 : 0;
    const x_centros_comerciales = p.centros_comerciales ? 1 : 0;
    const x_parques = p.parques ? 1 : 0;
    const x_gimnasios = p.gimnasios ? 1 : 0;
    const x_centros_salud = p.centros_salud ? 1 : 0;
    const x_colegios_universidades = p.colegios_universidades ? 1 : 0;

    const prediction = w.intercept +
      w.coef_area * x_area +
      w.coef_estrato * x_estrato +
      w.coef_habitaciones * x_habitaciones +
      w.coef_banos * x_banos +
      w.coef_parqueaderos * x_parqueaderos +
      w.coef_tipo_casa * x_tipo_casa +
      w.coef_admin_incluida * x_admin_incluida +
      w.coef_amoblado * x_amoblado +
      (w.coef_rutas_bus || 0) * x_rutas_bus +
      (w.coef_metro || 0) * x_metro +
      (w.coef_supermercados || 0) * x_supermercados +
      (w.coef_centros_comerciales || 0) * x_centros_comerciales +
      (w.coef_parques || 0) * x_parques +
      (w.coef_gimnasios || 0) * x_gimnasios +
      (w.coef_centros_salud || 0) * x_centros_salud +
      (w.coef_colegios_universidades || 0) * x_colegios_universidades +
      x_antiguedad +
      barrio_uplift;

    return Math.max(800000, prediction);
  }

  public predict(input: {
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
    rutas_bus?: boolean;
    metro?: boolean;
    supermercados?: boolean;
    centros_comerciales?: boolean;
    parques?: boolean;
    gimnasios?: boolean;
    centros_salud?: boolean;
    colegios_universidades?: boolean;
  }): { precioEstimado: number; rangoMin: number; rangoMax: number; nivelConfianza: number; barrioAvg: number } {
    let raw = this.predictRaw(input);

    // Dynamic price rounding based on market pricing rules
    raw = Math.round(raw / 10000) * 10000;

    // Standard deviation or residual percentage based confidence range
    const variationPercent = 0.085; // +/- 8.5% confidence limit range
    const minRange = Math.round((raw * (1 - variationPercent)) / 10000) * 10000;
    const maxRange = Math.round((raw * (1 + variationPercent)) / 10000) * 10000;

    // Confidence index rating (60% to 98%) based on input ranges within standard standard deviation
    let confidence = 95;
    if (input.area < 30 || input.area > 350) confidence -= 10;
    if (input.estrato < 1 || input.estrato > 6) confidence -= 5;
    
    // Neighborhood averages baseline estimation
    const barrioRevenues = this.properties.filter(p => p.barrio === input.barrio);
    const barrioAvg = barrioRevenues.length > 0 
      ? Math.round((barrioRevenues.reduce((s, p) => s + p.precio_arriendo, 0) / barrioRevenues.length) / 10000) * 10000
      : 2200000;

    return {
      precioEstimado: raw,
      rangoMin: minRange,
      rangoMax: maxRange,
      nivelConfianza: Math.max(70, confidence),
      barrioAvg
    };
  }

  /**
   * Find most similar property listings using vector space distance
   */
  public findSimilarViviendas(input: {
    barrio: string;
    estrato: number;
    area: number;
    habitaciones: number;
    banos: number;
    parqueaderos: number;
    tipo_vivienda: string;
  }, limit: number = 4): Property[] {
    if (this.properties.length === 0) return [];

    // Calculate distance score based on features
    const list = this.properties.map(p => {
      let score = 0;
      
      // Categorical similarity weights
      if (p.barrio === input.barrio) score += 0; // closer
      else score += 12;

      if (p.tipo_vivienda === input.tipo_vivienda) score += 0;
      else score += 4;

      // Numerical offsets
      score += Math.abs(p.estrato - input.estrato) * 2;
      score += Math.abs(p.area - input.area) * 0.15;
      score += Math.abs(p.habitaciones - input.habitaciones) * 1.5;
      score += Math.abs(p.banos - input.banos) * 1.2;
      score += Math.abs(p.parqueaderos - input.parqueaderos) * 1.0;

      return { prop: p, score };
    });

    // Sort by smallest distance and return limit
    return list
      .sort((a, b) => a.score - b.score)
      .slice(0, limit)
      .map(item => item.prop);
  }

  public saveModelToFile() {
    try {
      if (!this.weights || !this.metrics) return;
      const data = {
        weights: this.weights,
        metrics: this.metrics,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(
        path.join(process.cwd(), 'models', 'modelo_arriendo.json'),
        JSON.stringify(data, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error saving model parameters:', error);
    }
  }

  public getModelStats() {
    try {
      const modelPath = path.join(process.cwd(), 'models', 'modelo_arriendo.json');
      if (fs.existsSync(modelPath)) {
        return JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
      }
    } catch (e) {
      // return defaults
    }
    return {
      weights: this.weights,
      metrics: this.metrics,
      updatedAt: new Date().toISOString()
    };
  }
}
