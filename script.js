// --- DOM Element Selections (Cached) ---
const leftbtn = document.querySelector(".left-arr");
const rightbtn = document.querySelector(".right-arr");
const songCardsContainer = document.querySelector(".song-cards");
const librarySongsContainer = document.querySelector(".library-songs");
const playpausebtn = document.querySelector(
  ".player .playpause .playpause-btn"
);
const nextAudioBtn = document.getElementById("next").querySelector(".next-btn");
const prevAudioBtn = document.getElementById("previous").querySelector(".prev-btn");
const currSongDiv = document.querySelector(".curr-song"); // Cache this too
const progressBarWrapper = document.querySelector(".progress-bar-wrapper");
const progressBar = document.querySelector(".progress-bar");
const currentTimeSpan = document.querySelector(".current-time");
const totalDurationSpan = document.querySelector(".total-duration");

// --- Global Variables ---
let songs = null;
let currentAudioId = null;
let currentAudio = null; // Use this consistently, avoid window.currentAudio unless necessary

// --- Constants ---
const SCROLL_AMOUNT = 600;

// --- Function to update visibility of scroll arrows ---
function updateArrowVisibility() {
  const scrollLeft = songCardsContainer.scrollLeft;
  const maxScrollLeft =
    songCardsContainer.scrollWidth - songCardsContainer.clientWidth;

  leftbtn.style.display = scrollLeft > 0 ? "block" : "none";
  rightbtn.style.display = scrollLeft < maxScrollLeft ? "block" : "none";
}

// --- Initialize arrow visibility & Event Listeners for scroll buttons ---
updateArrowVisibility();
songCardsContainer.addEventListener("scroll", updateArrowVisibility);

leftbtn.addEventListener("click", () => {
  songCardsContainer.scrollBy({ left: -SCROLL_AMOUNT, behavior: "smooth" });
});

rightbtn.addEventListener("click", () => {
  songCardsContainer.scrollBy({ left: SCROLL_AMOUNT, behavior: "smooth" });
});

// --- Anchor tags to open in new tab and apply security best practices ---
document.addEventListener("DOMContentLoaded", function () {
  const links = document.querySelectorAll("a");
  links.forEach((link) => {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });
});

