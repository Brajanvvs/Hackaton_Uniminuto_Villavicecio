async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      method: options.method || 'GET',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con la API. Revisa que el servidor esté activo y que server/.env tenga la contraseña de MySQL.');
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'No se pudo completar la operación.');
    error.code = data.code;
    error.recommendationId = data.recommendationId;
    throw error;
  }
  return data;
}

export const api = {
  resumen: () => request('/api/resumen'),
  tutores: () => request('/api/tutores'),
  tutor: (id) => request(`/api/tutores/${id}`),
  guardarTutor: (body, id) => request(id ? `/api/tutores/${id}` : '/api/tutores', {
    method: id ? 'PUT' : 'POST',
    body,
  }),
  eliminarTutor: (id) => request(`/api/tutores/${id}`, { method: 'DELETE' }),
  materias: () => request('/api/materias'),
  crearMateria: (name) => request('/api/materias', { method: 'POST', body: { name } }),
  habilidades: () => request('/api/habilidades'),
  crearSolicitud: (body) => request('/api/solicitudes', { method: 'POST', body }),
  recomendaciones: () => request('/api/recomendaciones'),
  recomendacion: (id) => request(`/api/recomendaciones/${id}`),
  elegirTutor: (id, tutorId) => request(`/api/recomendaciones/${id}/eleccion`, { method: 'PUT', body: { tutorId } }),
  cancelarTutoria: (id, body) => request(`/api/recomendaciones/${id}/cancelacion`, { method: 'POST', body }),
  configuracion: () => request('/api/configuracion'),
  guardarConfiguracion: (body) => request('/api/configuracion', { method: 'PUT', body }),
};
