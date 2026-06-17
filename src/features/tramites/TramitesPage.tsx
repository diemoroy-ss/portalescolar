import React from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const tramiteItems = [
  {
    id: 'certificado',
    titulo: 'Certificado de Alumno Regular',
    descripcion: 'Documento oficial que acredita matrícula vigente en el establecimiento.',
    icon: '📄',
    action: 'Solicitar',
    badge: { label: 'Disponible', variant: 'success' as const },
  },
  {
    id: 'autorizaciones',
    titulo: 'Autorizaciones Digitales',
    descripcion: 'Revisa y firma autorizaciones pendientes enviadas por el colegio.',
    icon: '✍️',
    action: 'Ver autorizaciones',
    badge: { label: '2 pendientes', variant: 'warning' as const },
  },
  {
    id: 'historial',
    titulo: 'Historial de Documentos',
    descripcion: 'Consulta todos los documentos y solicitudes anteriores.',
    icon: '🗂️',
    action: 'Ver historial',
    badge: { label: 'Disponible', variant: 'success' as const },
  },
];

export const TramitesPage: React.FC = () => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className="space-y-4 max-w-2xl mx-auto"
  >
    <motion.div variants={itemVariants}>
      <p className="text-sm text-neutral-500 mb-4">
        Gestiona documentos y autorizaciones del Colegio Montahue desde aquí.
      </p>
    </motion.div>

    {tramiteItems.map(item => (
      <motion.div key={item.id} variants={itemVariants}>
        <Card variant="elevated" hover padding="md">
          <div className="flex items-start gap-4">
            <div className="text-3xl shrink-0" aria-hidden>{item.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                <h3 className="text-sm font-semibold text-neutral-100">{item.titulo}</h3>
                <Badge variant={item.badge.variant}>{item.badge.label}</Badge>
              </div>
              <p className="text-xs text-neutral-400 mb-3">{item.descripcion}</p>
              <Button variant="outline" size="sm">
                {item.action}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    ))}
  </motion.div>
);
