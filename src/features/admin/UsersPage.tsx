import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { fetchAllUsers, createAdminUserProfile } from '@/services/admin.service';
import type { Usuario } from '@/types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', rol: 'docente' as any, uid: '' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await fetchAllUsers();
      setUsers(allUsers);
    } catch (err: any) {
      toast.error('Error al cargar usuarios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.uid) {
      toast.error('Por favor completa todos los campos.');
      return;
    }
    try {
      await createAdminUserProfile(form.uid, {
        nombre: form.nombre,
        email: form.email,
        rol: form.rol,
      });
      toast.success('Usuario creado exitosamente.');
      setIsModalOpen(false);
      setForm({ nombre: '', email: '', rol: 'docente', uid: '' });
      loadUsers();
    } catch (err: any) {
      toast.error('Error al crear usuario: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 text-neutral-800">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-neutral-900">Gestión de Usuarios</h1>
          <p className="text-xs text-neutral-500">Administra todos los perfiles de usuarios de la plataforma.</p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>Agregar Usuario</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <Card variant="elevated" padding="none" className="overflow-x-auto bg-white border border-neutral-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-neutral-600 border-b border-neutral-200">
                <th className="p-3 font-medium">UID / Document</th>
                <th className="p-3 font-medium">Nombre</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.uid} className="border-b border-neutral-100 hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono text-neutral-500 text-[10px]">{u.uid}</td>
                  <td className="p-3 font-medium text-neutral-800">{u.nombre}</td>
                  <td className="p-3 text-neutral-600">{u.email}</td>
                  <td className="p-3">
                    <Badge
                      variant={u.rol === 'admin' ? 'danger' : u.rol === 'docente' ? 'info' : u.rol === 'administrativo' ? 'warning' : 'success'}
                    >
                      {u.rol}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* USER CREATION MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agregar Perfil de Usuario">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="UID Único de Firebase Auth"
            placeholder="Ej: docente-juan"
            value={form.uid}
            onChange={e => setForm({ ...form, uid: e.target.value })}
            required
          />
          <Input
            label="Nombre Completo"
            placeholder="Ej: Juan Pérez"
            value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })}
            required
          />
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="Ej: juan.perez@montahue.cl"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400">Rol asignado</label>
            <select
              value={form.rol}
              onChange={e => setForm({ ...form, rol: e.target.value as any })}
              className="w-full bg-surface-2 border border-surface-3 text-sm rounded-xl px-3 py-2.5 text-neutral-200 focus:outline-none"
            >
              <option value="docente">Docente (Profesor)</option>
              <option value="administrativo">Administrativo</option>
              <option value="apoderado">Apoderado (Padre/Madre)</option>
              <option value="admin">Administrador (Gestión)</option>
            </select>
          </div>
          
          <div className="flex gap-2 justify-end pt-3 border-t border-neutral-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Perfil</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
