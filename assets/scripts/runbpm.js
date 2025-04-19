let currentBPM = null;
let isBPMSearch = false;

// Initialize the search functionality
function songSearch() {
  "use strict";

  let searchOutput = document.querySelector('.search-output');
  let searchBtn = document.getElementById('search');
  let searchInput = document.getElementById('search-input');
  let searchType = document.getElementById('search-type'); // Dropdown for search type
  let recommendedSongsSection = document.querySelector('.recommended-songs');

  searchBtn.addEventListener('click', () => {
    recommendedSongsSection.style.display = 'none';
    createSearch(searchInput, searchType, searchOutput);
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.keyCode === 13) {
      recommendedSongsSection.style.display = 'none';
      createSearch(searchInput, searchType, searchOutput);
    }
  });
}

// Creating a song search or BPM search
function createSearch(input, typeSelector, output) {
  let inputVal = input.value.trim();
  let searchType = typeSelector.value; // Get the selected search type

  if (inputVal === '') {
    output.innerHTML = "<p>Please enter a value.</p>";
    return;
  }

  // Clear previous results
  output.innerHTML = `<p>Searching for "${inputVal}"...</p>`;

  // Call the appropriate API function
  if (searchType === "bpm") {
    currentBPM = inputVal;
    isBPMSearch = true;
    fetchSongsByBPM(inputVal, output);
  } else {
    currentBPM = null;
    isBPMSearch = false;
    fetchSongsByName(inputVal, output);
  }

  // Clear input field
  input.value = '';
}

// Function to fetch songs by name
async function fetchSongsByName(songName, output) {
  try {
    const response = await fetch(`/api/search?type=song&query=${encodeURIComponent(songName)}`);
    const data = await response.json();

    if (!data.search || data.search.length === 0) {
      output.innerHTML = `<p>No results found for "${songName}". Try another song.</p>`;
      return;
    }

    displayResults(data.search.slice(0, 25), output);
  } catch (error) {
    console.error("Error fetching song data:", error);
    output.innerHTML = `<p>There was an error fetching song data. Try again later.</p>`;
  }
}

async function fetchSongsByBPM(bpm, output) {
  const genreFilter = document.getElementById("genre-select").value;

  try {
    const response = await fetch(`/api/search?type=bpm&query=${bpm}`);
    const data = await response.json();

    if (!data.tempo || data.tempo.length === 0) {
      output.innerHTML = `<p>No songs found for BPM "${bpm}". Try another BPM.</p>`;
      return;
    }

    let songs = data.tempo;

    if (genreFilter) {
      songs = songs.filter(song =>
        song.artist && song.artist.genres && song.artist.genres.includes(genreFilter.toLowerCase())
      );
    }

    if (songs.length === 0) {
      output.innerHTML = `<p>No songs found for BPM "${bpm}" in the "${genreFilter}" genre.</p>`;
      return;
    }

    displayResults(songs.slice(0, 20), output);
  } catch (error) {
    console.error("Error fetching song data:", error);
    output.innerHTML = `<p>There was an error fetching song data. Try again later.</p>`;
  }
}

