const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

export const api = {
  login: (email) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email }) }),

  createSession: (teacherId, subject) =>
    request('/api/sessions/create-session', { method: 'POST', body: JSON.stringify({ teacherId, subject }) }),

  generateQR: (sessionId) => request(`/api/sessions/generate-qr/${sessionId}`),

  getSessionAttendance: (sessionId) => request(`/api/sessions/session-attendance/${sessionId}`),

  getTeacherSessions: (teacherId) => request(`/api/sessions/teacher-sessions/${teacherId}`),

  endSession: (sessionId) =>
    request(`/api/sessions/end-session/${sessionId}`, { method: 'PUT' }),

  markAttendance: (sessionId, studentId) =>
    request('/api/attendance/mark', { method: 'POST', body: JSON.stringify({ sessionId, studentId }) }),

  getStudentAttendance: (studentId) => request(`/api/attendance/student/${studentId}`),
};

export { BASE_URL };
