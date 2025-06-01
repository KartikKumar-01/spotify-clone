// Selecting DOM elements for left and right scroll buttons and the container of song cards
const leftbtn = document.querySelector(".left-arr");
const rightbtn = document.querySelector(".right-arr");
const container = document.querySelector(".song-cards");

// Amount to scroll when arrow buttons are clicked
const scrollAmount = 600;

// Function to update visibility of scroll arrows based on container's scroll position
function updateArrowVisibility() {
  const scrollLeft = container.scrollLeft;
  const maxScrollLeft = container.scrollWidth - container.clientWidth;

  leftbtn.style.display = scrollLeft > 0 ? "block" : "none";
  rightbtn.style.display = scrollLeft < maxScrollLeft ? "block" : "none";
}

// Initialize arrow visibility on page load
updateArrowVisibility();

// Update arrow visibility when user scrolls the container
container.addEventListener("scroll", updateArrowVisibility);

// Scroll left by scrollAmount when left arrow is clicked
leftbtn.addEventListener("click", () => {
  container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
});

// Scroll right by scrollAmount when right arrow is clicked
rightbtn.addEventListener("click", () => {
  container.scrollBy({ left: scrollAmount, behavior: "smooth" });
});

// Set all anchor tags to open in new tab and apply security best practices
document.addEventListener("DOMContentLoaded", function () {
  const links = document.querySelectorAll("a");
  links.forEach((link) => {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer"); // Prevents access to the original page via `window.opener`
  });
});

// Declare global variables
let songs = null;
let currentAudioId = null;
let currentAudio = null;

// Load songs from JSON and render them as song cards
async function loadTrendingSongs() {
  const songContainer = document.querySelector(".song-cards");
  if (!songContainer) {
    console.error("Song container '.song-cards' not found");
    return;
  }

  const response = await fetch("songs.json");
  songs = await response.json();

  // Create a card for each song
  songs.forEach((song) => {
    const card = document.createElement("div");
    card.className = "song-card flex-column";

    // Generate card HTML using song data
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

    // Append card to song container
    songContainer.appendChild(card);
  });

  // Add click listeners to play buttons
  setTimeout(() => {
    document.querySelectorAll(".play-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const audioId = btn.getAttribute("data-id");
        playSong(audioId);
      });
    });
  }, 0);
}

// Play selected song using its audioId
function playSong(audioId) {
  currentAudioId = audioId;
  const song = songs.find((song) => song.id === currentAudioId);

  // Stop current audio if already playing
  if (window.currentAudio) {
    window.currentAudio.pause();
  }

  // Create new Audio instance and play
  currentAudio = new Audio(song.url);
  currentAudio.play();
  window.currentAudio = currentAudio;

  updatePlayer(song);

  // Automatically play next song when current ends
  currentAudio.addEventListener("ended", () => {
    nextAudioBtn.click();
  });
}

// Update player UI with current song info
function updatePlayer(song) {
  const currSongDiv = document.querySelector(".curr-song");

  // Update cover image
  const coverImg = currSongDiv.querySelector(".curr-song-img img");
  coverImg.src = `${song.coverImg}`;

  // Update song name and singers
  const songInfo = currSongDiv.querySelector(".curr-song-info");
  songInfo.querySelector(
    ".curr-song-name"
  ).innerHTML = `<span>${song.name}</span>`;
  songInfo.querySelector(".curr-song-singers").innerHTML = `
    <span>
      ${song.singers
        .map((singer, i) =>
          song.singersUrl?.[i]
            ? `<a href="${song.singersUrl[i]}" class="wrap" target="_blank">${singer}</a>`
            : singer
        )
        .join(", ")}
    </span>
  `;

  updatePlayBtn();
}

// Select the play/pause button element
const playpausebtn = document.querySelector(
  ".player .playpause .playpause-btn"
);

// Change play/pause icon based on audio state
function updatePlayBtn() {
  if (!currentAudio.paused && currentAudio) {
    playpausebtn.querySelector("img").src = "Assets/SVGs/pause.svg";
  } else {
    playpausebtn.querySelector("img").src = "Assets/SVGs/playMusic.svg";
  }
}

// Add event listener to play/pause button
function initializePlayBtn() {
  playpausebtn.addEventListener("click", () => {
    if (!currentAudio) {
      // If no audio has played yet, play the first song
      playSong(songs[0].id);
      updatePlayBtn();
      return;
    }

    // Toggle between play and pause
    if (!currentAudio.paused) {
      currentAudio.pause();
    } else {
      currentAudio.play();
    }

    updatePlayBtn();
  });
}

// Get the "Next" button and handle song switching logic
const nextAudioBtn = document.getElementById("next").querySelector(".next-btn");
nextAudioBtn.addEventListener("click", () => {
  let songsSize = songs.length;
  let song = null;

  // If nothing is playing, start with the first song
  if (!window.currentAudio || !currentAudioId) {
    song = songs[0];
    currentAudioId = "1";
    currentAudio = new Audio(song.url);
    currentAudio.play();
    window.currentAudio = currentAudio;

    updatePlayer(song);
    updatePlayBtn();
    currentAudio.addEventListener("ended", () => {
      nextAudioBtn.click();
    });
    return;
  }

  // Stop current audio
  window.currentAudio.pause();
  let currIndex = parseInt(currentAudioId) - 1;

  // Get next song in list, loop to first if at end
  if (currIndex === songsSize - 1) {
    song = songs[0];
    currentAudioId = "1";
  } else {
    let nextSongIndex = currIndex + 1;
    song = songs[nextSongIndex];
    currentAudioId = String(nextSongIndex + 1);
  }

  // Play new song
  currentAudio = new Audio(song.url);
  currentAudio.play();
  window.currentAudio = currentAudio;

  updatePlayer(song);
  updatePlayBtn();

  // Auto-play next song when current ends
  currentAudio.addEventListener("ended", () => {
    nextAudioBtn.click();
  });
});

// Run setup functions when DOM content is loaded
window.addEventListener("DOMContentLoaded", async () => {
  await loadTrendingSongs(); // load songs and build cards
  initializePlayBtn(); // set up play/pause button
});
