(function () {
  'use strict';

  /* ═══════════ Tracking (GA4 / GTM) ═══════════
     TODO: inserir no <head> do index.html o snippet do
     Google Tag Manager (GTM-XXXXXXX) e/ou gtag.js (G-XXXXXXXXXX).
     Os eventos abaixo são empurrados para o dataLayer;
     basta configurar as tags/triggers no GTM com esses nomes. */
  window.dataLayer = window.dataLayer || [];
  function trackEvent(eventName, params) {
    window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (!el) return;
    trackEvent(el.dataset.track, { link_url: el.href || null });
  });

  var contatoForm = document.getElementById('contatoForm');
  if (contatoForm) {
    contatoForm.addEventListener('submit', function () {
      trackEvent('submit_contact_form');
    });
  }

  /* ═══════════ Preloader ═══════════ */
  var STAGGER_MS = 35;
  var LINE_OFFSET_MS = 130;
  var ICON_TOTAL_MS = 1500;
  var LETTER_START_DELAY = 150;
  var LETTER_REVEAL_MS = 450;
  var HOLD_AFTER_MS = 350;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var preloaderEl = document.getElementById('preloader');
  var lines = Array.prototype.slice.call(document.querySelectorAll('.wordmark-line'));

  function buildLetters() {
    var baseDelay = reduced ? 0 : (ICON_TOTAL_MS + LETTER_START_DELAY);
    var maxDelay = 0;

    lines.forEach(function (lineEl) {
      lineEl.innerHTML = '';
      var text = lineEl.dataset.text;
      var lineIndex = parseInt(lineEl.dataset.line, 10) || 0;
      var lineOffset = baseDelay + lineIndex * LINE_OFFSET_MS;

      text.split('').forEach(function (ch, i) {
        var span = document.createElement('span');
        span.className = 'letter';
        span.textContent = ch === ' ' ? ' ' : ch;
        var delay = lineOffset + i * STAGGER_MS;
        if (!reduced) span.style.animationDelay = delay + 'ms';
        lineEl.appendChild(span);
        if (delay > maxDelay) maxDelay = delay;
      });
    });

    return maxDelay;
  }

  function runPreloader() {
    document.body.classList.add('is-loading');
    var maxDelay = buildLetters();
    var totalMs = reduced ? 400 : maxDelay + LETTER_REVEAL_MS + HOLD_AFTER_MS;

    setTimeout(function () {
      preloaderEl.classList.add('is-hidden');
      document.body.classList.remove('is-loading');
    }, totalMs);
  }

  window.addEventListener('load', runPreloader);

  /* ═══════════ Menu mobile ═══════════ */
  var navToggle = document.getElementById('navToggle');
  var navMenu = document.getElementById('navMenu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      var isOpen = navMenu.classList.toggle('is-open');
      navToggle.classList.toggle('is-active', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navMenu.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ═══════════ Carrossel infinito de Serviços ═══════════
     Clona o conjunto real de cards antes e depois dele.
     Ao chegar perto de uma ponta, salta sem animação para a
     posição equivalente no meio, dando a sensação de loop contínuo. */
  var servicosTrack = document.getElementById('servicosTrack');
  var servicosList = document.getElementById('servicosList');

  if (servicosTrack && servicosList) {
    var realCards = Array.prototype.slice.call(servicosList.children);

    function cloneSet() {
      return realCards.map(function (card) {
        var clone = card.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        return clone;
      });
    }

    var beforeFrag = document.createDocumentFragment();
    cloneSet().forEach(function (c) { beforeFrag.appendChild(c); });
    servicosList.insertBefore(beforeFrag, servicosList.firstChild);

    var afterFrag = document.createDocumentFragment();
    cloneSet().forEach(function (c) { afterFrag.appendChild(c); });
    servicosList.appendChild(afterFrag);

    var allCards = Array.prototype.slice.call(servicosList.querySelectorAll('.servico-card'));

    /* Distância (centro a centro) entre o 1º card do grupo "real" e o 1º
       card do grupo clonado seguinte = largura de um grupo inteiro.
       Não dá pra usar scrollWidth/3: o padding-inline da faixa (aplicado
       uma única vez, nas pontas) entraria na conta e desalinharia os saltos. */
    var groupWidth = function () {
      var a = allCards[realCards.length].getBoundingClientRect();
      var b = allCards[realCards.length * 2].getBoundingClientRect();
      return (b.left + b.width / 2) - (a.left + a.width / 2);
    };

    var jumpWithoutAnimation = function (scrollLeft) {
      servicosTrack.style.scrollBehavior = 'auto';
      servicosTrack.scrollLeft = scrollLeft;
      requestAnimationFrame(function () {
        servicosTrack.style.scrollBehavior = '';
      });
    };

    var getClosestCard = function () {
      var trackRect = servicosTrack.getBoundingClientRect();
      var trackCenter = trackRect.left + trackRect.width / 2;
      var closest = null;
      var closestDist = Infinity;
      allCards.forEach(function (card) {
        var cardRect = card.getBoundingClientRect();
        var cardCenter = cardRect.left + cardRect.width / 2;
        var dist = Math.abs(cardCenter - trackCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closest = card;
        }
      });
      return closest;
    };

    var scrollToCard = function (card, smooth) {
      /* Desliga o scroll-snap nativo enquanto rola: como o card ativo muda de
         tamanho, o ponto de "descanso" calculado pelo snap nativo pode divergir
         do nosso alvo (baseado na posição visual) e corrigir pro card vizinho. */
      servicosTrack.style.scrollSnapType = 'none';
      var trackRect = servicosTrack.getBoundingClientRect();
      var cardRect = card.getBoundingClientRect();
      var cardCenterOffset = (cardRect.left - trackRect.left) + servicosTrack.scrollLeft + cardRect.width / 2;
      var target = cardCenterOffset - servicosTrack.clientWidth / 2;
      servicosTrack.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
    };

    var servicosChips = Array.prototype.slice.call(document.querySelectorAll('.servico-chip'));

    servicosChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var idx = parseInt(chip.dataset.index, 10);
        var target = allCards[realCards.length + idx];
        if (target) scrollToCard(target, true);
      });
    });

    var servicosPrev = document.getElementById('servicosPrev');
    var servicosNext = document.getElementById('servicosNext');

    var stepCarousel = function (direction) {
      var closest = getClosestCard();
      var idx = allCards.indexOf(closest) + direction;
      idx = Math.max(0, Math.min(allCards.length - 1, idx));
      scrollToCard(allCards[idx], true);
    };

    if (servicosPrev) servicosPrev.addEventListener('click', function () { stepCarousel(-1); });
    if (servicosNext) servicosNext.addEventListener('click', function () { stepCarousel(1); });

    var updateActiveCard = function () {
      var closest = getClosestCard();
      allCards.forEach(function (card) {
        card.classList.toggle('is-active', card === closest);
      });
      var chipIndex = allCards.indexOf(closest) % realCards.length;
      servicosChips.forEach(function (chip, i) {
        chip.classList.toggle('is-active', i === chipIndex);
      });
    };

    /* Em vez de comparar scrollLeft com limites em pixels (frágil: dependia
       do padding da faixa, que entrava errado na conta), verificamos direto
       se o card centralizado pertence a um dos grupos clonados — se sim,
       saltamos exatamente um "groupWidth" pra trazer de volta pro grupo real. */
    var checkLoopBoundary = function () {
      var closest = getClosestCard();
      var idx = allCards.indexOf(closest);
      if (idx < realCards.length) {
        jumpWithoutAnimation(servicosTrack.scrollLeft + groupWidth());
      } else if (idx >= realCards.length * 2) {
        jumpWithoutAnimation(servicosTrack.scrollLeft - groupWidth());
      }
    };

    var scrollSettleTimeout;
    servicosTrack.addEventListener('scroll', function () {
      clearTimeout(scrollSettleTimeout);
      scrollSettleTimeout = setTimeout(function () {
        servicosTrack.style.scrollSnapType = '';
        checkLoopBoundary();
        updateActiveCard();
      }, 100);
    });

    window.addEventListener('load', function () {
      scrollToCard(allCards[realCards.length], false);
      updateActiveCard();
    });
    window.addEventListener('resize', updateActiveCard);
  }
})();
