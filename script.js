/* =========================================================
   HOLMES LAW — interações
   ========================================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Header + rail de progresso + voltar ao topo ---------- */

  (function () {
    var header = $('#siteHeader');
    var fill   = $('#railFill');
    var toTop  = $('#toTop');
    var ticking = false;

    function update() {
      var y = window.scrollY || window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;

      if (header) header.classList.toggle('is-stuck', y > 40);
      if (fill)   fill.style.height = (max > 0 ? Math.min(y / max, 1) * 100 : 0) + '%';
      if (toTop)  toTop.classList.toggle('is-on', y > window.innerHeight * 0.7);

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    window.addEventListener('resize', update, { passive: true });
    update();

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      });
    }
  })();

  /* ---------- Menu mobile ---------- */

  (function () {
    var toggle   = $('#navToggle');
    var menu     = $('#mobileMenu');
    var backdrop = $('#menuBackdrop');
    if (!toggle || !menu || !backdrop) return;

    var links = $$('a', menu);
    links.forEach(function (a, i) { a.style.setProperty('--i', i); });

    function open() {
      menu.classList.add('is-open');
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Fechar menu');
      menu.setAttribute('aria-hidden', 'false');
      backdrop.hidden = false;
      document.body.classList.add('is-locked');
      window.requestAnimationFrame(function () { backdrop.classList.add('is-on'); });
    }

    function close() {
      menu.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
      menu.setAttribute('aria-hidden', 'true');
      backdrop.classList.remove('is-on');
      document.body.classList.remove('is-locked');
      window.setTimeout(function () { backdrop.hidden = true; }, 350);
    }

    toggle.addEventListener('click', function () {
      menu.classList.contains('is-open') ? close() : open();
    });

    backdrop.addEventListener('click', close);
    links.forEach(function (a) { a.addEventListener('click', close); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        close();
        toggle.focus();
      }
    });
  })();

  /* ---------- Reveal ao rolar ---------- */

  (function () {
    var items = $$('.reveal');
    if (!items.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    // Escalona irmaos dentro de um mesmo grupo. Usa Map porque um no de DOM
    // como chave de objeto vira a string "[object HTMLDivElement]" — todos os
    // elementos cairiam no mesmo grupo e o escalonamento nao funcionaria.
    var groups = new Map();
    items.forEach(function (el) {
      var key = el.parentNode;
      var n = groups.get(key) || 0;
      el.style.setProperty('--d', Math.min(n, 6) * 0.1 + 's');
      groups.set(key, n + 1);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Contadores ---------- */

  (function () {
    var nums = $$('[data-count]');
    if (!nums.length) return;

    function run(el) {
      var end    = parseFloat(el.getAttribute('data-count'));
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var plain  = el.getAttribute('data-plain') === 'true';
      var start  = plain ? Math.max(end - 40, 0) : 0;

      if (reduced || isNaN(end)) {
        el.textContent = prefix + end + suffix;
        return;
      }

      var t0 = null;
      var dur = 1400;

      function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var value = Math.round(start + (end - start) * eased);
        el.textContent = prefix + value + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      }

      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    nums.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Faixa rolante contínua ---------- */

  (function () {
    var strip = $('#docket');
    var track = $('#docketTrack');
    if (!strip || !track) return;

    var group = $('.docket-group', track);
    if (!group) return;

    var SPEED = 58; // pixels por segundo — mude aqui para acelerar ou desacelerar

    function build() {
      // limpa clones de uma passada anterior
      $$('.docket-group', track).forEach(function (g, i) {
        if (i > 0) g.parentNode.removeChild(g);
      });

      var w = group.getBoundingClientRect().width;
      var visible = strip.getBoundingClientRect().width;

      // se nao deu para medir, cai para a lista estatica em vez de tira parada
      if (!w) { strip.classList.add('is-static'); return; }
      strip.classList.remove('is-static');

      // clones suficientes para cobrir a tela inteira mais uma volta de folga
      var copies = Math.max(2, Math.ceil(visible / w) + 1);
      for (var i = 1; i < copies; i++) {
        track.appendChild(group.cloneNode(true));
      }

      // desloca exatamente a largura de um grupo: o loop fecha sem salto
      track.style.setProperty('--shift', w + 'px');
      track.style.setProperty('--dur', (w / SPEED).toFixed(2) + 's');
    }

    build();

    // a largura muda quando a fonte real substitui a de fallback
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(build);
    }

    var rid;
    window.addEventListener('resize', function () {
      window.clearTimeout(rid);
      rid = window.setTimeout(build, 220);
    }, { passive: true });
  })();

  /* ---------- Carrossel de áreas ---------- */

  (function () {
    var root  = $('#carousel');
    var track = $('#carouselTrack');
    var dots  = $('#carouselDots');
    var prev  = $('#prevBtn');
    var next  = $('#nextBtn');
    if (!root || !track) return;

    var slides = $$('.case', track);
    var index = 0;
    var perView = 3;
    var maxIndex = 0;

    function measure() {
      var w = window.innerWidth;
      perView = w <= 640 ? 1 : (w <= 1080 ? 2 : 3);
      maxIndex = Math.max(slides.length - perView, 0);
      index = Math.min(index, maxIndex);
    }

    function buildDots() {
      if (!dots) return;
      dots.innerHTML = '';
      for (var i = 0; i <= maxIndex; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Ir para o slide ' + (i + 1));
        b.addEventListener('click', (function (n) {
          return function () {
            index = n; render();
            ativo = index; marcar(); iniciarAuto();
          };
        })(i));
        dots.appendChild(b);
      }
    }

    function render() {
      if (!slides.length) return;
      var step = slides[0].getBoundingClientRect().width + 24;
      track.style.transform = 'translate3d(' + (-index * step) + 'px,0,0)';

      slides.forEach(function (s, i) {
        var visible = i >= index && i < index + perView;
        s.setAttribute('aria-hidden', visible ? 'false' : 'true');
      });

      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index >= maxIndex;

      if (dots) {
        $$('button', dots).forEach(function (b, i) {
          b.classList.toggle('is-on', i === index);
          b.setAttribute('aria-selected', i === index ? 'true' : 'false');
        });
      }
    }

    function go(delta) {
      index = Math.max(0, Math.min(index + delta, maxIndex));
      render();
      // o destaque acompanha a navegacao manual
      ativo = index;
      marcar();
      iniciarAuto();
    }

    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { go(-1); }
      if (e.key === 'ArrowRight') { go(1); }
    });

    // arrastar com mouse / toque
    var startX = 0, dragging = false;

    track.addEventListener('pointerdown', function (e) {
      dragging = true;
      startX = e.clientX;
      track.classList.add('is-dragging');
      track.setPointerCapture(e.pointerId);
    });

    track.addEventListener('pointerup', function (e) {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
      else render();
    });

    track.addEventListener('pointercancel', function () {
      dragging = false;
      track.classList.remove('is-dragging');
      render();
    });

    var rid;
    window.addEventListener('resize', function () {
      window.clearTimeout(rid);
      rid = window.setTimeout(function () {
        var before = maxIndex;
        measure();
        if (before !== maxIndex) buildDots();
        render();
        garantirVisivel();
        marcar();
      }, 140);
    }, { passive: true });

    /* ----- Destaque automatico -----
       Sempre um cartao em evidencia. Ele caminha para a direita, e ao
       chegar no ultimo inverte o sentido e volta. Passar o mouse assume
       o controle: o cartao sob o cursor vira o destacado. */

    var PASSO = 3200;     // ms em cada cartao
    var ativo = 0;
    var sentido = 1;
    var relogio = null;
    var sobMouse = false;
    var foraDaTela = false;

    function marcar() {
      slides.forEach(function (s, i) {
        s.classList.toggle('is-active', i === ativo);
      });
    }

    // mantem o cartao destacado dentro da area visivel do carrossel
    function garantirVisivel() {
      if (ativo < index) {
        index = ativo;
        render();
      } else if (ativo >= index + perView) {
        index = Math.min(ativo - perView + 1, maxIndex);
        render();
      }
    }

    function passo() {
      if (slides.length < 2) return;
      ativo += sentido;
      if (ativo > slides.length - 1) { ativo = slides.length - 2; sentido = -1; }
      if (ativo < 0)                 { ativo = 1;                 sentido = 1; }
      garantirVisivel();
      marcar();
    }

    function iniciarAuto() {
      window.clearInterval(relogio);
      if (reduced) return;            // com "reduzir movimento" o destaque fica parado
      relogio = window.setInterval(function () {
        if (!sobMouse && !foraDaTela) passo();
      }, PASSO);
    }

    slides.forEach(function (slide, i) {
      slide.addEventListener('mouseenter', function () {
        sobMouse = true;
        ativo = i;
        sentido = 1;
        marcar();
      });
      slide.addEventListener('mouseleave', function () {
        sobMouse = false;
        iniciarAuto();                // reinicia a contagem: nao pula logo apos sair
      });
    });

    // fora da tela nao precisa animar
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        foraDaTela = !entries[0].isIntersecting;
      }, { threshold: 0.15 }).observe(root);
    }

    measure();
    buildDots();
    render();
    marcar();
    iniciarAuto();
  })();

  /* ---------- Acordeão do FAQ ---------- */

  (function () {
    var items = $$('.acc-item');
    if (!items.length) return;

    items.forEach(function (item, i) {
      var btn   = $('.acc-trigger', item);
      var panel = $('.acc-panel', item);
      if (!btn || !panel) return;

      var id = 'acc-panel-' + (i + 1);
      panel.id = id;
      btn.setAttribute('aria-controls', id);

      function collapseOthers() {
        items.forEach(function (other) {
          if (other === item) return;
          var b = $('.acc-trigger', other);
          var p = $('.acc-panel', other);
          if (b && b.getAttribute('aria-expanded') === 'true') shut(b, p);
        });
      }

      function shut(b, p) {
        b.setAttribute('aria-expanded', 'false');
        if (reduced) { p.hidden = true; return; }
        p.style.height = p.scrollHeight + 'px';
        void p.offsetHeight;
        p.style.height = '0px';
        window.setTimeout(function () {
          if (b.getAttribute('aria-expanded') === 'false') {
            p.hidden = true;
            p.style.height = '';
          }
        }, 420);
      }

      function open(b, p) {
        b.setAttribute('aria-expanded', 'true');
        p.hidden = false;
        if (reduced) return;
        p.style.height = '0px';
        void p.offsetHeight;
        p.style.height = p.scrollHeight + 'px';
        window.setTimeout(function () {
          if (b.getAttribute('aria-expanded') === 'true') p.style.height = 'auto';
        }, 420);
      }

      btn.addEventListener('click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
          shut(btn, panel);
        } else {
          collapseOthers();
          open(btn, panel);
        }
      });
    });
  })();

  /* ---------- Formulário de contato ---------- */

  (function () {
    var form = $('#contactForm');
    if (!form) return;

    var success = $('#formSuccess');
    var mail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setError(field, message) {
      var wrap = field.closest('.field');
      var note = wrap ? $('.field-error', wrap) : null;
      if (wrap) wrap.classList.toggle('has-error', !!message);
      if (note) note.textContent = message || '';
      return !message;
    }

    function check(field) {
      var value = (field.value || '').trim();

      if (field.hasAttribute('required') && !value) {
        return setError(field, 'Campo obrigatório.');
      }
      if (field.type === 'email' && value && !mail.test(value)) {
        return setError(field, 'Informe um e-mail válido.');
      }
      if (field.id === 'f-message' && value && value.length < 12) {
        return setError(field, 'Descreva um pouco mais a situação.');
      }
      return setError(field, '');
    }

    function servico(campo) {                     // _subject, _template, _captcha, _honey
      return campo.type === 'hidden' || campo.name.charAt(0) === '_';
    }

    $$('input, select, textarea', form).forEach(function (field) {
      if (servico(field)) return;
      field.addEventListener('blur', function () { check(field); });
      field.addEventListener('input', function () {
        var wrap = field.closest('.field');
        if (wrap && wrap.classList.contains('has-error')) check(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var fields = $$('[required]', form);
      var ok = true;
      var first = null;

      fields.forEach(function (field) {
        if (!check(field)) {
          ok = false;
          if (!first) first = field;
        }
      });

      if (!ok) {
        if (first) first.focus();
        return;
      }

      enviar();
    });

    /* ------------------------------------------------------------------
       Envio pelo FormSubmit.
       O endereco de destino vem do atributo action do <form> — um unico
       lugar para trocar. O endpoint AJAX e derivado dele, o que mantem o
       visitante na pagina. Se o fetch falhar, o formulario e submetido do
       jeito tradicional, usando o proprio action.
       ------------------------------------------------------------------ */

    function endpointAjax() {
      var acao = form.getAttribute('action') || '';
      return acao.indexOf('formsubmit.co/') > -1
        ? acao.replace('formsubmit.co/', 'formsubmit.co/ajax/')
        : '';
    }

    function aviso(texto, erro) {
      if (!success) return;
      success.textContent = texto;
      success.classList.toggle('is-error', !!erro);
      success.hidden = false;
      window.clearTimeout(aviso.t);
      aviso.t = window.setTimeout(function () { success.hidden = true; }, 10000);
    }

    function enviar() {
      var url = endpointAjax();
      if (!url || !window.fetch) { form.submit(); return; }   // sem AJAX: envio tradicional

      var botao = $('button[type="submit"]', form);
      var rotulo = botao ? botao.textContent : '';
      if (botao) { botao.disabled = true; botao.textContent = 'Enviando…'; }

      var dados = {};
      $$('input, select, textarea', form).forEach(function (campo) {
        if (campo.name) dados[campo.name] = campo.value;
      });

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(dados)
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var ok = j && (j.success === true || j.success === 'true');
          if (ok) {
            aviso('Mensagem enviada. O retorno será feito pelo e-mail informado.', false);
            if (window.vcTrack) window.vcTrack('generate_lead', { method: 'formulario' });
            form.reset();
            $$('.field', form).forEach(function (w) { w.classList.remove('has-error'); });
          } else {
            // primeira mensagem de todas: o FormSubmit pede confirmação do e-mail
            aviso((j && j.message) || 'Não foi possível enviar agora. Tente pelo WhatsApp.', true);
          }
        })
        .catch(function () {
          aviso('Falha de conexão ao enviar. Tente pelo WhatsApp ou escreva direto para o e-mail do rodapé.', true);
        })
        .then(function () {
          if (botao) { botao.disabled = false; botao.textContent = rotulo; }
        });
    }
  })();

  /* ---------- Link de e-mail com rede de segurança ---------- */

  (function () {
    var link = $('#linkEmail');
    if (!link) return;

    var endereco = link.getAttribute('data-email') || '';
    var rotulo   = $('.ci-text small', link);
    if (!rotulo) return;

    var textoOriginal = rotulo.textContent;
    var modoGmail = false;
    var t1, t2;

    // Gmail na web: funciona para quem nao tem aplicativo de e-mail instalado
    function urlGmail() {
      var m = link.getAttribute('href').split('?');
      return 'https://mail.google.com/mail/?view=cm&fs=1&to=' +
             encodeURIComponent(endereco) + '&' + (m[1] || '');
    }

    function mostrar(texto, destaque) {
      rotulo.textContent = texto;
      link.classList.toggle('is-copied', !!destaque);
    }

    function restaurar() {
      mostrar(textoOriginal, false);
      modoGmail = false;
    }

    // copia sem depender da API moderna, que exige contexto seguro (https)
    function copiar(texto) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(texto).then(function () { return true; },
                                                          function () { return legado(texto); });
      }
      return Promise.resolve(legado(texto));
    }

    function legado(texto) {
      try {
        var campo = document.createElement('textarea');
        campo.value = texto;
        campo.setAttribute('readonly', '');
        campo.style.position = 'fixed';
        campo.style.left = '-9999px';
        document.body.appendChild(campo);
        campo.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(campo);
        return ok;
      } catch (e) { return false; }
    }

    link.addEventListener('click', function (e) {
      // segundo clique, depois do aviso: abre direto o Gmail na web
      if (modoGmail) {
        e.preventDefault();
        window.open(urlGmail(), '_blank', 'noopener');
        restaurar();
        return;
      }

      window.clearTimeout(t1); window.clearTimeout(t2);

      copiar(endereco).then(function (copiou) {
        mostrar(copiou ? 'Endereço copiado — abrindo seu e-mail…' : 'Abrindo seu e-mail…', true);
      });

      /* Se o sistema nao tem aplicativo de e-mail, o mailto nao faz nada e a
         pagina continua em foco. Nesse caso, oferece o Gmail na web. */
      t1 = window.setTimeout(function () {
        if (document.hasFocus()) {
          modoGmail = true;
          mostrar('Não abriu? Clique para usar o Gmail', true);
          t2 = window.setTimeout(restaurar, 12000);
        } else {
          t2 = window.setTimeout(restaurar, 2500);
        }
      }, 1500);
    });
  })();

  /* ---------- Imagem remota que falha ---------- */

  (function () {
    // 1x1 transparente. Trocar o src por ele faz o navegador considerar a
    // imagem carregada: some o icone de "imagem quebrada" e o fundo gravado
    // do CSS aparece no lugar, em vez de um retangulo vazio.
    var VAZIO = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    function cair(img) {
      if (img.getAttribute('src') !== VAZIO) {
        img.setAttribute('src', VAZIO);
        img.setAttribute('data-fallback', 'true');
      }
    }

    $$('img').forEach(function (img) {
      img.addEventListener('error', function () { cair(img); });
      // ja falhou antes do script rodar
      if (img.complete && img.naturalWidth === 0) cair(img);
    });
  })();

  /* ---------- Parallax discreto no retrato do hero ---------- */

  (function () {
    var img = $('#heroImg');
    if (!img || reduced) return;

    var ticking = false;

    function move() {
      var y = window.scrollY || window.pageYOffset;
      if (y < window.innerHeight * 1.2) {
        img.style.transform = 'translate3d(0,' + (y * 0.13) + 'px,0) scale(1.05)';
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(move); ticking = true; }
    }, { passive: true });
  })();

})();

