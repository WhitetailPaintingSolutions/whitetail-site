# Whitetail Painting Solutions — site + CMS

Nine pages, editable at `/admin` without touching code. Content lives as
JSON and Markdown in this repo; Netlify rebuilds the site whenever the
CMS saves.

```
src/
  _data/            what the CMS edits
    site.json         phone, links, service area, form destination
    pages/*.json      per-page headings, photos, questions
    reviews.json      real reviews only — empty by design
    projects.json     before/after photos
  blog/*.md         the Notes posts
  _includes/        the templates (header, footer, page shells)
  assets/           stylesheet, script, logo, favicons
    uploads/          where CMS photo uploads land
  admin/            the CMS itself
  *.njk             one file per page
eleventy.config.js  turns all of the above into _site/
netlify.toml        tells Netlify how to build it
```

## Getting it running

**1. Put it on GitHub.** New repository, drag this whole folder in.
Do not upload `node_modules` or `_site` — `.gitignore` already excludes
them.

**2. Connect it to Netlify.** Add new site → import from GitHub → pick
the repo. Netlify reads `netlify.toml` and fills in the build settings
itself. Nothing to type.

**3. Point the CMS at the repo.** Open `src/admin/config.yml` and change
this line to your real repository:

```yaml
  repo: YOUR-GITHUB-USERNAME/whitetail-site
```

Until that is right, `/admin` will load but nothing will save.

**4. Log in.** Go to `yoursite.netlify.app/admin` and choose **Sign In
with Token**. It gives you a link that opens GitHub with the right
permissions already ticked; generate the token, paste it back. The token
is stored in your browser, so you do this once per device.

No OAuth server, no Netlify Identity, no Git Gateway.

## Using it

Everything in the left-hand list writes to a real file:

| Screen | What it changes |
|---|---|
| **Settings** | Phone, email, Facebook, service area, form destination |
| **Pages** | Each page's headline, opening paragraph, photos, questions |
| **Reviews** | Customer reviews |
| **Photos** | Before/after jobs, filed by trade |
| **Notes** | Blog posts |

Save, and Netlify rebuilds in about thirty seconds.

**Photos.** Upload one and the hatched placeholder disappears on its own
— there is no second step. Every photo field is optional, so the site
looks right at every stage of filling it in.

**Reviews.** The whole section hides itself while the list is empty, so
you never have blank quote cards on a live site. Paste real reviews word
for word. Do not write these.

**Before/after photos.** Each job picks a trade, and it appears on both
the Our Work page and that trade's page. Before and after are separate
fields — one without the other still works.

**Notes.** Write in the editor, set a date, save. The listing page,
the home page block, and the post page all appear on their own. Tick
**Draft** to keep something in the repo but off the site.

## Before it goes live

**The phone number is still Nathanael's** — `717-320-4903`. Change it in
Settings, both fields (the readable one and the `+1...` link one).

**The form delivers nothing.** It validates and shows the thank-you, but
nothing is sent anywhere. Fill in *Estimate form destination* in Settings
and it switches on. The fields it sends are:

```
first_name, last_name, phone, email, address, job_type, timing, notes,
source_page
```

Plain on purpose, close to what Jobber and Housecall Pro expect on
import, so the CRM decision can wait.

**Check two factual claims.** The insurance wording and the town list are
statements about the business, not marketing copy. The towns are Juniata
County geography, not a record of where they have worked — edit them.

**The starter Note.** One post is included, about how to tell whether a
house needs painting yet. It is honest and useful, but read it before
publishing — it goes out under their name.

## Things worth knowing

**The CMS version is pinned.** `src/admin/index.html` loads Sveltia at
`0.212.1` rather than "latest". Sveltia's own instructions use an
unpinned tag, which means the admin screen can change without you
deploying anything. Pinned, it moves when you decide it moves. To
update, change the number and check that saving still works.

Sveltia is beta, targeting 1.0 in late 2026, and is maintained by one
person. That is a real risk, and it is survivable here because your
content is plain files in your own repo — if it ever stops, the site
keeps building and you go back to editing in GitHub. It also reads
Decap's config format, so pointing a different editor at these same
files later is not a migration.

It has no user roles and no conflict prevention. Fine for one editor;
worth knowing before you add a second.

**The mobile menu panel sits outside the `<header>`** in
`_includes/base.njk`, on purpose. `header.site` has `backdrop-filter` on
it, which makes it the containing block for any `position: fixed`
descendant — with the panel inside, `bottom: 0` resolved to the bottom of
the 78px bar and the menu opened 66px tall. Moving it back inside breaks
it again, silently, because the markup still looks correct.

**Gold comes in two shades.** `--gold` (`#D2A95F`) for dark backgrounds,
`--gold-ink` (`#7A5A24`) for the cream bands. Plain gold on cream is
about 2:1 contrast — unreadable. They are not interchangeable.

**Headings use Playfair Display** as a stand-in for the logo's display
serif. Same species, not the same face. If the real one gets licensed for
web, swap it in `_includes/base.njk` and the `.d` rule in `style.css`.

## Checked

- Real build runs clean; all 10 routes serve
- No horizontal scroll from 320px to 1680px on any page
- No wrapped nav at any desktop width
- Mobile menu opens and closes on every page
- Every internal link resolves; no page links to itself
- No JavaScript errors, no failed asset requests
- No unrendered template syntax in the output
- Every CMS field maps to a real key in a real data file, and no data
  file has orphaned keys the CMS cannot reach
- Form endpoint proven to flow from Settings through to the page
- Reading level grade 3.9 at worst, American spelling, no absolutes
- No invented reviews, statistics, guarantees, or client names
