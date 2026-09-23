/* ============================================================
   WHITETAIL PAINTING SOLUTIONS — site script

   Two jobs only: the menus, and the estimate form. Everything else
   on this site is plain HTML and CSS on purpose, so there is less
   that can break.
   ============================================================ */

/* ---------- footer year ---------- */
document.querySelectorAll('[data-year]').forEach(el => {
  el.textContent = new Date().getFullYear();
});

/* ---------- mobile menu ----------
   The body gets locked while the panel is open so the page behind it
   does not scroll under your finger. */
(function () {
  const burger = document.querySelector('.burger');
  const panel  = document.getElementById('mobileNav');
  if (!burger || !panel) return;

  function set(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) panel.setAttribute('data-open', '');
    else      panel.removeAttribute('data-open');
    document.body.classList.toggle('locked', open);
  }

  burger.addEventListener('click', () => {
    set(burger.getAttribute('aria-expanded') !== 'true');
  });

  // Tapping any link closes it, so an in-page anchor is not hidden
  // behind a full-screen menu.
  panel.addEventListener('click', e => {
    if (e.target.closest('a')) set(false);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') set(false);
  });

  // If the screen grows past the mobile breakpoint while the panel is
  // open, close it — otherwise it stays stuck over a desktop layout.
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) set(false);
  });
})();

/* ---------- services dropdown ----------
   CSS handles hover. This adds click and keyboard, so the menu is
   reachable without a mouse. Both drive the same [data-open]. */
(function () {
  const drop = document.querySelector('.drop');
  if (!drop) return;
  const btn = drop.querySelector('button');

  btn.addEventListener('click', e => {
    e.preventDefault();
    const open = drop.hasAttribute('data-open');
    if (open) drop.removeAttribute('data-open');
    else      drop.setAttribute('data-open', '');
    btn.setAttribute('aria-expanded', open ? 'false' : 'true');
  });

  document.addEventListener('click', e => {
    if (!drop.contains(e.target)) {
      drop.removeAttribute('data-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      drop.removeAttribute('data-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* ---------- estimate form ----------
   Right now this posts NOWHERE. It validates, shows the thank-you, and
   logs what it would have sent. That is deliberate for the draft.

   To make it live: open the CMS, go to Settings and fill in "Estimate
   form destination". The page passes that value through as
   window.WT_ENDPOINT, so nothing here needs editing.

   The field names sent are:
     first_name, last_name, phone, email, address, job_type, timing,
     notes, source_page
   They are plain on purpose — close to what a CRM expects on import.
   Renaming them means changing whatever receives them too. */
const ENDPOINT = (typeof window !== 'undefined' && window.WT_ENDPOINT) || '';

(function () {
  const form = document.getElementById('estimateForm');
  if (!form) return;

  /* Stamped as late as possible — this is the clock the server checks. */
  const stamp = document.getElementById('t');
  if (stamp) stamp.value = String(Date.now());

  const btn   = document.getElementById('sendBtn');
  const msg   = document.getElementById('formMsg');
  const LABEL = btn.textContent;

  function say(text, ok) {
    msg.textContent = text;
    msg.className = 'fmsg show ' + (ok ? 'ok' : 'bad');
  }

  /* Safari restores a page from its back/forward cache exactly as it
     was left — including a disabled button, which strands anyone who
     hits back after submitting. */
  window.addEventListener('pageshow', () => {
    btn.disabled = false;
    btn.textContent = LABEL;
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    // Which page the request came from. Useful later for knowing
    // whether the cabinet page is actually earning its keep.
    data.source_page = location.pathname.split('/').pop() || 'index.html';

    if (!data.first_name.trim() || !data.last_name.trim()) {
      return say('Please add your first and last name.', false);
    }
    if (!data.phone.trim()) {
      return say('Please add a phone number so we can call you back.', false);
    }

    btn.disabled = true;
    btn.textContent = 'Sending…';

    /* No endpoint means nothing can be sent. Previously this faked a
       success message, which is the worst possible outcome — the visitor
       walks away believing they have been in touch. Tell them the truth
       and give them the phone number instead. */
    if (!ENDPOINT) {
      console.warn('No form endpoint set — the form cannot send.');
      btn.disabled = false;
      btn.textContent = LABEL;
      return say('Sorry — the form is not working right now. ' +
                 'Please call us at 717-582-1146.', false);
    }

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      say('Thank you for your submission. We will be reaching out shortly.', true);
    } catch (err) {
      say('That did not send. Please call us at 717-582-1146 and we will ' +
          'take it down over the phone.', false);
    } finally {
      btn.disabled = false;
      btn.textContent = LABEL;
    }
  });
})();
