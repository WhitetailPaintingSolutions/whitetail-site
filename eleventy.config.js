/* ============================================================
   Eleventy configuration.

   This turns the content files in src/_data and src/blog into the
   finished HTML in _site. Netlify runs it in the cloud every time the
   CMS saves, so nothing here ever needs to run on anybody's computer.

   Keep this file boring. It is the one piece of the site that, if it
   breaks, stops every page from building.
   ============================================================ */

export default function (eleventyConfig) {

  /* Files copied straight through, untouched. The CMS writes uploaded
     photos into assets/uploads, so that folder has to come along. */
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy({ 'src/admin': 'admin' });

  /* The admin page is copied, never templated. Without this, Eleventy
     also treats admin/index.html as a Nunjucks template and tries to
     render the CMS markup — which works today only because that file
     happens to contain no {{ }} or {% %}. Ignoring it removes the trap. */
  eleventyConfig.ignores.add('src/admin/**');

  /* Rebuild when the stylesheet changes while previewing locally. */
  eleventyConfig.addWatchTarget('src/assets/');

  /* ---------- filters ---------- */

  // "March 2026" — what a person reads on a blog post.
  eleventyConfig.addFilter('readableDate', (d) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    }));

  // "2026-03-04" — what goes in the <time datetime> attribute.
  eleventyConfig.addFilter('isoDate', (d) =>
    new Date(d).toISOString().slice(0, 10));

  // Projects filtered to one category, newest first.
  eleventyConfig.addFilter('byCategory', (projects, cat) =>
    (projects || []).filter((p) => p.category === cat));

  eleventyConfig.addFilter('newestFirst', (items) =>
    [...(items || [])].sort((a, b) => new Date(b.date) - new Date(a.date)));

  eleventyConfig.addFilter('limit', (arr, n) => (arr || []).slice(0, n));

  // "01", "02" — the big numerals on the step blocks.
  eleventyConfig.addFilter('pad', (n) => String(n).padStart(2, '0'));

  /* Splits a CMS text field into paragraphs on blank lines.
     Doing it here rather than in the template, because Nunjucks string
     literals do not handle "\n\n" reliably. */
  eleventyConfig.addFilter('paragraphs', (s) =>
    String(s || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean));

  /* A photo slot. If the CMS has a real image for it, that image is
     rendered. If not, the hatched placeholder appears instead, naming
     what belongs there.

     This is why uploading a photo in the CMS makes the placeholder
     disappear on its own — there is no second step to remember. */
  eleventyConfig.addShortcode('photo', function (src, alt, shape = 'ph-tall', hint = '') {
    const cls = `ph ${shape}`;
    if (src) {
      return `<div class="${cls} has-photo"><img src="${src}" alt="${esc(alt || '')}" loading="lazy" decoding="async"></div>`;
    }
    return `<div class="${cls}"><span>${hint || esc(alt || 'Photo')}</span></div>`;
  });

  /* Blog posts, newest first, drafts left out. A post marked draft
     stays in the repo but never appears on the site. */
  eleventyConfig.addCollection('posts', (api) =>
    api.getFilteredByGlob('src/blog/*.md')
       .filter((p) => !p.data.draft)
       .sort((a, b) => b.date - a.date));

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    templateFormats: ['njk', 'md', 'html'],
  };
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
                  .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
