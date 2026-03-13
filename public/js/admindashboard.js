/* =====================================================
   DOM References
   ===================================================== */
const heroTrack = document.getElementById("heroTrack");
const ticketTrack = document.getElementById("ticketTrack");
const labSearch = document.getElementById("labSearch");
const announceText = document.getElementById("announceText");
const postBtn = document.getElementById("postBtn");
const clearBtn = document.getElementById("clearBtn");
const notifMini = document.getElementById("notifMini");

/* =====================================================
   Hero Carousel Controls
   ===================================================== */
function getHeroIndex() {
  const w = heroTrack?.clientWidth || 1;
  return Math.round(heroTrack.scrollLeft / w);
}

function updateHeroArrows() {
  if (!heroTrack) return;

  const cards = heroTrack.querySelectorAll(".hero-card");
  const idx = getHeroIndex();
  const isFirst = idx <= 0;
  const isLast = idx >= cards.length - 1;

  document
    .querySelectorAll(".hero-prev")
    .forEach(btn => (btn.style.display = isFirst ? "none" : "grid"));

  document
    .querySelectorAll(".hero-next")
    .forEach(btn => (btn.style.display = isLast ? "none" : "grid"));
}

function setupHeroScroll() {
  if (!heroTrack) return;

  heroTrack.addEventListener("click", e => {
    const prev = e.target.closest(".hero-prev");
    const next = e.target.closest(".hero-next");
    if (!prev && !next) return;

    const step = heroTrack.clientWidth;
    heroTrack.scrollBy({
      left: prev ? -step : step,
      behavior: "smooth"
    });
  });

  heroTrack.addEventListener("scroll", () => {
    requestAnimationFrame(updateHeroArrows);
  });

  window.addEventListener("resize", updateHeroArrows);
  updateHeroArrows();
}

/* =====================================================
   Horizontal Scroll Enhancement
   ===================================================== */
function enableWheelHorizontalScroll(el) {
  if (!el) return;

  el.addEventListener(
    "wheel",
    e => {
      const canScrollX = el.scrollWidth > el.clientWidth + 1;
      const insideRoomScroll = e.target.closest(".room-scroll");

      if (!canScrollX || insideRoomScroll) return;

      const intentVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
      if (!intentVertical) return;

      e.preventDefault();
      el.scrollBy({ left: e.deltaY, behavior: "auto" });
    },
    { passive: false }
  );
}

/* =====================================================
   Search Navigation
   ===================================================== */
function setupLabSearch() {
  if (!labSearch) return;

  labSearch.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;

    event.preventDefault();

    const keyword = labSearch.value.trim();
    if (!keyword) return;

    window.location.href = `/search-results?q=${encodeURIComponent(keyword)}`;
  });
}

/* =====================================================
   Announcement Helpers
   ===================================================== */
function setAnnouncementButtonState(isPosting) {
  if (!postBtn) return;

  postBtn.disabled = isPosting;
  postBtn.textContent = isPosting ? "Posting..." : "Post";
}

function clearAnnouncementField() {
  if (announceText) {
    announceText.value = "";
    announceText.focus();
  }
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function prependMiniNotification(name, snippet) {
  if (!notifMini) return;

  const item = document.createElement("div");
  item.className = "mini-item";
  item.innerHTML = `
    <img
      src="/img/system_profile.png"
      class="mini-ava"
      alt="${escapeHtml(name)}"
      onerror="this.onerror=null;this.src='/img/system_profile.png';"
    >
    <div class="mini-text">
      <div class="mini-name">${escapeHtml(name)}</div>
      <div class="mini-snippet">${escapeHtml(snippet)}</div>
    </div>
  `;

  notifMini.prepend(item);

  while (notifMini.children.length > 4) {
    notifMini.removeChild(notifMini.lastElementChild);
  }
}

/* =====================================================
   Announcement Buttons
   ===================================================== */
function setupAnnouncementActions() {
  if (clearBtn && announceText) {
    clearBtn.addEventListener("click", () => {
      clearAnnouncementField();
    });
  }

  if (postBtn && announceText) {
    postBtn.addEventListener("click", async () => {
      const value = announceText.value.trim();

      if (!value) {
        alert("Please write an announcement first.");
        return;
      }

      try {
        setAnnouncementButtonState(true);

        const response = await fetch("/admin/announcements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: value
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to post announcement.");
        }

        prependMiniNotification("Reserve++ Team", value);
        clearAnnouncementField();
        alert("Announcement posted successfully.");
      } catch (err) {
        console.error("Announcement posting failed:", err);
        alert(err.message || "Failed to post announcement.");
      } finally {
        setAnnouncementButtonState(false);
      }
    });
  }
}

/* =====================================================
   Initial Setup
   ===================================================== */
setupHeroScroll();
enableWheelHorizontalScroll(heroTrack);
enableWheelHorizontalScroll(ticketTrack);
setupLabSearch();
setupAnnouncementActions();