(function () {
    'use strict';

    var root = document.documentElement;
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------------------------------------------------
       Theme
       The initial value is set by the inline script in <head>;
       here we only handle toggling and system-preference changes.
       --------------------------------------------------------- */

    var themeToggle = document.getElementById('themeToggle');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    function syncToggleLabel() {
        if (!themeToggle) return;
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        themeToggle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    }

    function setTheme(theme, persist) {
        root.setAttribute('data-theme', theme);
        if (persist) {
            try { localStorage.setItem('theme', theme); } catch (e) { /* storage unavailable */ }
        }
        syncToggleLabel();
    }

    syncToggleLabel();

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
        });
    }

    systemDark.addEventListener('change', function (event) {
        var stored = null;
        try { stored = localStorage.getItem('theme'); } catch (e) { /* storage unavailable */ }
        if (!stored) setTheme(event.matches ? 'dark' : 'light', false);
    });

    /* ---------------------------------------------------------
       Mobile navigation
       --------------------------------------------------------- */

    var navToggle = document.getElementById('navToggle');
    var navMenu = document.getElementById('navMenu');

    function closeNav() {
        if (!navMenu || !navToggle) return;
        navMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
    }

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function () {
            var isOpen = navMenu.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', String(isOpen));
            navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        });

        navMenu.addEventListener('click', function (event) {
            if (event.target.closest('a')) closeNav();
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && navMenu.classList.contains('is-open')) {
                closeNav();
                navToggle.focus();
            }
        });

        document.addEventListener('click', function (event) {
            if (!navMenu.classList.contains('is-open')) return;
            if (!event.target.closest('#navMenu') && !event.target.closest('#navToggle')) closeNav();
        });
    }

    /* ---------------------------------------------------------
       Scroll state: navbar border and back-to-top button
       --------------------------------------------------------- */

    var navbar = document.getElementById('navbar');
    var toTop = document.getElementById('toTop');
    var ticking = false;

    function onScroll() {
        var y = window.scrollY;
        if (navbar) navbar.classList.toggle('is-scrolled', y > 8);
        if (toTop) toTop.classList.toggle('is-visible', y > 600);
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(onScroll);
    }, { passive: true });

    onScroll();

    if (toTop) {
        toTop.addEventListener('click', function () {
            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        });
    }

    /* ---------------------------------------------------------
       Active section highlighting
       --------------------------------------------------------- */

    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
    var linkById = {};
    var watched = [];

    navLinks.forEach(function (link) {
        var id = link.getAttribute('href').slice(1);
        var section = document.getElementById(id);
        if (!section) return;
        linkById[id] = link;
        watched.push(section);
    });

    if (watched.length && 'IntersectionObserver' in window) {
        var visible = new Set();

        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    visible.add(entry.target.id);
                } else {
                    visible.delete(entry.target.id);
                }
            });

            var activeId = null;
            for (var i = 0; i < watched.length; i++) {
                if (visible.has(watched[i].id)) activeId = watched[i].id;
            }

            navLinks.forEach(function (link) { link.classList.remove('active'); });
            if (activeId && linkById[activeId]) linkById[activeId].classList.add('active');
        }, { rootMargin: '-70px 0px -60% 0px', threshold: 0 });

        watched.forEach(function (section) { spy.observe(section); });
    }

    /* ---------------------------------------------------------
       Reveal on scroll
       Applied from JS so content stays visible without scripting.
       --------------------------------------------------------- */

    var revealTargets = document.querySelectorAll(
        '.news-item, .research-card, .pub-item, .timeline-item, .info-card, .course, .contact-block'
    );

    if (revealTargets.length && !prefersReducedMotion && 'IntersectionObserver' in window) {
        var revealer = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-revealed');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        revealTargets.forEach(function (el, index) {
            el.setAttribute('data-reveal', '');
            el.style.transitionDelay = Math.min(index % 6, 5) * 45 + 'ms';
            revealer.observe(el);
        });
    }

    /* ---------------------------------------------------------
       CV preview
       --------------------------------------------------------- */

    var cvToggle = document.getElementById('toggleCvPreview');
    var cvViewer = document.getElementById('cvViewer');

    if (cvToggle && cvViewer) {
        cvToggle.addEventListener('click', function () {
            var show = cvViewer.hasAttribute('hidden');
            var label = cvToggle.querySelector('[data-label]');

            if (show) {
                cvViewer.removeAttribute('hidden');
            } else {
                cvViewer.setAttribute('hidden', '');
            }

            cvToggle.setAttribute('aria-expanded', String(show));
            if (label) label.textContent = show ? 'Hide preview' : 'Preview';
        });
    }

    /* ---------------------------------------------------------
       Misc
       --------------------------------------------------------- */

    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    var topLink = document.querySelector('a[href="#top"]');
    if (topLink) {
        topLink.addEventListener('click', function (event) {
            event.preventDefault();
            closeNav();
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            if (window.history.replaceState) {
                window.history.replaceState(null, '', window.location.pathname);
            }
        });
    }
})();
