import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Sidebar } from './Sidebar';
import { cn } from '@/utils/cn';

const routeTitles: Record<string, string> = {
  '/agenda': 'Agenda Académica',
  '/notas': 'Notas y Calificaciones',
  '/asistencia': 'Registro de Asistencia',
  '/comunicacion': 'Comunicaciones',
  '/tramites': 'Trámites y Documentos',
  '/admin': 'Panel de Administración',
  '/usuarios': 'Gestión de Usuarios',
};

const MenuIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = routeTitles[location.pathname] ?? 'Portal Escolar';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className={cn('flex-1 flex flex-col min-h-screen text-neutral-800', 'lg:ml-sidebar')}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center gap-4 px-4 py-3 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors touch-target"
            aria-label="Abrir menú"
            aria-expanded={isSidebarOpen}
          >
            <MenuIcon />
          </button>

          <div className="flex-1">
            <h1 className="text-base font-semibold text-neutral-800">{pageTitle}</h1>
          </div>
        </header>

        {/* Page content with transition */}
        <main className="flex-1 p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
