<p align="center">
  <img src="./public/brand/banner.webp" alt="AnchorGrid" width="100%" />
</p>

# AnchorGrid

**Versión actual: v0.5.0**

AnchorGrid es un juego de estrategia por turnos, mobile-first y multiplataforma, pensado para **salas privadas** entre amigos. No hay matchmaking global ni salas públicas: se crea una sala, se obtiene un código de 4 dígitos y se comparte el enlace.

La versión objetivo para GitHub Pages es:

```text
https://luics415.github.io/AnchorGrid/
```

## AnchorGrid v0.5

- Nueva pantalla de **bienvenida** con el emblema de ancla y firma Luics415.
- Ancla, firma y banner integrados en `public/brand/`.
- Favicon y PWA icons derivados del ancla.
- Metadatos Open Graph preparados para la portada social del repositorio/sitio.
- Las cuatro fichas conservan colores competitivos fuertes en todos los temas:
  - **Norte:** azul, ancla orientada 180°.
  - **Este:** verde, ancla orientada 90°.
  - **Sur:** rojo, ancla orientada 0°.
  - **Oeste:** amarillo, ancla orientada -90°.
- El movimiento queda siempre activo: toca una casilla legal para mover.
- Las paredes ya no usan selector de herramienta: se arrastran desde el dock y se sueltan sobre un anclaje válido.
- Las paredes conservan el color de quien las colocó.
- Los efectos de Aurora, Bloom, Crystal, Stormlight, Nebula y Garden Pulse se mantienen, pero ahora están más definidos, menos luminosos y siempre detrás de la interfaz/tablero.

## Núcleo del juego

El tablero es siempre **11×11**. Las paredes ocupan dos segmentos y el motor nunca permite una colocación que deje a un jugador activo sin ruta válida a su meta.

### Modos

- **Duelo 1v1:** Norte vs Sur. Gana quien alcance primero el borde opuesto. 10 paredes por jugador.
- **Todos al centro (4P):** Norte, Este, Sur y Oeste compiten por `(5,5)`. 7 paredes por jugador.
- **Equipos 2v2:** Norte + Sur contra Este + Oeste. Gana el equipo cuyo primer integrante alcance el centro. 7 paredes por jugador.

Todos los turnos duran **30 segundos**. En 1v1, agotar el tiempo pierde la partida. En 4P y 2v2, la ficha queda eliminada y sus paredes permanecen.

## Reglas implementadas

- Movimiento ortogonal.
- Salto automático sobre una ficha adyacente.
- Salto diagonal si detrás de la ficha hay pared o borde.
- Cadena de salto cuando varias fichas quedan alineadas en modos de cuatro jugadores.
- Nunca dos fichas en la misma casilla.
- Paredes horizontales/verticales con anclajes 10×10.
- Sin solapamientos parciales.
- Sin cruces de paredes.
- BFS después de cada intento de pared para garantizar una ruta válida para cada jugador activo.
- La meta central **jamás puede quedar completamente sellada**.
- Temporizador compartido de 30 segundos por turno.

## Salas privadas y host migration

La capa online utiliza Firebase Anonymous Auth + Realtime Database.

- Código de 4 dígitos.
- Invitación directa mediante `?room=4826`.
- Identidad anónima: no se pide correo ni contraseña.
- Presencia y reconexión.
- Reserva del mismo asiento al recargar.
- `revision` para descartar acciones atrasadas.
- `authority.epoch` para impedir que un host antiguo recupere autoridad después de una migración.
- Si el host se desconecta, el siguiente jugador conectado reclama el host mediante una transacción atómica y **la partida continúa**.

## Temas

El fondo base siempre parte de `#B6DDFE`.

- **Aurora:** cintas cian/magenta suaves.
- **Bloom:** pétalos y vidrio floral.
- **Crystal:** facetas y prismas.
- **Stormlight:** pulsos eléctricos contenidos.
- **Nebula:** polvo estelar y profundidad azul.
- **Garden Pulse:** ondas orgánicas y cian acuoso.
- **Aleatorio:** el tema se decide al crear la partida.

Los efectos ambientales son deliberadamente secundarios: el tablero, las fichas y las paredes siempre conservan mayor contraste y prioridad visual.

## Multiplataforma / PWA

Preparado para:

- Android.
- iPhone/iPad.
- Windows/macOS/Linux mediante navegador.
- Pantallas táctiles, mouse y trackpad.
- Retrato y paisaje.
- Safe areas/notch.
- Instalación PWA.

## Stack

- Vite
- React 19
- TypeScript
- Zustand
- Firebase Anonymous Auth
- Firebase Realtime Database
- Vitest
- GitHub Pages + GitHub Actions

## Arranque local

```bash
npm install
npm run dev
```

Para abrirlo también desde teléfonos de la misma Wi-Fi:

```bash
npm run dev -- --host
```

Vite mostrará una URL de red como `http://192.168.x.x:5173`.

## Activar multijugador

Consulta [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md). Resumen:

1. Crear un proyecto en Firebase.
2. Activar **Authentication → Anonymous**.
3. Crear **Realtime Database**.
4. Añadir `luics415.github.io` a los dominios autorizados de Firebase Authentication.
5. Copiar `.env.example` a `.env` para desarrollo local.
6. Añadir las mismas variables como GitHub Actions Secrets para producción.

## Publicar en GitHub Pages

Repositorio oficial: **`Luics415/AnchorGrid`**.

Consulta [`GITHUB_PAGES_DEPLOY.md`](./GITHUB_PAGES_DEPLOY.md) para el despliegue completo. El workflow `.github/workflows/deploy-pages.yml` ejecuta:

```text
npm install
npm test
npm run build
GitHub Pages deploy
```

Después de la primera publicación, las invitaciones tendrán esta forma:

```text
https://luics415.github.io/AnchorGrid/?room=4826
```

## Pruebas entre dispositivos

Consulta [`MULTIDEVICE_TEST.md`](./MULTIDEVICE_TEST.md). El orden recomendado es:

1. 1v1 en dos dispositivos.
2. Desconexión/reconexión de jugador.
3. Caída del host y migración automática.
4. 4P en cuatro dispositivos.
5. 2v2.
6. Revancha conservando la sala.

## Paleta base

```text
#344D75  #4A7CA1  #637D98  #B6DDFE  #BAF0FA  #F7C5EB  #D069B8
```

El fondo principal permanece en `#B6DDFE`.

<p align="center">
  <img src="./public/brand/signature.webp" alt="Luics415" width="340" />
</p>
