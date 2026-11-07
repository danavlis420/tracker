# Tracker

Aplicación estática de finanzas, Meal Prep y hábitos. No requiere instalar dependencias.

## Iniciar

Desde la carpeta del proyecto, serví los archivos por HTTP local (por ejemplo, `python -m http.server 8000`) y abrí `http://localhost:8000`. La app carga sus módulos JavaScript desde `index.html` y necesita conexión a Internet para las APIs de GitHub y Gemini.

## GitHub Gist

1. Creá un Personal Access Token de GitHub con permiso `gist`.
2. En `GIST / JSON`, pegá el token y guardá las credenciales.
3. Seleccioná `Crear Gist`; la app crea un Gist secreto y guarda su ID en este navegador.
4. Usá `PUSH` para subir el estado y `PULL` para descargarlo. PULL valida el archivo y pide confirmación antes de reemplazar los datos locales.
5. `Auto-Sync` sube cambios locales al Gist con una demora breve. No combina cambios: el último PUSH reemplaza el archivo remoto.

Para sincronizar otro navegador o dispositivo, configurá allí el token y el mismo ID del Gist. El Gist secreto no es privado para quien conozca su URL. El token se guarda en `localStorage` de cada navegador; no uses esta configuración en dispositivos compartidos.

## Backup JSON

`Exportar .JSON` descarga una copia local. `Importar .JSON` valida su estructura y restaura el estado sin iniciar un PUSH automático. Guardá una copia antes de importar si querés conservar los datos actuales.

## Oráculo IA

Configurá una API Key de Gemini con el botón de llave o desde `GIST / JSON`. El Oráculo puede proponer altas/ediciones de ingresos y gastos, actualizar stock o compras, marcar hábitos y actualizar trackers. Cada operación muestra una vista previa; no se guarda nada hasta confirmar. No puede borrar registros.

Para identificar los elementos que le pidas cambiar, la consulta envía a Gemini los registros actuales de finanzas, compras, freezer, hábitos y trackers. La API Key también se guarda en `localStorage`. Revisá las políticas de Google y evitá usar la función con datos que no quieras enviar al proveedor.

## Seguridad

Esta versión no usa backend: las credenciales se almacenan en el navegador y las llamadas se hacen directamente a GitHub y Google. Un script comprometido que se ejecute en el mismo origen podría acceder a esas credenciales; no publiques tokens en el código ni compartas el navegador configurado. Para aislar credenciales se necesitaría una arquitectura con backend/OAuth.