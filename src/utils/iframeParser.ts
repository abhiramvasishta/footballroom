export interface ParsedIframe {
  src: string;
  allow: string | null;
  allowFullScreen: boolean;
  sandbox: string | null;
}

/**
 * Parses raw iframe embed code and safely extracts specific allowed attributes.
 * Discards any other potentially dangerous HTML or attributes.
 */
export function parseIframeEmbedCode(code: string): ParsedIframe | null {
  if (!code || typeof code !== 'string') return null;
  if (!code.toLowerCase().includes('<iframe') || !code.toLowerCase().includes('src=')) return null;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(code, 'text/html');
    const iframe = doc.querySelector('iframe');

    if (!iframe) return null;

    const src = iframe.getAttribute('src');
    
    if (!src) return null;

    return {
      src,
      allow: iframe.getAttribute('allow'),
      allowFullScreen: iframe.hasAttribute('allowfullscreen'),
      sandbox: iframe.getAttribute('sandbox')
    };
  } catch (error) {
    console.error("Failed to parse iframe code:", error);
    return null;
  }
}
