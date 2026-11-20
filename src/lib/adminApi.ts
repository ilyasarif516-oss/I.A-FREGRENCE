import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './supabase';

function getAdminApiUrl(action: string, query?: Record<string, string>): string {
  const base = supabaseUrl.replace(/\/+$/, '');
  const url = new URL(`${base}/functions/v1/admin-api`);
  url.searchParams.set('action', action);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

export async function callAdminApi<T>(
  action: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    formData?: FormData;
    query?: Record<string, string>;
  } = {}
): Promise<T> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Connect VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and deploy the admin-api Edge Function.'
    );
  }

  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    'X-Requested-With': 'ia-fragrance-admin',
  };

  let requestBody: BodyInit | undefined;
  if (options.formData) {
    requestBody = options.formData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(getAdminApiUrl(action, options.query), {
      method,
      headers,
      body: requestBody,
    });
  } catch {
    throw new Error(
      'Unable to reach the admin backend. Ensure the admin-api Edge Function is deployed.'
    );
  }

  const parsed = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!response.ok) {
    const message = parsed?.error || `Request failed (${response.status}).`;
    throw new Error(message);
  }

  return parsed;
}
