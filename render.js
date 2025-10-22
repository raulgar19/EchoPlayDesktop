document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "https://creek-offerings-pricing-fred.trycloudflare.com";

  // --- Referencias a elementos del DOM ---
  const userSelectWrapper = document.getElementById("user-select");
  const userSelectTrigger = document.getElementById("user-select-trigger");
  const userOptionsContainer = document.getElementById("user-options");
  const selectedUserName = document.getElementById("selected-user-name");
  const selectedUserImage = document.getElementById("selected-user-image");
  const playlistList = document.getElementById("playlist-list");
  const playlistTitle = document.getElementById("playlist-title"); // Referencia al título
  const songListBody = document.getElementById("song-list-body"); // Referencia al cuerpo de la tabla
  const searchInput = document.getElementById("search-input"); // Referencia al input de búsqueda
  const searchResults = document.getElementById("search-results"); // Referencia al desplegable de resultados
  const addToPlaylistBtn = document.getElementById("add-to-playlist-btn");
  const playlistModal = document.getElementById("playlist-modal");
  const modalClose = document.getElementById("modal-close");
  const playlistSelection = document.getElementById("playlist-selection");
  const modalSongName = document.getElementById("modal-song-name");
  const modalSongArtist = document.getElementById("modal-song-artist");
  const confirmModal = document.getElementById("confirm-modal");
  const confirmMessage = document.getElementById("confirm-message");
  const confirmOk = document.getElementById("confirm-ok");
  const confirmCancel = document.getElementById("confirm-cancel");
  const addPlaylistBtn = document.getElementById("add-playlist-btn");
  const newPlaylistModal = document.getElementById("new-playlist-modal");
  const newPlaylistClose = document.getElementById("new-playlist-close");
  const playlistNameInput = document.getElementById("playlist-name-input");
  const newPlaylistCreate = document.getElementById("new-playlist-create");
  const newPlaylistCancel = document.getElementById("new-playlist-cancel");
  const apiErrorModal = document.getElementById("api-error-modal");
  const apiErrorMessage = document.getElementById("api-error-message");
  const apiErrorRetry = document.getElementById("api-error-retry");
  const apiErrorClose = document.getElementById("api-error-close");

  // --- Referencias a elementos del reproductor ---
  const audioPlayer = document.getElementById("audio-player");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const loopBtn = document.getElementById("loop-btn");
  const volumeBtn = document.getElementById("volume-btn");
  const volumeSlider = document.getElementById("volume-slider");
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
  let allSongs = []; // Todas las canciones de la playlist actual (sin filtrar)
  let currentPlaylistId = null; // ID de la playlist actual
  let currentPlaylistName = ""; // Nombre de la playlist actual
  let allSongsDatabase = []; // Todas las canciones de la base de datos (para búsqueda)
  let currentSong = null; // Canción actualmente reproduciéndose
  let allPlaylists = []; // Todas las playlists del usuario actual
  let currentUserId = null; // ID del usuario actual

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
      // Mostrar modal de error y permitir reintento
      const message = `Error conectando con la API al solicitar ${endpoint}. Revisa tu conexión o intenta reintentar.`;
      const retry = await showApiErrorModal(message);
      if (retry) {
        // Reintentar la petición una vez
        try {
          const retryResp = await fetch(`${API_BASE_URL}${endpoint}`);
          if (!retryResp.ok)
            throw new Error(`Error en la API: ${retryResp.statusText}`);
          return await retryResp.json();
        } catch (err) {
          console.error("Reintento fallido:", err);
          return [];
        }
      }
      return [];
    }
  }

  function showApiErrorModal(message) {
    return new Promise((resolve) => {
      apiErrorMessage.textContent = message;
      apiErrorModal.classList.add("show");

      const cleanup = () => {
        apiErrorModal.classList.remove("show");
        apiErrorRetry.removeEventListener("click", onRetry);
        apiErrorClose.removeEventListener("click", onClose);
        apiErrorModal.removeEventListener("click", onOutside);
      };

      const onRetry = () => {
        cleanup();
        resolve(true);
      };

      const onClose = () => {
        cleanup();
        resolve(false);
      };

      const onOutside = (e) => {
        if (e.target === apiErrorModal) {
          cleanup();
          resolve(false);
        }
      };

      apiErrorRetry.addEventListener("click", onRetry);
      apiErrorClose.addEventListener("click", onClose);
      apiErrorModal.addEventListener("click", onOutside);
    });
  }

  // --- Funciones del reproductor ---

  function playSong(song, index, playlist) {
    currentSongIndex = index;
    currentPlaylist = playlist;
    currentSong = song; // Guardar la canción actual

    // Actualizar la información del reproductor
    playerTitle.textContent = song.name;
    playerArtist.textContent = song.artist;

    // Habilitar el botón de añadir a playlist
    addToPlaylistBtn.disabled = false;

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

  function updateVolumeIcon(volume) {
    const icon = volumeBtn.querySelector("i");
    icon.classList.remove(
      "fa-volume-high",
      "fa-volume-low",
      "fa-volume-off",
      "fa-volume-xmark"
    );

    if (volume === 0) {
      icon.classList.add("fa-volume-xmark");
    } else if (volume < 0.5) {
      icon.classList.add("fa-volume-low");
    } else {
      icon.classList.add("fa-volume-high");
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
        li.dataset.playlistId = playlist.id;
        if (index === 0) {
          li.classList.add("active");
        }

        // Crear estructura con nombre y botón de eliminar
        const contentDiv = document.createElement("span");
        contentDiv.classList.add("playlist-item-content");
        contentDiv.textContent = playlist.name;

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("playlist-delete-btn");
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = "Eliminar playlist";

        // Evento para eliminar playlist
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          deletePlaylist(playlist.id, playlist.name);
        });

        li.appendChild(contentDiv);
        li.appendChild(deleteBtn);
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
    allSongs = songs; // Guardar todas las canciones
    currentPlaylistName = playlistName; // Guardar el nombre de la playlist

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
                    <td class="delete-song-cell">
                        <button class="delete-song-btn" title="Eliminar de la playlist">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;

        // Agregar evento de clic para reproducir la canción (solo en las primeras 3 columnas)
        const cells = row.querySelectorAll("td:not(.delete-song-cell)");
        cells.forEach((cell) => {
          cell.style.cursor = "pointer";
          cell.addEventListener("click", () => {
            playSong(song, index, songs);
            updateActiveSongRow();
          });
        });

        // Agregar evento al botón de eliminar
        const deleteBtn = row.querySelector(".delete-song-btn");
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation(); // Evitar que se reproduzca la canción
          deleteSongFromPlaylist(song.id, song.name);
        });

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
    currentUserId = userId; // Guardar el ID del usuario actual
    playlistList.innerHTML = "<li>Cargando...</li>";
    const playlists = await fetchAPI(`/users/${userId}/playlists`);
    allPlaylists = playlists; // Guardar todas las playlists
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
    currentPlaylistId = playlistId; // Guardar el ID de la playlist actual
    songListBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Cargando canciones...</td></tr>`;
    const songs = await fetchAPI(`/playlists/${playlistId}/songs`);
    renderSongs(songs, playlistName);
  }

  // --- Función de búsqueda ---

  function searchSongs(searchTerm) {
    const term = searchTerm.toLowerCase().trim();

    if (term === "") {
      // Si no hay término, ocultar el desplegable
      searchResults.classList.remove("show");
      searchResults.innerHTML = "";
      return;
    }

    // Filtrar canciones desde la variable local (sin llamar a la API)
    const filteredSongs = allSongsDatabase.filter(
      (song) =>
        song.name.toLowerCase().includes(term) ||
        song.artist.toLowerCase().includes(term)
    );

    // Mostrar resultados en el desplegable
    searchResults.innerHTML = "";

    if (filteredSongs.length > 0) {
      filteredSongs.forEach((song) => {
        const item = document.createElement("div");
        item.classList.add("search-result-item");

        item.innerHTML = `
          <img src="${song.cover}" alt="${song.name}" onerror="this.src='https://placehold.co/48x48/282828/b3b3b3?text=♪'">
          <div class="search-result-info">
            <div class="song-name">${song.name}</div>
            <div class="artist-name">${song.artist}</div>
          </div>
        `;

        // Al hacer clic en un resultado, reproducir la canción
        item.addEventListener("click", () => {
          // Cerrar el desplegable
          searchResults.classList.remove("show");
          searchInput.value = "";

          // Reproducir la canción
          // Añadir la canción a la playlist actual si no está
          const songIndex = currentPlaylist.findIndex((s) => s.id === song.id);
          if (songIndex !== -1) {
            playSong(song, songIndex, currentPlaylist);
          } else {
            // Si no está en la playlist actual, reproducir directamente
            currentPlaylist = [song];
            allSongs = [song];
            playSong(song, 0, [song]);
          }
          updateActiveSongRow();
        });

        searchResults.appendChild(item);
      });

      searchResults.classList.add("show");
    } else {
      const noResults = document.createElement("div");
      noResults.classList.add("search-no-results");
      noResults.textContent = "No se encontraron canciones";
      searchResults.appendChild(noResults);
      searchResults.classList.add("show");
    }
  }

  // --- Función para cargar todas las canciones una sola vez ---
  async function loadAllSongs() {
    allSongsDatabase = await fetchAPI("/songs");
    console.log(`${allSongsDatabase.length} canciones cargadas en memoria`);
  }

  // --- Funciones para añadir canciones a playlists ---

  function openAddToPlaylistModal() {
    if (!currentSong) {
      alert("No hay ninguna canción seleccionada");
      return;
    }

    if (allPlaylists.length === 0) {
      alert("No tienes playlists disponibles");
      return;
    }

    // Actualizar información de la canción en el modal
    modalSongName.textContent = currentSong.name;
    modalSongArtist.textContent = currentSong.artist;

    // Limpiar y cargar las playlists en el modal
    playlistSelection.innerHTML = "";

    allPlaylists.forEach((playlist) => {
      const option = document.createElement("div");
      option.classList.add("playlist-option");
      option.dataset.playlistId = playlist.id;
      option.innerHTML = `
        <i class="fas fa-list-music"></i>
        <span>${playlist.name}</span>
      `;

      option.addEventListener("click", () =>
        addSongToPlaylist(playlist.id, option)
      );

      playlistSelection.appendChild(option);
    });

    // Mostrar el modal
    playlistModal.classList.add("show");
  }

  function closeAddToPlaylistModal() {
    playlistModal.classList.remove("show");
  }

  async function addSongToPlaylist(playlistId, optionElement) {
    if (!currentSong) return;

    // Deshabilitar el botón temporalmente
    optionElement.style.pointerEvents = "none";
    optionElement.style.opacity = "0.5";

    try {
      const response = await fetch(
        `${API_BASE_URL}/playlists/${playlistId}/songs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ songId: currentSong.id }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Marcar como añadida
        optionElement.classList.add("added");
        optionElement.style.pointerEvents = "none";
        optionElement.style.opacity = "1";

        // Recargar la lista de canciones si se añadió a la playlist actual
        if (playlistId == currentPlaylistId) {
          await loadSongsForPlaylist(currentPlaylistId, currentPlaylistName);
        }
      } else {
        alert(data.error || "Error al añadir la canción a la playlist");
        optionElement.style.pointerEvents = "auto";
        optionElement.style.opacity = "1";
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al añadir la canción a la playlist");
      optionElement.style.pointerEvents = "auto";
      optionElement.style.opacity = "1";
    }
  }

  // --- Función para mostrar modal de confirmación ---
  function showConfirmModal(message) {
    return new Promise((resolve) => {
      confirmMessage.textContent = message;
      confirmModal.classList.add("show");

      const handleOk = () => {
        cleanup();
        resolve(true);
      };

      const handleCancel = () => {
        cleanup();
        resolve(false);
      };

      const handleClickOutside = (e) => {
        if (e.target === confirmModal) {
          cleanup();
          resolve(false);
        }
      };

      const cleanup = () => {
        confirmModal.classList.remove("show");
        confirmOk.removeEventListener("click", handleOk);
        confirmCancel.removeEventListener("click", handleCancel);
        confirmModal.removeEventListener("click", handleClickOutside);
      };

      confirmOk.addEventListener("click", handleOk);
      confirmCancel.addEventListener("click", handleCancel);
      confirmModal.addEventListener("click", handleClickOutside);
    });
  }

  async function deleteSongFromPlaylist(songId, songName) {
    if (!currentPlaylistId) {
      alert("No hay ninguna playlist seleccionada");
      return;
    }

    // Confirmar antes de eliminar con modal personalizado
    const confirmed = await showConfirmModal(
      `¿Estás seguro de que quieres eliminar "${songName}" de esta playlist?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/playlists/${currentPlaylistId}/songs/${songId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Recargar la lista de canciones
        await loadSongsForPlaylist(currentPlaylistId, currentPlaylistName);
      } else {
        alert(data.error || "Error al eliminar la canción de la playlist");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar la canción de la playlist");
    }
  }

  // --- Funciones para gestionar playlists ---

  function openNewPlaylistModal() {
    playlistNameInput.value = "";
    newPlaylistModal.classList.add("show");
    playlistNameInput.focus();
  }

  function closeNewPlaylistModal() {
    newPlaylistModal.classList.remove("show");
  }

  async function createPlaylist() {
    const playlistName = playlistNameInput.value.trim();

    if (!playlistName) {
      alert("Por favor, ingresa un nombre para la playlist");
      return;
    }

    if (!currentUserId) {
      alert("No hay un usuario seleccionado");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/playlists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playlistName,
          userId: currentUserId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        closeNewPlaylistModal();
        // Recargar las playlists
        await loadPlaylistsForUser(currentUserId);
      } else {
        alert(data.error || "Error al crear la playlist");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear la playlist");
    }
  }

  async function deletePlaylist(playlistId, playlistName) {
    const confirmed = await showConfirmModal(
      `¿Estás seguro de que quieres eliminar la playlist "${playlistName}"? Se eliminarán todas las canciones de la playlist.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        // Recargar las playlists
        await loadPlaylistsForUser(currentUserId);
      } else {
        alert(data.error || "Error al eliminar la playlist");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar la playlist");
    }
  }

  // --- Event Listeners ---

  // Event listener para la búsqueda
  searchInput.addEventListener("input", (e) => {
    searchSongs(e.target.value);
  });

  // Cerrar el desplegable al hacer clic fuera y cerrar el selector de usuario
  window.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.remove("show");
    }
    if (!userSelectWrapper.contains(e.target)) {
      userSelectWrapper.classList.remove("open");
    }
  });

  userSelectTrigger.addEventListener("click", () => {
    userSelectWrapper.classList.toggle("open");
  });

  playlistList.addEventListener("click", (e) => {
    // Buscar el elemento LI más cercano
    const listItem = e.target.closest("li");

    if (listItem && listItem.dataset.playlistId) {
      const currentActive = playlistList.querySelector(".active");
      if (currentActive) {
        currentActive.classList.remove("active");
      }
      listItem.classList.add("active");

      const playlistId = listItem.dataset.playlistId;
      const playlistName = listItem.querySelector(
        ".playlist-item-content"
      ).textContent;
      loadSongsForPlaylist(playlistId, playlistName);
    }
  });

  // --- Event Listeners para gestión de playlists ---

  addPlaylistBtn.addEventListener("click", openNewPlaylistModal);

  newPlaylistClose.addEventListener("click", closeNewPlaylistModal);

  newPlaylistCancel.addEventListener("click", closeNewPlaylistModal);

  newPlaylistCreate.addEventListener("click", createPlaylist);

  // Permitir crear playlist con Enter
  playlistNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      createPlaylist();
    }
  });

  // Cerrar modal al hacer clic fuera
  newPlaylistModal.addEventListener("click", (e) => {
    if (e.target === newPlaylistModal) {
      closeNewPlaylistModal();
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

  // --- Event Listeners para añadir a playlist ---

  addToPlaylistBtn.addEventListener("click", openAddToPlaylistModal);

  modalClose.addEventListener("click", closeAddToPlaylistModal);

  // Cerrar modal al hacer clic fuera del contenido
  playlistModal.addEventListener("click", (e) => {
    if (e.target === playlistModal) {
      closeAddToPlaylistModal();
    }
  });

  shuffleBtn.addEventListener("click", toggleShuffle);

  loopBtn.addEventListener("click", toggleLoop);

  // --- Control de volumen ---
  volumeSlider.addEventListener("input", (e) => {
    const volume = e.target.value / 100;
    audioPlayer.volume = volume;
    updateVolumeIcon(volume);
  });

  volumeBtn.addEventListener("click", () => {
    if (audioPlayer.volume > 0) {
      audioPlayer.dataset.previousVolume = audioPlayer.volume;
      audioPlayer.volume = 0;
      volumeSlider.value = 0;
      updateVolumeIcon(0);
    } else {
      const previousVolume =
        parseFloat(audioPlayer.dataset.previousVolume) || 1;
      audioPlayer.volume = previousVolume;
      volumeSlider.value = previousVolume * 100;
      updateVolumeIcon(previousVolume);
    }
  });

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
    // Deshabilitar el botón de añadir a playlist hasta que haya una canción
    addToPlaylistBtn.disabled = true;

    // Cargar todas las canciones al inicio
    await loadAllSongs();

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
