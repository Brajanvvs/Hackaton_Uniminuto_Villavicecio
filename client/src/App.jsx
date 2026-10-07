import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ConfiguracionPage from './modules/configuracion/ConfiguracionPage';
import Inicio from './modules/inicio/Inicio';
import Layout from './modules/layout/Layout';
import HistorialPage from './modules/recomendaciones/HistorialPage';
import ResultadoPage from './modules/recomendaciones/ResultadoPage';
import SolicitudPage from './modules/solicitudes/SolicitudPage';
import TutorFormPage from './modules/tutores/TutorFormPage';
import TutoresPage from './modules/tutores/TutoresPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="tutores" element={<TutoresPage />} />
          <Route path="tutores/nuevo" element={<TutorFormPage />} />
          <Route path="tutores/:id/editar" element={<TutorFormPage />} />
          <Route path="solicitud" element={<SolicitudPage />} />
          <Route path="resultado/:id" element={<ResultadoPage />} />
          <Route path="historial" element={<HistorialPage />} />
          <Route path="configuracion" element={<ConfiguracionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
