import express from "express";
import path from "path";
import * as fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { HousingModel, BARRIO_DATA, Property } from "./server/model";
import { GoogleGenAI } from "@google/genai";

// Load Environment variables from .env
dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload bounds for custom CSV data uploads
app.use(express.json({ limit: "25mb" }));

// Initialize our core Machine Learning ML module
const model = new HousingModel();

// Initialize the Google Gemini API client lazily when need to avoid start crash
let ai: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!ai && process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI:", e);
    }
  }
  return ai;
}

// Global Basic Admin Credentials (Default simplified validation)
const ADMIN_USER = "admin";
const ADMIN_PASS = "medellin2026";

// API Endpoints - Keep them FIRST before Vite middleware

// Admin Authentication check
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, token: "session-medellin-arriendo-2026-auth" });
  } else {
    res.status(401).json({ success: false, error: "Credenciales de administrador incorrectas" });
  }
});

// Primary Predict Endpoint with Dynamic ML Calculation + Gemini Expert Opinion
app.post("/api/predict", async (req, res) => {
  try {
    const {
      barrio,
      estrato,
      area,
      habitaciones,
      banos,
      parqueaderos,
      tipo_vivienda,
      antiguedad,
      administracion_incluida,
      amoblado,
      rutas_bus,
      metro,
      supermercados,
      centros_comerciales,
      parques,
      gimnasios,
      centros_salud,
      colegios_universidades,
      generateAI,
    } = req.body;

    // Validate inputs
    if (!barrio || !estrato || !area || !habitaciones || !banos || !tipo_vivienda || !antiguedad) {
      return res.status(400).json({ error: "Faltan parámetros obligatorios de la vivienda." });
    }

    const inputData = {
      barrio,
      estrato: Number(estrato),
      area: Number(area),
      habitaciones: Number(habitaciones),
      banos: Number(banos),
      parqueaderos: Number(parqueaderos || 0),
      tipo_vivienda,
      antiguedad,
      administracion_incluida: administracion_incluida || "No",
      amoblado: amoblado || "No",
      rutas_bus: !!rutas_bus,
      metro: !!metro,
      supermercados: !!supermercados,
      centros_comerciales: !!centros_comerciales,
      parques: !!parques,
      gimnasios: !!gimnasios,
      centros_salud: !!centros_salud,
      colegios_universidades: !!colegios_universidades,
    };

    // Calculate valuation via ML model
    const predictionResults = model.predict(inputData);

    // Find statistically similar properties nearby (Peer listings)
    const similarViviendas = model.findSimilarViviendas(inputData, 5);

    // Call Gemini to generate a professional Analyst paragraph in Spanish
    let aiReport = "";
    let isGemini = false;
    let quotaExceeded = false;
    const aiClient = getGeminiClient();

    if (generateAI && aiClient) {
      try {
        const prompt = `Actúa como un experto consultor inmobiliario especializado en el mercado de arriendos en Medellín, Colombia.
Genera un análisis profesional, conciso y valioso de la siguiente propiedad evaluada:
- Barrio/Sector: ${barrio}
- Estrato: ${estrato}
- Tipo: ${tipo_vivienda}
- Área: ${area} m²
- Habitaciones: ${habitaciones}
- Baños: ${banos}
- Parqueaderos: ${parqueaderos}
- Antigüedad: ${antiguedad}
- Administración Incluida: ${administracion_incluida}
- Amoblada: ${amoblado}
- Zonas de interés cercanas (a menos de 10 cuadras): ${[
          rutas_bus ? "Rutas de buses" : "",
          metro ? "Estación de metro" : "",
          supermercados ? "Supermercados" : "",
          centros_comerciales ? "Centros comerciales" : "",
          parques ? "Parques y zonas verdes" : "",
          gimnasios ? "Gimnasios" : "",
          centros_salud ? "Centros de salud / Clínicas" : "",
          colegios_universidades ? "Colegios y universidades" : ""
        ].filter(Boolean).join(", ") || "Sin zonas de interés cercanas destacadas"}

Nuestra estimación del algoritmo de Machine Learning de la plataforma predijo un valor de: $${predictionResults.precioEstimado.toLocaleString('es-CO')} COP mensuales (rango estimado entre $${predictionResults.rangoMin.toLocaleString('es-CO')} COP y $${predictionResults.rangoMax.toLocaleString('es-CO')} COP) con un nivel de confianza de ${predictionResults.nivelConfianza}%. El promedio general de arriendo para propiedades en ${barrio} es de $${predictionResults.barrioAvg.toLocaleString('es-CO')} COP.

Escribe un reporte de 2 a 3 párrafos en español que justifique esta tasación en el mercado actual de Medellín. Incluye:
1. Las ventajas específicas de este sector (Medellín/Zonas) y la relación de este precio con el estrato y tamaño del inmueble, mencionando específicamente el valor agregado de tener comodidades y zonas de interés cercanas como transporte, parques, supermercados o gimnasios (si están marcados como cercanos).
2. Comportamiento y consejos breves para el propietario (si desea arrendarlo rápido) o para el inquilino (para saber si es un trato justo).
3. Estructura el párrafo de forma amigable y profesional. No inventes datos técnicos falsos del sistema. No uses títulos dramáticos.`;

        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });

        if (response && response.text) {
          aiReport = response.text;
          isGemini = true;
        }
      } catch (gemError: any) {
        console.warn("[Gemini API Client warning/quota reached, falling back gracefully to local expert report engine]");
        if (gemError && gemError.message && (gemError.message.includes("429") || gemError.message.includes("quota"))) {
          quotaExceeded = true;
        }
      }
    }

    // Default expert opinion fallback if Gemini is offline/not configured/quota reached/skipped
    if (!aiReport) {
      const amenitiesList = [
        rutas_bus ? "Rutas de Buses" : "",
        metro ? "Estación de Metro" : "",
        supermercados ? "Supermercados" : "",
        centros_comerciales ? "Centros Comerciales" : "",
        parques ? "Parques y Áreas Verdes" : "",
        gimnasios ? "Gimnasios" : "",
        centros_salud ? "Centros de Salud" : "",
        colegios_universidades ? "Colegios y/o Universidades" : ""
      ].filter(Boolean);

      const pricePerSqm = Math.round(predictionResults.precioEstimado / area);
      const comparisonText = predictionResults.precioEstimado > predictionResults.barrioAvg 
        ? `un valor de $${pricePerSqm.toLocaleString('es-CO')} COP por metro cuadrado, posicionándose por encima del promedio general de arriendo en ${barrio} ($${predictionResults.barrioAvg.toLocaleString('es-CO')} COP mensuales). Esto se justifica habitualmente por el estrato alto (${estrato}) y la combinación de comodidades que optimizan el uso de los espacios.`
        : `un valor de $${pricePerSqm.toLocaleString('es-CO')} COP por metro cuadrado, siendo una opción sumamente competitiva e idónea en comparación con el promedio general de arriendo de ${barrio} ($${predictionResults.barrioAvg.toLocaleString('es-CO')} COP mensuales).`;

      const amenitiesText = amenitiesList.length > 0
        ? `La vivienda cuenta con una excelente conectividad urbana al tener acceso a no más de 10 cuadras de: ${amenitiesList.join(", ")}. Esta proximidad de servicios robustece de manera sustancial la plusvalía de la propiedad, reduciendo los tiempos de traslado vial diario y facilitando el esparcimiento o el abastecimiento comercial.`
        : "La ubicación de la propiedad ofrece un entorno residencial más privado, apacible y sereno, ideal para quienes priorizan el descanso de la actividad comercial regular.";

      const furnishingNote = amoblado === 'Si' 
        ? "La modalidad de arriendo amoblado representa un incremento significativo en el canon (+35% de prima), una tasa estándar atractiva y de altísima rotación orientada a perfiles corporativos o turistas internacionales."
        : "Al ofertarse sin amoblar, la vivienda se alinea con contratos de larga estadía clásicos medellinenses, minimizando la rotación interna y simplificando el mantenimiento físico del mobiliario.";

      aiReport = `Análisis de Tasación en Medellín (Vivero de Datos Local)
La propiedad tipo ${tipo_vivienda} en el sector de ${barrio} cuenta con ${comparisonText} ${furnishingNote}

Impacto de Entorno y Conectividad Cercana (≤ 10 Cuadras)
${amenitiesText} Disponer de facilidades como estaciones del Metro de Medellín o rutas integradas acelera la absorción en el mercado de arrendamiento tradicional.

Recomendaciones de Mercado:
- Propietario: Para alquilar con rapidez, fije el canon inicial más cercano al rango bajo ($${predictionResults.rangoMin.toLocaleString('es-CO')} COP). Si busca maximizar rentabilidad y la conservación de acabados es impecable, apunte al rango alto.
- Inquilino: El precio es coherente con el inventario de ${barrio}, reflejando un balance adecuado entre el estrato ${estrato} y la accesibilidad geográfica que posee la urbanización en este cuadrante.`;
    }

    res.json({
      ...predictionResults,
      aiReport,
      isGemini,
      quotaExceeded,
      similarViviendas,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error procesando la predicción" });
  }
});

