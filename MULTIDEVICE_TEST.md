# AnchorGrid · Prueba multidispositivo v0.3

Esta versión está preparada para empezar las pruebas reales entre teléfonos, tablets y computadoras usando una sala privada de 4 dígitos.

## Preparación

1. Crea/configura Firebase y habilita **Authentication → Anonymous**.
2. Crea una **Realtime Database**.
3. Copia `.env.example` a `.env` y rellena las credenciales del SDK web.
4. Despliega `firebase.database.rules.json` para el entorno de prueba.
5. Ejecuta `npm install`, `npm run dev` y, para dispositivos de tu misma red local, usa `npm run dev -- --host`.
6. Alternativamente publícalo en GitHub Pages y abre la misma URL en todos los dispositivos.

## Prueba A · 1v1 básico

- Dispositivo A crea una sala 1v1.
- Dispositivo B abre el enlace compartido o introduce el código.
- Comprueba que ambos muestran el mismo tema, nombres y asientos.
- Inicia desde el host.
- Realiza 10-15 movimientos alternados.
- Coloca paredes desde ambos dispositivos.
- Verifica que revisión `R` aumenta igual en ambos.
- Intenta crear una pared que cierre completamente la ruta: debe ser rechazada.

## Prueba B · reconexión

Durante una partida:

1. Activa modo avión en el jugador que **no** es host.
2. El otro dispositivo debe verlo `OFFLINE`.
3. Desactiva modo avión antes de que finalice el turno.
4. La aplicación debe volver a marcarlo conectado automáticamente, sin volver a introducir código.
5. Recarga el navegador: si ese navegador tenía asiento reservado y conserva su identidad anónima, `?room=XXXX` reanuda la sala automáticamente.

## Prueba C · migración de host

1. Inicia una partida con al menos 2 dispositivos.
2. Identifica `HOST` en la interfaz.
3. Cierra el navegador del host o corta su conexión.
4. Espera a que Firebase declare la presencia desconectada.
5. El siguiente asiento conectado debe mostrar `HOST`.
6. `E` (authority epoch) debe aumentar en 1.
7. Continúa jugando; el tablero y el temporizador no deben reiniciarse.
8. Reconecta el host original: recupera su asiento, pero **no** recupera automáticamente la autoridad.

## Prueba D · 4 jugadores / 2v2

- Usa cuatro navegadores o dispositivos diferentes.
- Confirma los asientos Norte → Este → Sur → Oeste.
- En 2v2 verifica: Norte+Sur = Equipo A y Este+Oeste = Equipo B.
- Confirma saltos simples, diagonales y multi-salto.
- Deja expirar 30 segundos: en 4P/2v2 sólo se elimina esa ficha y sus paredes permanecen.

## Prueba E · concurrencia

En dos dispositivos intenta tocar una acción casi al mismo tiempo. Sólo la acción correspondiente al turno/revisión válida debe modificar el estado. Los requests atrasados usan `expectedRevision` y `authorityEpoch`, por lo que no deben sobreescribir una revisión nueva ni cruzar una migración de host.

## Indicadores de diagnóstico

Durante estas pruebas la UI muestra:

- `Sincronizado / Reconectando`.
- `HOST` cuando el dispositivo tiene autoridad.
- `E#`: época de autoridad; aumenta con cada migración.
- `R#`: revisión del GameState.
- desfase aproximado con el reloj del servidor Firebase.

Estos indicadores son deliberadamente visibles en v0.3 y pueden ocultarse en la versión final.


## Interacción v0.5

- El movimiento está siempre activo: toca una casilla marcada.
- Para poner una pared, arrastra la pieza horizontal o vertical desde el dock hasta un anclaje válido y suelta.
- Verifica el drag con mouse, touch y, si está disponible, stylus.
- Comprueba que las anclas de las fichas miren hacia su lado: Norte 180°, Este 90°, Sur 0°, Oeste -90°.
