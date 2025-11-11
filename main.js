// main.js

// Importa los módulos necesarios de Electron
const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const { handleSquirrelEvent } = require("./installer");

// Maneja los eventos de instalación/actualización de Squirrel
// Si retorna true, salimos de la aplicación porque estamos en medio de una instalación
if (handleSquirrelEvent()) {
  return;
}

// Función para crear la ventana principal de la aplicación
const createWindow = () => {
  // Ocultar el menú de la aplicación
  Menu.setApplicationMenu(null);

  // Crea la ventana del navegador con las dimensiones deseadas.
  const win = new BrowserWindow({
    width: 1400, // Ancho de la ventana en píxeles (más ancho para ser rectangular)
    height: 800, // Alto de la ventana en píxeles
    minWidth: 1400, // Ancho mínimo permitido
    minHeight: 800, // Alto mínimo permitido
    icon: path.join(__dirname, "icon.ico"), // Ruta al icono de la aplicación
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Permitir carga de recursos externos como Google Drive
      allowRunningInsecureContent: false,
    },
  });

  // Carga el archivo index.html en la ventana
  win.loadFile("index.html");

  // Configurar la sesión para permitir acceso a recursos externos
  win.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      // Añadir headers necesarios para Google Drive
      details.requestHeaders["Referer"] = "https://drive.google.com/";
      details.requestHeaders["Origin"] = "https://drive.google.com";
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  // Manejar errores de carga de medios
  win.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.log("Error al cargar:", errorCode, errorDescription);
  });

  // Opcional: Abre las herramientas de desarrollo (como en Chrome) para depurar
  win.webContents.openDevTools();
};

// Este método se llama cuando Electron ha terminado la inicialización
// y está listo para crear ventanas de navegador.
app.whenReady().then(() => {
  createWindow();

  // En macOS, es común volver a crear una ventana en la aplicación cuando
  // el ícono del dock se hace clic y no hay otras ventanas abiertas.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Cierra la aplicación cuando todas las ventanas están cerradas, excepto en macOS.
app.on("window-all-closed", () => {
  // En macOS, es común que las aplicaciones y su barra de menú
  // permanezcan activas hasta que el usuario salga explícitamente con Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});
