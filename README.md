# ValuArriendo Medellín - Plataforma Inteligente Inmobiliaria

Plataforma full-stack con algoritmos de **Machine Learning de Regresión Multivariable (Ridge Regularization)** entrenados en tiempo real para predecir, valuar y analizar cánones de arrendamiento en la ciudad de Medellín, Colombia. Cuenta con retroalimentación y reportes de opinión de expertos potenciados por **Google Gemini API**.

---

## 🚀 Arquitectura Técnica y Características

- **Frontend**: SPA reactiva construida sobre **React 19**, **Vite**, **Tailwind CSS**, animación fluida con **motion/react** e iconografía de **Lucide React**. Se implementan gráficos interactivos con **Recharts** para representar la dispersión de precios, distribución por estratos y mapas térmicos locales.
- **Backend**: Servidor **Express.js** en TypeScript con soporte dual para ejecución de desarrollo/producción tradicional (`startServer`) y compatibilidad serverless optimizada para despliegues en la nube (**Vercel** y **Netlify**).
- **Machine Learning Engine**: Implementación matemática nativa en TypeScript de un modelo de regresión lineal multivariable con regularización Ridge y codificación por promedio de la variable objetivo (*Mean Target Encoding*) para los barrios de Medellín. Posee un pipeline de reentrenamiento bajo demanda administrado desde un panel de control seguro.
- **AI Specialist Opinion**: Integración del moderno SDK `@google/genai` de Google para generar análisis descriptivos contextuales automáticos en es-CO con el modelo `gemini-3.5-flash`.

---

## 🛠️ Requisitos de Variables de Entorno

Para habilitar el análisis de Inteligencia Artificial mediante Gemini, declare la siguiente variable en su proveedor de hosting o archivo `.env`:

```env
GEMINI_API_KEY=tu_api_key_de_google_ai_studio
```

---

## 📦 Instrucciones para Despliegue Exitoso

### Opción 1: Despliegue en Vercel (Recomendado)

El proyecto está 100% preconfigurado con `vercel.json` y soporte serverless.

1. Conecte su repositorio de GitHub a **Vercel**.
2. Vercel detectará el archivo de configuración automáticamente.
3. Configure las variables de entorno:
   - Añada `GEMINI_API_KEY` con su clave de Google AI Studio.
4. Haga clic en **Deploy**. El frontend de React se servirá de forma estática en la CDN global de Vercel y toda la lógica del backend de Express (`/api/*`) será enrutada automáticamente a funciones serverless basadas en Node `/api/index.ts`.

### Opción 2: Despliegue en Netlify

El proyecto incluye soporte serverless nativo para Netlify y funciones integradas mediante `netlify/functions/api.ts`.

1. Conecte su repositorio de GitHub a **Netlify**.
2. Use la siguiente configuración en la interfaz de Netlify si es necesario (generalmente se lee automáticamente de la raíz en `netlify.toml`):
   - **Build Command**: `npm run build`
   - **Publish directory**: `dist`
3. Configure su variable de entorno `GEMINI_API_KEY` en la sección "Environment Variables" de la configuración de su sitio en Netlify.
4. Guarde y despliegue. Las llamadas a `/api/*` serán redirigidas de forma interna a la función serverless de Netlify (`/.netlify/functions/api`).

---

## 💻 Desarrollo Local

Para correr e iterar sobre el proyecto localmente, ejecute:

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo (con soporte de middleware Vite)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) en su navegador web.

---

## 🧪 Estructura de Rutas de la API

Express.js enruta y procesa las siguientes rutas dinámicas:
- `POST /api/predict` - Realiza predicciones y genera opcionalmente un reporte con IA.
- `GET /api/stats` - Recupera estadísticas descriptivas generales para el dashboard de Recharts.
- `GET /api/model/stats` - Obtiene las métricas de calidad de entrenamiento activo (R², MAE, RMSE, pesos).
- `POST /api/model/retrain` - Reentrena el modelo matemático Ridge a partir de la caché de datos.
- `POST /api/model/upload` - Carga un archivo CSV personalizado para actualizar la base de datos de entrenamiento.
- `GET /api/model/report` - Descarga el dataset consolidado en formato CSV.
- `GET /api/model/export` - Exporta la configuración de coeficientes matriciales y escalamiento Z-score en JSON.

---

Desarrollado con pasión, alta ingeniería y precisión técnica para el mercado de arriendos de Medellín, Antioquia. 🇨🇴
