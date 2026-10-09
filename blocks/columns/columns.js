/**
 * Detects the "bio" layout: a single row with a picture-only column and a text column
 * that opens with a short paragraph (the person's name) directly followed by a heading
 * (the person's title). Only that structure gets the bio styling; any other columns
 * content keeps the generic columns behaviour.
 */
function decorateBio(block) {
  if (block.children.length !== 1) return;
  const cols = [...block.firstElementChild.children];
  if (cols.length !== 2) return;
  const imgCol = cols.find((col) => col.classList.contains('columns-img-col'));
  const textCol = cols.find((col) => col !== imgCol);
  if (!imgCol || !textCol) return;
  const [first, second] = textCol.children;
  if (!first || first.tagName !== 'P' || first.querySelector('picture, a')) return;
  if (!second || !/^H[1-6]$/.test(second.tagName)) return;
  block.classList.add('columns-bio');
  textCol.classList.add('columns-bio-text');
  first.classList.add('columns-bio-name');
  second.classList.add('columns-bio-title');
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  decorateBio(block);
}
