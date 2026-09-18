# AnchorGrid v1.0.0-alpha.2 — IA + Performance + PWA

Este ZIP es **acumulativo**.

Si todavía no instalaste `v1.0.0-alpha.1`, NO necesitas instalarlo primero.
Aplica únicamente este parche encima de tu AnchorGrid v0.8.2 actual.

## Incluye todo alpha.1

- VS IA en 1v1, 4P y 2v2.
- Fácil / Normal / Difícil / Maestro.
- Minimax/alpha-beta para duelo y evaluación por equipos.
- MaxN para 4 jugadores.
- IA ejecutándose en Web Worker.
- Performance Pass siempre en AUTO.
- Optimización del arrastre de paredes.
- Temporizador aislado del tablero.
- BFS/pathfinding optimizado.
- Atmósferas adaptativas.
- Reacciones 😹 😸 🙀 😿 😾 😼.

## Nuevo en alpha.2

La bienvenida incorpora instalación como aplicación:

### Android / Chromium
Cuando el navegador entrega `beforeinstallprompt`, aparece:

`Instalar AnchorGrid`

El botón abre el prompt nativo del sistema.

### iPhone / iPad
Se muestra:

`Instalar en iPhone / iPad`

y una guía integrada:

1. Safari → Compartir.
2. Agregar a pantalla de inicio.
3. Abrir AnchorGrid desde el nuevo icono.

### Importante
Cuando AnchorGrid ya se ejecuta desde la aplicación instalada:

- se detecta `display-mode: standalone`;
- en iOS también se comprueba `navigator.standalone`;
- la opción **Instalar AnchorGrid NO vuelve a aparecer**.

La PWA sigue siendo opcional. El juego web continúa funcionando sin instalar.

## Instalación

1. Descomprime este ZIP.
2. Copia su contenido encima de la raíz de tu proyecto AnchorGrid.
3. Acepta reemplazar archivos.
4. No borres `.git`, `.env`, `node_modules` ni tus secretos Firebase.

Después ejecuta:

```powershell
npm test
npm run build
```

Si todo pasa:

```powershell
git add -A
git commit -m "feat: AnchorGrid 1.0 alpha 2 AI performance and PWA install"
git push
```

## Caché

El Service Worker cambia a:

`anchorgrid-v1.0.0-alpha.2`

Si GitHub Pages todavía muestra una versión anterior después del despliegue,
usa `Ctrl + F5` una vez o cierra completamente la PWA/navegador y vuelve a abrirlo.
