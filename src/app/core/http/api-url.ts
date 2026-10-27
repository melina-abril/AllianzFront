import { environment } from '../../../environments/environment';

export function apiUrl(path: string): string {
  const base = environment.apiBaseUrl.replace(/\/+$/, '');
  const resource = `/${path.replace(/^\/+/, '')}`;
  // Los servicios del contrato ya incluyen /api y la configuración local también.
  const suffix = base.endsWith('/api') && (resource === '/api' || resource.startsWith('/api/'))
    ? resource.slice(4)
    : resource;
  return `${base}${suffix}`;
}
