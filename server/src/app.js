import cors from 'cors';
import express from 'express';
import configuracionRoutes from './modules/configuracion/configuracion.routes.js';
import habilidadesRoutes from './modules/habilidades/habilidades.routes.js';
import materiasRoutes from './modules/materias/materias.routes.js';
import recomendacionesRoutes from './modules/recomendaciones/recomendaciones.routes.js';
import resumenRoutes from './modules/resumen/resumen.routes.js';
import solicitudesRoutes from './modules/solicitudes/solicitudes.routes.js';
import tutoresRoutes from './modules/tutores/tutores.routes.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
  app.use(express.json());

  app.get('/api/salud', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api/tutores', tutoresRoutes);
  app.use('/api/materias', materiasRoutes);
  app.use('/api/habilidades', habilidadesRoutes);
  app.use('/api/solicitudes', solicitudesRoutes);
  app.use('/api/recomendaciones', recomendacionesRoutes);
  app.use('/api/configuracion', configuracionRoutes);
  app.use('/api/resumen', resumenRoutes);

  app.use('/api', (_req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada.' });
  });

  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    if (status === 500) console.error(error);
    res.status(status).json({
      message: status === 500 ? 'Error interno del servidor.' : error.message,
      ...(status === 500 ? {} : error.details),
    });
  });

  return app;
}