/* =========================================================
   MEDICAO (Google Analytics) E CONSENTIMENTO DE COOKIES

   - Enquanto GA_ID for o valor de exemplo, NADA e carregado e
     o aviso de cookies nao aparece.
   - Para ativar: troque GA_ID abaixo pelo ID de medicao do
     Google Analytics 4 (formato G-XXXXXXXXXX).
   - O Analytics so e carregado depois que o visitante aceita.
   - Cada contato (formulario, WhatsApp, e-mail, telefone) gera o
     evento "generate_lead" com o parametro "method".
   ========================================================= */

(function () {
  'use strict';

  var GA_ID = 'G-4P7YBCW884';          // <-- TROCAR pelo seu ID do Google Analytics
  var KEY   = 'vc_cookie_consent';     // guarda a escolha do visitante
  var loaded = false;
  var bar = null;

  function ativo() {
    return /^G-[A-Z0-9]{6,}$/.test(GA_ID) && GA_ID !== 'G-XXXXXXXXXX';
  }

  function ler() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function gravar(v) {
    try { window.localStorage.setItem(KEY, v); } catch (e) { /* sem armazenamento: escolha vale so nesta visita */ }
  }

  function carregarGA() {
    if (loaded || !ativo()) return;
    loaded = true;
    window['ga-disable-' + GA_ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  function limparGA() {
    window['ga-disable-' + GA_ID] = true;
    loaded = false;
    var host = window.location.hostname;
    document.cookie.split(';').forEach(function (c) {
      var nome = c.split('=')[0].trim();
      if (nome.indexOf('_ga') === 0) {
        [host, '.' + host, ''].forEach(function (d) {
          document.cookie = nome + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
        });
      }
    });
  }

  function esconder() { if (bar) bar.hidden = true; }

  function escolher(v) {
    gravar(v);
    esconder();
    if (v === 'granted') carregarGA(); else limparGA();
  }

  function montarAviso() {
    bar = document.createElement('div');
    bar.className = 'cookie-bar';
    bar.id = 'cookieBar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Aviso de cookies');
    bar.hidden = true;
    bar.innerHTML =
      '<p>Este site usa cookies de medição (Google Analytics) somente se você aceitar, ' +
      'para entender como o conteúdo é acessado. ' +
      '<a href="privacidade.html">Política de Privacidade</a></p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="ck-btn" data-consent="denied">Recusar</button>' +
      '<button type="button" class="ck-btn ck-btn-primary" data-consent="granted">Aceitar</button>' +
      '</div>';
    document.body.appendChild(bar);

    bar.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-consent]') : null;
      if (b) escolher(b.getAttribute('data-consent'));
    });
  }

  function linkPreferencias() {
    var alvo = document.querySelector('.footer-bottom span:last-child, .legal-foot .shell');
    if (!alvo) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ck-link';
    b.textContent = 'Preferências de cookies';
    b.addEventListener('click', function () { if (bar) bar.hidden = false; });
    alvo.appendChild(document.createTextNode(' · '));
    alvo.appendChild(b);
  }

  // Evento unico de conversao. Fica sem efeito se o visitante nao aceitou.
  window.vcTrack = function (nome, params) {
    if (loaded && typeof window.gtag === 'function') window.gtag('event', nome, params || {});
  };

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '';
    var metodo = null;
    if (h.indexOf('wa.me') > -1) metodo = 'whatsapp';
    else if (h.indexOf('mailto:') === 0) metodo = 'email';
    else if (h.indexOf('tel:') === 0) metodo = 'telefone';
    if (!metodo) return;
    var onde = a.closest('.fabs') ? 'botao_flutuante'
             : a.closest('footer') ? 'rodape'
             : a.closest('#contato') ? 'contato' : 'outro';
    window.vcTrack('generate_lead', { method: metodo, link_location: onde });
  });

  if (!ativo()) return;      // sem ID de medicao: nada de cookies, nada de aviso

  montarAviso();
  linkPreferencias();

  var escolha = ler();
  if (escolha === 'granted') carregarGA();
  else if (escolha !== 'denied') bar.hidden = false;
})();
