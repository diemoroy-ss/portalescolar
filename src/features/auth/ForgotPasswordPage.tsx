import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { sendPasswordReset } from '@/services/auth.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const EmailIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('El correo es requerido');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
      toast.success('Correo enviado. Revisa tu bandeja de entrada.');
    } catch {
      toast.error('No se pudo enviar el correo. Verifica la dirección ingresada.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="text-center mb-8">
        <h1 className="font-heading text-2xl font-bold text-neutral-100">
          Recuperar contraseña
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Te enviaremos un enlace a tu correo
        </p>
      </div>

      <div className="glass-card p-6">
        {sent ? (
          <div className="text-center py-4 space-y-3">
            <div className="h-12 w-12 rounded-full bg-success-900/50 border border-success-900 flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-success-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm text-neutral-300">
              Revisa tu correo <span className="text-primary-400 font-medium">{email}</span>
            </p>
            <p className="text-xs text-neutral-500">
              Si no ves el mensaje, revisa la carpeta de spam.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              error={error}
              leftIcon={<EmailIcon />}
              disabled={isLoading}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Enviar enlace de recuperación
            </Button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
