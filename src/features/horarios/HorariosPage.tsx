import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BloqueHorario, CeldaHorario, Curso, Alumno } from '@/types';
import { getBloquesHorarios, getHorarioCurso, saveHorarioCurso, saveBloquesHorarios } from './horarios.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const DEFAULT_COLORS = ['bg-primary-500', 'bg-secondary-500', 'bg-accent', 'bg-warning-500', 'bg-danger-500', 'bg-info-500'];

export const HorariosPage: React.FC = () => {
  const { userData } = useAuth();
  const isAdmin = userData?.rol === 'admin';

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selectedCursoId, setSelectedCursoId] = useState<string>('');
  
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [bloquesExtra, setBloquesExtra] = useState<BloqueHorario[]>([]);
  const [horario, setHorario] = useState<CeldaHorario[]>([]);
  const [docentes, setDocentes] = useState<Record<string, string>>({}); // id -> nombre
  const [asignaturasMap, setAsignaturasMap] = useState<Record<string, string>>({}); // id -> nombre
  const [alumnosPorCurso, setAlumnosPorCurso] = useState<Record<string, string[]>>({});

  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editingCelda, setEditingCelda] = useState<{bloqueId: string, diaSemana: number} | null>(null);
  const [editAsignatura, setEditAsignatura] = useState('');
  const [editDocente, setEditDocente] = useState('');
  const [editColor, setEditColor] = useState(DEFAULT_COLORS[0]);

  // Edit Bloques State
  const [isEditingBloques, setIsEditingBloques] = useState(false);
  const [editingBloquesData, setEditingBloquesData] = useState<BloqueHorario[]>([]);

  // Edit Bloques Extra State
  const [isEditingBloquesExtra, setIsEditingBloquesExtra] = useState(false);
  const [editingBloquesExtraData, setEditingBloquesExtraData] = useState<BloqueHorario[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Load bloques
        const loadedBloques = await getBloquesHorarios();
        setBloques(loadedBloques);

        // Load docentes
        const docRef = collection(db, 'usuarios');
        const qDoc = query(docRef, where('rol', '==', 'docente'));
        const docSnap = await getDocs(qDoc);
        const docMap: Record<string, string> = {};
        docSnap.forEach(d => {
          docMap[d.id] = d.data().nombre;
        });
        setDocentes(docMap);

        // Load asignaturas
        const asigRef = collection(db, 'asignaturas');
        const asigSnap = await getDocs(asigRef);
        const asigMap: Record<string, string> = {};
        asigSnap.forEach(a => {
          asigMap[a.id] = a.data().nombre;
        });
        setAsignaturasMap(asigMap);

        // Load cursos based on role
        if (isAdmin) {
          const cRef = collection(db, 'cursos');
          const cSnap = await getDocs(cRef);
          const cList: Curso[] = [];
          cSnap.forEach(c => cList.push({ id: c.id, ...c.data() } as Curso));
          setCursos(cList);
          if (cList.length > 0) setSelectedCursoId(cList[0].id);
        } else if (userData?.rol === 'apoderado') {
          // Apoderado: get alumnos, then their courses
          const aRef = collection(db, 'alumnos');
          const qAlumnos = query(aRef, where('apoderados', 'array-contains', userData.uid));
          const aSnap = await getDocs(qAlumnos);
          const cursoIds = new Set<string>();
          const alMap: Record<string, string[]> = {};
          
          aSnap.forEach(a => {
            const data = a.data() as Alumno;
            if (data.cursoId) {
              cursoIds.add(data.cursoId);
              if (!alMap[data.cursoId]) alMap[data.cursoId] = [];
              alMap[data.cursoId].push(data.nombre.split(' ')[0]);
            }
          });
          
          setAlumnosPorCurso(alMap);

          if (cursoIds.size > 0) {
            const cRef = collection(db, 'cursos');
            const qCursos = query(cRef, where(documentId(), 'in', Array.from(cursoIds)));
            const cSnap = await getDocs(qCursos);
            const cList: Curso[] = [];
            cSnap.forEach(c => cList.push({ id: c.id, ...c.data() } as Curso));
            setCursos(cList);
            if (cList.length > 0) setSelectedCursoId(cList[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (userData) fetchData();
  }, [userData, isAdmin]);

  useEffect(() => {
    if (selectedCursoId) {
      getHorarioCurso(selectedCursoId).then(data => {
        setHorario(data.celdas);
        setBloquesExtra(data.bloquesExtra || []);
      });
    }
  }, [selectedCursoId]);

  const handleCellClick = (bloqueId: string, diaSemana: number) => {
    if (!isAdmin) return;
    const existing = horario.find(c => c.bloqueId === bloqueId && c.diaSemana === diaSemana);
    setEditAsignatura(existing?.asignaturaId || '');
    setEditDocente(existing?.docenteId || '');
    setEditColor(existing?.color || DEFAULT_COLORS[0]);
    setEditingCelda({ bloqueId, diaSemana });
    setIsEditing(true);
  };

  const handleAsignaturaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setEditAsignatura(val);
    const activeCurso = cursos.find(c => c.id === selectedCursoId);
    if (val && activeCurso?.docentesAsignaturas?.[val]) {
      setEditDocente(activeCurso.docentesAsignaturas[val]);
    } else {
      setEditDocente('');
    }
  };

  const handleSaveCell = async () => {
    if (!editingCelda || !selectedCursoId) return;
    
    let newHorario = [...horario];
    const index = newHorario.findIndex(c => c.bloqueId === editingCelda.bloqueId && c.diaSemana === editingCelda.diaSemana);
    
    if (editAsignatura.trim() === '') {
      // Remove cell
      if (index >= 0) newHorario.splice(index, 1);
    } else {
      const newCell: CeldaHorario = {
        bloqueId: editingCelda.bloqueId,
        diaSemana: editingCelda.diaSemana,
        asignaturaId: editAsignatura,
        docenteId: editDocente,
        color: editColor
      };
      if (index >= 0) newHorario[index] = newCell;
      else newHorario.push(newCell);
    }
    
    setHorario(newHorario);
    setIsEditing(false);
    await saveHorarioCurso(selectedCursoId, { celdas: newHorario, bloquesExtra });
  };

  const handleOpenBloquesEditor = () => {
    setEditingBloquesData([...bloques]);
    setIsEditingBloques(true);
  };

  const handleSaveBloques = async () => {
    await saveBloquesHorarios(editingBloquesData);
    setBloques(editingBloquesData);
    setIsEditingBloques(false);
  };

  const handleUpdateBloque = (index: number, field: keyof BloqueHorario, value: string) => {
    const newBloques = [...editingBloquesData];
    newBloques[index] = { ...newBloques[index], [field]: value };
    setEditingBloquesData(newBloques);
  };

  const handleAddBloque = () => {
    setEditingBloquesData([...editingBloquesData, { id: `b${Date.now()}`, horaInicio: '', horaFin: '', tipo: 'clase', nombre: '' }]);
  };

  const handleRemoveBloque = (index: number) => {
    const newBloques = [...editingBloquesData];
    newBloques.splice(index, 1);
    setEditingBloquesData(newBloques);
  };

  const handleOpenBloquesExtraEditor = () => {
    setEditingBloquesExtraData([...bloquesExtra]);
    setIsEditingBloquesExtra(true);
  };

  const handleSaveBloquesExtra = async () => {
    await saveHorarioCurso(selectedCursoId, { celdas: horario, bloquesExtra: editingBloquesExtraData });
    setBloquesExtra(editingBloquesExtraData);
    setIsEditingBloquesExtra(false);
  };

  const handleUpdateBloqueExtra = (index: number, field: keyof BloqueHorario, value: any) => {
    const newBloques = [...editingBloquesExtraData];
    if (field === 'diaSemana') {
      if (value) newBloques[index] = { ...newBloques[index], diaSemana: Number(value) };
      else {
        const { diaSemana, ...rest } = newBloques[index];
        newBloques[index] = rest as BloqueHorario;
      }
    } else {
      newBloques[index] = { ...newBloques[index], [field]: value };
    }
    setEditingBloquesExtraData(newBloques);
  };

  const handleAddBloqueExtra = () => {
    setEditingBloquesExtraData([...editingBloquesExtraData, { id: `be${Date.now()}`, horaInicio: '', horaFin: '', tipo: 'clase', nombre: '' }]);
  };

  const handleRemoveBloqueExtra = (index: number) => {
    const newBloques = [...editingBloquesExtraData];
    newBloques.splice(index, 1);
    setEditingBloquesExtraData(newBloques);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (cursos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-3" aria-hidden>📅</div>
        <p className="text-neutral-400 text-sm">No tienes cursos asignados.</p>
      </div>
    );
  }

  // Calculate display blocks
  const allBloquesRaw = [...bloques, ...bloquesExtra].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  let displayBloques = allBloquesRaw;
  
  if (!isAdmin) {
    let maxIndex = -1;
    allBloquesRaw.forEach((b, index) => {
      if (b.tipo === 'recreo') return;
      const hasClass = horario.some(c => c.bloqueId === b.id);
      if (hasClass) {
        maxIndex = index;
      }
    });
    if (maxIndex >= 0) {
      displayBloques = allBloquesRaw.slice(0, maxIndex + 1);
    } else {
      displayBloques = [];
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-neutral-100">Horarios</h1>
          <p className="text-neutral-400 text-sm mt-1">Visualiza o edita el horario de clases.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedCursoId}
            onChange={e => setSelectedCursoId(e.target.value)}
            className="bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-primary-500"
          >
            {cursos.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre} {!isAdmin && alumnosPorCurso[c.id] ? ` (${alumnosPorCurso[c.id].join(', ')})` : ''}
              </option>
            ))}
          </select>
          {isAdmin && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleOpenBloquesExtraEditor} disabled={!selectedCursoId}>
                + Bloque del Curso
              </Button>
              <Button size="sm" variant="outline" onClick={handleOpenBloquesEditor}>
                Bloques Globales
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card variant="glass" className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr>
              <th className="p-3 border-b border-surface-3 bg-surface-2/50 font-medium text-neutral-300 w-24 text-center">Horario</th>
              {DIAS.map(dia => (
                <th key={dia} className="p-3 border-b border-surface-3 bg-surface-2/50 font-medium text-neutral-300 text-center">{dia}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayBloques.map(bloque => (
              <tr key={bloque.id}>
                <td className="p-3 border-b border-surface-3 whitespace-nowrap text-center font-medium text-neutral-400 bg-surface-1/30">
                  <div className="text-sm">{bloque.horaInicio}</div>
                  <div className="text-xs text-neutral-500">{bloque.horaFin}</div>
                </td>
                {bloque.tipo === 'recreo' && !bloque.diaSemana ? (
                  <td colSpan={5} className="p-3 border-b border-surface-3 text-center bg-surface-2/80 text-neutral-500 font-semibold tracking-[0.2em] uppercase">
                    {bloque.nombre || 'Recreo'}
                  </td>
                ) : (
                  DIAS.map((dia, idx) => {
                    const diaNum = idx + 1;
                    const isVisible = bloque.diaSemana ? bloque.diaSemana === diaNum : true;
                    
                    if (!isVisible) {
                      return <td key={dia} className="p-2 border-b border-r last:border-r-0 border-surface-3 bg-surface-1/50 opacity-30"></td>;
                    }

                    if (bloque.tipo === 'recreo') {
                       return (
                         <td key={dia} className="p-3 border-b border-r last:border-r-0 border-surface-3 text-center bg-surface-2/80 text-neutral-500 font-semibold tracking-[0.1em] uppercase">
                           {bloque.nombre || 'Recreo'}
                         </td>
                       );
                    }

                    const celda = horario.find(c => c.bloqueId === bloque.id && c.diaSemana === diaNum);
                    return (
                      <td 
                        key={dia} 
                        onClick={() => handleCellClick(bloque.id, diaNum)}
                        className={`p-2 border-b border-r last:border-r-0 border-surface-3 min-w-[140px] h-20 transition-colors ${isAdmin ? 'cursor-pointer hover:bg-surface-2' : ''}`}
                      >
                        {celda ? (
                          <div className={`h-full rounded-lg p-2 flex flex-col justify-center items-center text-center ${celda.color || 'bg-surface-3'} shadow-sm`}>
                            <span className="font-bold text-white text-xs mb-1 line-clamp-2 leading-tight">{asignaturasMap[celda.asignaturaId] || celda.asignaturaId}</span>
                            {celda.docenteId && (
                              <span className="text-[10px] text-white/80 line-clamp-1">{docentes[celda.docenteId] || celda.docenteId}</span>
                            )}
                          </div>
                        ) : (
                          <div className="h-full rounded-lg border border-dashed border-surface-3 flex items-center justify-center text-neutral-600 text-xs opacity-0 hover:opacity-100 transition-opacity">
                            {isAdmin ? '+ Asignar' : ''}
                          </div>
                        )}
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Edit Modal (Simulated with standard elements for now) */}
      {isEditing && editingCelda && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface border border-surface-3 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-surface-3">
              <h3 className="text-lg font-bold text-neutral-100">Editar Clase</h3>
              <p className="text-sm text-neutral-400">{DIAS[editingCelda.diaSemana - 1]} - {bloques.find(b => b.id === editingCelda.bloqueId)?.horaInicio}</p>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Asignatura</label>
                <select
                  value={editAsignatura}
                  onChange={handleAsignaturaChange}
                  className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-primary-500 transition-all"
                >
                  <option value="">Seleccione una asignatura...</option>
                  {(cursos.find(c => c.id === selectedCursoId)?.asignaturas || []).map(asigId => (
                    <option key={asigId} value={asigId}>{asignaturasMap[asigId] || asigId}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Docente</label>
                <select
                  value={editDocente}
                  onChange={e => setEditDocente(e.target.value)}
                  className="w-full bg-surface-2 border border-surface-3 rounded-xl px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-primary-500 transition-all"
                >
                  <option value="">Seleccione un docente...</option>
                  {Object.entries(docentes).map(([id, nombre]) => (
                    <option key={id} value={id}>{nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2">Color de Fondo</label>
                <div className="flex gap-2">
                  {DEFAULT_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className={`w-8 h-8 rounded-full ${c} ${editColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-surface-3 flex justify-end gap-3 bg-surface-2/30">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSaveCell}>Guardar Cambios</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Bloques Modal */}
      {isEditingBloques && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface border border-surface-3 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-surface-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-100">Configurar Bloques Horarios</h3>
                <p className="text-sm text-neutral-400">Ajusta los horarios globales del colegio.</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddBloque}>+ Añadir Bloque</Button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {editingBloquesData.map((b, idx) => (
                <div key={b.id} className="flex gap-3 items-end bg-surface-2/50 p-3 rounded-xl border border-surface-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Inicio</label>
                    <input type="time" value={b.horaInicio} onChange={e => handleUpdateBloque(idx, 'horaInicio', e.target.value)} className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-sm text-neutral-100 outline-none focus:border-primary-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Fin</label>
                    <input type="time" value={b.horaFin} onChange={e => handleUpdateBloque(idx, 'horaFin', e.target.value)} className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-sm text-neutral-100 outline-none focus:border-primary-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Tipo</label>
                    <select value={b.tipo} onChange={e => handleUpdateBloque(idx, 'tipo', e.target.value as any)} className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-sm text-neutral-100 outline-none focus:border-primary-500">
                      <option value="clase">Clase</option>
                      <option value="recreo">Recreo</option>
                    </select>
                  </div>
                  {b.tipo === 'recreo' && (
                    <div className="flex-[1.5]">
                      <label className="block text-xs font-medium text-neutral-400 mb-1">Nombre</label>
                      <input type="text" value={b.nombre || ''} onChange={e => handleUpdateBloque(idx, 'nombre', e.target.value)} placeholder="Ej. Almuerzo" className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-sm text-neutral-100 outline-none focus:border-primary-500" />
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="text-danger-500 hover:bg-danger-500/10 mb-[1px]" onClick={() => handleRemoveBloque(idx)}>Eliminar</Button>
                </div>
              ))}
              {editingBloquesData.length === 0 && (
                <div className="text-center py-6 text-neutral-500 text-sm">No hay bloques definidos.</div>
              )}
            </div>
            
            <div className="p-5 border-t border-surface-3 flex justify-end gap-3 bg-surface-2/30 shrink-0">
              <Button variant="ghost" onClick={() => setIsEditingBloques(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSaveBloques}>Guardar Configuración</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Bloques Extra Modal */}
      {isEditingBloquesExtra && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface border border-surface-3 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-surface-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-100">Bloques Especiales del Curso</h3>
                <p className="text-sm text-neutral-400">Añade horarios que solo aplican a {cursos.find(c => c.id === selectedCursoId)?.nombre}.</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddBloqueExtra}>+ Añadir Bloque Especial</Button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {editingBloquesExtraData.map((b, idx) => (
                <div key={b.id} className="flex gap-3 items-end bg-surface-2/50 p-3 rounded-xl border border-surface-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Inicio</label>
                    <input type="time" value={b.horaInicio} onChange={e => handleUpdateBloqueExtra(idx, 'horaInicio', e.target.value)} className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-sm text-neutral-100 outline-none focus:border-primary-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Fin</label>
                    <input type="time" value={b.horaFin} onChange={e => handleUpdateBloqueExtra(idx, 'horaFin', e.target.value)} className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-sm text-neutral-100 outline-none focus:border-primary-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Tipo</label>
                    <select value={b.tipo} onChange={e => handleUpdateBloqueExtra(idx, 'tipo', e.target.value as any)} className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-sm text-neutral-100 outline-none focus:border-primary-500">
                      <option value="clase">Clase</option>
                      <option value="recreo">Recreo / Extra</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Día (Opcional)</label>
                    <select value={b.diaSemana || ''} onChange={e => handleUpdateBloqueExtra(idx, 'diaSemana', e.target.value)} className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-sm text-neutral-100 outline-none focus:border-primary-500">
                      <option value="">Toda la semana</option>
                      <option value="1">Lunes</option>
                      <option value="2">Martes</option>
                      <option value="3">Miércoles</option>
                      <option value="4">Jueves</option>
                      <option value="5">Viernes</option>
                    </select>
                  </div>
                  {b.tipo === 'recreo' && (
                    <div className="flex-[1.5]">
                      <label className="block text-xs font-medium text-neutral-400 mb-1">Nombre</label>
                      <input type="text" value={b.nombre || ''} onChange={e => handleUpdateBloqueExtra(idx, 'nombre', e.target.value)} placeholder="Ej. Taller Extra" className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-sm text-neutral-100 outline-none focus:border-primary-500" />
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="text-danger-500 hover:bg-danger-500/10 mb-[1px]" onClick={() => handleRemoveBloqueExtra(idx)}>Eliminar</Button>
                </div>
              ))}
              {editingBloquesExtraData.length === 0 && (
                <div className="text-center py-6 text-neutral-500 text-sm">No hay bloques especiales para este curso.</div>
              )}
            </div>
            
            <div className="p-5 border-t border-surface-3 flex justify-end gap-3 bg-surface-2/30 shrink-0">
              <Button variant="ghost" onClick={() => setIsEditingBloquesExtra(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSaveBloquesExtra}>Guardar Configuración</Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
