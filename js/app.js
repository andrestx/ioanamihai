/* ============================================================
   GALERIE FOTO NUNTĂ — Mihai & Ioana
   Editează textele/timpii de mai jos după cum vrei.
   ============================================================ */
const CONFIG = {
  manifestUrl: 'data/manifest.json',
  introAutoAdvanceMs: 4200,   // cât timp stă ecranul de intro înainte să treacă automat mai departe
  slideshowIntervalMs: 3500,  // interval între poze în modul "Prezentare" din lightbox
};

const VIDEO_EXT = ['mp4', 'mov', 'webm', 'avi', 'm4v'];

let manifest = { albums: [] };
let activeAlbum = null;
let activeIndex = 0;
let slideshowTimer = null;
let introTimer = null;

const els = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  cacheElements();
  bindEvents();
  setupIntro();

  await loadManifest();
  renderAlbumsOverview();
  handleRoute();
}

function cacheElements() {
  els.intro = document.getElementById('intro');
  els.app = document.getElementById('app');
  els.viewOverview = document.getElementById('view-overview');
  els.viewDetail = document.getElementById('view-detail');
  els.albumsGrid = document.getElementById('albums-grid');
  els.photosGrid = document.getElementById('photos-grid');
  els.albumTitle = document.getElementById('album-title');
  els.albumCount = document.getElementById('album-count');
  els.backBtn = document.getElementById('back-btn');
  els.emptyState = document.getElementById('empty-state');
  els.errorState = document.getElementById('error-state');

  els.lightbox = document.getElementById('lightbox');
  els.lightboxStage = document.getElementById('lightbox-stage');
  els.lightboxCounter = document.getElementById('lightbox-counter');
  els.lightboxClose = document.getElementById('lightbox-close');
  els.lightboxPrev = document.getElementById('lightbox-prev');
  els.lightboxNext = document.getElementById('lightbox-next');
  els.lightboxDownload = document.getElementById('lightbox-download');
  els.lightboxSlideshow = document.getElementById('lightbox-slideshow');
}

function bindEvents() {
  window.addEventListener('hashchange', handleRoute);
  els.backBtn.addEventListener('click', () => { location.hash = ''; });

  els.lightboxClose.addEventListener('click', closeLightbox);
  els.lightboxPrev.addEventListener('click', () => stepLightbox(-1));
  els.lightboxNext.addEventListener('click', () => stepLightbox(1));
  els.lightboxSlideshow.addEventListener('click', toggleSlideshow);

  els.lightbox.addEventListener('click', (e) => {
    if (e.target === els.lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (els.lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') stepLightbox(1);
    else if (e.key === 'ArrowLeft') stepLightbox(-1);
  });

  let touchStartX = null;
  els.lightboxStage.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  els.lightboxStage.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) stepLightbox(dx > 0 ? -1 : 1);
    touchStartX = null;
  }, { passive: true });
}

/* ---------------- Intro ---------------- */
function setupIntro() {
  if (!els.intro) return;
  let dismissed = false;

  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(introTimer);
    els.intro.classList.add('intro--hide');

    els.app.hidden = false;
    void els.app.offsetHeight; // forțează reflow ca tranziția CSS să pornească
    els.app.classList.add('app--visible');

    setTimeout(() => { els.intro.hidden = true; }, 700);
  };

  introTimer = setTimeout(dismiss, CONFIG.introAutoAdvanceMs);
  els.intro.addEventListener('click', dismiss);
  els.intro.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismiss(); }
  });
}

