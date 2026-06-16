  (function(){
    'use strict';
    // Publishable key — safe for client; protected by RLS (anon INSERT-only into waitlist).
    var SUPABASE_URL = 'https://cdhrnjeegdhlrazbmpox.supabase.co';
    var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_TSfuTn3SHco1wb5oPSlZ4w_svUg0qk4';
    var WAITLIST_ENDPOINT = SUPABASE_URL + '/rest/v1/waitlist';

    var form = document.getElementById('betaForm');
    var btn = document.getElementById('betaSubmit');
    var msg = document.getElementById('betaMsg');
    var success = document.getElementById('betaSuccess');

    function showMsg(text, kind){ msg.textContent = text; msg.className = 'beta-msg ' + kind; }
    function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var email = form.email.value.trim();
      var name = form.full_name.value.trim();
      if (!validEmail(email)) { showMsg('Please enter a valid email address.', 'err'); form.email.focus(); return; }

      btn.disabled = true; var orig = btn.textContent; btn.textContent = 'Reserving…';

      var row = {
        email: email,
        full_name: name || null,
        interest: form.interest.value || 'founding_subscriber',
        platform_vote: form.platform_vote.value.trim() || null,
        message: form.message.value.trim() || null,
        source: 'beta_page',
        referrer: document.referrer || null,
        user_agent: navigator.userAgent || null
      };

      // Reaches success on a clean insert OR an "already on the list" duplicate.
      function showSuccess() {
        document.getElementById('bsName').textContent = name ? name.split(' ')[0] : 'tuner';
        form.style.display = 'none';
        success.classList.add('show');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      // Email fallback so a signup is never lost when the server is genuinely unreachable.
      function showEmailFallback(lead) {
        var subject = encodeURIComponent('V-Tuning Beta Signup');
        var body = encodeURIComponent('Name: ' + (name||'') + '\nEmail: ' + email + '\nInterest: ' + row.interest + '\nPlatform vote: ' + (row.platform_vote||'') + '\nMessage: ' + (row.message||''));
        showMsg(lead + ' ', 'err');
        msg.innerHTML = lead + ' <a href="mailto:info@vektrontechnologies.com?subject=' + subject + '&body=' + body + '" style="color:#d9c6ff;text-decoration:underline">Send your signup by email instead →</a>';
      }

      var res;
      try {
        // POST directly to PostgREST with ONLY the apikey header. The Supabase JS SDK also
        // sends Authorization: Bearer <publishable-key>, which this project rejects (401
        // "permission denied for table waitlist"). apikey-only resolves the anon role correctly.
        res = await fetch(WAITLIST_ENDPOINT, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(row)
        });
      } catch (netErr) {
        // fetch() only throws for a genuine transport failure (offline, DNS, blocked,
        // CORS, TLS). THIS is the only case that is truly "can't reach the server."
        console.error('[beta] network error', netErr);
        showEmailFallback('We could not reach the server — you may be offline or a browser extension is blocking the request.');
        btn.disabled = false; btn.textContent = orig;
        return;
      }

      // We got a response from the server. Interpret the status precisely.
      if (res.ok) { showSuccess(); btn.disabled = false; btn.textContent = orig; return; }

      // Read the server's explanation so we can show the REAL reason.
      var detail = '', payload = null;
      try { detail = await res.text(); } catch (_) {}
      try { payload = JSON.parse(detail); } catch (_) {}
      var pgCode = payload && payload.code;
      var pgMsg  = (payload && payload.message) || '';
      console.error('[beta] insert rejected', res.status, pgCode, pgMsg);

      // 409 / 23505 = unique violation = already signed up. Treat as a friendly success.
      if (res.status === 409 || pgCode === '23505' || /duplicate key|already exists/i.test(pgMsg)) {
        showSuccess();
        btn.disabled = false; btn.textContent = orig;
        return;
      }

      // 23514 = CHECK constraint (e.g. an interest/value the DB doesn't accept).
      // 400/422 = bad/invalid data. Surface a clear, specific reason — NOT "network error."
      var friendly;
      if (pgCode === '23514' || /violates check constraint/i.test(pgMsg)) {
        friendly = 'One of your selections wasn\u2019t accepted. Please adjust your answers and try again.';
      } else if (res.status === 400 || res.status === 422) {
        friendly = 'We couldn\u2019t accept that submission — please check your details and try again.';
      } else if (res.status === 401 || res.status === 403) {
        friendly = 'The signup service rejected the request. Please try again shortly.';
      } else if (res.status >= 500) {
        friendly = 'The server hit a temporary error. Please try again in a moment.';
      } else {
        friendly = 'Something went wrong (error ' + res.status + ').';
      }
      showEmailFallback(friendly);
      btn.disabled = false; btn.textContent = orig;
    });
  })();
