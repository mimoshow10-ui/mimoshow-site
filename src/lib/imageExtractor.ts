export function extractImageUrls(input: any): string[] {
  if (!input) return [];
  let items: any[] = [];
  
  try {
    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          items = JSON.parse(trimmed);
        } catch {
          items = [trimmed];
        }
      } else {
        items = trimmed.split(/[\r\n]+/).map((s: string) => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(input)) {
      items = input;
    }

    const urls: string[] = [];
    for (const item of items) {
      if (typeof item === 'string' && item.trim()) {
        let str = item.trim();

        if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/')) {
          urls.push(str);
        } else if (str.includes(',')) {
          const parts = str.split(',').map((s: string) => s.trim()).filter(Boolean);
          urls.push(...parts);
        } else {
          urls.push(str);
        }
      }
    }
    return urls;
  } catch {
    return [];
  }
}

/**
 * Retorna a URL otimizada e comprimida da imagem (redimensionamento e compressão via CDN)
 * Reduz em até 90% o peso das fotos, acelerando drasticamente o carregamento no celular e desktop.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  width: number = 350,
  quality: number = 75
): string {
  if (!url || typeof url !== 'string') return '';
  let cleanUrl = url.trim();

  if (cleanUrl.startsWith('http://')) {
    cleanUrl = cleanUrl.replace(/^http:\/\//i, 'https://');
  }

  // Se a imagem estiver hospedada no Supabase Storage, usa o endpoint nativo de renderização e compressão
  if (cleanUrl.includes('supabase.co/storage/v1/object/public/')) {
    const separator = cleanUrl.includes('?') ? '&' : '?';
    return cleanUrl.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    ) + `${separator}width=${width}&quality=${quality}&resize=contain`;
  }

  return cleanUrl;
}
