/*
 * Search block: keyword input with a search icon.
 *
 * Content contract (all optional):
 * - a link to a *.json query index -> live results rendered below the input
 * - any other link -> results page; submitting navigates to <link>?q=<keyword>
 * - plain text -> input placeholder (default "Enter Keyword")
 * With no links, the block searches /query-index.json.
 */
const DEFAULT_INDEX = '/query-index.json';

function normalize(text) {
  return (text || '').toLowerCase();
}

let indexCache;
async function fetchIndex(source) {
  if (!indexCache) {
    indexCache = fetch(source)
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .then((json) => json.data || [])
      .catch(() => []);
  }
  return indexCache;
}

function renderResults(list, hits, terms) {
  list.replaceChildren();
  hits.slice(0, 20).forEach((hit) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = hit.path;
    a.textContent = hit.title || hit.path;
    li.append(a);
    if (hit.description) {
      const p = document.createElement('p');
      p.textContent = hit.description;
      li.append(p);
    }
    list.append(li);
  });
  if (!hits.length && terms.length) {
    const li = document.createElement('li');
    li.className = 'search-no-results';
    li.textContent = 'No results found.';
    list.append(li);
  }
}

export default function decorate(block) {
  const links = [...block.querySelectorAll('a[href]')];
  const indexLink = links.find((a) => /\.json(\?|$)/.test(a.href));
  const pageLink = links.find((a) => a !== indexLink);
  const placeholder = [...block.querySelectorAll('p, div')]
    .filter((el) => !el.children.length)
    .map((el) => el.textContent.trim())
    .find(Boolean) || 'Enter Keyword';

  const form = document.createElement('form');
  form.className = 'search-box';
  form.setAttribute('role', 'search');

  const icon = document.createElement('span');
  icon.className = 'search-icon';
  icon.setAttribute('aria-hidden', 'true');

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.className = 'search-input';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);
  const params = new URLSearchParams(window.location.search);
  if (params.get('q')) input.value = params.get('q');

  form.append(icon, input);

  const results = document.createElement('ul');
  results.className = 'search-results';

  const live = !pageLink;
  const source = indexLink ? indexLink.href : DEFAULT_INDEX;

  const run = async () => {
    const terms = normalize(input.value).split(/\s+/).filter((t) => t.length > 1);
    if (!terms.length) {
      results.replaceChildren();
      return;
    }
    const data = await fetchIndex(source);
    const hits = data.filter((row) => {
      const hay = normalize(`${row.title} ${row.description}`);
      return terms.every((t) => hay.includes(t));
    });
    renderResults(results, hits, terms);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (live) {
      run();
      return;
    }
    const url = new URL(pageLink.href, window.location.href);
    url.searchParams.set('q', input.value.trim());
    window.location.href = url.toString();
  });

  if (live) {
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(run, 250);
    });
  }

  block.replaceChildren(form, ...(live ? [results] : []));
  if (live && input.value) run();
}
