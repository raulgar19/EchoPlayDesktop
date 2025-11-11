module.exports = {
  packagerConfig: {
    // 👇 ¡No olvides tu icono! Debe ser .ico para Windows
    icon: "./icon.ico",
  },
  rebuildConfig: {},
  makers: [
    {
      // --- Esta es la parte clave ---
      name: "@electron-forge/maker-nsis",
      config: {
        // Opciones de configuración de NSIS

        // (Recomendado: false) Si es 'false', muestra el asistente de instalación.
        // Si es 'true', instala con un solo clic (menos control para el usuario).
        oneClick: false,

        // (Recomendado: true) Permite al usuario elegir la carpeta de instalación.
        allowToChangeInstallationDirectory: true,

        // (Opcional) Crea un acceso directo en el escritorio.
        createDesktopShortcut: true,

        // (Opcional) Ejecuta la app justo después de terminar la instalación.
        runAfterFinish: true,

        // (Opcional) Define el nombre del ejecutable del instalador.
        // Si no se pone, usará el nombre de tu app (ej. mi-app-setup-1.0.0.exe).
        // setupExe: 'MiAppInstalador.exe'
      },
    },
    // ... aquí podrían ir otros 'makers' (como 'maker-zip' para otras plataformas)
  ],
};
