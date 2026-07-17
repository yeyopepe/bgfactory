// Persistencia del estado: autoguardado en localStorage + exportar/importar JSON.

const STORAGE_KEY = 'errantes:state';

export function saveToLocalStorage(components) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ components }));
}

export function loadFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function exportToJsonFile(components, filename = 'errantes-componentes.json') {
  const blob = new Blob([JSON.stringify({ components }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function importFromJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        resolve(data.components ?? []);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
