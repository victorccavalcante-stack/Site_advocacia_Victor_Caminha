/* =========================================================
   Cookies e Google Analytics 4 (com consentimento)
   - O Analytics só é carregado depois que o visitante clica em "Aceitar".
   - Cada contato gera o evento "generate_lead" com o parâmetro "method".
   - Para trocar o ID do Analytics, altere GA_ID abaixo.
   ========================================================= */
(function () {
  'use strict';

  var GA_ID = 'G-4P7YBCW884';
  var KEY   = 'vc_cookie_consent';
  var loaded = false;
  var bar = null;

  function ativo() {
    return /^G-[A-Z0-9]{6,}$/.test(GA_ID) && GA_ID !== 'G-XXXXXXXXXX';
  }

  function ler() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function gravar(v) {
    try { window.localStorage.setItem(KEY, v); } catch (e) { /* sem armazenamento: vale só nesta visita */ }
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

  function escolher(v) {
    gravar(v);
    if (bar) bar.hidden = true;
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
    var alvo = document.querySelector('.footer__inner, .legal-foot .legal-wrap');
    if (!alvo) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ck-link';
    b.textContent = 'Preferências de cookies';
    b.addEventListener('click', function () { if (bar) bar.hidden = false; });
    alvo.appendChild(b);
  }

  // Evento de conversão. Sem efeito se o visitante não aceitou.
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
    var onde = a.closest('.wa-float') ? 'botao_flutuante'
             : a.closest('.topbar') ? 'topo'
             : a.closest('footer') ? 'rodape'
             : a.closest('#contato') ? 'contato' : 'outro';
    window.vcTrack('generate_lead', { method: metodo, link_location: onde });
  });

  function iniciar() {
    if (!ativo()) return;
    montarAviso();
    linkPreferencias();
    var escolha = ler();
    if (escolha === 'granted') carregarGA();
    else if (escolha !== 'denied') bar.hidden = false;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