// Function to display results and (conditionally) add playlist button
function displayResults(songs, output) {
  output.innerHTML = "<h2>Search Results</h2>";
  output.classList.add("recommended-songs");

  const resultsList = document.createElement("div");
  resultsList.classList.add("song-list");

  songs.forEach(song => {
    const songTitle = song.title || song.song_title || "Unknown Title";
    const artistName = song.artist && song.artist.name ? song.artist.name : "Unknown Artist";
    const bpmValue = song.tempo || "N/A";
    const bpmText = song.tempo ? `${song.tempo} BPM` : "BPM not available";

    const songCard = document.createElement("div");
    songCard.classList.add("song-card");

    const songInfo = document.createElement("div");
    songInfo.classList.add("song-info");
    songInfo.innerHTML = `<h2>${songTitle}</h2><p>${artistName}</p>`;

    const songBpm = document.createElement("div");
    songBpm.classList.add("song-bpm");
    songBpm.innerHTML = `<p>${bpmText}</p>`;

    songCard.appendChild(songInfo);
    songCard.appendChild(songBpm);

    // Only show Add to Playlist if BPM search
    if (isBPMSearch && currentBPM) {
      const addBtn = document.createElement("button");
      addBtn.innerText = "Add to Playlist";
      addBtn.onclick = () => {
        const playlistName = `${currentBPM} BPM Songs`;
        const playlists = JSON.parse(localStorage.getItem("playlists")) || {};

        if (!playlists[playlistName]) {
          playlists[playlistName] = [];
        }

        const alreadyExists = playlists[playlistName].some(song =>
          song.title === songTitle && song.artist === artistName
        );

        if (!alreadyExists) {
          playlists[playlistName].push({ title: songTitle, artist: artistName, bpm: bpmValue });
          localStorage.setItem("playlists", JSON.stringify(playlists));
          alert(`"${songTitle}" added to playlist "${playlistName}"`);
        } else {
          alert(`"${songTitle}" is already in "${playlistName}"`);
        }
      };
      songCard.appendChild(addBtn);
    }

    resultsList.appendChild(songCard);
  });

  output.appendChild(resultsList);

  const gotoPlaylistContainer = document.getElementById('goto-playlist-container');
  gotoPlaylistContainer.style.display = 'flex';
  document.getElementById('goto-playlist').onclick = () => {
    window.location.href = "playlist.html";
  };
}

// Playlist display (for playlist.html)
function showPlaylist() {
  const playlists = JSON.parse(localStorage.getItem("playlists")) || {};
  const container = document.createElement("div");
  container.className = "song-list";

  if (Object.keys(playlists).length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.innerText = "You haven't created any playlists yet!";
    emptyMsg.style.textAlign = "center";
    container.appendChild(emptyMsg);
  }

  for (const playlistName in playlists) {
    const playlistCard = document.createElement("div");
    playlistCard.className = "song-card";
    playlistCard.style.flexDirection = "column";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.innerHTML = `<h2>${playlistName}</h2>`;

    const toggleBtn = document.createElement("button");
    toggleBtn.innerText = "View Songs";
    toggleBtn.style.fontSize = "18px";
    toggleBtn.style.marginLeft = "10px";

    header.appendChild(toggleBtn);
    playlistCard.appendChild(header);

    const songList = document.createElement("div");
    songList.style.display = "none";
    songList.style.marginTop = "10px";

    playlists[playlistName].forEach((song, index) => {
      const songItem = document.createElement("div");
      songItem.style.display = "flex";
      songItem.style.justifyContent = "space-between";
      songItem.style.alignItems = "center";
      songItem.style.padding = "8px 0";
      songItem.style.borderTop = "1px solid #ccc";

      const left = document.createElement("div");
      left.innerHTML = `<strong>${song.title}</strong> - ${song.artist}`;

      const removeBtn = document.createElement("button");
      removeBtn.innerText = "Remove";
      removeBtn.onclick = () => {
        playlists[playlistName].splice(index, 1);
        localStorage.setItem("playlists", JSON.stringify(playlists));
        showPlaylist(); // Reload the UI
      };

      const controls = document.createElement("div");
      controls.style.display = "flex";
      controls.style.alignItems = "center";
      controls.appendChild(removeBtn);

      songItem.appendChild(left);
      songItem.appendChild(controls);
      songList.appendChild(songItem);
    });

    const clearBtn = document.createElement("button");
    clearBtn.innerText = "Clear Playlist";
    clearBtn.onclick = () => {
      if (confirm(`Are you sure you want to delete all songs from "${playlistName}"?`)) {
        delete playlists[playlistName];
        localStorage.setItem("playlists", JSON.stringify(playlists));
        showPlaylist();
      }
    };

    songList.appendChild(clearBtn);
    playlistCard.appendChild(songList);

    toggleBtn.onclick = () => {
      const isVisible = songList.style.display === "block";
      songList.style.display = isVisible ? "none" : "block";
      toggleBtn.innerText = isVisible ? "View Songs" : "Hide Songs";
    };

    container.appendChild(playlistCard);
  }

  const existing = document.querySelector(".song-list");
  if (existing) existing.remove();
  document.body.insertBefore(container, document.querySelector("footer"));
}




// Load page-specific functionality
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector('.search-output')) {
    songSearch();
  } else if (window.location.pathname.includes("playlist.html")) {
    showPlaylist();
  }
});

