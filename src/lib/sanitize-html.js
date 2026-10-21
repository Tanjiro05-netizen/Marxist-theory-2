import DOMPurify from 'dompurify';

const FALLBACK_UNSAFE_HTML = /<\/?(?:script|style|link|iframe|object|embed|form|input|button|textarea|select|svg|math|audio|video|base|meta)[^>]*>|\s(?:on[a-z]+|srcdoc|formaction|action|ping|style)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const FALLBACK_UNSAFE_URL = /(?:javascript|vbscript|data:text\/html|data:application\/javascript):/i;
const SAFE_EBOOK_URI = /^(?:(?:https?|mailto|tel|blob):|data:image\/(?:png|gif|jpe?g|webp);base64,|[#/]|\.\.?\/|[a-z0-9_.~-])/i;

const purifier = () => {
  const value = typeof DOMPurify?.sanitize === 'function' ? DOMPurify : DOMPurify?.default;
  return typeof value?.sanitize === 'function' ? value : null;
};

const fallback = (html) => `${html || ''}`
  .replace(FALLBACK_UNSAFE_HTML, '')
  .replace(FALLBACK_UNSAFE_URL, '#')
  .trim();

export const sanitizeRichHtml = (html = '') => {
  if (!html) return '';
  const value = purifier();
  return value
    ? value.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target', 'rel'],
      FORBID_TAGS: ['script', 'style', 'link', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'svg', 'math', 'audio', 'video', 'base', 'meta'],
      FORBID_ATTR: ['style', 'srcdoc', 'formaction', 'action', 'ping'],
    })
    : fallback(html);
};

export const sanitizeEpubHtml = (html = '') => {
  const clean = sanitizeRichHtml(html);
  if (typeof DOMParser === 'undefined') return clean;

  const doc = new DOMParser().parseFromString(clean, 'text/html');
  doc.querySelectorAll('*').forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith('on') || ['srcdoc', 'formaction', 'action', 'ping', 'style'].includes(name)) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (['href', 'src', 'xlink:href'].includes(name)) {
        if (!SAFE_EBOOK_URI.test(value) || /^(?:javascript|vbscript|data:text\/html|data:application\/javascript):/i.test(value)) {
          element.removeAttribute(attribute.name);
        }
      }
    });

    if (element.tagName.toLowerCase() === 'img') {
      const source = element.getAttribute('src') || '';
      if (!/^(?:blob:|data:image\/)/i.test(source)) element.remove();
    }

    if (element.tagName.toLowerCase() === 'a' && element.getAttribute('href')) {
      const href = element.getAttribute('href');
      if (/^(?:https?:|mailto:|tel:)/i.test(href)) {
        element.setAttribute('target', '_blank');
        element.setAttribute('rel', 'noopener noreferrer nofollow');
      }
    }
  });

  return doc.body.innerHTML;
};
