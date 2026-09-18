<p align="center">
  <img src="./public/brand/banner.webp" alt="AnchorGrid" width="100%" />
</p>

# AnchorGrid

**Versión actual: v0.8.2**

AnchorGrid es un juego de estrategia por turnos, mobile-first y multiplataforma, diseñado para jugar de forma **local** o mediante **salas privadas** entre amigos.

**Sitio:** `https://luics415.github.io/AnchorGrid/`

## v0.8.2 — fondos de partida

Esta actualización corrige específicamente la interpretación visual de las atmósferas: los efectos descritos para Aurora, Bloom, Crystal, Stormlight, Nebula y Garden Pulse pertenecen al **fondo real durante la partida**, no a los botones del selector.

Durante el juego:

- **Aurora:** grandes manchas rosa/cian recorren lentamente distintas zonas del escenario y cambian de escala durante el trayecto.
- **Bloom:** lluvia continua de pétalos con suficientes partículas y desfases para que nunca exista un periodo vacío evidente.
- **Crystal:** fragmentos de cristal flotan, cambian sutilmente de brillo y dos reflejos fríos recorren lentamente el escenario.
- **Stormlight:** grandes tiras luminosas permanecen apagadas durante periodos largos y después encienden/desvanecen lentamente.
- **Nebula:** campo de polvo estelar mucho más denso, con pequeñas agrupaciones independientes y nubes espaciales en deriva.
- **Garden Pulse:** ondas circulares nacen desde distintos puntos como gotas de lluvia, se expanden, pierden fuerza y desaparecen.

`ThemeAtmosphere` ahora distingue entre una atmósfera ambiental normal y una **atmósfera de partida de alta presencia**, de modo que el menú/lobby no necesita cargar la misma cantidad de partículas que el tablero.

El tablero conserva mayor prioridad visual y es más sólido para que las nuevas animaciones no reduzcan su legibilidad.

## v0.8.1

- Se agregó un apartado propio de **Juego Local** al menú.
- El final de partida en escritorio fue ampliado y rediseñado, manteniendo la composición compacta en móvil.
- En 2v2:
  - Norte + Sur = **Equipo Morado**.
  - Este + Oeste = **Equipo Naranja**.
  - Fichas, paredes, indicadores y etiquetas respetan el equipo.
- Todos los modos utilizan tablero 11×11 y 10 paredes por jugador.
- El temporizador mantiene el aviso de inactividad antes de saltar el turno.

## Modos

- **Duelo 1v1:** Norte contra Sur; gana quien alcanza primero el borde opuesto.
- **Todos al centro (4P):** cuatro jugadores compiten por `(5,5)`.
- **Equipos 2v2:** Morado contra Naranja; gana el equipo cuyo primer integrante alcanza el centro.

## Reglas principales

- Una acción por turno: mover o colocar una pared.
- Movimiento siempre disponible tocando una casilla legal.
- Las paredes se colocan arrastrándolas desde el dock.
- Salto automático sobre una ficha adyacente.
- Salto diagonal cuando una pared o el borde bloquean el salto recto.
- Paredes horizontales/verticales de dos segmentos.
- Sin cruces ni solapamientos.
- BFS después de cada pared: ningún jugador activo puede quedarse sin una ruta válida.
- La meta central jamás puede quedar completamente cerrada.
- 30 segundos por turno.
- Tras 30 segundos aparece aviso de inactividad; si tampoco responde durante la gracia, sólo se salta el turno.

## Juego local

El menú principal contiene un apartado dedicado a Juego Local. Utiliza el modo y atmósfera seleccionados y funciona sin una sala Firebase.

## Salas privadas

El online utiliza Firebase Anonymous Authentication + Realtime Database.

1. El host crea la sala.
2. AnchorGrid genera un código de 4 dígitos.
3. La invitación usa `?room=4826`.
4. Los jugadores aparecen en el lobby en tiempo real.
5. El host inicia cuando se completa la cantidad necesaria.
6. Si el host se desconecta, la autoridad migra y la sala continúa.

Al terminar una partida online:

- Regresar al lobby.
- Menú principal.
- Revancha `X/N`.

## Paleta

```text
#344D75  #4A7CA1  #637D98  #B6DDFE  #BAF0FA  #F7C5EB  #D069B8
```

El fondo base continúa partiendo de `#B6DDFE`.

## Stack

- Vite
- React 19
- TypeScript
- Zustand
- Firebase Anonymous Auth
- Firebase Realtime Database
- Vitest
- GitHub Pages + GitHub Actions

## Desarrollo

```bash
npm install
npm run dev
```

Para otros dispositivos en la misma Wi-Fi:

```bash
npm run dev -- --host
```

Antes de publicar:

```bash
npm test
npm run build
```

Después:

```bash
git add -A
git commit -m "fix: AnchorGrid v0.8.2 in-game atmosphere scenes"
git push
```

El Service Worker usa `anchorgrid-v0.8.2` para evitar que GitHub Pages conserve el CSS anterior.

<p align="center">
  <img src="./public/brand/signature.webp" alt="Luics415" width="340" />
</p>
