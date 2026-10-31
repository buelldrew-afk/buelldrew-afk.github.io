// Films come from YouTube. To add one, add a line here with its video ID
// (the part after "v=" in the YouTube link).
const FILMS = [
  { id: "nf2axyg0GWU", title: "A Trip Through the High Sierras", note: "Donner Summit to Lake Tahoe", group: "sierras" },
  { id: "9ha4GuFbYuY", title: "The American River", note: "Morning to evening on the river", group: "river" },
  { id: "TwTfaRelWRg", title: "No Hands Bridge (First Person View)", note: "A first-person run down the river", group: "fpv" },
  { id: "ItQl-Bh0iBM", title: "The Georgetown Divide", note: "", group: null },
];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---- Films: show a thumbnail, load the YouTube player only when clicked ----
const filmList = document.getElementById("film-list");
for (const film of FILMS) {
  const fig = document.createElement("figure");
  fig.className = "film";
  fig.innerHTML = `
    <div class="film-frame">
      <button class="film-play" aria-label="Play ${film.title}">
        <img src="https://i.ytimg.com/vi/${film.id}/maxresdefault.jpg" alt="" loading="lazy">
        <span class="play-icon"></span>
      </button>
    </div>
    <figcaption>
      <div class="film-title">${film.title}</div>
      ${film.note ? `<div class="film-note">${film.note}</div>` : ""}
    </figcaption>`;
  const img = fig.querySelector("img");
  // Some videos have no high-res thumbnail; YouTube then returns a small grey placeholder.
  img.addEventListener("load", () => {
    if (img.naturalWidth < 200) img.src = `https://i.ytimg.com/vi/${film.id}/hqdefault.jpg`;
  });
  img.addEventListener("error", () => { img.src = `https://i.ytimg.com/vi/${film.id}/hqdefault.jpg`; }, { once: true });
  fig.querySelector(".film-play").addEventListener("click", (e) => {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${film.id}?autoplay=1&rel=0&modestbranding=1`;
    iframe.title = film.title;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    e.currentTarget.replaceWith(iframe);
  });
  filmList.appendChild(fig);
}

// ---- Gallery: silent looping tiles that play only while on screen ----
const grid = document.getElementById("grid");
const tiles = window.CLIPS.map((clip, index) => {
  const tile = document.createElement("button");
  tile.className = "tile";
  tile.dataset.group = clip.group;
  tile.setAttribute("aria-label", `View ${clip.title}`);
  tile.innerHTML = `
    <video muted loop playsinline preload="none" poster="media/${clip.slug}.jpg" src="media/${clip.slug}-sm.mp4"></video>
    <span class="tile-label">${clip.title}</span>`;
  tile.addEventListener("click", () => openViewer(index));
  grid.appendChild(tile);
  return tile;
});

function play(video) { video.play().catch(() => {}); }

if (reduceMotion) {
  // No autoplay: play a tile only while the pointer is over it.
  for (const tile of tiles) {
    const v = tile.querySelector("video");
    tile.addEventListener("mouseenter", () => play(v));
    tile.addEventListener("mouseleave", () => v.pause());
  }
  document.querySelector(".hero-video").removeAttribute("autoplay");
} else {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const v = entry.target.querySelector("video");
      if (entry.isIntersecting) play(v); else v.pause();
    }
  }, { rootMargin: "100px 0px", threshold: 0.25 });
  tiles.forEach((t) => observer.observe(t));
}

// Filters
const chips = document.querySelectorAll(".chip");
chips.forEach((chip) => chip.addEventListener("click", () => {
  chips.forEach((c) => c.classList.toggle("is-active", c === chip));
  const f = chip.dataset.filter;
  tiles.forEach((t) => { t.hidden = f !== "all" && t.dataset.group !== f; });
}));

// ---- Full-size viewer ----
const viewer = document.getElementById("viewer");
const viewerVideo = document.getElementById("viewer-video");
const viewerTitle = document.getElementById("viewer-title");
const viewerFilm = document.getElementById("viewer-film");
let current = 0;
let lastFocus = null;

function visibleIndexes() {
  return tiles.map((t, i) => (t.hidden ? -1 : i)).filter((i) => i >= 0);
}

function show(index) {
  current = index;
  const clip = window.CLIPS[index];
  viewerVideo.poster = `media/${clip.slug}.jpg`;
  viewerVideo.src = `media/${clip.slug}.mp4`;
  play(viewerVideo);
  viewerTitle.textContent = clip.title;
  const film = FILMS.find((f) => f.group === clip.group);
  viewerFilm.hidden = !film;
  if (film) {
    viewerFilm.href = `https://www.youtube.com/watch?v=${film.id}`;
    viewerFilm.textContent = `Watch it in “${film.title}” →`;
  }
}

function openViewer(index) {
  lastFocus = document.activeElement;
  viewer.hidden = false;
  document.body.style.overflow = "hidden";
  show(index);
  viewer.querySelector(".viewer-close").focus();
}

function closeViewer() {
  viewer.hidden = true;
  viewerVideo.pause();
  viewerVideo.removeAttribute("src");
  viewerVideo.load();
  document.body.style.overflow = "";
  if (lastFocus) lastFocus.focus();
}

function step(dir) {
  const list = visibleIndexes();
  const pos = list.indexOf(current);
  show(list[(pos + dir + list.length) % list.length]);
}

viewer.querySelector(".viewer-close").addEventListener("click", closeViewer);
viewer.querySelector(".prev").addEventListener("click", () => step(-1));
viewer.querySelector(".next").addEventListener("click", () => step(1));
viewer.addEventListener("click", (e) => { if (e.target === viewer) closeViewer(); });
document.addEventListener("keydown", (e) => {
  if (viewer.hidden) return;
  if (e.key === "Escape") closeViewer();
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});
