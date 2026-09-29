/** Partage natif, sinon copie du lien. `cancelled` : l'utilisateur a fermé la feuille de partage. */
export const shareLink = async ({ title, url }: { title: string; url: string }): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> => {
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title, url });
      return 'shared';
    }
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError' ? 'cancelled' : 'failed';
  }
};