// Get statistical summaries and maps trends data for Dashboard
app.get("/api/stats", (req, res) => {
  try {
    const properties = model.properties;
    if (properties.length === 0) {
      return res.json({ success: false, message: "No hay datos cargados" });
    }

    // Average price by Neighborhood
    const neighborhoodAverages: { [key: string]: { sum: number; count: number; lat: number; lng: number } } = {};
    properties.forEach(p => {
      if (!neighborhoodAverages[p.barrio]) {
        // Find default coordinates
        const def = BARRIO_DATA[p.barrio] || { lat: 6.25, lng: -75.57 };
        neighborhoodAverages[p.barrio] = { sum: 0, count: 0, lat: def.lat, lng: def.lng };
      }
      neighborhoodAverages[p.barrio].sum += p.precio_arriendo;
      neighborhoodAverages[p.barrio].count += 1;
    });

    const averagePerBarrio = Object.keys(neighborhoodAverages).map(b => {
      const item = neighborhoodAverages[b];
      return {
        barrio: b,
        promedio: Math.round(item.sum / item.count),
        conteo: item.count,
        latitud: item.lat,
        longitud: item.lng
      };
    }).sort((a, b) => b.promedio - a.promedio);

    // Distribution profile by Estrato
    const estratoPriceDistribution: { [key: number]: { sum: number; count: number } } = {};
    properties.forEach(p => {
      if (!estratoPriceDistribution[p.estrato]) {
        estratoPriceDistribution[p.estrato] = { sum: 0, count: 0 };
      }
      estratoPriceDistribution[p.estrato].sum += p.precio_arriendo;
      estratoPriceDistribution[p.estrato].count += 1;
    });

    const estratoData = Object.keys(estratoPriceDistribution).map(e_str => {
      const e = Number(e_str);
      const item = estratoPriceDistribution[e];
      return {
        estrato: e,
        promedioPrice: Math.round(item.sum / item.count),
        count: item.count
      };
    }).sort((a, b) => a.estrato - b.estrato);

    // Price distribution histogram (bins of 500,000 COP)
    const priceBins: { [key: string]: number } = {
      "Menos de $1M": 0,
      "$1M a $1.5M": 0,
      "$1.5M a $2M": 0,
      "$2M a $3M": 0,
      "$3M a $5M": 0,
      "Más de $5M": 0
    };

    properties.forEach(p => {
      const pr = p.precio_arriendo;
      if (pr < 1000000) priceBins["Menos de $1M"]++;
      else if (pr < 1500000) priceBins["$1M a $1.5M"]++;
      else if (pr < 2000000) priceBins["$1.5M a $2M"]++;
      else if (pr < 3000000) priceBins["$2M a $3M"]++;
      else if (pr < 5000000) priceBins["$3M a $5M"]++;
      else priceBins["Más de $5M"]++;
    });

    const distributionHistogram = Object.keys(priceBins).map(key => ({
      rango: key,
      cantidad: priceBins[key]
    }));

    // Area vs Price trend samples
    const areaVsPricePoints = properties
      .slice(0, 100) // sample 100 to stay performant
      .map(p => ({
        area: p.area,
        precio: p.precio_arriendo,
        barrio: p.barrio,
        estrato: p.estrato
      }));

    res.json({
      totalInmuebles: properties.length,
      averagePerBarrio,
      estratoData,
      distributionHistogram,
      areaVsPricePoints,
      barrioBaselines: BARRIO_DATA
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Model status parameters (r2, coefficients, timestamp)
app.get("/api/model/stats", (req, res) => {
  try {
    const stats = model.getModelStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger training routine on demand
app.post("/api/model/retrain", (req, res) => {
  try {
    const token = req.headers.authorization;
    if (token !== "session-medellin-arriendo-2026-auth") {
      return res.status(403).json({ error: "Acceso denegado. Se requiere autenticación." });
    }

    model.trainModel();
    const stats = model.getModelStats();
    res.json({ success: true, message: "Modelo reentrenado con éxito en base al dataset activo.", stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload a completely new CSV property dataset
app.post("/api/model/upload", (req, res) => {
  try {
    const token = req.headers.authorization;
    if (token !== "session-medellin-arriendo-2026-auth") {
      return res.status(403).json({ error: "Acceso denegado. Se requiere autenticación." });
    }

    const { csvContent } = req.body;
    if (!csvContent || typeof csvContent !== "string") {
      return res.status(400).json({ error: "Contenido CSV inválido o vacío." });
    }

    const csvPath = path.join(process.cwd(), "datasets", "propiedades_medellin.csv");
    fs.writeFileSync(csvPath, csvContent, "utf-8");

    // Load CSV and immediately train ML model
    model.loadCSV(csvPath);
    model.trainModel();

    const stats = model.getModelStats();

    res.json({
      success: true,
      message: `¡Se cargó el dataset con éxito! Modelo entrenado sobre ${model.properties.length} registros.`,
      stats
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Download full CSV dataset report or training report logs
app.get("/api/model/report", (req, res) => {
  try {
    const csvPath = path.join(process.cwd(), "datasets", "propiedades_medellin.csv");
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ error: "Reporte de datos ausente." });
    }
    const fileContent = fs.readFileSync(csvPath, "utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=propiedades_arriendo_medellin.csv");
    res.setHeader("Content-Type", "text/csv");
    res.send(fileContent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Download mathematical weights configurations as JSON report
app.get("/api/model/export", (req, res) => {
  try {
    const jsonPath = path.join(process.cwd(), "models", "modelo_arriendo.json");
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({ error: "Modelo no entrenado actualmente." });
    }
    const fileContent = fs.readFileSync(jsonPath, "utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=modelo_arriendo_medellin.json");
    res.setHeader("Content-Type", "application/json");
    res.send(fileContent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  // Vite integration middleware setup for hot React rendering
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express] Medellín Housing ML server boot success at port ${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL && !process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer();
}
