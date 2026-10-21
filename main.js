(() => {
  const masthead = document.querySelector('[data-masthead]');
  const runningHead = document.querySelector('[data-running-head]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const navLinks = [...document.querySelectorAll('.nav__list a')];

  /* Masthead turns solid as soon as the page moves */
  const updateMasthead = () => {
    const scrolled = window.scrollY > 40;
    masthead.classList.toggle('is-solid', scrolled);
    masthead.classList.toggle('is-scrolled', scrolled);
  };
  updateMasthead();
  window.addEventListener('scroll', updateMasthead, { passive: true });

  /* Running head: names the chapter under the masthead */
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const chapterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const name = entry.target.dataset.chapter;
      runningHead.textContent = name;
      runningHead.classList.toggle('has-chapter', Boolean(name));
      const id = entry.target.id;
      navLinks.forEach((a) => {
        if (a.getAttribute('href') === `#${id}`) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  chapters.forEach((c) => chapterObserver.observe(c));

  /* Chapter openers settle once */
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });
  document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

  /* Mobile menu */
  const setMenu = (open) => {
    masthead.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Fechar menu' : 'Abrir menu';
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  navLinks.forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && masthead.classList.contains('is-open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 921px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* Contact form: validates, then opens WhatsApp with the message composed */
  const form = document.querySelector('[data-form]');
  const status = document.querySelector('[data-form-status]');
  const WHATSAPP = '5586988753468';

  const setError = (field, message) => {
    const error = document.getElementById(field.getAttribute('aria-describedby'));
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    if (error) error.textContent = message || '';
  };

  const validate = () => {
    const nome = form.elements.nome;
    const email = form.elements.email;
    const msg = form.elements.mensagem;
    let first = null;

    if (!nome.value.trim()) { setError(nome, 'Informe seu nome.'); first ||= nome; } else setError(nome);
    if (email.value.trim() && !email.checkValidity()) { setError(email, 'Confira o e-mail: falta algo no endereço.'); first ||= email; } else setError(email);
    if (!msg.value.trim()) { setError(msg, 'Descreva em poucas linhas a sua situação.'); first ||= msg; } else setError(msg);

    if (first) first.focus();
    return !first;
  };

  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.textContent = '';
    if (!validate()) return;

    const f = form.elements;
    const value = (name) => f[name].value.trim();
    const optional = (label, name) => (value(name) ? `${label}: ${value(name)}` : null);
    const text = [
      `Olá, Victor. Meu nome é ${value('nome')}.`,
      optional('Empresa', 'empresa'),
      `Assunto: ${f.assunto.value}`,
      '',
      value('mensagem'),
      '',
      optional('E-mail', 'email'),
      optional('Telefone', 'telefone'),
    ].filter((line) => line !== null).join('\n').trim();

    const win = window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank');
    if (win) win.opener = null;
    status.textContent = win
      ? 'Abrimos o WhatsApp com a sua mensagem. É só confirmar o envio por lá.'
      : 'Não foi possível abrir o WhatsApp. Use o link ao lado ou escreva para o e-mail.';
  });
})();
