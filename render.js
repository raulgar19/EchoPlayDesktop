document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "http://localhost:3000";

  // --- Referencias a elementos del DOM ---
  const userSelectWrapper = document.getElementById("user-select");
  const userSelectTrigger = document.getElementById("user-select-trigger");
  const userOptionsContainer = document.getElementById("user-options");
  const selectedUserName = document.getElementById("selected-user-name");
  const selectedUserImage = document.getElementById("selected-user-image");
  const playlistList = document.getElementById("playlist-list");
  const playlistTitle = document.getElementById("playlist-title"); // Referencia al título
  const songListBody = document.getElementById("song-list-body"); // Referencia al cuerpo de la tabla

  // --- Referencias a elementos del reproductor ---
  const audioPlayer = document.getElementById("audio-player");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const loopBtn = document.getElementById("loop-btn");
  const playerTitle = document.getElementById("player-title");
  const playerArtist = document.getElementById("player-artist");
  const playerAlbumArt = document.getElementById("player-album-art");
  const currentTimeLabel = document.getElementById("current-time");
  const durationLabel = document.getElementById("duration");
  const progressBar = document.getElementById("progress-bar");
  const progress = document.getElementById("progress");

  // --- Variables globales para el reproductor ---
  let isPlaying = false;
  let currentSongIndex = -1;
  let currentPlaylist = [];
  let isShuffleOn = false;
  let isLoopOn = false; // Solo para el estado visual del botón
  let shuffledPlaylist = []; // Playlist mezclada para reproducción
  let displayPlaylist = []; // Playlist para mostrar en la tabla (siempre en orden original)

  // --- Funciones para obtener datos de la API ---

  async function fetchAPI(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`Error en la API: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`No se pudo obtener ${endpoint}:`, error);
      alert(
        `Error conectando con la API. Asegúrate de que el servidor esté en http://localhost:3000.`
      );
      return [];
    }
  }

  // --- Funciones del reproductor ---

  function playSong(song, index, playlist) {
    currentSongIndex = index;
    currentPlaylist = playlist;

    // Actualizar la información del reproductor
    playerTitle.textContent = song.name;
    playerArtist.textContent = song.artist;

    // Actualizar la imagen del álbum
    if (song.cover) {
      playerAlbumArt.innerHTML = `<img src="${song.cover}" alt="${song.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">`;
    } else {
      playerAlbumArt.textContent = "🎵";
    }

    // Si la canción tiene una URL de audio, cargarla
    if (song.file) {
      audioPlayer.src = song.file;
      audioPlayer.play();
      isPlaying = true;
      updatePlayPauseButton();
    } else {
      alert("Esta canción no tiene una fuente de audio disponible.");
    }
  }

  function updatePlayPauseButton() {
    const icon = playPauseBtn.querySelector("i");
    if (isPlaying) {
      icon.classList.remove("fa-play");
      icon.classList.add("fa-pause");
    } else {
      icon.classList.remove("fa-pause");
      icon.classList.add("fa-play");
    }
  }

  function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function updateActiveSongRow() {
    const rows = document.querySelectorAll(".song-row");
    rows.forEach((row, index) => {
      row.classList.remove("active");
      if (index === currentSongIndex) {
        row.classList.add("active");
      }
    });
  }

  function togglePlayPause() {
    if (audioPlayer.src) {
      if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
      } else {
        audioPlayer.play();
        isPlaying = true;
      }
      updatePlayPauseButton();
    }
  }

  function updateProgressBar() {
    const currentTime = audioPlayer.currentTime;
    const duration = audioPlayer.duration;

    currentTimeLabel.textContent = formatDuration(currentTime);
    durationLabel.textContent = formatDuration(duration);

    // Actualizar barra de progreso
    if (duration > 0) {
      const progressPercent = (currentTime / duration) * 100;
      progress.style.width = `${progressPercent}%`;
    }
  }

  function setProgress(e) {
    const width = progressBar.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    audioPlayer.currentTime = (clickX / width) * duration;
  }

  // --- Funciones de shuffle ---

  function toggleShuffle() {
    isShuffleOn = !isShuffleOn;

    if (isShuffleOn) {
      shuffleBtn.classList.add("active");
      // Crear una playlist mezclada para reproducción
      shuffledPlaylist = [...currentPlaylist];
      shuffleArray(shuffledPlaylist);
    } else {
      shuffleBtn.classList.remove("active");
      shuffledPlaylist = []; // Limpiar la playlist mezclada
    }
  }

  function toggleLoop() {
    // Cambia el estado visual del botón y la funcionalidad de loop
    isLoopOn = !isLoopOn;

    if (isLoopOn) {
      loopBtn.classList.add("active");
      audioPlayer.loop = true; // Activar loop en el reproductor de audio
    } else {
      loopBtn.classList.remove("active");
      audioPlayer.loop = false; // Desactivar loop en el reproductor de audio
    }
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function getNextSongIndex() {
    if (isShuffleOn && shuffledPlaylist.length > 0) {
      // Buscar la canción actual en la playlist mezclada
      const currentSong = currentPlaylist[currentSongIndex];
      const shuffledIndex = shuffledPlaylist.findIndex(
        (song) => song.id === currentSong.id
      );

      if (shuffledIndex < shuffledPlaylist.length - 1) {
        // Obtener la siguiente canción de la lista mezclada
        const nextSong = shuffledPlaylist[shuffledIndex + 1];
        // Encontrar esa canción en la playlist original para devolver el índice correcto
        return currentPlaylist.findIndex((song) => song.id === nextSong.id);
      } else {
        // Si estamos en la última canción de la lista mezclada, volver a la primera
        const firstSong = shuffledPlaylist[0];
        return currentPlaylist.findIndex((song) => song.id === firstSong.id);
      }
    } else {
      if (currentSongIndex < currentPlaylist.length - 1) {
        return currentSongIndex + 1;
      } else {
        // Si estamos en la última canción, volver a la primera
        return 0;
      }
    }
  }

  function getPrevSongIndex() {
    if (isShuffleOn && shuffledPlaylist.length > 0) {
      // Buscar la canción actual en la playlist mezclada
      const currentSong = currentPlaylist[currentSongIndex];
      const shuffledIndex = shuffledPlaylist.findIndex(
        (song) => song.id === currentSong.id
      );

      if (shuffledIndex > 0) {
        // Obtener la canción anterior de la lista mezclada
        const prevSong = shuffledPlaylist[shuffledIndex - 1];
        // Encontrar esa canción en la playlist original para devolver el índice correcto
        return currentPlaylist.findIndex((song) => song.id === prevSong.id);
      } else {
        // Si estamos en la primera canción de la lista mezclada, ir a la última
        const lastSong = shuffledPlaylist[shuffledPlaylist.length - 1];
        return currentPlaylist.findIndex((song) => song.id === lastSong.id);
      }
    } else {
      if (currentSongIndex > 0) {
        return currentSongIndex - 1;
      } else {
        // Si estamos en la primera canción, ir a la última
        return currentPlaylist.length - 1;
      }
    }
  }

  // --- Funciones para renderizar datos en la UI ---

  function renderUsers(users) {
    userOptionsContainer.innerHTML = "";

    users.forEach((user) => {
      const option = document.createElement("div");
      option.classList.add("custom-option");
      option.dataset.value = user.id;

      option.innerHTML = `
                <img src="${user.image}" alt="${user.name}" onerror="this.src='https://placehold.co/32x32/282828/b3b3b3?text=Err'"/>
                <span>${user.name}</span>
            `;

      option.addEventListener("click", () => {
        selectedUserName.textContent = user.name;
        selectedUserImage.src = user.image;
        userSelectWrapper.classList.remove("open");
        loadPlaylistsForUser(user.id);
      });

      userOptionsContainer.appendChild(option);
    });
  }

  function renderPlaylists(playlists) {
    playlistList.innerHTML = "";
    if (playlists.length > 0) {
      playlists.forEach((playlist, index) => {
        const li = document.createElement("li");
        li.textContent = playlist.name;
        li.dataset.playlistId = playlist.id;
        if (index === 0) {
          li.classList.add("active");
        }
        playlistList.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.textContent = "No tiene playlists";
      li.style.color = "#888";
      playlistList.appendChild(li);
    }
  }

  // Función de canciones MODIFICADA
  function renderSongs(songs, playlistName) {
    playlistTitle.textContent = playlistName;
    songListBody.innerHTML = ""; // Limpiar la tabla de canciones

    currentPlaylist = songs; // Guardar la playlist actual

    // Resetear shuffle al cargar nueva playlist
    if (isShuffleOn) {
      isShuffleOn = false;
      shuffleBtn.classList.remove("active");
      shuffledPlaylist = [];
    }

    if (songs.length > 0) {
      songs.forEach((song, index) => {
        const row = document.createElement("tr");
        row.classList.add("song-row");

        // Agregar evento de clic para reproducir la canción
        row.addEventListener("click", () => {
          playSong(song, index, songs);
          // Resaltar la fila activa
          updateActiveSongRow();
        });

        // Adaptamos la celda del título para incluir la carátula (cover)
        row.innerHTML = `
                    <td>${index + 1}</td>
                    <td class="song-title">
                       <div style="display: flex; align-items: center;">
                            <img src="${song.cover}" alt="${
          song.name
        }" style="width: 40px; height: 40px; margin-right: 15px; border-radius: 4px;" onerror="this.style.display='none'">
                            <span>${song.name}</span>
                        </div>
                    </td>
                    <td>${song.artist}</td>
                `;

        songListBody.appendChild(row);
      });
    } else {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="5" style="text-align:center; color: #888;">Esta playlist está vacía</td>`;
      songListBody.appendChild(row);
    }
  }

  // --- Lógica de la aplicación ---

  async function loadPlaylistsForUser(userId) {
    playlistList.innerHTML = "<li>Cargando...</li>";
    const playlists = await fetchAPI(`/users/${userId}/playlists`);
    renderPlaylists(playlists);

    // Si el usuario tiene playlists, carga las canciones de la primera
    if (playlists.length > 0) {
      loadSongsForPlaylist(playlists[0].id, playlists[0].name);
    } else {
      // Si no tiene, limpia la lista de canciones
      renderSongs([], "Selecciona una playlist");
    }
  }

  async function loadSongsForPlaylist(playlistId, playlistName) {
    songListBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Cargando canciones...</td></tr>`;
    const songs = await fetchAPI(`/playlists/${playlistId}/songs`);
    renderSongs(songs, playlistName);
  }

  // --- Event Listeners ---

  userSelectTrigger.addEventListener("click", () => {
    userSelectWrapper.classList.toggle("open");
  });

  window.addEventListener("click", (e) => {
    if (!userSelectWrapper.contains(e.target)) {
      userSelectWrapper.classList.remove("open");
    }
  });

  playlistList.addEventListener("click", (e) => {
    if (e.target.tagName === "LI" && e.target.dataset.playlistId) {
      const currentActive = playlistList.querySelector(".active");
      if (currentActive) {
        currentActive.classList.remove("active");
      }
      e.target.classList.add("active");

      const playlistId = e.target.dataset.playlistId;
      const playlistName = e.target.textContent;
      loadSongsForPlaylist(playlistId, playlistName);
    }
  });

  // --- Event Listeners del reproductor ---

  playPauseBtn.addEventListener("click", togglePlayPause);

  prevBtn.addEventListener("click", () => {
    const prevIndex = getPrevSongIndex();
    playSong(currentPlaylist[prevIndex], prevIndex, currentPlaylist);
    updateActiveSongRow();
  });

  nextBtn.addEventListener("click", () => {
    const nextIndex = getNextSongIndex();
    playSong(currentPlaylist[nextIndex], nextIndex, currentPlaylist);
    updateActiveSongRow();
  });

  shuffleBtn.addEventListener("click", toggleShuffle);

  loopBtn.addEventListener("click", toggleLoop);

  audioPlayer.addEventListener("timeupdate", updateProgressBar);

  audioPlayer.addEventListener("play", () => {
    isPlaying = true;
    updatePlayPauseButton();
  });

  audioPlayer.addEventListener("pause", () => {
    isPlaying = false;
    updatePlayPauseButton();
  });

  // Cuando termina la canción, pasar a la siguiente
  audioPlayer.addEventListener("ended", () => {
    // Si el loop está activado, el reproductor de audio se encarga automáticamente
    // Si no, pasamos a la siguiente canción
    if (!isLoopOn) {
      const nextIndex = getNextSongIndex();
      playSong(currentPlaylist[nextIndex], nextIndex, currentPlaylist);
      updateActiveSongRow();
    }
  });

  progressBar.addEventListener("click", setProgress);

  // --- Inicialización ---

  async function initializeApp() {
    const users = await fetchAPI("/users");
    if (users.length > 0) {
      renderUsers(users);

      const firstUser = users[0];
      selectedUserName.textContent = firstUser.name;
      selectedUserImage.src = firstUser.image;
      loadPlaylistsForUser(firstUser.id);
    } else {
      console.log("No se encontraron usuarios.");
      selectedUserName.textContent = "No hay usuarios";
    }
  }

  initializeApp();
});