/* ---------------- Date ---------------- */
async function loadManifest() {
  try {
    const res = await fetch(CONFIG.manifestUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    manifest = await res.json();
  } catch (err) {
    console.error('Nu am putut încărca manifest.json:', err);
    manifest = { albums: [] };
    els.errorState.hidden = false;
  }
}

/* ---------------- Randare albume ---------------- */
function renderAlbumsOverview() {
  const albums = manifest.albums || [];
  if (albums.length === 0) {
    els.emptyState.hidden = false;
    return;
  }

  els.albumsGrid.innerHTML = '';
  albums.forEach((album, i) => {
    const card = document.createElement('a');
    card.href = '#album-' + album.id;
    card.className = 'album-card';
    card.style.setProperty('--delay', (i * 70) + 'ms');

    if (itemType(album.cover) === 'video') {
      card.innerHTML =
        '<div class="album-card__cover album-card__cover--video"><span class="album-card__play">▶</span></div>' +
        '<div class="album-card__info"><h3>' + escapeHtml(album.title) + '</h3>' +
        '<span>' + album.items.length + ' fișiere</span></div>';
    } else {
      const src = buildPath(album.folder, album.cover);
      card.innerHTML =
        '<div class="album-card__cover"><img src="' + src + '" alt="' + escapeHtml(album.title) + '" loading="lazy" decoding="async"></div>' +
        '<div class="album-card__info"><h3>' + escapeHtml(album.title) + '</h3>' +
        '<span>' + album.items.length + ' fișiere</span></div>';
    }
    els.albumsGrid.appendChild(card);
  });

  observeReveal(els.albumsGrid.querySelectorAll('.album-card'));
}

/* ---------------- Randare album deschis ---------------- */
function openAlbumDetail(id) {
  const album = (manifest.albums || []).find(a => a.id === id);
  if (!album) { location.hash = ''; return; }
  activeAlbum = album;

  els.viewOverview.hidden = true;
  els.viewDetail.hidden = false;
  els.albumTitle.textContent = album.title;
  els.albumCount.textContent = album.items.length + ' fișiere';

  els.photosGrid.innerHTML = '';
  album.items.forEach((item, index) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'photo-tile';
    tile.setAttribute('aria-label', 'Deschide fișierul ' + (index + 1));
    tile.style.setProperty('--delay', (Math.min(index, 24) * 25) + 'ms');

    if (item.type === 'video') {
      tile.classList.add('photo-tile--video');
      tile.innerHTML = '<span class="photo-tile__play">▶</span>';
    } else {
      const src = buildPath(album.folder, item.file);
      tile.innerHTML = '<img src="' + src + '" alt="' + escapeHtml(album.title) + ' - poza ' + (index + 1) + '" loading="lazy" decoding="async">';
    }

    tile.addEventListener('click', () => openLightbox(index));
    els.photosGrid.appendChild(tile);
  });

  observeReveal(els.photosGrid.querySelectorAll('.photo-tile'));
  window.scrollTo(0, 0);
}

function closeAlbumDetail() {
  activeAlbum = null;
  els.viewDetail.hidden = true;
  els.viewOverview.hidden = false;
}

/* ---------------- Router simplu (#album-ID) ---------------- */
function handleRoute() {
  const hash = decodeURIComponent(location.hash || '');
  if (hash.indexOf('#album-') === 0) {
    openAlbumDetail(hash.slice('#album-'.length));
  } else {
    closeAlbumDetail();
  }
}

/* ---------------- Lightbox ---------------- */
function openLightbox(index) {
  if (!activeAlbum) return;
  activeIndex = index;
  els.lightbox.hidden = false;
  document.body.classList.add('no-scroll');
  renderLightboxItem();
}

function closeLightbox() {
  els.lightbox.hidden = true;
  document.body.classList.remove('no-scroll');
  stopSlideshow();
  els.lightboxStage.innerHTML = '';
}

function stepLightbox(direction) {
  if (!activeAlbum) return;
  const total = activeAlbum.items.length;
  activeIndex = (activeIndex + direction + total) % total;
  renderLightboxItem();
}

function renderLightboxItem() {
  const item = activeAlbum.items[activeIndex];
  const src = buildPath(activeAlbum.folder, item.file);

  els.lightboxStage.innerHTML = '';
  let mediaEl;
  if (item.type === 'video') {
    mediaEl = document.createElement('video');
    mediaEl.src = src;
    mediaEl.controls = true;
    mediaEl.playsInline = true;
  } else {
    mediaEl = document.createElement('img');
    mediaEl.src = src;
    mediaEl.alt = activeAlbum.title + ' - poza ' + (activeIndex + 1);
  }
  mediaEl.className = 'lightbox-media';
  els.lightboxStage.appendChild(mediaEl);

  els.lightboxCounter.textContent = (activeIndex + 1) + ' / ' + activeAlbum.items.length;
  els.lightboxDownload.href = src;
  els.lightboxDownload.setAttribute('download', item.file);
}

function toggleSlideshow() {
  if (slideshowTimer) {
    stopSlideshow();
  } else {
    slideshowTimer = setInterval(() => stepLightbox(1), CONFIG.slideshowIntervalMs);
    els.lightboxSlideshow.classList.add('is-active');
    els.lightboxSlideshow.textContent = '⏸ Oprește';
  }
}

function stopSlideshow() {
  if (slideshowTimer) { clearInterval(slideshowTimer); slideshowTimer = null; }
  els.lightboxSlideshow.classList.remove('is-active');
  els.lightboxSlideshow.textContent = '▶ Prezentare';
}

/* ---------------- Utilitare ---------------- */
function itemType(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  return VIDEO_EXT.indexOf(ext) !== -1 ? 'video' : 'image';
}

function buildPath(folder, file) {
  return folder.split('/').map(encodeURIComponent).join('/') + '/' + encodeURIComponent(file);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function observeReveal(elements) {
  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  elements.forEach(el => observer.observe(el));
}