// --- Load songs from JSON ---
async function loadSongs() {
  try {
    const response = await fetch("songs.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    songs = await response.json();
  } catch (error) {
    console.error("Failed to load songs:", error);
    // Optionally display an error message to the user
  }
}

// --- Render trending songs ---
function loadTrendingSongs() {
  if (!songCardsContainer) {
    console.error("Song container '.song-cards' not found");
    return;
  }

  songs.forEach((song) => {
    if (song.tags.includes("trending")) {
      const card = document.createElement("div");
      card.className = "song-card flex-column";
      card.innerHTML = `
        <div class="cover-img">
          <img class="cover" src="${song.coverImg}" alt="${song.name}" />
          <button class="play-btn scale" data-id="${song.id}">
            <img src="Assets/SVGs/play.svg" alt="" />
          </button>
        </div>
        <div class="description flex-column">
          <div class="song-name"><span>${song.name}</span></div>
          <div class="singer fs-13">
            <span>
              ${song.singers
                .map((singer, i) =>
                  song.singersUrl?.[i]
                    ? `<a href="${song.singersUrl[i]}" target="_blank">${singer}</a>`
                    : singer
                )
                .join(", ")}
            </span>
          </div>
        </div>
      `;
      songCardsContainer.appendChild(card);
    }
  });
}

// --- Render library songs ---
function loadLibrarySongs() {
  if (!librarySongsContainer) {
    console.error("Song container '.library-songs' not found");
    return;
  }
  const shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
  shuffledSongs.forEach((song) => {
    const card = document.createElement("div");
    card.className = "library-song flex align-center";
    card.innerHTML = `
      <div class="song-img flex align-center">
              <img src="${song.coverImg}" alt="${song.name}">
            </div>
            <div class="library-play-btn flex align-center justify-center">
              <button data-id="${
                song.id
              }"><img src="Assets/SVGs/playMusic2.svg" alt=""></button>
            </div>
            <div class="song-info flex-column">
              <div class="song-name flex">
                <span class="fs-15 bold">${song.name}</span>
              </div>
              <div class="singers">
                <span class="fs-13">
                  ${song.singers
                    .map((singer, i) =>
                      song.singersUrl?.[i]
                        ? `<a href="${song.singersUrl[i]}" target="_blank">${singer}</a>`
                        : singer
                    )
                    .join(", ")}
                </span>
              </div>
            </div>
    `;
    librarySongsContainer.appendChild(card);
  });
}

// --- Play selected song ---
function playSong(audioId) {
  currentAudioId = audioId;

  // Update active state for library songs
  document.querySelectorAll(".library-song").forEach((card) => {
    const btn = card.querySelector("button");
    if (btn && btn.getAttribute("data-id") === audioId) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });

  const song = songs.find((s) => s.id === currentAudioId);
  if (!song) {
    console.error(`Song with ID ${audioId} not found.`);
    return;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.removeEventListener("timeupdate", handleTimeUpdate);
    currentAudio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    currentAudio.removeEventListener("ended", playNextSong);
    currentAudio.removeEventListener("play", handleAudioPlay);
  }

  currentAudio = new Audio(song.url);

  currentAudio.addEventListener("timeupdate", handleTimeUpdate);
  currentAudio.addEventListener("loadedmetadata", handleLoadedMetadata);
  currentAudio.addEventListener("play", handleAudioPlay);
  currentAudio.addEventListener("ended", playNextSong);

  currentAudio.play();

  updatePlayer(song);
  updatePlayBtn();
}

// --- Update player UI with current song info ---
function updatePlayer(song) {
  const { coverImg, name, singers, singersUrl } = song;

  currSongDiv.querySelector(".curr-song-img img").src = coverImg;
  currSongDiv.querySelector(
    ".curr-song-name"
  ).innerHTML = `<span>${name}</span>`;
  currSongDiv.querySelector(".curr-song-singers").innerHTML = `
    <span>
      ${singers
        .map((singer, i) =>
          singersUrl?.[i]
            ? `<a href="${singersUrl[i]}" class="wrap" target="_blank">${singer}</a>`
            : singer
        )
        .join(", ")}
    </span>
  `;
}

// --- Update play/pause button icon ---
function updatePlayBtn() {
  if (currentAudio && !currentAudio.paused) {
    playpausebtn.querySelector("img").src = "Assets/SVGs/pause.svg";
  } else {
    playpausebtn.querySelector("img").src = "Assets/SVGs/playMusic.svg";
  }
}

// --- Initialize play/pause button listener ---
function initializePlayBtn() {
  playpausebtn.addEventListener("click", () => {
    if (!currentAudio) {
      playSong(songs[0].id); // Play the first song if nothing is playing
      return;
    }

    if (!currentAudio.paused) {
      currentAudio.pause();
    } else {
      currentAudio.play();
    }
    updatePlayBtn();
  });
}

// --- Play next song ---
function playNextSong() {
  let currIndex = parseInt(currentAudioId) - 1;
  let nextSongIndex;

  if (currIndex === songs.length - 1) {
    nextSongIndex = 0; // Loop to the first song
  } else {
    nextSongIndex = currIndex + 1;
  }

  const nextSong = songs[nextSongIndex];
  playSong(nextSong.id); // This will handle stopping the current, playing the next, and updating UI
}

// --- Event Listener for Next button ---
nextAudioBtn.addEventListener("click", playNextSong);

// --- Event Delegation for Play Buttons ---
songCardsContainer.addEventListener("click", (event) => {
  const playBtn = event.target.closest(".play-btn");
  if (playBtn) {
    const audioId = playBtn.getAttribute("data-id");
    playSong(audioId);
  }
});


// --- Play prev song ---
function playPrevSong() {
  let currIndex = parseInt(currentAudioId) - 1;
  let prevSongIndex;

  if (currIndex === 0) {
    prevSongIndex = songs.length - 1; // Loop to the first song
  } else {
    prevSongIndex = currIndex - 1;
  }

  const prevSong = songs[prevSongIndex];
  playSong(prevSong.id); // This will handle stopping the current, playing the next, and updating UI
}

// --- Event Listener for Next button ---
prevAudioBtn.addEventListener("click", playPrevSong);

// --- Event Delegation for Play Buttons ---
songCardsContainer.addEventListener("click", (event) => {
  const playBtn = event.target.closest(".play-btn");
  if (playBtn) {
    const audioId = playBtn.getAttribute("data-id");
    playSong(audioId);
  }
});

librarySongsContainer.addEventListener("click", (event) => {
  const libraryPlayBtn = event.target.closest(".library-play-btn button");
  if (libraryPlayBtn) {
    const audioId = libraryPlayBtn.getAttribute("data-id");
    playSong(audioId);
  }
});

progressBarWrapper.addEventListener("click", (e) => {
  if (!currentAudio || isNaN(currentAudio.duration)) {
    return;
  }

  const clickX = e.offsetX;
  const wrapperWidth = progressBarWrapper.clientWidth;

  const clickPercent = clickX / wrapperWidth;
  currentAudio.currentTime = currentAudio.duration * clickPercent;
});

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const formattedSeconds =
    remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds;
  return `${minutes}:${formattedSeconds}`;
}

function handleTimeUpdate() {
  if (!isNaN(currentAudio.duration)) {
    const progressPercent =
      (currentAudio.currentTime / currentAudio.duration) * 100;
    progressBar.style.width = `${progressPercent}%`; // Make sure to use '%' unit
    currentTimeSpan.textContent = formatTime(currentAudio.currentTime);
  }
}

function handleLoadedMetadata() {
  if (!isNaN(currentAudio.duration)) {
    totalDurationSpan.textContent = formatTime(currentAudio.duration);
  } else {
    totalDurationSpan.textContent = "0:00";
  }
}

function handleAudioPlay() {
  if (!isNaN(currentAudio.duration)) {
    totalDurationSpan.textContent = formatTime(currentAudio.duration);
  }
}

// --- Initial Setup on DOM Content Loaded ---
window.addEventListener("DOMContentLoaded", async () => {
  await loadSongs();
  loadTrendingSongs();
  loadLibrarySongs(); // Load library songs after songs are loaded
  initializePlayBtn();
});

document.addEventListener("DOMContentLoaded", () => {
  totalDurationSpan.textContent = "0:00";
  currentTimeSpan.textContent = "0:00";
});
