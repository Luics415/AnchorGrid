# AnchorGrid v1.0.0-alpha.3

Este parche se instala **encima de v1.0.0-alpha.2**, que es la versión que estás
probando ahora.

## 1. Puntos de movimiento

Los puntos legales ahora tienen mucho más contraste:

- núcleo magenta;
- borde blanco;
- anillo azul oscuro;
- halo cian;
- saltos y diagonales conservan formas diferenciadas.

El objetivo es que se distingan incluso en Crystal, Bloom y los fondos más claros.

## 2. Juego Cercano — primera integración

Se agrega el flujo de **Sala Cercana Pública**.

No utiliza el flujo de Firebase de las salas privadas:

- no hay código de 4 dígitos;
- no hay enlace de invitación;
- no hay botón Compartir;
- la sala queda esperando dispositivos cercanos.

### Asientos por dispositivo

Un dispositivo puede controlar más de un asiento. Esto evita obligar a que
"1 dispositivo = 1 jugador".

Ejemplos válidos:

- 4P con 3 dispositivos:
  - dispositivo A → Norte + Oeste
  - dispositivo B → Este
  - dispositivo C → Sur

- 2v2 con 2 dispositivos:
  - dispositivo A → Morado (Norte + Sur)
  - dispositivo B → Naranja (Este + Oeste)

- 1 dispositivo:
  - puede controlar todos los asientos.

### Inicio siempre disponible

El host puede pulsar **Iniciar partida** aunque falten asientos.

Antes de empezar, AnchorGrid muestra un aviso indicando qué asientos vacíos se
controlarán desde el host. Así no se inicia por accidente una configuración distinta
a la esperada.

## Estado de iPhone/Android

La capa de sala, reparto de asientos y contrato de transporte ya están preparados.
En navegador funciona como prueba local de la lógica.

El descubrimiento físico real iPhone ↔ Android todavía necesita el bridge nativo
Nearby Connections. Se mantiene separado del motor, Firebase, Local e IA.

## Archivos

El ZIP contiene sólo los archivos nuevos/modificados de alpha.3.

## Verificación

Después de copiar encima del proyecto:

```powershell
npm test
npm run build
```

Si todo termina correctamente:

```powershell
git add -A
git commit -m "feat: AnchorGrid alpha 3 nearby public lobby and movement visibility"
git push
```

El Service Worker cambia a `anchorgrid-v1.0.0-alpha.3`.
