import { env } from '@/config/env';
import {
  getAccessToken,
  readApiError,
  tryRefreshAccess,
} from '@/lib/api-client';

/**
 * Télécharge un fichier protégé (CSV d'inscriptions, export comptable) avec le
 * jeton Keycloak, puis le propose à l'enregistrement. Rafraîchit le jeton une
 * fois sur 401. Lève l'`ApiError` du back (format V1) en cas d'échec.
 */
export async function telechargerFichier(
  chemin: string,
  params: Record<string, string | undefined> = {},
  nomParDefaut = 'export.csv',
): Promise<void> {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v) as [string, string][],
  ).toString();
  const url = `${env.API_URL}${chemin}${qs ? `?${qs}` : ''}`;
  const envoyer = () =>
    fetch(url, {
      headers: getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {},
      credentials: 'include',
    });
  let res = await envoyer();
  if (res.status === 401) {
    await tryRefreshAccess().catch(() => undefined);
    res = await envoyer();
  }
  if (!res.ok) throw await readApiError(res);
  const blob = await res.blob();
  const dispo = res.headers.get('content-disposition') ?? '';
  const nom = /filename="?([^";]+)"?/.exec(dispo)?.[1] ?? nomParDefaut;
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(blob);
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(lien.href);
}
