import {
  findFullBookAnchorTarget,
  findNoteFallbackTarget,
  getHrefParts,
  getNoteTargetFromHash,
  getScrollTopForTarget,
} from './epubNavigation.js';

describe('epubNavigation', () => {
  test('parses same-document EPUB hash links', () => {
    expect(getHrefParts('#n12')).toEqual({ base: '', hash: 'n12' });
    expect(getHrefParts('Text/Section0002.xhtml#f13')).toEqual({
      base: 'Text/Section0002.xhtml',
      hash: 'f13',
    });
  });

  test('understands common footnote source and reference ids', () => {
    expect(getNoteTargetFromHash('n12')).toEqual({ kind: 'reference', number: '12' });
    expect(getNoteTargetFromHash('f12')).toEqual({ kind: 'source', number: '12' });
  });

  test('finds hash-only references outside the first rendered section', () => {
    document.body.innerHTML = `
      <div data-testid="scroller">
        <section data-epub-section="true">
          <h1>Front matter</h1>
        </section>
        <section data-epub-section="true">
          <p>Body text <sup><a id="f12" href="#n12">[12]</a></sup></p>
          <p class="ref">References</p>
          <p><a id="n12" href="#f12">12.</a> Capital Volume I.</p>
        </section>
      </div>
    `;

    const scroller = document.querySelector('[data-testid="scroller"]');
    const sourceAnchor = document.getElementById('f12');

    expect(findFullBookAnchorTarget(scroller, { hash: 'n12', sourceAnchor }))
      .toBe(document.getElementById('n12'));
  });

  test('falls back to the displayed reference number when exact ids are missing', () => {
    document.body.innerHTML = `
      <div data-testid="scroller">
        <section data-epub-section="true">
          <p>Body text <sup><a href="#missing-note">[12]</a></sup></p>
        </section>
        <section data-epub-section="true">
          <p class="ref">References</p>
          <p><a href="#f12">12.</a> Capital Volume I.</p>
        </section>
      </div>
    `;

    const scroller = document.querySelector('[data-testid="scroller"]');
    const sourceAnchor = scroller.querySelector('sup a');
    const referenceAnchor = Array.from(scroller.querySelectorAll('a')).find((anchor) => anchor.textContent === '12.');

    expect(findFullBookAnchorTarget(scroller, { hash: 'missing-note', sourceAnchor }))
      .toBe(referenceAnchor);
  });

  test('can find the source number when clicking a reference back-link', () => {
    document.body.innerHTML = `
      <div data-testid="scroller">
        <section data-epub-section="true">
          <p>Body text <sup><a id="f13" href="#n13">[13]</a></sup></p>
          <p class="ref">References</p>
          <p><a id="n13" href="#f13">13.</a> Scheherazade.</p>
        </section>
      </div>
    `;

    const scroller = document.querySelector('[data-testid="scroller"]');

    expect(findNoteFallbackTarget(scroller, { kind: 'source', number: '13' }))
      .toBe(document.getElementById('f13'));
  });

  test('computes scroll position relative to the reader scroller', () => {
    const scroller = document.createElement('div');
    const target = document.createElement('a');
    scroller.scrollTop = 200;
    scroller.getBoundingClientRect = jest.fn(() => ({ top: 50 }));
    target.getBoundingClientRect = jest.fn(() => ({ top: 300 }));

    expect(getScrollTopForTarget(scroller, target, 24)).toBe(426);
  });
});
