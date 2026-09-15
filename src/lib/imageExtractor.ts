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
