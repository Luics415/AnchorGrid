# AnchorGrid v0.8.2 — Game Atmospheres Hotfix

Este ZIP es un **parche incremental** para instalar encima de AnchorGrid v0.8.1.

## Qué corrige

Las instrucciones de Aurora/Bloom/Crystal/Stormlight/Nebula/Garden Pulse ahora se aplican específicamente al **fondo de la partida real**.

No se trata de hacer más llamativos los botones del selector.

## Archivos incluidos

```text
src/components/ThemeAtmosphere.tsx
src/components/GameScreen.tsx
src/styles/v0.8.2-game-atmospheres.css
src/main.tsx
public/sw.js
package.json
README.md
```

## Instalación

1. Descomprime este ZIP.
2. Copia su contenido encima de la raíz de tu carpeta `AnchorGrid`.
3. Acepta reemplazar los archivos existentes.
4. No borres `.git`, `.env`, `node_modules` ni tus secretos/configuración Firebase.

Después:

```powershell
npm test
npm run build
```

Si ambos terminan correctamente:

```powershell
git add -A
git commit -m "fix: AnchorGrid v0.8.2 in-game atmosphere scenes"
git push
```

## Importante después del deploy

El parche cambia el Service Worker a:

```text
anchorgrid-v0.8.2
```

Aun así, si ves el fondo anterior después de GitHub Pages:

- prueba `Ctrl + F5`;
- o abre una pestaña privada una vez;
- en móvil cierra completamente el navegador/PWA y vuelve a abrirlo.

## Resultado esperado

Durante una partida —local u online— los fondos deben ser claramente visibles:

- Aurora: blobs rosa/cian recorriendo el escenario.
- Bloom: pétalos cayendo sin pausas perceptibles.
- Crystal: cristales flotantes + reflejos móviles.
- Stormlight: tiras largas de luz con encendidos lentos.
- Nebula: polvo estelar abundante y nubes en deriva.
- Garden Pulse: ondas de impacto tipo gotas de lluvia.

El tablero permanece por encima, más sólido y legible.
