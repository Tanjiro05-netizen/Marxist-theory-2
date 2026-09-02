const NOTE_HASH_RE = /(?:^|[^a-z])([fn])(\d+)(?:$|[^0-9])/i;

export const getHrefParts = (href) => {
  const value = `${href || ''}`.trim();
  const hashIndex = value.indexOf('#');

  if (hashIndex < 0) {
    return { base: value, hash: '' };
  }

  const rawHash = value.slice(hashIndex + 1);
  let hash = rawHash;
  try {
    hash = decodeURIComponent(rawHash);
  } catch {
    hash = rawHash;
  }

  return {
    base: value.slice(0, hashIndex),
    hash,
  };
};

const getAnchorAttributes = (element) => [
  element.getAttribute('id'),
  element.getAttribute('name'),
  element.getAttribute('data-epub-anchor-id'),
  element.getAttribute('data-epub-anchor-name'),
].filter(Boolean);

export const findAnchorByIdOrName = (root, anchor) => {
  if (!root || !anchor) return null;

  return Array.from(
    root.querySelectorAll('[id], [name], [data-epub-anchor-id], [data-epub-anchor-name]')
  ).find((element) => getAnchorAttributes(element).includes(anchor)) || null;
};

export const getNoteTargetFromHash = (hash) => {
  const match = `${hash || ''}`.match(NOTE_HASH_RE);
  if (!match) return null;

  return {
    kind: match[1].toLowerCase() === 'n' ? 'reference' : 'source',
    number: match[2],
  };
};

export const getNoteNumberFromText = (text) => {
  const normalized = `${text || ''}`.replace(/\s+/g, '').trim();
  const match = normalized.match(/^\[?(\d+)\]?\.?$/);
  return match?.[1] || null;
};

const isReferenceNumberText = (text, number) => {
  const normalized = `${text || ''}`.replace(/\s+/g, '').trim();
  return normalized === `${number}.` || normalized === `${number}` || normalized === `${number})`;
};

const isSourceNumberText = (text, number) => {
  const normalized = `${text || ''}`.replace(/\s+/g, '').trim();
  return normalized === `[${number}]` || normalized === `${number}`;
};

export const findNoteFallbackTarget = (root, { kind, number } = {}) => {
  if (!root || !number) return null;

  const anchors = Array.from(root.querySelectorAll('a'));
  const expectedIdPrefix = kind === 'source' ? 'f' : 'n';
  const expectedBackHref = kind === 'source' ? `#n${number}` : `#f${number}`;
  const textMatcher = kind === 'source' ? isSourceNumberText : isReferenceNumberText;

  return anchors.find((anchor) => {
    const attrs = getAnchorAttributes(anchor);
    const href = anchor.getAttribute('href') || '';

    return (
      attrs.some((value) => value.toLowerCase() === `${expectedIdPrefix}${number}`.toLowerCase()) ||
      (href.toLowerCase() === expectedBackHref.toLowerCase() && textMatcher(anchor.textContent, number))
    );
  }) || anchors.find((anchor) => textMatcher(anchor.textContent, number)) || null;
};

export const findFullBookAnchorTarget = (scroller, { hash, preferredSection, sourceAnchor } = {}) => {
  if (!scroller || !hash) return null;

  const exactPreferred = findAnchorByIdOrName(preferredSection, hash);
  if (exactPreferred) return exactPreferred;

  const exactAnywhere = findAnchorByIdOrName(scroller, hash);
  if (exactAnywhere) return exactAnywhere;

  const noteTarget = getNoteTargetFromHash(hash);
  if (noteTarget) {
    const fallbackTarget = findNoteFallbackTarget(scroller, noteTarget);
    if (fallbackTarget) return fallbackTarget;
  }

  const textNumber = getNoteNumberFromText(sourceAnchor?.textContent);
  if (textNumber) {
    return findNoteFallbackTarget(scroller, {
      kind: noteTarget?.kind || 'reference',
      number: textNumber,
    });
  }

  return null;
};

export const getScrollTopForTarget = (scroller, target, offset = 24) => {
  if (!scroller || !target) return 0;

  const scrollerRect = scroller.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  return scroller.scrollTop + targetRect.top - scrollerRect.top - offset;
};
