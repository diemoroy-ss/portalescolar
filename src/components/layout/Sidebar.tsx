import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  roles?: string[];
}

const CalendarIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const GradeIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);

const AttendanceIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const MessageIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const AdminIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
  </svg>
);

const FamilyIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);

const UserIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
  </svg>
);

const allNavItems: NavItem[] = [
  { to: '/agenda', label: 'Agenda', icon: <CalendarIcon />, roles: ['apoderado', 'docente', 'admin'] },
  { to: '/horarios', label: 'Horarios', icon: <ClockIcon />, roles: ['apoderado', 'admin'] },
  { to: '/notas', label: 'Notas', icon: <GradeIcon />, roles: ['apoderado', 'docente', 'admin'] },
  { to: '/asistencia', label: 'Asistencia', icon: <AttendanceIcon />, roles: ['apoderado', 'docente', 'admin'] },
  { to: '/comunicacion', label: 'Mensajes', icon: <MessageIcon />, roles: ['apoderado', 'docente', 'admin'] },
  { to: '/tramites', label: 'Trámites', icon: <DocumentIcon />, roles: ['apoderado', 'admin'] },
  { to: '/apoderados', label: 'Ficha Matrícula', icon: <FamilyIcon />, roles: ['apoderado', 'admin'] },
  { to: '/usuarios', label: 'Usuarios', icon: <UserIcon />, roles: ['admin'] },
  { to: '/admin', label: 'Administración', icon: <AdminIcon />, roles: ['admin'] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { userData, logout, changeRole, user } = useAuth();
  const navigate = useNavigate();

  const navItems = allNavItems.filter(
    item => !item.roles || (userData?.rol && item.roles.includes(userData.rol)),
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}

      <motion.aside
        className={cn(
          'fixed top-0 left-0 h-full z-40 flex flex-col',
          'bg-gradient-sidebar border-r border-surface-3',
          'w-sidebar sidebar-transition',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-surface-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent flex items-center justify-center shrink-0 shadow-glow-green">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-100 truncate">Colegio Montahue</p>
            <p className="text-2xs text-neutral-500 truncate">Portal Escolar</p>
          </div>
        </div>

        {/* User info */}
        {userData && (
          <div className="flex flex-col gap-3 px-5 py-4 border-b border-surface-3">
            <div className="flex items-center gap-3">
              <Avatar name={userData.nombre} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-200 truncate">{userData.nombre}</p>
                <Badge
                  variant={userData.rol === 'admin' ? 'danger' : userData.rol === 'docente' ? 'info' : 'success'}
                  className="mt-0.5"
                >
                  {userData.rol}
                </Badge>
              </div>
            </div>
            {user?.email === 'diemoroy@gmail.com' && (
              <div className="mt-1 space-y-1 bg-surface-3/50 p-2 rounded-xl border border-surface-3">
                <p className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">Superadmin Vista:</p>
                <div className="flex gap-1">
                  {(['apoderado', 'docente', 'admin'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => changeRole(role)}
                      className={cn(
                        "text-[9px] px-1.5 py-1 rounded transition-all font-medium border capitalize flex-1 text-center",
                        userData.rol === role
                          ? "bg-primary-600 border-primary-500 text-white font-bold"
                          : "bg-surface-2 border-surface-3 text-neutral-400 hover:text-neutral-200"
                      )}
                    >
                      {role === 'apoderado' ? 'Apod' : role === 'docente' ? 'Doc' : 'Admin'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3" aria-label="Navegación principal">
          <ul className="space-y-1" role="list">
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                      'transition-all duration-200 relative group',
                      isActive
                        ? 'bg-primary-900/60 text-primary-400 border border-primary-800/60'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-surface-2',
                    )
                  }
                  aria-label={item.label}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 rounded-xl bg-primary-900/60 border border-primary-800/60"
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      <span className={cn('relative z-10', isActive ? 'text-primary-400' : 'text-neutral-500 group-hover:text-neutral-300')}>
                        {item.icon}
                      </span>
                      <span className="relative z-10">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="relative z-10 ml-auto bg-primary-600 text-white text-2xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-surface-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogoutIcon />}
            className="w-full justify-start text-neutral-500 hover:text-danger-500"
          >
            Cerrar sesión
          </Button>
        </div>
      </motion.aside>
    </>
  );
};
