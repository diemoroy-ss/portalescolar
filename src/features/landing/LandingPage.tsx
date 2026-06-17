import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedCounter } from './components/AnimatedCounter';
import { ModuleCard } from './components/ModuleCard';

// Iconos SVG Limpios e Inline
const LogoIcon = () => (
  <svg className="h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const GradeIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);

const MessageIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const HeartIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751A11.956 11.956 0 0 1 12 2.714Z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const WhatsappIcon = () => (
  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.45 5.548 0 10.063-4.515 10.066-10.066.002-2.69-1.045-5.216-2.948-7.12C16.678 1.513 14.156.467 11.474.467c-5.552 0-10.069 4.518-10.072 10.07-.001 1.893.501 3.73 1.456 5.372l-1.018 3.715 3.81-.998zm11.758-7.533c-.328-.164-1.94-.957-2.24-1.066-.3-.11-.518-.164-.737.164-.218.328-.847 1.066-1.038 1.284-.19.219-.382.246-.71.082-.328-.164-1.386-.51-2.64-1.627-.975-.87-1.633-1.946-1.824-2.274-.19-.328-.02-.505.143-.668.148-.147.328-.382.492-.573.164-.19.219-.328.328-.546.11-.219.055-.41-.027-.573-.082-.164-.738-1.777-1.01-2.434-.266-.64-.56-.552-.767-.563-.197-.01-.42-.01-.643-.01-.224 0-.59.084-.9.424-.309.339-1.18 1.155-1.18 2.812 0 1.657 1.202 3.258 1.366 3.477.164.218 2.365 3.611 5.729 5.06 3.364 1.45 3.364.966 3.974.906.61-.06 1.94-.792 2.213-1.529.273-.737.273-1.366.19-1.5-.081-.132-.272-.214-.6-.378z" />
  </svg>
);

// Componente Acordeón reutilizable para mobile
const AccordionItem: React.FC<{
  number: string;
  title: string;
  items: string[];
  defaultOpen?: boolean;
}> = ({ number, title, items, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-surface-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left bg-surface-card/50 hover:bg-surface-1/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-xl bg-primary-950/50 text-primary-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {number}
          </div>
          <span className="font-heading font-bold text-base text-neutral-100">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-neutral-400 flex-shrink-0 ml-2"
        >
          <ChevronDownIcon />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <ul className="space-y-2 text-neutral-400 text-sm px-5 pb-5 pt-3 border-t border-surface-border">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-primary-400 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const whatsappUrl = "https://wa.me/56900000000?text=Hola,%20me%20interesa%20agendar%20una%20demostraci%C3%B3n%20de%20Portal%20Escolar.";

  const modules = [
    {
      title: 'Agenda Académica',
      description: 'Calendario unificado con evaluaciones, eventos y reuniones de apoderados en un solo lugar.',
      icon: <CalendarIcon />,
    },
    {
      title: 'Notas y Asistencia',
      description: 'Calificaciones y asistencia en tiempo real para que los apoderados estén siempre informados.',
      icon: <GradeIcon />,
    },
    {
      title: 'Comunicación Oficial',
      description: 'Comunicados escolares con confirmación de lectura integrada, sin pérdida de información.',
      icon: <MessageIcon />,
    },
    {
      title: 'Trámites y Matrículas',
      description: 'Autorizaciones digitales y certificados en línea sin necesidad de visitar el colegio.',
      icon: <DocumentIcon />,
    },
    {
      title: 'Bienestar y Convivencia',
      description: 'Seguimiento socioemocional y alertas de convivencia para un acompañamiento oportuno.',
      icon: <HeartIcon />,
    },
    {
      title: 'Panel de Administración',
      description: 'Métricas clave, analíticas de participación y control total del establecimiento.',
      icon: <ShieldIcon />,
    },
  ];

  const beneficiosData = [
    {
      number: '1',
      title: 'Comunicación más Efectiva',
      items: [
        'Menos correos masivos redundantes.',
        'Disminución de llamadas innecesarias.',
        'Tasa de confirmación de lectura medible.',
        'Mayor participación de las familias.',
      ],
    },
    {
      number: '2',
      title: 'Menos Carga Administrativa',
      items: [
        'Certificados y emisión de documentos en línea.',
        'Autorizaciones y firmas digitales.',
        'Historial de trámites automatizado.',
        'Menor congestión en atención presencial.',
      ],
    },
    {
      number: '3',
      title: 'Familias más Involucradas',
      items: [
        'Seguimiento fluido del rendimiento académico.',
        'Alertas de inasistencias en el mismo día.',
        'Comunicación directa y estructurada con docentes.',
        'Mayor apoyo familiar en el proceso escolar.',
      ],
    },
  ];


  return (
    <div className="min-h-screen bg-surface text-neutral-100 selection:bg-primary-500 selection:text-white relative overflow-hidden font-sans">
      {/* Patrón de puntos de fondo */}
      <div className="absolute inset-0 bg-dot-pattern bg-dot-sm opacity-5 pointer-events-none" />
      <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none" />

      {/* Header Fijo */}
      <header className="sticky top-0 z-50 w-full border-b border-surface-border bg-surface/80 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoIcon />
            <span className="font-heading font-bold text-lg tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-200 bg-clip-text text-transparent">
              Portal Escolar
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <a href="#solucion" className="hover:text-primary-400 transition-colors">La Solución</a>
            <a href="#modulos" className="hover:text-primary-400 transition-colors">Módulos</a>
            <a href="#beneficios" className="hover:text-primary-400 transition-colors">Beneficios</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-neutral-300 hover:text-white px-3 py-2 rounded-xl transition-all"
            >
              Ingresar
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold h-10 px-4 rounded-xl transition-all shadow-glow-green cursor-pointer"
            >
              <WhatsappIcon />
              <span className="hidden sm:inline">Demo</span>
              <span className="sm:hidden">Demo</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section — compacto en mobile */}
      <section className="relative pt-16 pb-14 md:pt-28 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-88 h-88 bg-gradient-radial from-primary-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-950/45 border border-primary-800/30 text-primary-400 text-xs font-semibold uppercase tracking-wider mb-5"
          >
            <span>Propuesta Comercial 2026</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl text-neutral-50 tracking-tight leading-none mb-5"
          >
            Portal Escolar <br />
            <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-accent-light bg-clip-text text-transparent">
              para Apoderados
            </span>
          </motion.h1>

          {/* Subtítulo: corto en mobile, completo en desktop */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-xl text-neutral-400 font-normal leading-relaxed max-w-2xl mx-auto mb-8"
          >
            <span className="md:hidden">
              Menos correos, menos llamadas. Más participación y familias conectadas.
            </span>
            <span className="hidden md:inline">
              Transformando la comunicación entre el colegio y las familias. Una solución que mejora la experiencia, reduce tareas administrativas y fortalece la participación activa de los apoderados.
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-500 text-white font-bold h-12 px-8 rounded-2xl transition-all shadow-glow-green text-base w-full sm:w-auto cursor-pointer"
            >
              <WhatsappIcon />
              Agendar Demostración
            </a>
            <a
              href="#modulos"
              className="inline-flex items-center justify-center bg-surface-1 hover:bg-surface-2 border border-surface-border text-neutral-200 font-semibold h-12 px-8 rounded-2xl transition-all text-base w-full sm:w-auto"
            >
              Ver módulos
            </a>
          </motion.div>
        </div>

        {/* Mockup: oculto en mobile, visible en desktop */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="hidden md:block mt-16 max-w-5xl mx-auto rounded-3xl overflow-hidden border border-surface-border bg-surface-card/60 backdrop-blur-sm p-3 shadow-2xl relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent z-10 pointer-events-none" />
          <div className="aspect-[16/9] w-full rounded-2xl bg-gradient-to-br from-surface-2 to-surface-card flex items-center justify-center overflow-hidden border border-surface-border relative">
            <div className="absolute top-6 left-6 p-4 rounded-2xl bg-surface-1/80 border border-surface-border/50 max-w-xs shadow-card backdrop-blur-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-2 w-2 rounded-full bg-primary-400 animate-pulse" />
                <span className="text-xs font-semibold text-primary-400">Último Comunicado</span>
              </div>
              <p className="text-sm font-medium text-neutral-200">Reunión general programada para este viernes.</p>
              <div className="mt-3 flex items-center justify-between text-2xs text-neutral-500">
                <span>Leído por el 96%</span>
                <span>Hace 10 min</span>
              </div>
            </div>
            <div className="absolute bottom-12 right-6 p-4 rounded-2xl bg-surface-1/80 border border-surface-border/50 max-w-xs shadow-card backdrop-blur-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-2 w-2 rounded-full bg-accent-light" />
                <span className="text-xs font-semibold text-accent-light">Calificaciones</span>
              </div>
              <p className="text-sm font-medium text-neutral-200">Nueva nota en Lenguaje: <span className="text-primary-400 font-bold">6.8</span></p>
              <div className="mt-2 text-2xs text-neutral-500">
                <span>Apoderado notificado al instante</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
              <div className="h-16 w-16 rounded-full bg-primary-950/50 border border-primary-500/20 flex items-center justify-center text-primary-400 text-2xl font-bold shadow-glow-green">✓</div>
              <h4 className="font-heading font-bold text-xl text-neutral-100">Portal Escolar en Acción</h4>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Una interfaz moderna que mantiene a toda la comunidad escolar conectada sin intermediarios.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats — compactas en mobile (2×2 horizontal con padding reducido) */}
      <section className="py-10 md:py-20 bg-surface-1/40 border-y border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Título problemática: solo en desktop */}
          <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-400">La Realidad Actual</span>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-neutral-50 mt-3 mb-6 leading-tight">
                La comunicación escolar tradicional está rota
              </h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 rounded-xl bg-danger-900/20 text-danger-500 border border-danger-500/10">⚠️</div>
                  <div>
                    <h4 className="text-neutral-200 font-bold text-base">Sobrecarga de correos redundantes</h4>
                    <p className="text-neutral-400 text-sm mt-1">Más del 70% de los correos respondidos corresponden a información que ya fue enviada previamente.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 rounded-xl bg-danger-900/20 text-danger-500 border border-danger-500/10">⚠️</div>
                  <div>
                    <h4 className="text-neutral-200 font-bold text-base">Apoderados desconectados</h4>
                    <p className="text-neutral-400 text-sm mt-1">Menos del 30% revisa oportunamente los comunicados tradicionales y más del 90% silencia los grupos de WhatsApp.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 grid grid-cols-2 gap-6">
              {[
                { prefix: '-', value: 80, label: 'Correos Masivos', desc: 'Menos saturación de bandejas de entrada.' },
                { prefix: '-', value: 70, label: 'Tiempo Admin.', desc: 'Reducción en trámites y solicitudes recurrentes.' },
                { prefix: '+', value: 40, label: 'Participación', desc: 'Más respuestas a encuestas y asistencia a reuniones.' },
                { prefix: '-', value: 60, label: 'Llamadas', desc: 'Menos consultas informativas por teléfono.' },
              ].map(({ prefix, value, label, desc }) => (
                <div key={label} className="p-8 rounded-3xl bg-surface-card border border-surface-border flex flex-col justify-between">
                  <span className="text-primary-400 font-heading font-bold text-4xl lg:text-5xl block mb-2">
                    {prefix}<AnimatedCounter value={value} suffix="%" />
                  </span>
                  <div>
                    <h4 className="text-neutral-200 font-bold mb-1">{label}</h4>
                    <p className="text-neutral-400 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: stats compactas en grilla 2×2 */}
          <div className="md:hidden">
            <h2 className="font-heading font-bold text-2xl text-neutral-50 text-center mb-6">
              Resultados <span className="text-primary-400">comprobados</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { prefix: '-', value: 80, label: 'Correos masivos' },
                { prefix: '-', value: 70, label: 'Carga admin.' },
                { prefix: '+', value: 40, label: 'Participación' },
                { prefix: '-', value: 60, label: 'Llamadas' },
              ].map(({ prefix, value, label }) => (
                <div key={label} className="p-4 rounded-2xl bg-surface-card border border-surface-border text-center">
                  <span className="text-primary-400 font-heading font-bold text-3xl block mb-1">
                    {prefix}<AnimatedCounter value={value} suffix="%" />
                  </span>
                  <p className="text-neutral-400 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Solución: 3 pilares — horizontal en mobile */}
      <section id="solucion" className="py-14 md:py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-400">La Solución</span>
          <h2 className="font-heading font-bold text-2xl sm:text-4xl text-neutral-50 mt-3 mb-3">
            Un Portal Centralizado
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed hidden sm:block">
            Cada apoderado accede a información relevante de sus hijos, mientras el colegio reduce drásticamente su carga administrativa.
          </p>
        </div>

        {/* Mobile: lista compacta. Desktop: grilla de 3 */}
        <div className="flex flex-col sm:hidden gap-3">
          {[
            { emoji: '⚡', title: 'Acceso 24/7 y Multidispositivo', desc: 'Web y móvil, disponible en cualquier momento.' },
            { emoji: '📊', title: 'Trazabilidad Total', desc: 'Confirmación de lectura de cada comunicado.' },
            { emoji: '🕒', title: 'Notificaciones al Instante', desc: 'Alertas automáticas de notas e inasistencias.' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-card border border-surface-border">
              <div className="h-10 w-10 rounded-xl bg-surface-1 flex items-center justify-center text-xl flex-shrink-0">{emoji}</div>
              <div>
                <h3 className="text-sm font-bold text-neutral-100">{title}</h3>
                <p className="text-neutral-400 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: grilla */}
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { emoji: '⚡', title: 'Acceso 24/7 y Multidispositivo', desc: 'Disponible en la web y optimizado para móvil. Información accesible en cualquier momento y lugar.' },
            { emoji: '📊', title: 'Trazabilidad Total', desc: 'Confirmación automática de lecturas. Ten la certeza de quién y cuándo revisaron los comunicados.' },
            { emoji: '🕒', title: 'Notificaciones en Tiempo Real', desc: 'Alertas inmediatas al registrar nuevas notas, observaciones o avisos importantes del colegio.' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="p-8 rounded-3xl bg-surface-card border border-surface-border hover:border-primary-500/20 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-surface-1 text-primary-400 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-950/30 transition-colors duration-300 text-xl">{emoji}</div>
              <h3 className="text-lg font-bold text-neutral-100 mb-2">{title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Módulos — 3 visible en mobile + botón "Ver todos" */}
      <section id="modulos" className="py-14 md:py-24 bg-surface-1/30 border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-400">Funcionalidades</span>
            <h2 className="font-heading font-bold text-2xl sm:text-4xl text-neutral-50 mt-3 mb-3">
              6 Módulos Integrados
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed hidden sm:block">
              Una plataforma integral para simplificar el flujo informativo entre apoderados, docentes y el equipo directivo.
            </p>
          </div>

          {/* Desktop: todos los módulos */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((mod, index) => (
              <ModuleCard key={mod.title} title={mod.title} description={mod.description} icon={mod.icon} index={index} />
            ))}
          </div>

          {/* Mobile: todos los módulos en lista compacta — sin fricción extra */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {modules.map((mod, index) => (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-surface-card border border-surface-border"
              >
                <div className="p-2.5 rounded-xl bg-surface-1 text-primary-400 flex-shrink-0">
                  {mod.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-100">{mod.title}</h3>
                  <p className="text-neutral-400 text-xs mt-0.5 leading-relaxed">{mod.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios — Acordeón en mobile, grilla en desktop */}
      <section id="beneficios" className="py-14 md:py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-400">Valor Entregado</span>
          <h2 className="font-heading font-bold text-2xl sm:text-4xl text-neutral-50 mt-3">
            Beneficios para tu Colegio
          </h2>
        </div>

        {/* Mobile: acordeón */}
        <div className="flex flex-col gap-3 md:hidden">
          {beneficiosData.map((b, i) => (
            <AccordionItem key={b.title} number={b.number} title={b.title} items={b.items} defaultOpen={i === 0} />
          ))}
        </div>

        {/* Desktop: grilla */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-12">
          {beneficiosData.map((b) => (
            <div key={b.title} className="p-8 rounded-3xl bg-surface-card/50 border border-surface-border">
              <div className="h-10 w-10 rounded-xl bg-primary-950/50 text-primary-400 flex items-center justify-center font-bold text-lg mb-6">
                {b.number}
              </div>
              <h3 className="font-heading font-bold text-xl text-neutral-100 mb-4">{b.title}</h3>
              <ul className="space-y-3 text-neutral-400 text-sm">
                {b.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary-400">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ROI — oculto en mobile, visible en desktop */}
      <section id="roi" className="hidden md:block py-24 bg-surface-1/40 border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-400">Retorno de la Inversión</span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-neutral-50 mt-3 mb-4">
              Más que una inversión tecnológica
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
              Consigue ahorros operativos cuantificables mientras fortaleces la relación de confianza con los apoderados.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Horas Administrativas', desc: 'Reducción significativa de tareas repetitivas y atención en ventanilla para el equipo de secretaría.' },
              { title: 'Costos Operativos', desc: 'Menor uso de papel, fotocopias, impresiones institucionales y materiales físicos de comunicación.' },
              { title: 'Imagen Institucional', desc: 'Posicionamiento digital del establecimiento frente a la competencia, apoyando los procesos de admisión.' },
            ].map(({ title, desc }) => (
              <div key={title} className="p-6 rounded-2xl bg-surface-card border border-surface-border">
                <h4 className="font-bold text-neutral-100 text-lg mb-2">{title}</h4>
                <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cierre / CTA */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="font-heading font-bold text-2xl sm:text-4xl md:text-5xl text-neutral-50 mb-4 md:mb-6">
            Una comunidad educativa más conectada
          </h2>
          <p className="text-neutral-400 text-sm md:text-lg leading-relaxed max-w-xl mx-auto mb-8">
            Agenda tu demostración gratuita en vivo hoy mismo.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-500 text-white font-bold h-13 px-8 rounded-2xl transition-all shadow-glow-green text-base cursor-pointer w-full sm:w-auto"
          >
            <WhatsappIcon />
            Agendar Demostración por WhatsApp
          </a>
          <div className="mt-4 text-xs text-neutral-500">
            Demo de 30 minutos · Sin compromiso
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border py-8 bg-surface-card/20 text-neutral-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-heading font-bold text-base text-neutral-200">Portal Escolar</span>
          </div>
          <span className="text-xs text-neutral-500">
            &copy; 2026 Santisoft · contacto@portalescolar.cl
          </span>
        </div>
      </footer>

      {/* Botón flotante WhatsApp — 0 clics para contactar en mobile */}
      <div className="fixed bottom-5 right-4 z-50 md:hidden">
        <motion.a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Agendar demostración por WhatsApp"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 1.2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2.5 bg-primary-600 text-white font-bold h-12 px-5 rounded-full shadow-glow-green cursor-pointer"
        >
          <WhatsappIcon />
          <span className="text-sm">Agendar Demo</span>
        </motion.a>
      </div>
    </div>
  );
};
