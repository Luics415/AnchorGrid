# AnchorGrid v1.0.0-alpha.4

Parche incremental para instalar encima de `v1.0.0-alpha.3`.

## Cambios

### Home
`Juego Local` ahora es la opción 04 y aparece antes de las opciones online.

La misma sección contiene:

- **Este dispositivo** → partida local tradicional.
- **Dispositivos cercanos** → sala pública cercana.

Se elimina la tarjeta independiente `08 · JUEGO CERCANO`.

El orden queda:

1. Identidad
2. Modo
3. Atmósfera
4. Juego Local
5. Sala Privada
6. Código
7. VS IA

También se acortaron varios textos de ayuda que ya no aportaban información.

### Puntos de movimiento
Se elimina el anillo/halo de alpha.3.

Ahora cada movimiento legal muestra únicamente un punto rosa fuerte:

`#D82AA4`

Sin borde, sin aro exterior y sin resplandor.

## Instalar

Copia este ZIP sobre tu proyecto `v1.0.0-alpha.3` y acepta reemplazar.

Después:

```powershell
npm test
npm run build
```

Si pasa todo:

```powershell
git add -A
git commit -m "refactor: merge local and nearby play in AnchorGrid alpha 4"
git push
```

Service Worker: `anchorgrid-v1.0.0-alpha.4`
