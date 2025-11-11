// installer.js - Manejo de eventos de Squirrel para Windows

const { app } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

// Función para crear acceso directo en el escritorio
function createDesktopShortcut() {
  if (process.platform !== "win32") return;

  const updateDotExe = path.resolve(
    path.dirname(process.execPath),
    "..",
    "Update.exe"
  );
  const exeName = path.basename(process.execPath);
  const iconPath = process.execPath; // El ejecutable ya tiene el icono embebido

  // Crear acceso directo en el escritorio y menú inicio
  spawn(
    updateDotExe,
    [
      "--createShortcut",
      exeName,
      "--shortcut-locations",
      "Desktop,StartMenu",
      "--icon",
      iconPath,
    ],
    { detached: true }
  ).unref();
}

// Función para eliminar acceso directo del escritorio
function removeDesktopShortcut() {
  if (process.platform !== "win32") return;

  const updateDotExe = path.resolve(
    path.dirname(process.execPath),
    "..",
    "Update.exe"
  );
  const exeName = path.basename(process.execPath);

  spawn(updateDotExe, ["--removeShortcut", exeName], {
    detached: true,
  }).unref();
}

// Manejar eventos de Squirrel
function handleSquirrelEvent() {
  if (process.platform !== "win32") {
    return false;
  }

  const squirrelEvent = process.argv[1];

  switch (squirrelEvent) {
    case "--squirrel-install":
    case "--squirrel-updated":
      // Instalar/actualizar: crear accesos directos
      createDesktopShortcut();

      // Esperar un poco para que se creen los shortcuts
      setTimeout(app.quit, 1000);
      return true;

    case "--squirrel-uninstall":
      // Desinstalar: eliminar accesos directos
      removeDesktopShortcut();

      setTimeout(app.quit, 1000);
      return true;

    case "--squirrel-obsolete":
      // Esto se ejecuta en la versión antigua antes de actualizar
      app.quit();
      return true;

    default:
      return false;
  }
}

module.exports = { handleSquirrelEvent };
