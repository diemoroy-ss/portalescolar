import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { changeUserPassword } from '@/services/auth.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

const LockIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUserData } = useAuth();
  const [form, setForm] = useState<ChangePasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ChangePasswordForm>>({});

  const validate = (): boolean => {
    const newErrors: Partial<ChangePasswordForm> = {};
    if (!form.currentPassword) {
      newErrors.currentPassword = 'Ingresa tu contraseña actual';
    }
    if (form.newPassword.length < 8) {
      newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/(?=.*[A-Z])(?=.*[0-9])/.test(form.newPassword)) {
      newErrors.newPassword = 'Debe incluir al menos una mayúscula y un número';
    }
    if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      await changeUserPassword(form.currentPassword, form.newPassword);
      await refreshUserData();
      toast.success('¡Contraseña actualizada exitosamente!');
      navigate('/agenda', { replace: true });
    } catch {
      toast.error('No se pudo cambiar la contraseña. Verifica tu contraseña actual.');
    } finally {
      setIsLoading(false);
    }
  };

  const setField = (field: keyof ChangePasswordForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setErrors(prev => ({ ...prev, [field]: undefined }));
    };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="text-center mb-8">
        <div className="h-12 w-12 rounded-xl bg-primary-900/50 border border-primary-800 flex items-center justify-center mx-auto mb-4">
          <svg className="h-6 w-6 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl font-bold text-neutral-100">
          Crear nueva contraseña
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Es tu primer ingreso. Por seguridad, debes cambiar tu contraseña.
        </p>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            required
            value={form.currentPassword}
            onChange={setField('currentPassword')}
            error={errors.currentPassword}
            leftIcon={<LockIcon />}
          />
          <Input
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            required
            value={form.newPassword}
            onChange={setField('newPassword')}
            error={errors.newPassword}
            hint="Mínimo 8 caracteres, una mayúscula y un número"
            leftIcon={<LockIcon />}
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={setField('confirmPassword')}
            error={errors.confirmPassword}
            leftIcon={<LockIcon />}
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            Establecer contraseña y continuar
          </Button>
        </form>
      </div>
    </motion.div>
  );
};
