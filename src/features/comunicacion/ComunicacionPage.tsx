import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkeletonList } from '@/components/ui/Skeleton';
import { formatRelativeTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { useMensajes } from './useMensajes';
import { Modal } from '@/components/ui/Modal';
import { emailTemplates, type TemplateId } from './emailTemplates';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

type TabType = 'mensajes' | 'avisos';

export const ComunicacionPage: React.FC = () => {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('mensajes');

  // Permisos para redactar
  const canRedact = userData && ['docente', 'admin', 'administrativo'].includes(userData.rol);

  // Filtro secundario según rol
  const [senderFilter, setSenderFilter] = useState<'enviados' | 'pendientes'>('enviados');
  const [parentFilter, setParentFilter] = useState<'no-vistos' | 'vistos'>('no-vistos');

  const {
    mensajes,
    mensajesEnviados,
    avisos,
    avisosEnviados,
    isLoading,
    enviarComunicacion,
    marcarMensajeLeido,
    marcarAvisoLeido,
  } = useMensajes(userData?.uid ?? '');

  const unreadMessages = mensajes.filter(m => !m.leido && m.para === userData?.uid).length;

  // Estados del Modal de Creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipo, setTipo] = useState<'mensajes' | 'avisos'>('mensajes');
  const [destino, setDestino] = useState<string[]>(['todos']);
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [isCritico, setIsCritico] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [templateId, setTemplateId] = useState<TemplateId>('clasico');
  const [estadoInput, setEstadoInput] = useState<'enviado' | 'pendiente'>('enviado');
  const [isSending, setIsSending] = useState(false);

  // Filtro de fechas y Modal de Detalles/Edición para Admin
  const [comFiltering, setComFiltering] = useState({ dateStart: '', dateEnd: '' });
  const [selectedComDetail, setSelectedComDetail] = useState<any>(null);
  const [editingCom, setEditingCom] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    asunto: '', cuerpo: '', templateId: 'clasico' as TemplateId, estado: 'enviado' as 'enviado' | 'pendiente',
  });
  const [isSavingCom, setIsSavingCom] = useState(false);

  const handleDeleteCom = async (com: any, isMensaje: boolean) => {
    if (!confirm('¿Seguro que deseas eliminar esta comunicación?')) return;
    try {
      await deleteDoc(doc(db, isMensaje ? 'mensajes' : 'avisos', com.id));
      toast.success('Comunicación eliminada correctamente.');
    } catch (err: any) {
      toast.error('Error al eliminar: ' + err.message);
    }
  };

  const handleEditComClick = (com: any, isMensaje: boolean) => {
    setEditingCom({ ...com, isMensaje });
    setEditForm({
      asunto: isMensaje ? com.asunto : com.titulo,
      cuerpo: com.cuerpo,
      templateId: com.templateId || 'clasico',
      estado: com.estado || 'enviado',
    });
  };

  const handleUpdateCom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCom) return;
    setIsSavingCom(true);
    try {
      const ref = doc(db, editingCom.isMensaje ? 'mensajes' : 'avisos', editingCom.id);
      const dataToUpdate: any = {
        cuerpo: editForm.cuerpo,
        templateId: editForm.templateId,
        estado: editForm.estado,
      };
      if (editingCom.isMensaje) {
        dataToUpdate.asunto = editForm.asunto;
      } else {
        dataToUpdate.titulo = editForm.asunto;
      }
      await updateDoc(ref, dataToUpdate);
      toast.success('Comunicación actualizada.');
      setEditingCom(null);
    } catch (err: any) {
      toast.error('Error al actualizar: ' + err.message);
    } finally {
      setIsSavingCom(false);
    }
  };

  // Lista de cursos disponibles para el selector
  const [cursos, setCursos] = useState<{ id: string; nombre: string; nivel: string }[]>([]);

  const handleCheckboxChange = (val: string) => {
    setDestino(prev => {
      if (val === 'todos') {
        return ['todos'];
      }
      let next = prev.filter(x => x !== 'todos');
      if (next.includes(val)) {
        next = next.filter(x => x !== val);
      } else {
        next.push(val);
      }
      if (next.length === 0) {
        return ['todos'];
      }
      return next;
    });
  };

  useEffect(() => {
    if (!userData) return;
    const fetchCursosList = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'cursos'));
        
        const getLevelWeight = (nivel: string) => {
          const n = nivel.toLowerCase();
          if (n.includes('pre')) return 1;
          if (n.includes('bas')) return 2;
          if (n.includes('med')) return 3;
          return 4;
        };

        const allCursos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombre || doc.id,
          nivel: doc.data().nivel || '',
        })).sort((a, b) => getLevelWeight(a.nivel) - getLevelWeight(b.nivel));

        if (userData.rol === 'admin' || userData.rol === 'administrativo') {
          setCursos(allCursos);
        } else if (userData.rol === 'docente' && userData.cursos) {
          setCursos(allCursos.filter(c => userData.cursos.includes(c.id)));
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
      }
    };
    fetchCursosList();
  }, [userData]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    if (!asunto.trim() || !cuerpo.trim()) {
      toast.error('Por favor, rellena todos los campos requeridos.');
      return;
    }

    setIsSending(true);
    try {
      const res = await enviarComunicacion({
        tipo,
        asunto,
        cuerpo,
        deUid: userData.uid,
        deName: userData.nombre,
        deRol: userData.rol,
        destino,
        userCursos: userData.cursos || [],
        isCritico,
        sendEmail,
        templateId,
        estado: estadoInput,
      });

      toast.success(
        `Comunicación registrada exitosamente (Estado: ${estadoInput === 'enviado' ? 'Enviado' : 'Pendiente'}). ` +
        `Destinatarios: ${res.totalDestinatarios} apoderado(s).` +
        (sendEmail ? ' (Correos electrónicos simulados en consola).' : '')
      );

      // Limpiar Formulario y cerrar
      setAsunto('');
      setCuerpo('');
      setIsCritico(false);
      setSendEmail(false);
      setTemplateId('clasico');
      setEstadoInput('enviado');
      setIsModalOpen(false);
      setSenderFilter(estadoInput === 'enviado' ? 'enviados' : 'pendientes');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al enviar la comunicación.');
    } finally {
      setIsSending(false);
    }
  };

  const renderCursosDestino = (cursosDestino?: string[]) => {
    if (!cursosDestino || cursosDestino.length === 0) return 'Sin especificar';
    return cursosDestino.map(cId => {
      if (cId === 'todos') return 'Todos los cursos';
      if (cId === 'nivel-pre-basica') return 'Pre-Básica';
      if (cId === 'nivel-basica') return 'Básica';
      if (cId === 'nivel-media') return 'Media';
      const cursoObj = cursos.find(c => c.id === cId);
      return cursoObj ? cursoObj.nombre : cId;
    }).join(', ');
  };

  // Generar HTML dinámico para el preview del correo
  const nombreCursoTarget = renderCursosDestino(destino);

  const previewHtml = emailTemplates[templateId].render({
    asunto: asunto || '[Ingresa un Asunto / Título]',
    cuerpo: cuerpo || '[Escribe el cuerpo del correo aquí...]',
    remitente: userData?.nombre || 'Remitente',
    rolRemitente: (userData?.rol || 'docente').toUpperCase(),
    nombreCurso: nombreCursoTarget,
  });

  const applyDateFilter = (items: any[]) => items.filter(item => {
    if (!item.fecha) {
      return !(comFiltering.dateStart || comFiltering.dateEnd);
    }
    const d = item.fecha.toDate();
    if (comFiltering.dateStart && d < new Date(comFiltering.dateStart + 'T00:00:00')) return false;
    if (comFiltering.dateEnd && d > new Date(comFiltering.dateEnd + 'T23:59:59')) return false;
    return true;
  });

  // Filtrar comunicaciones según el rol y el filtro activo
  const displayMensajes = applyDateFilter(canRedact
    ? mensajesEnviados.filter(m => senderFilter === 'enviados' ? (m.estado === 'enviado' || !m.estado) : m.estado === 'pendiente')
    : mensajes.filter(m => parentFilter === 'no-vistos' ? !m.leido : m.leido));

  const displayAvisos = applyDateFilter(canRedact
    ? avisosEnviados.filter(a => senderFilter === 'enviados' ? (a.estado === 'enviado' || !a.estado) : a.estado === 'pendiente')
    : avisos.filter(a => {
        const yaLeido = a.leidoPor?.includes(userData?.uid ?? '');
        return parentFilter === 'no-vistos' ? !yaLeido : yaLeido;
      }));



  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 max-w-4xl mx-auto"
    >
      {/* Cabecera y Botón Redactar */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          {/* Tabs principales (Mensajes / Avisos) */}
          <motion.div variants={itemVariants} className="flex gap-1 p-1 bg-surface-1 rounded-xl border border-surface-3 w-fit">
            {(['mensajes', 'avisos'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                }}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize flex items-center gap-2',
                  activeTab === tab
                    ? 'bg-primary-700 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200',
                )}
                aria-selected={activeTab === tab}
                role="tab"
              >
                {tab}
                {tab === 'mensajes' && unreadMessages > 0 && (
                  <span className="bg-danger-500 text-white text-2xs font-bold px-1.5 py-0.5 rounded-full">
                    {unreadMessages}
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          {/* Sub-tabs dinámicas según rol */}
          {canRedact ? (
            <motion.div variants={itemVariants} className="flex gap-1.5 mt-1">
              <button
                onClick={() => {
                  setSenderFilter('enviados');
                }}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                  senderFilter === 'enviados'
                    ? 'bg-surface-3 text-primary-400 border border-primary-900/50'
                    : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
                )}
              >
                📤 Enviados
              </button>
              <button
                onClick={() => {
                  setSenderFilter('pendientes');
                }}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                  senderFilter === 'pendientes'
                    ? 'bg-surface-3 text-primary-400 border border-primary-900/50'
                    : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
                )}
              >
                ⏳ Pendientes
              </button>

              {/* Date filters */}
              <div className="flex items-center gap-2 ml-4">
                <span className="text-xs text-neutral-500 font-semibold hidden md:inline">Fechas:</span>
                <input
                  type="date"
                  value={comFiltering.dateStart}
                  onChange={e => setComFiltering({ ...comFiltering, dateStart: e.target.value })}
                  className="bg-surface-2 border border-surface-3 rounded-lg px-2 py-1 text-xs text-neutral-200 outline-none focus:border-primary-500 transition-colors"
                  aria-label="Fecha inicio"
                />
                <span className="text-neutral-500 text-xs">-</span>
                <input
                  type="date"
                  value={comFiltering.dateEnd}
                  onChange={e => setComFiltering({ ...comFiltering, dateEnd: e.target.value })}
                  className="bg-surface-2 border border-surface-3 rounded-lg px-2 py-1 text-xs text-neutral-200 outline-none focus:border-primary-500 transition-colors"
                  aria-label="Fecha fin"
                />
                {(comFiltering.dateStart || comFiltering.dateEnd) && (
                  <button
                    onClick={() => setComFiltering({ dateStart: '', dateEnd: '' })}
                    className="text-xs text-danger-400 hover:text-danger-300 transition-colors"
                    title="Limpiar fechas"
                  >
                    ✕
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="flex gap-1.5 mt-1">
              <button
                onClick={() => setParentFilter('no-vistos')}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                  parentFilter === 'no-vistos'
                    ? 'bg-surface-3 text-primary-400 border border-primary-900/50'
                    : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
                )}
              >
                🆕 No Vistos
              </button>
              <button
                onClick={() => setParentFilter('vistos')}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                  parentFilter === 'vistos'
                    ? 'bg-surface-3 text-primary-400 border border-primary-900/50'
                    : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
                )}
              >
                👁️ Vistos
              </button>
            </motion.div>
          )}
        </div>

        {canRedact && (
          <motion.div variants={itemVariants}>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="primary"
              className="flex items-center gap-2"
            >
              <span>+</span> Nueva Comunicación
            </Button>
          </motion.div>
        )}
      </div>

      {/* Content */}
      {activeTab === 'mensajes' && (
        <motion.div variants={itemVariants} className="space-y-3">
          {isLoading ? (
            <SkeletonList rows={4} />
          ) : displayMensajes.length === 0 ? (
            <EmptyState
              emoji="💬"
              title={canRedact ? (senderFilter === 'enviados' ? 'Sin mensajes enviados' : 'Sin mensajes pendientes') : (parentFilter === 'no-vistos' ? 'Sin mensajes nuevos' : 'Sin mensajes vistos')}
              description="No hay comunicaciones en esta sección."
            />
          ) : (
            displayMensajes.map(mensaje => (
              <Card
                key={mensaje.id}
                variant={mensaje.leido || canRedact ? 'default' : 'elevated'}
                hover
                padding="md"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'h-2 w-2 rounded-full mt-2 shrink-0',
                    mensaje.leido || canRedact ? 'bg-surface-3' : 'bg-primary-500',
                  )} aria-hidden />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedComDetail({ ...mensaje, isMensaje: true, asuntoStr: mensaje.asunto })}
                          className="text-sm font-semibold text-primary-400 hover:text-primary-300 truncate cursor-pointer underline transition-colors"
                          title="Ver detalle"
                        >
                          {mensaje.asunto}
                        </button>
                        {mensaje.estado && (
                          <Badge variant={mensaje.estado === 'enviado' ? 'success' : 'warning'}>
                            {mensaje.estado === 'enviado' ? 'Enviado' : 'Pendiente'}
                          </Badge>
                        )}
                        {mensaje.templateId && (
                          <Badge variant="neutral">
                            Template: {emailTemplates[mensaje.templateId as TemplateId]?.name || mensaje.templateId}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {!mensaje.leido && !canRedact && <Badge variant="primary" dot>Nuevo</Badge>}
                        {canRedact && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditComClick(mensaje, true)}
                              className="text-xs text-primary-400 hover:text-primary-300 px-2 py-1 rounded bg-surface-2 hover:bg-surface-3 transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteCom(mensaje, true)}
                              className="text-xs text-danger-400 hover:text-danger-300 px-2 py-1 rounded bg-surface-2 hover:bg-surface-3 transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {canRedact ? `Para apoderado(s)` : `De: ${mensaje.de}`} · {mensaje.fecha ? formatRelativeTime(mensaje.fecha.toDate()) : 'Reciente'}
                    </p>
                    
                    {!canRedact && (
                      <p className="text-sm text-neutral-400 mt-2 line-clamp-3">
                        {mensaje.cuerpo}
                      </p>
                    )}

                    {/* Botón de Marcar como Visto para apoderados */}
                    {!mensaje.leido && !canRedact && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 text-xs"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await marcarMensajeLeido(mensaje.id);
                          toast.success('Mensaje marcado como visto');
                        }}
                      >
                        👁️ Marcar como Visto
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </motion.div>
      )}

      {activeTab === 'avisos' && (
        <motion.div variants={itemVariants} className="space-y-3">
          {isLoading ? (
            <SkeletonList rows={3} />
          ) : displayAvisos.length === 0 ? (
            <EmptyState
              emoji="📢"
              title={canRedact ? (senderFilter === 'enviados' ? 'Sin avisos enviados' : 'Sin avisos pendientes') : (parentFilter === 'no-vistos' ? 'Sin avisos nuevos' : 'Sin avisos vistos')}
              description="No hay avisos en esta sección."
            />
          ) : (
            displayAvisos.map(aviso => {
              const yaLeido = userData?.uid ? aviso.leidoPor?.includes(userData.uid) : false;
              return (
                <Card
                  key={aviso.id}
                  variant={aviso.critico ? 'bordered' : 'elevated'}
                  padding="md"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedComDetail({ ...aviso, isMensaje: false, asuntoStr: aviso.titulo })}
                        className="text-sm font-semibold text-primary-400 hover:text-primary-300 truncate cursor-pointer underline transition-colors"
                        title="Ver detalle"
                      >
                        {aviso.titulo}
                      </button>
                      {aviso.estado && (
                        <Badge variant={aviso.estado === 'enviado' ? 'success' : 'warning'}>
                          {aviso.estado === 'enviado' ? 'Enviado' : 'Pendiente'}
                        </Badge>
                      )}
                      {aviso.templateId && (
                        <Badge variant="neutral">
                          Template: {emailTemplates[aviso.templateId as TemplateId]?.name || aviso.templateId}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      {aviso.critico && <Badge variant="danger" dot>Crítico</Badge>}
                      {!canRedact && (
                        yaLeido
                          ? <Badge variant="neutral">Leído</Badge>
                          : <Badge variant="warning" dot>Sin leer</Badge>
                      )}
                      {canRedact && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditComClick(aviso, false)}
                            className="text-xs text-primary-400 hover:text-primary-300 px-2 py-1 rounded bg-surface-2 hover:bg-surface-3 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteCom(aviso, false)}
                            className="text-xs text-danger-400 hover:text-danger-300 px-2 py-1 rounded bg-surface-2 hover:bg-surface-3 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!canRedact && (
                    <p className="text-sm text-neutral-400 mt-2">{aviso.cuerpo}</p>
                  )}
                  <p className="text-xs text-neutral-600 mt-2">
                    {aviso.fecha ? formatRelativeTime(aviso.fecha.toDate()) : 'Reciente'} · {canRedact ? 'Publicado por ti' : `Por: ${aviso.publicadoPor || 'Institución'}`}
                  </p>

                  {/* Botón Confirmar Lectura para apoderados */}
                  {!yaLeido && !canRedact && userData?.uid && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await marcarAvisoLeido(aviso.id, userData.uid);
                        toast.success('Lectura de aviso confirmada');
                      }}
                    >
                      Confirmar lectura / Visto
                    </Button>
                  )}
                </Card>
              );
            })
          )}
        </motion.div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Comunicación"
        size="xl"
      >
        <form onSubmit={handleSend} className="space-y-5 text-neutral-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campos Izquierda */}
            <div className="space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Tipo de Comunicación
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo('mensajes')}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-sm font-medium border transition-all',
                      tipo === 'mensajes'
                        ? 'bg-primary-950/40 border-primary-500 text-primary-400'
                        : 'border-surface-3 text-neutral-400 hover:text-neutral-200'
                    )}
                  >
                    💬 Mensaje Privado
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('avisos')}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-sm font-medium border transition-all',
                      tipo === 'avisos'
                        ? 'bg-primary-950/40 border-primary-500 text-primary-400'
                        : 'border-surface-3 text-neutral-400 hover:text-neutral-200'
                    )}
                  >
                    📢 Aviso Público
                  </button>
                </div>
              </div>

              {/* Destino */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Cursos Destinatarios (Selecciona uno o más)
                </label>
                <div className="max-h-48 overflow-y-auto p-3 border border-surface-3 rounded-xl bg-surface-1 space-y-2">
                  {/* Opción Todos */}
                  <label className="flex items-center gap-2.5 cursor-pointer text-sm py-0.5 hover:text-neutral-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={destino.includes('todos')}
                      onChange={() => handleCheckboxChange('todos')}
                      className="rounded border-surface-3 text-primary-600 focus:ring-primary-500 bg-surface-2"
                    />
                    <span className="font-semibold text-primary-400">Todos los cursos</span>
                  </label>

                  <div className="border-t border-surface-3 my-2 pt-1 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Niveles</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'nivel-pre-basica', label: 'Pre-Básica' },
                        { id: 'nivel-basica', label: 'Básica' },
                        { id: 'nivel-media', label: 'Media' },
                      ].map(lvl => (
                        <label key={lvl.id} className="flex items-center gap-1.5 cursor-pointer text-xs hover:text-neutral-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={destino.includes(lvl.id)}
                            onChange={() => handleCheckboxChange(lvl.id)}
                            className="rounded border-surface-3 text-primary-600 focus:ring-primary-500 bg-surface-2"
                          />
                          <span>{lvl.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-surface-3 my-2 pt-2 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">Cursos individuales</span>
                    {cursos.map(c => (
                      <label key={c.id} className="flex items-center gap-2.5 cursor-pointer text-sm hover:text-neutral-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={destino.includes(c.id)}
                          onChange={() => handleCheckboxChange(c.id)}
                          className="rounded border-surface-3 text-primary-600 focus:ring-primary-500 bg-surface-2"
                        />
                        <div className="flex justify-between w-full pr-2">
                          <span>{c.nombre}</span>
                          <span className="text-[10px] text-neutral-500 uppercase">{c.nivel}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Estado Inicial de la Comunicación
                </label>
                <select
                  value={estadoInput}
                  onChange={e => setEstadoInput(e.target.value as 'enviado' | 'pendiente')}
                  className="w-full text-sm bg-surface-1 border border-surface-3 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-primary-500"
                >
                  <option value="enviado">Enviado (Activo/Visible)</option>
                  <option value="pendiente">Pendiente (Borrador)</option>
                </select>
              </div>

              {/* Asunto / Título */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  {tipo === 'mensajes' ? 'Asunto' : 'Título'}
                </label>
                <input
                  type="text"
                  required
                  value={asunto}
                  onChange={e => setAsunto(e.target.value)}
                  placeholder={tipo === 'mensajes' ? 'Ej: Justificación de inasistencia' : 'Ej: Suspensión de clases por lluvia'}
                  className="w-full text-sm bg-surface-1 border border-surface-3 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Cuerpo */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Mensaje / Contenido
                </label>
                <textarea
                  required
                  rows={4}
                  value={cuerpo}
                  onChange={e => setCuerpo(e.target.value)}
                  placeholder="Escribe los detalles aquí..."
                  className="w-full text-sm bg-surface-1 border border-surface-3 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              {/* Opciones Adicionales */}
              <div className="space-y-3 pt-2">
                {tipo === 'avisos' && (
                  <button
                    type="button"
                    onClick={() => setIsCritico(!isCritico)}
                    className="flex items-center gap-3 cursor-pointer group text-left"
                  >
                    <div className={cn(
                      "w-11 h-6 rounded-full transition-colors relative flex items-center p-1 shrink-0",
                      isCritico ? "bg-danger-600" : "bg-surface-3"
                    )}>
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white transition-transform shadow-md transform",
                        isCritico ? "translate-x-5" : "translate-x-0"
                      )} />
                    </div>
                    <span className="text-sm text-neutral-300 group-hover:text-neutral-100 transition-colors">
                      Marcar como Aviso Crítico/Urgente
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSendEmail(!sendEmail)}
                  className="flex items-center gap-3 cursor-pointer group text-left"
                >
                  <div className={cn(
                    "w-11 h-6 rounded-full transition-colors relative flex items-center p-1 shrink-0",
                    sendEmail ? "bg-primary-600" : "bg-surface-3"
                  )}>
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white transition-transform shadow-md transform",
                      sendEmail ? "translate-x-5" : "translate-x-0"
                    )} />
                  </div>
                  <span className="text-sm text-neutral-300 group-hover:text-neutral-100 transition-colors">
                    Enviar también por Correo Electrónico
                  </span>
                </button>
              </div>

              {/* Plantillas de Correo (Izquierda) */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Selecciona una Plantilla de Correo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(emailTemplates).map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplateId(t.id)}
                      className={cn(
                        'p-2.5 text-left rounded-xl border transition-all text-xs flex flex-col justify-between h-20 bg-white',
                        templateId === t.id
                          ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md'
                          : 'border-neutral-200 hover:bg-neutral-50'
                      )}
                    >
                      <span className={cn(
                        "font-semibold block truncate",
                        templateId === t.id ? "text-primary-700 font-bold" : "text-neutral-800"
                      )}>{t.name}</span>
                      <span className={cn(
                        "text-[10px] line-clamp-2 leading-tight",
                        templateId === t.id ? "text-primary-600/90" : "text-neutral-500"
                      )}>
                        {t.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel de Email / Preview (Derecha) */}
            <div className="flex flex-col min-h-[400px]">
              <div className="flex-1 flex flex-col h-full">
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                  <span>Vista Previa del Correo</span>
                  {!sendEmail && (
                    <span className="text-[10px] text-neutral-500 font-normal normal-case">
                      (Correo desactivado - Solo guardado de plantilla)
                    </span>
                  )}
                </label>
                <iframe
                  srcDoc={previewHtml}
                  title="Vista Previa de Correo"
                  className="w-full flex-1 rounded-xl border border-surface-3 bg-white min-h-[400px]"
                />
              </div>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="flex justify-end gap-3 pt-3 border-t border-surface-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSending}
              className="px-6"
            >
              {isSending
                ? 'Guardando...'
                : sendEmail
                  ? 'Guardar y Enviar'
                  : 'Guardar'
              }
            </Button>
          </div>
        </form>
      </Modal>
      {/* COMMUNICATIONS DETAIL MODAL */}
      <Modal
        isOpen={selectedComDetail !== null}
        onClose={() => setSelectedComDetail(null)}
        title={`Detalle de Comunicación: ${selectedComDetail?.asuntoStr || ''}`}
        size="xl"
      >
        {selectedComDetail && (
          <div className="space-y-4 text-neutral-800">
            <div className="flex justify-between items-center bg-slate-50 p-3 border border-neutral-200 rounded-xl text-xs text-neutral-600 gap-2 flex-wrap">
              <div>
                <strong>Tipo: </strong>
                <span className="capitalize">{selectedComDetail.isMensaje ? 'Mensaje' : 'Aviso'}</span>
              </div>
              <div>
                <strong>Remitente: </strong>
                <span>{selectedComDetail.de || selectedComDetail.publicadoPor || 'Institución'}</span>
              </div>
              <div>
                <strong>Estado: </strong>
                <Badge variant={selectedComDetail.estado === 'enviado' ? 'success' : 'neutral'}>
                  {selectedComDetail.estado || 'enviado'}
                </Badge>
              </div>
              <div>
                <strong>Fecha: </strong>
                <span>
                  {selectedComDetail.fecha
                    ? new Date(selectedComDetail.fecha.seconds * 1000).toLocaleString()
                    : 'Reciente'}
                </span>
              </div>
            </div>

            <div className="border border-neutral-200 rounded-xl overflow-hidden h-[450px]">
              <iframe
                srcDoc={emailTemplates[(selectedComDetail.templateId || 'clasico') as TemplateId].render({
                  asunto: selectedComDetail.asuntoStr,
                  cuerpo: selectedComDetail.cuerpo,
                  remitente: selectedComDetail.de || selectedComDetail.publicadoPor || 'Institución',
                  rolRemitente: 'REMITENTE',
                  nombreCurso: renderCursosDestino(selectedComDetail.cursosDestino),
                })}
                title="Vista Previa de Correo"
                className="w-full h-full bg-white"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-200">
              <Button onClick={() => setSelectedComDetail(null)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* COMMUNICATIONS EDIT MODAL */}
      <Modal
        isOpen={editingCom !== null}
        onClose={() => setEditingCom(null)}
        title="Editar Comunicación"
        size="xl"
      >
        {editingCom && (
          <form onSubmit={handleUpdateCom} className="space-y-5 text-neutral-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Asunto / Título
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.asunto}
                    onChange={e => setEditForm({ ...editForm, asunto: e.target.value })}
                    className="w-full text-sm bg-white border border-neutral-300 rounded-xl px-3 py-2 text-neutral-850 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Mensaje / Contenido
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={editForm.cuerpo}
                    onChange={e => setEditForm({ ...editForm, cuerpo: e.target.value })}
                    className="w-full text-sm bg-white border border-neutral-300 rounded-xl px-3 py-2 text-neutral-850 focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Estado
                  </label>
                  <select
                    value={editForm.estado}
                    onChange={e => setEditForm({ ...editForm, estado: e.target.value as any })}
                    className="w-full text-sm bg-white border border-neutral-300 rounded-xl px-3 py-2 text-neutral-850 focus:outline-none focus:border-primary-500"
                  >
                    <option value="enviado">Enviado (Activo/Visible)</option>
                    <option value="pendiente">Pendiente (Borrador)</option>
                  </select>
                </div>

                {/* Plantillas de Correo (Izquierda) */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    Selecciona una Plantilla de Correo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(emailTemplates).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, templateId: t.id })}
                        className={cn(
                          'p-2.5 text-left rounded-xl border transition-all text-xs flex flex-col justify-between h-20 bg-white',
                          editForm.templateId === t.id
                            ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md'
                            : 'border-neutral-200 hover:bg-neutral-50'
                        )}
                      >
                        <span className={cn(
                          "font-semibold block truncate",
                          editForm.templateId === t.id ? "text-primary-700 font-bold" : "text-neutral-800"
                        )}>{t.name}</span>
                        <span className={cn(
                          "text-[10px] line-clamp-2 leading-tight",
                          editForm.templateId === t.id ? "text-primary-600/90" : "text-neutral-500"
                        )}>
                          {t.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Template preview (Derecha) */}
              <div className="flex flex-col min-h-[400px]">
                <div className="flex-1 flex flex-col h-full">
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Vista Previa del Correo
                  </label>
                  <iframe
                    srcDoc={emailTemplates[editForm.templateId].render({
                      asunto: editForm.asunto || '[Ingresa un Asunto / Título]',
                      cuerpo: editForm.cuerpo || '[Escribe el cuerpo del correo aquí...]',
                      remitente: editingCom.de || editingCom.publicadoPor || 'Remitente',
                      rolRemitente: 'REMITENTE',
                      nombreCurso: renderCursosDestino(editingCom.cursosDestino),
                    })}
                    title="Vista Previa de Correo"
                    className="w-full h-full flex-1 rounded-xl border border-neutral-200 bg-white min-h-[400px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingCom(null)}
                disabled={isSavingCom}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSavingCom}
                className="px-6"
              >
                {isSavingCom ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </motion.div>
  );
};

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ emoji, title, description }) => (
  <div className="text-center py-16 space-y-3">
    <div className="text-5xl" aria-hidden>{emoji}</div>
    <p className="text-neutral-400 text-sm font-medium">{title}</p>
    <p className="text-neutral-600 text-xs max-w-xs mx-auto">{description}</p>
  </div>
);


