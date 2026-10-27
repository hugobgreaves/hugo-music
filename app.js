(function () {
  "use strict";

  // SHA-256 of the friends password — plaintext is never stored in the repo.
  const PASS_HASH =
    "629f4cf9337b0d0c76f305d860f98894cfa8c279516b425747514ca8710deb97";
  const UNLOCK_KEY = "hugo-music-unlocked";

  const TRACKS = [
    {
      id: "never-be-a-sheep",
      title: "Never Be a Sheep",
      file: "tracks/never-be-a-sheep.mp3",
      duration: 143,
    },
    {
      id: "easy-money",
      title: "Easy Money",
      file: "tracks/easy-money.mp3",
      duration: 147,
    },
    {
      id: "till-i-win",
      title: "Till I Win",
      file: "tracks/till-i-win.mp3",
      duration: 262,
    },
    {
      id: "saturday-night",
      title: "Saturday Night",
      file: "tracks/saturday-night.mp3",
      duration: 548,
    },
    {
      id: "two-tens",
      title: "Two Tens",
      file: "tracks/two-tens.mp3",
      duration: 233,
    },
    {
      id: "freestyle-session",
      title: "Freestyle Session",
      file: "tracks/freestyle-session.mp3",
      duration: 1734,
    },
  ];

  const gate = document.getElementById("gate");
  const app = document.getElementById("app");
  const form = document.getElementById("gate-form");
  const passwordInput = document.getElementById("password");
  const gateError = document.getElementById("gate-error");
  const trackList = document.getElementById("track-list");
  const audio = document.getElementById("audio");
  const nowTitle = document.getElementById("now-title");
  const nowTime = document.getElementById("now-time");
  const seek = document.getElementById("seek");
  const btnPlay = document.getElementById("btn-play");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");

  let currentIndex = -1;
  let seeking = false;

  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    }
    return m + ":" + String(s).padStart(2, "0");
  }

  async function sha256Hex(text) {
    const data = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function showApp() {
    gate.hidden = true;
    app.hidden = false;
  }

  function showGate() {
    gate.hidden = false;
    app.hidden = true;
  }

  function renderList() {
    trackList.innerHTML = "";
    TRACKS.forEach((t, i) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "track" + (i === currentIndex ? " active" : "");
      btn.innerHTML =
        '<span class="track-num">' +
        (i + 1) +
        '</span><span class="track-meta"><div class="track-title">' +
        t.title +
        '</div><div class="track-dur">' +
        fmt(t.duration) +
        "</div></span>";
      btn.addEventListener("click", () => playIndex(i));
      li.appendChild(btn);
      trackList.appendChild(li);
    });
  }

  function updateActive() {
    const buttons = trackList.querySelectorAll(".track");
    buttons.forEach((b, i) => {
      b.classList.toggle("active", i === currentIndex);
    });
  }

  function playIndex(i) {
    if (i < 0 || i >= TRACKS.length) return;
    currentIndex = i;
    const t = TRACKS[i];
    nowTitle.textContent = t.title;
    audio.src = t.file;
    audio.play().catch(() => {});
    btnPlay.textContent = "⏸";
    updateActive();
  }

  function togglePlay() {
    if (currentIndex < 0) {
      playIndex(0);
      return;
    }
    if (audio.paused) {
      audio.play().catch(() => {});
      btnPlay.textContent = "⏸";
    } else {
      audio.pause();
      btnPlay.textContent = "▶";
    }
  }

  function updateTime() {
    const cur = audio.currentTime || 0;
    const dur = audio.duration || (currentIndex >= 0 ? TRACKS[currentIndex].duration : 0);
    nowTime.textContent = fmt(cur) + " / " + fmt(dur);
    if (!seeking && dur) {
      seek.value = String(Math.round((cur / dur) * 1000));
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    gateError.hidden = true;
    const entered = passwordInput.value.replace(/\s+/g, "").trim();
    const hash = await sha256Hex(entered);
    if (hash === PASS_HASH) {
      try {
        sessionStorage.setItem(UNLOCK_KEY, "1");
      } catch (_) {}
      passwordInput.value = "";
      showApp();
      renderList();
    } else {
      gateError.hidden = false;
      passwordInput.select();
    }
  });

  btnPlay.addEventListener("click", togglePlay);
  btnPrev.addEventListener("click", () => {
    if (currentIndex < 0) return;
    playIndex((currentIndex - 1 + TRACKS.length) % TRACKS.length);
  });
  btnNext.addEventListener("click", () => {
    if (currentIndex < 0) return;
    playIndex((currentIndex + 1) % TRACKS.length);
  });

  seek.addEventListener("pointerdown", () => {
    seeking = true;
  });
  seek.addEventListener("pointerup", () => {
    seeking = false;
    const dur = audio.duration || 0;
    if (dur) audio.currentTime = (Number(seek.value) / 1000) * dur;
  });
  seek.addEventListener("change", () => {
    const dur = audio.duration || 0;
    if (dur) audio.currentTime = (Number(seek.value) / 1000) * dur;
    seeking = false;
  });

  audio.addEventListener("timeupdate", updateTime);
  audio.addEventListener("loadedmetadata", updateTime);
  audio.addEventListener("play", () => {
    btnPlay.textContent = "⏸";
  });
  audio.addEventListener("pause", () => {
    btnPlay.textContent = "▶";
  });
  audio.addEventListener("ended", () => {
    if (currentIndex < TRACKS.length - 1) {
      playIndex(currentIndex + 1);
    } else {
      btnPlay.textContent = "▶";
    }
  });

  // Boot
  let unlocked = false;
  try {
    unlocked = sessionStorage.getItem(UNLOCK_KEY) === "1";
  } catch (_) {}

  if (unlocked) {
    showApp();
    renderList();
  } else {
    showGate();
  }
})();
