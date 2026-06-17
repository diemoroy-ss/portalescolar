import React, { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';

import { AuthLayout } from '@/components/layout/AuthLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

const LoginPage          = lazy(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ChangePasswordPage = lazy(() => import('@/features/auth/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage })));
const LandingPage        = lazy(() => import('@/features/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const AgendaPage         = lazy(() => import('@/features/agenda/AgendaPage').then(m => ({ default: m.AgendaPage })));
const NotasPage          = lazy(() => import('@/features/notas/NotasPage').then(m => ({ default: m.NotasPage })));
const AsistenciaPage     = lazy(() => import('@/features/asistencia/AsistenciaPage').then(m => ({ default: m.AsistenciaPage })));
const ComunicacionPage   = lazy(() => import('@/features/comunicacion/ComunicacionPage').then(m => ({ default: m.ComunicacionPage })));
const TramitesPage       = lazy(() => import('@/features/tramites/TramitesPage').then(m => ({ default: m.TramitesPage })));
const ApoderadosPage     = lazy(() => import('@/features/apoderados/ApoderadosPage').then(m => ({ default: m.ApoderadosPage })));
const AdminPage          = lazy(() => import('@/features/admin/AdminPage').then(m => ({ default: m.AdminPage })));
const SeedPage           = lazy(() => import('@/features/admin/SeedPage').then(m => ({ default: m.SeedPage })));
const UsersPage          = lazy(() => import('@/features/admin/UsersPage').then(m => ({ default: m.UsersPage })));
const HorariosPage       = lazy(() => import('@/features/horarios/HorariosPage').then(m => ({ default: m.HorariosPage })));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full" />
  </div>
);

const router = createBrowserRouter([
  {
    path: '/seed',
    element: (
      <Suspense fallback={<PageLoader />}>
        <SeedPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: '/recuperar-contrasena',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ForgotPasswordPage />
          </Suspense>
        ),
      },
      {
        path: '/cambiar-contrasena',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ChangePasswordPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/agenda',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AgendaPage />
              </Suspense>
            ),
          },
          {
            path: '/notas',
            element: (
              <Suspense fallback={<PageLoader />}>
                <NotasPage />
              </Suspense>
            ),
          },
          {
            path: '/asistencia',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AsistenciaPage />
              </Suspense>
            ),
          },
          {
            path: '/comunicacion',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ComunicacionPage />
              </Suspense>
            ),
          },
          {
            path: '/tramites',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TramitesPage />
              </Suspense>
            ),
          },
          {
            path: '/apoderados',
            element: (
              <ProtectedRoute allowedRoles={['apoderado', 'admin']}>
                <Suspense fallback={<PageLoader />}>
                  <ApoderadosPage />
                </Suspense>
              </ProtectedRoute>
            ),
          },
          {
            path: '/horarios',
            element: (
              <ProtectedRoute allowedRoles={['apoderado', 'admin']}>
                <Suspense fallback={<PageLoader />}>
                  <HorariosPage />
                </Suspense>
              </ProtectedRoute>
            ),
          },
          {
            path: '/admin',
            element: (
              <ProtectedRoute allowedRoles={['admin']}>
                <Suspense fallback={<PageLoader />}>
                  <AdminPage />
                </Suspense>
              </ProtectedRoute>
            ),
          },
          {
            path: '/usuarios',
            element: (
              <ProtectedRoute allowedRoles={['admin']}>
                <Suspense fallback={<PageLoader />}>
                  <UsersPage />
                </Suspense>
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '/sin-acceso',
    element: (
      <div className="min-h-screen bg-surface flex items-center justify-center text-center p-4">
        <div className="space-y-3">
          <div className="text-5xl" aria-hidden>🚫</div>
          <h1 className="text-xl font-heading font-bold text-neutral-100">Sin acceso</h1>
          <p className="text-sm text-neutral-400">No tienes permisos para ver esta página.</p>
        </div>
      </div>
    ),
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen bg-surface flex items-center justify-center text-center p-4">
        <div className="space-y-3">
          <div className="text-5xl" aria-hidden>404</div>
          <h1 className="text-xl font-heading font-bold text-neutral-100">Página no encontrada</h1>
          <p className="text-sm text-neutral-400">La URL que buscas no existe.</p>
        </div>
      </div>
    ),
  },
]);

export const AppRouter: React.FC = () => <RouterProvider router={router} />;
