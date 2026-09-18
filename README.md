<p align="center">
  <img src="./public/brand/banner.webp" alt="AnchorGrid" width="100%" />
</p>

# AnchorGrid

**Versión actual: v0.8.1**

AnchorGrid es un juego de estrategia por turnos, mobile-first y multiplataforma, diseñado para jugar de forma **local** o mediante **salas privadas** entre amigos. No hay matchmaking global ni salas públicas: el host crea una sala, recibe un código de 4 dígitos y comparte el enlace.

**Sitio:** `https://luics415.github.io/AnchorGrid/`

## Novedades v0.8.1

- La sección **Atmósferas** fue rediseñada con previews más grandes, animados y fáciles de distinguir.
- Los seis temas ahora tienen movimiento continuo y propio:
  - **Aurora:** manchas rosa/cian que recorren lentamente el fondo y cambian de tamaño.
  - **Bloom:** lluvia continua de pétalos con distintas trayectorias y velocidades.
  - **Crystal:** fragmentos fríos que flotan y cambian sutilmente de brillo.
  - **Stormlight:** grandes tiras luminosas que se encienden y apagan en ciclos largos.
  - **Nebula:** nubes suaves y polvo estelar claramente visible.
  - **Garden Pulse:** ondas expansivas inspiradas en gotas de lluvia hasta desvanecerse.
- El tablero es menos transparente para conservar legibilidad sobre fondos animados.
- El final de partida en **escritorio** tiene una presentación más amplia y protagonista; móvil conserva su composición compacta.
- En **2v2** la identidad deja de depender de los cuatro colores individuales:
  - **Equipo Morado:** Norte + Sur.
  - **Equipo Naranja:** Este + Oeste.
  - Fichas, paredes, indicadores y etiquetas respetan el color del equipo.
- **Juego Local** ahora tiene una sección propia en el menú principal, al mismo nivel que las salas online.
- El texto “Probar partida local” fue reemplazado por **Iniciar partida local**.
- Service Worker actualizado a `anchorgrid-v0.8.1` para evitar conservar estilos antiguos tras desplegar.

## Modos

El tablero es siempre **11×11** y todos comienzan con **10 paredes por jugador**.

- **Duelo 1v1:** Norte vs Sur. Gana quien llegue primero al borde opuesto.
- **Todos al centro (4P):** cuatro jugadores compiten por alcanzar `(5,5)`.
- **Equipos 2v2:** Norte + Sur (Morado) contra Este + Oeste (Naranja). Gana el equipo cuyo primer integrante alcance el centro.

## Reglas principales

- Una acción por turno: mover **o** colocar una pared.
- Movimiento ortogonal.
- Salto automático sobre fichas adyacentes.
- Salto diagonal cuando una pared o borde impide saltar recto.
- Paredes horizontales y verticales de dos segmentos.
- Sin cruces ni solapamientos.
- BFS tras cada intento de pared: **ningún jugador activo puede quedar sin ruta a su objetivo**.
- En modos de centro, la meta `(5,5)` jamás puede quedar completamente bloqueada.
- Cada turno tiene 30 segundos.
- Al agotarse el tiempo aparece un aviso de inactividad y un periodo de gracia; si tampoco hay respuesta, se salta únicamente ese turno.

## Juego local

El menú principal incluye ahora un bloque dedicado a **Juego Local**. Usa el modo y atmósfera elegidos arriba y funciona sin Firebase ni sala online.

Incluye:

- 1v1, 4P y 2v2.
- Tablero 11×11.
- 10 paredes por jugador.
- Temporizador e inactividad.
- Revancha inmediata al terminar.

## Salas privadas online

La capa online utiliza **Firebase Anonymous Authentication + Realtime Database**.

Flujo:

1. El host pulsa **Crear sala**.
2. AnchorGrid genera un código de 4 dígitos.
3. La URL adopta la forma `?room=4826`.
4. Los invitados entran con el enlace o escribiendo los 4 dígitos.
5. El lobby muestra jugadores conectados, desconectados y asientos vacíos.
6. El host inicia cuando estén todos los jugadores requeridos.
7. Si el host cae, otro cliente conectado puede asumir autoridad sin destruir la partida.

Al finalizar una partida online están disponibles:

- **Regresar al lobby**.
- **Menú principal**.
- **Revancha X/N**, que inicia automáticamente cuando todos votan.

## Atmósferas

La identidad visual usa como fondo base `#B6DDFE` y la paleta:

```text
#344D75  #4A7CA1  #637D98  #B6DDFE  #BAF0FA  #F7C5EB  #D069B8
```

Los efectos se mantienen detrás del tablero y de la interfaz. En pantallas pequeñas se reduce automáticamente el número de elementos ambientales para conservar rendimiento.

## Stack

- Vite
- React 19
- TypeScript
- Zustand
- Firebase Anonymous Auth
- Firebase Realtime Database
- Vitest
- GitHub Pages + GitHub Actions

## Desarrollo local

```bash
npm install
npm run dev
```

Para probar desde otros dispositivos en la misma Wi-Fi:

```bash
npm run dev -- --host
```

## Verificación antes de publicar

```bash
npm test
npm run build
```

Después:

```bash
git add -A
git commit -m "feat: AnchorGrid v0.8.1 visual polish and local mode"
git push
```

GitHub Actions publicará `dist` en GitHub Pages.

## Firebase

La configuración Firebase pertenece al administrador del proyecto; los jugadores nunca deben introducir claves ni configuración técnica.

Consulta `FIREBASE_SETUP.md` para configurar Authentication, Realtime Database y los secretos `VITE_FIREBASE_*` del workflow.

<p align="center">
  <img src="./public/brand/signature.webp" alt="Luics415" width="340" />
</p>
