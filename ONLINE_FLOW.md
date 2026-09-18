# AnchorGrid · Flujo online v0.7.0

## Crear sala

1. El jugador escribe su nombre, elige modo y tema.
2. Pulsa **Crear sala**.
3. AnchorGrid reserva un código aleatorio de 4 dígitos en Realtime Database.
4. La URL del navegador pasa a `https://luics415.github.io/AnchorGrid/?room=####`.
5. El creador entra directamente al lobby y queda como host inicial.

## Lobby

El lobby muestra siempre:

- código de 4 dígitos;
- URL completa de invitación;
- botones Copiar / Compartir;
- todos los asientos del modo;
- nombre del jugador conectado;
- estado conectado / OFFLINE;
- host actual;
- contador `conectados / requeridos`;
- botón Iniciar partida para el host cuando todos están conectados.

Una pérdida de red no borra el asiento. Si el host cae, la autoridad migra al siguiente jugador conectado.

## Entrar con invitación

El invitado abre `?room=####`. AnchorGrid conserva el código en pantalla. Tras indicar su nombre, pulsa **Entrar** y ocupa el siguiente asiento libre. El lobby de todos se actualiza en tiempo real.

## Fin de partida

La pantalla final online ofrece:

- **Regresar al lobby**: devuelve la sala completa a espera, conservando código y jugadores.
- **Menú principal**: ese jugador abandona la sala.
- **Revancha X/N**: voto persistido en la sala. Cuando votan todos los jugadores requeridos, la nueva partida inicia automáticamente.

En 1v1 el contador es `0/2`; en 4P y 2v2 es `0/4`.

## Infraestructura

Firebase es infraestructura del administrador, no una opción de usuario. Los jugadores nunca deben ver un cuadro para pegar `firebaseConfig`.
El build de GitHub Pages recibe `VITE_FIREBASE_*` desde GitHub Actions.
