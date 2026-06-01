import { api } from './client.js';

export const listHydrants = (params = {}) =>
  api.get('/hydrants', { params }).then((r) => r.data);
export const getHydrant = (id) => api.get(`/hydrants/${id}`).then((r) => r.data);
export const createHydrant = (data) => api.post('/hydrants', data).then((r) => r.data);
export const createHydrantsBulk = (items) =>
  api.post('/hydrants', { items }).then((r) => r.data);
export const updateHydrant = (id, data) =>
  api.patch(`/hydrants/${id}`, data).then((r) => r.data);
export const deleteHydrant = (id) => api.delete(`/hydrants/${id}`).then((r) => r.data);

export const listInspections = (hydrantId) =>
  api.get(`/hydrants/${hydrantId}/inspections`).then((r) => r.data);

export const createInspection = (hydrantId, fields, files = []) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'weakness') {
      form.append('weakness', value || '');
    } else if (value === null || value === undefined) {
      // skip null tri-state checks
    } else if (typeof value === 'boolean') {
      form.append(key, String(value));
    }
  }
  for (const f of files) form.append('photos', f);
  return api
    .post(`/hydrants/${hydrantId}/inspections`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const downloadQrSheetPdf = (brigadeId) =>
  downloadPdf(`/brigades/${brigadeId}/qr-sheet.pdf`, `qr-sheet-${brigadeId}.pdf`);

export const downloadDefectActDocx = (brigadeId, body) =>
  downloadDocx(`/brigades/${brigadeId}/defect-act.docx`, body, `defect-act-${brigadeId}.docx`);

export const downloadAllDefectActDocx = (body) =>
  downloadDocx(`/reports/defects-all-act.docx`, body, `defect-act-all.docx`);

async function downloadDocx(path, body, filename) {
  const res = await api.post(path, body, { responseType: 'blob' });
  const blob = new Blob([res.data], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return filename;
}

async function downloadPdf(path, filename) {
  const res = await api.get(path, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return filename;
}
