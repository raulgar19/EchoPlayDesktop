// main.js

// Importa los módulos necesarios de Electron
const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

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
    icon: path.join(__dirname, "icon.png"), // Ruta al icono de la aplicación
    webPreferences: {
      // __dirname apunta al directorio actual.
      // path.join une las rutas de forma segura para cualquier sistema operativo.
      // Nota: `preload.js` no lo hemos creado aún, por lo que lo comentamos.
      // No es estrictamente necesario para que la app funcione ahora mismo.
      // preload: path.join(__dirname, 'preload.js')
    },
  });

  // Carga el archivo index.html en la ventana
  win.loadFile("index.html");

  // Opcional: Abre las herramientas de desarrollo (como en Chrome) para depurar
  // win.webContents.openDevTools();
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
