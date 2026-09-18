# Changelog

## v0.5.0 — AnchorGrid

- Cambio definitivo de nombre a **AnchorGrid** y URL `https://luics415.github.io/AnchorGrid/`.
- Movimiento permanentemente activo: las casillas legales siempre se pueden tocar.
- Eliminados los botones para alternar entre mover y colocar pared.
- Nuevo dock de paredes: horizontal y vertical se colocan mediante **drag & drop con Pointer Events**, compatible con mouse, touch y stylus.
- Preview de anclaje válido durante el arrastre.
- Fichas azul, verde, rojo y amarillo con pequeña ancla direccional: norte 180°, este 90°, sur 0°, oeste -90°.
- Bienvenida, manifest, metadata, invitaciones y documentación renombradas a AnchorGrid.
- Banner social/README actualizado para el nuevo nombre.
- Se mantiene el motor 11×11, BFS de rutas, temporizador, salas privadas y migración de host.

# Changelog

## v0.4.0

### Identidad

- Nueva pantalla de bienvenida responsive.
- Integración del emblema de ancla.
- Firma `Luics415` con ancla de fondo transparente.
- Banner oficial para README/repositorio.
- Favicon, Apple Touch Icon e iconos PWA derivados del ancla.
- Open Graph 1200×630 para compartir el sitio.

### Jugadores

- Restaurados los cuatro colores competitivos fuertes y permanentes:
  - Norte: azul.
  - Este: verde.
  - Sur: rojo.
  - Oeste: amarillo.
- Fichas, tarjetas y paredes aumentan contraste sin depender del tema visual.

### Temas

- Efectos ambientales enviados detrás de toda la interfaz.
- Menor luminosidad y saturación para reducir distracciones.
- Bordes/figuras más definidos y menos borrosos.
- Menor densidad de partículas en móviles y escritorio.
- La identidad de cada tema se conserva sin competir visualmente con las fichas.

### GitHub Pages

- Preparación para `Luics415/AnchorGrid`.
- Metadatos sociales apuntando al futuro `github.io`.
- Workflow actualizado sin depender de un `package-lock.json` inexistente.
- Nueva guía `GITHUB_PAGES_DEPLOY.md`.

## v0.3.0

- Refuerzo de presencia y reconexión Firebase.
- Reentrada automática al asiento reservado.
- Migración de host con `authority.epoch`.
- Unión atómica a asientos.
- Diagnósticos `HOST`, `E#` y `R#`.
- Primera pasada visual completa de los seis temas.
