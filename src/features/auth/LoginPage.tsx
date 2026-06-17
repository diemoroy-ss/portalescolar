import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { loginWithEmail } from '@/services/auth.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const EmailIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

const LockIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    {open ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    )}
    <circle cx={12} cy={12} r={3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface LoginFormState {
  email: string;
  password: string;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/agenda';

  const [form, setForm] = useState<LoginFormState>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormState>>({});

  const validate = (): boolean => {
    const newErrors: Partial<LoginFormState> = {};
    if (!form.email) {
      newErrors.email = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Ingresa un correo válido';
    }
    if (!form.password) {
      newErrors.password = 'La contraseña es requerida';
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
      await loginWithEmail(form.email, form.password);
      navigate(from, { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al iniciar sesión';
      const isInvalidCredentials =
        message.includes('invalid-credential') ||
        message.includes('wrong-password') ||
        message.includes('user-not-found');

      toast.error(
        isInvalidCredentials
          ? 'Correo o contraseña incorrectos'
          : 'Error al iniciar sesión. Intenta nuevamente.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Logo & Header */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-600 to-accent items-center justify-center mb-4 shadow-glow-green">
          <span className="font-heading text-white font-bold text-2xl">M</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-neutral-100">
          Colegio Montahue
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Portal de Apoderados</p>
      </motion.div>

      {/* Form card */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <h2 className="text-lg font-semibold text-neutral-200 mb-6">Iniciar sesión</h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
            error={errors.email}
            leftIcon={<EmailIcon />}
            disabled={isLoading}
          />

          <Input
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
            error={errors.password}
            leftIcon={<LockIcon />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <EyeIcon open={showPassword} />
              </button>
            }
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            Ingresar al portal
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/recuperar-contrasena"
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </motion.div>

      <motion.p variants={itemVariants} className="text-center text-2xs text-neutral-600 mt-6">
        Portal protegido — Solo personal autorizado
      </motion.p>
    </motion.div>
  );
};
