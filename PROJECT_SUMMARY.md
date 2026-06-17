# Portal Escolar - Colegio Montahue 🏫

Este es el portal escolar para el **Colegio Montahue**, diseñado para conectar a apoderados, docentes y administradores. La aplicación permite hacer seguimiento de calificaciones (notas), asistencia, agenda escolar (calendario, tareas y pruebas), solicitudes de trámites/certificados y mensajería/avisos de comunicación.

---

## 🚀 Tecnologías Principales

- **Frontend**: React 18, Vite 8, TypeScript 5, React Router 7.
- **Estilos**: Tailwind CSS 3 (tema personalizado con paleta forest/verde oscuro, accesibilidad WCAG de 44px de toque mínimo, y efectos de glassmorphism).
- **Animaciones**: Motion (framer-motion).
- **Backend & DB**: Firebase v12 (Firebase Auth, Cloud Firestore, Cloud Storage).
- **Herramientas de Calidad**: ESLint 9, Prettier 3, Vitest, Husky.
- **Gráficos**: Recharts (para estadísticas de asistencia y rendimiento).
- **Exportación**: jsPDF (para generación de certificados en trámites).

---

## 📂 Estructura del Proyecto

El código fuente se encuentra estructurado de la siguiente forma dentro de `src/`:

```bash
src/
├── components/         # Componentes globales y de diseño
│   ├── layout/         # Layouts de la app (AppLayout, AuthLayout)
│   └── ui/             # Componentes básicos reutilizables (Botones, Skeleton, inputs, etc.)
├── context/            # Contextos de estado global
│   └── AuthContext.tsx # Gestión de sesión de Firebase, expiración de sesión y cambio de rol
├── features/           # Módulos y funcionalidades de negocio
│   ├── admin/          # Panel de administración, sembrado de datos (SeedPage) y gestión de usuarios
│   ├── agenda/         # Calendario escolar, asignaturas, eventos, tareas y exámenes
│   ├── asistencia/     # Registro de asistencia mensual y modal de justificación de inasistencias
│   ├── auth/           # Login, recuperar contraseña, y cambio de contraseña
│   ├── comunicacion/   # Mensajería interna, avisos críticos e informativos
│   ├── notas/          # Visualización de calificaciones y cálculo de promedios por asignatura
│   └── tramites/       # Solicitudes de certificados y descargas (e.g., Alumno Regular)
├── lib/                # Configuración de clientes SDK externos
│   └── firebase.ts     # Inicialización de Firebase App, Auth, Firestore y Storage
├── routes/             # Enrutamiento de la aplicación
│   ├── AppRouter.tsx   # Enrutador principal (React Router dom 7) con Lazy Loading
│   └── ProtectedRoute.tsx # Guardias de ruta por autenticación y roles
├── services/           # Peticiones genéricas y servicios globales
├── types/              # Definición de interfaces TypeScript
│   └── index.ts        # Modelos principales (Usuario, Alumno, Nota, Evento, etc.)
└── utils/              # Funciones auxiliares y formateadores
```

---

## 🗄️ Modelos de Datos (Colecciones Firestore)

La base de datos Firestore se organiza en las siguientes colecciones clave:

1. **`usuarios`**:
   - `uid`: ID único de Firebase Auth.
   - `nombre`, `email`.
   - `rol`: `'apoderado' | 'docente' | 'admin' | 'administrativo'`.
   - `cursos`: Arreglo de IDs de cursos asociados (ej: `['1-medio-a']`).
   - `alumnos`: Arreglo de IDs de alumnos a cargo (ej: `['alumno-1']`).
   - `primerLogin`: Booleano para forzar cambio de contraseña.
   
2. **`alumnos`**:
   - `id`: Identificador del alumno.
   - `nombre`, `rut`, `foto`.
   - `cursoId`: ID del curso al que pertenece.
   - `apoderados`: Arreglo de UIDs de usuarios con rol de apoderado.

3. **`cursos`**:
   - `id` (ej: `'1-medio-a'`).
   - `nombre` (ej: `'1° Medio A'`), `nivel`.
   - `alumnos`: IDs de alumnos matriculados.
   - `docentes`: UIDs de docentes asociados.

4. **`notas`**:
   - Calificaciones individuales de alumnos asociadas a asignaturas y evaluaciones.

5. **`asistencia`**:
   - Registros diarios de asistencia (`presente`, `ausente`, `tardanza`) con justificaciones opcionales adjuntas.

6. **`mensajes` / `avisos`**:
   - Comunicación interna entre docentes y apoderados, y avisos masivos a la comunidad escolar.

7. **`documentos`**:
   - Solicitudes de trámites como certificados de alumno regular o autorizaciones.

---

## 🔑 Configuración del Entorno (`.env`)

El archivo `.env` en la raíz contiene las credenciales de Firebase del proyecto:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=portalescolar-3012f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=portalescolar-3012f
VITE_FIREBASE_STORAGE_BUCKET=portalescolar-3012f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=590165166424
VITE_FIREBASE_APP_ID=1:590165166424:web:...
VITE_FIREBASE_MEASUREMENT_ID=G-...
VITE_SESSION_TIMEOUT_MINUTES=30
VITE_APP_NAME=Portal Escolar Colegio Montahue
VITE_APP_URL=http://localhost:3009
```

---

## 🛡️ Características Especiales

1. **Simulación de Cambio de Rol**: 
   - El usuario `diemoroy@gmail.com` tiene la capacidad única en `AuthContext.tsx` de cambiar de rol (`admin`, `docente`, `apoderado`) desde la interfaz para facilitar pruebas de roles y desarrollo.
2. **Emulación de Base de Datos**: 
   - Soporte para emuladores locales de Firebase si `VITE_USE_EMULATORS` es `'true'`.
3. **Cierre de Sesión por Inactividad**: 
   - Monitoreo de eventos de usuario (mouse, teclado, scroll) que reinicia un temporizador configurado (por defecto 30 minutos). Si expira, el usuario es deslogueado automáticamente.
4. **PWA (Progressive Web App)**: 
   - Configurado con `vite-plugin-pwa` y Workbox en `src/sw.ts` para funcionamiento offline.
