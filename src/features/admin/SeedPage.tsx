import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export const SeedPage: React.FC = () => {
  const [status, setStatus] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('Montahue2026!');

  const log = (msg: string) => {
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const handleSeed = async () => {
    setLoading(true);
    setStatus([]);
    log('Iniciando proceso de seeding para Colegio Montahue...');

    try {
      // 1. Crear usuario de prueba apoderado
      const apoderadoEmail = 'diemoroy@gmail.com';
      const defaultPassword = password;
      log(`Intentando registrar usuario apoderado: ${apoderadoEmail}...`);

      let apoderadoUid = '';
      try {
        const userCred = await createUserWithEmailAndPassword(auth, apoderadoEmail, defaultPassword);
        apoderadoUid = userCred.user.uid;
        log(`Usuario creado exitosamente con UID: ${apoderadoUid}`);
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          log('El correo ya está registrado en Firebase Auth. Intentando iniciar sesión para recuperar el UID...');
          try {
            const userCred = await signInWithEmailAndPassword(auth, apoderadoEmail, defaultPassword);
            apoderadoUid = userCred.user.uid;
            log(`Inicio de sesión exitoso. UID recuperado: ${apoderadoUid}`);
          } catch (signInErr: any) {
            log(`Error al iniciar sesión con contraseña por defecto: ${signInErr.message}`);
            log('Por favor, si ya cambiaste la contraseña de esa cuenta en Firebase Auth, bórrala de la pestaña "Users" en la consola de Firebase e intenta de nuevo.');
            throw signInErr;
          }
        } else {
          throw err;
        }
      }

      // Si pudimos crear el usuario, o si ya existe (podemos guiar al usuario a crear una cuenta limpia si falla)
      const uids = {
        apoderado: apoderadoUid || 'diemoroy-uid-placeholder',
        admin: 'admin-uid-placeholder',
        docente: 'docente-uid-placeholder'
      };

      // 2. Crear Cursos
      log('Sembrando Cursos...');
      const cursoId = '1-medio-a';
      await setDoc(doc(db, 'cursos', cursoId), {
        nombre: '1° Medio A',
        nivel: 'Enseñanza Media',
        docentes: [uids.docente],
        alumnos: ['alumno-1'],
        creadoEn: serverTimestamp(),
      });
      log('Curso "1° Medio A" creado.');

      // 3. Crear Alumnos
      log('Sembrando Alumnos...');
      const alumnoId = 'alumno-1';
      await setDoc(doc(db, 'alumnos', alumnoId), {
        nombre: 'Benjamin Roy',
        rut: '21.345.678-K',
        cursoId: cursoId,
        apoderados: [uids.apoderado],
        foto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        creadoEn: serverTimestamp(),
      });
      log('Alumno "Benjamin Roy" asociado al curso y al apoderado.');

      // 4. Crear Perfiles de Usuario en Firestore
      log('Sembrando perfiles de usuarios en Firestore...');
      if (apoderadoUid) {
        await setDoc(doc(db, 'usuarios', apoderadoUid), {
          nombre: 'Diemo Roy',
          email: apoderadoEmail,
          rol: 'apoderado',
          cursos: [cursoId],
          alumnos: [alumnoId],
          primerLogin: false,
          creadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        });
        log('Perfil de apoderado guardado en Firestore.');
      }

      // 5. Sembrar Notas
      log('Sembrando calificaciones para Benjamin Roy...');
      const asignaturas = ['Matemáticas', 'Lenguaje', 'Historia', 'Ciencias'];
      let notaIdCounter = 1;
      for (const asig of asignaturas) {
        const notasMock = [6.2, 5.8, 6.5, 7.0];
        for (let i = 0; i < notasMock.length; i++) {
          const id = `nota-${asig.toLowerCase()}-${notaIdCounter++}`;
          await setDoc(doc(db, 'notas', id), {
            alumnoId: alumnoId,
            asignatura: asig,
            evaluacion: `Evaluación ${i + 1}`,
            nota: notasMock[i],
            fecha: Timestamp.fromDate(new Date(2026, 4, 10 + i * 5)),
            docenteId: uids.docente,
            cursoId: cursoId,
            creadoEn: serverTimestamp(),
          });
        }
      }
      log('Calificaciones sembradas correctamente.');

      // 6. Sembrar Asistencia
      log('Sembrando registro de asistencia...');
      let asistenciaIdCounter = 1;
      // Generar 15 días de asistencia (la mayoría presente, algunos ausentes/tardanzas)
      for (let i = 1; i <= 15; i++) {
        const id = `asistencia-${asistenciaIdCounter++}`;
        const estado = i === 5 ? 'ausente' : i === 10 ? 'tardanza' : 'presente';
        
        const docData: any = {
          alumnoId: alumnoId,
          cursoId: cursoId,
          fecha: Timestamp.fromDate(new Date(2026, 4, i)),
          estado: estado,
        };

        if (estado === 'ausente') {
          docData.justificacion = 'Cita médica dental';
          docData.justificadoPor = uids.apoderado;
          docData.justificadoEn = serverTimestamp();
        }

        await setDoc(doc(db, 'asistencia', id), docData);
      }
      log('Registro de asistencia sembrado.');

      // 7. Sembrar Mensajes y Avisos
      log('Sembrando mensajes de comunicación y avisos...');
      await setDoc(doc(db, 'mensajes', 'msg-1'), {
        de: uids.docente,
        para: uids.apoderado,
        asunto: 'Felicitaciones por rendimiento',
        cuerpo: 'Estimado Diemo, quería felicitar el desempeño de Benjamin en la última prueba de Matemáticas. Obtuvo un 7.0.',
        leido: false,
        fecha: Timestamp.fromDate(new Date()),
        alumnoId: alumnoId,
      });

      await setDoc(doc(db, 'avisos', 'aviso-1'), {
        titulo: 'Reunión de Apoderados Junio',
        cuerpo: 'Estimada comunidad, les recordamos que la reunión mensual de apoderados se realizará el próximo jueves a las 19:00 hrs de manera presencial.',
        destinatarios: [uids.apoderado],
        leidoPor: [],
        fecha: Timestamp.fromDate(new Date()),
        critico: true,
        publicadoPor: 'Dirección Colegio Montahue',
      });
      log('Mensajes y Avisos iniciales sembrados.');

      // Cerrar sesión para que puedan loguearse normalmente
      await signOut(auth);
      log('Seeding completado con éxito.');
      log(`Credenciales creadas:\nUsuario: ${apoderadoEmail}\nContraseña: ${defaultPassword}`);
      log('Ya puedes ir a /login para ingresar al portal escolar.');
    } catch (err: any) {
      log(`ERROR durante el seeding: ${err.message || err}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-neutral-100">
      <div className="w-full max-w-lg bg-surface-2 border border-surface-3 rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <span className="text-4xl">🌱</span>
          <h1 className="text-2xl font-bold font-heading">PortalEscolar Database Seeder</h1>
          <p className="text-sm text-neutral-400">
            Esta página creará las cuentas de prueba y sembrará datos iniciales de calificaciones, asistencia y mensajes en tu proyecto Firebase.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-surface-3 p-4 rounded-xl space-y-3 border border-neutral-800">
            <h2 className="text-sm font-semibold text-primary-400">Usuario a Crear/Usar:</h2>
            <p className="text-sm text-neutral-300">
              <strong className="text-neutral-400">Email:</strong> diemoroy@gmail.com
            </p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-400">Contraseña de la cuenta:</label>
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full text-sm bg-surface-2 border border-surface-3 rounded-lg px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-primary-500 font-mono"
                placeholder="Ingresa la contraseña"
              />
              <p className="text-[10px] text-neutral-500">
                * Si el usuario ya existe en Firebase, escribe la contraseña actual que le asignaste y el script la usará para loguearse y sembrar Firestore.
              </p>
            </div>
            <p className="text-sm text-neutral-300">
              <strong className="text-neutral-400">Rol:</strong> Apoderado (Benjamín Roy)
            </p>
          </div>

          <button
            onClick={handleSeed}
            disabled={loading}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 rounded-xl font-medium text-white transition-all shadow-lg shadow-primary-900/30"
          >
            {loading ? 'Sembrando Datos...' : 'Comenzar Seeding'}
          </button>
        </div>

        {status.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Progreso:</h3>
            <div className="bg-neutral-950 p-4 rounded-xl h-48 overflow-y-auto font-mono text-xs text-neutral-300 space-y-1 border border-neutral-900">
              {status.map((s, index) => (
                <div key={index}>{s}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
