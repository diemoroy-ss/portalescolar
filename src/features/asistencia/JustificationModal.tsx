import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { justificarInasistencia } from './asistencia.service';
import { useAuth } from '@/context/AuthContext';
import { formatShortDate } from '@/utils/formatters';
import type { RegistroAsistencia } from '@/types';

interface JustificationModalProps {
  record: RegistroAsistencia;
  onClose: () => void;
}

export const JustificationModal: React.FC<JustificationModalProps> = ({
  record,
  onClose,
}) => {
  const { userData } = useAuth();
  const [justificacion, setJustificacion] = useState('');
  const [archivoUrl, setArchivoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (justificacion.trim().length < 10) {
      setError('La justificación debe tener al menos 10 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      await justificarInasistencia(
        record.id,
        {
          justificacion: justificacion.trim(),
          ...(archivoUrl.trim() ? { justificacionArchivo: archivoUrl.trim() } : {}),
        },
        userData?.uid ?? '',
      );
      toast.success('Inasistencia justificada exitosamente');
      onClose();
    } catch {
      toast.error('Error al enviar la justificación. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Justificar inasistencia"
      description={`Inasistencia del ${formatShortDate(record.fecha.toDate())}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            Enviar justificación
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-300" htmlFor="justificacion-text">
            Motivo de la inasistencia <span className="text-danger-500" aria-hidden>*</span>
          </label>
          <textarea
            id="justificacion-text"
            value={justificacion}
            onChange={e => { setJustificacion(e.target.value); setError(''); }}
            placeholder="Describe el motivo de la inasistencia..."
            rows={4}
            required
            className="w-full rounded-xl bg-surface-1 border border-surface-3 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 resize-none outline-none transition-colors focus:border-primary-600 focus:ring-1 focus:ring-primary-600/30"
            aria-describedby={error ? 'justificacion-error' : undefined}
            aria-invalid={Boolean(error)}
          />
          {error && (
            <p id="justificacion-error" role="alert" className="text-xs text-danger-500">
              {error}
            </p>
          )}
        </div>

        <Input
          label="URL de documento adjunto (opcional)"
          type="url"
          placeholder="https://..."
          value={archivoUrl}
          onChange={e => setArchivoUrl(e.target.value)}
          hint="Enlace a certificado médico u otro documento"
        />
      </form>
    </Modal>
  );
};
