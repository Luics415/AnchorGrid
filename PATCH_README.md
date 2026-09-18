# AnchorGrid v0.8.1 — parche visual + Juego Local

Este ZIP **no contiene el proyecto completo**. Sólo incluye archivos nuevos o modificados para esta pasada.

## Instalación

1. Haz una copia de seguridad de tu carpeta actual de AnchorGrid.
2. Descomprime este ZIP.
3. Copia su contenido encima de la raíz de tu repositorio local `AnchorGrid`.
4. Acepta **reemplazar los archivos existentes**.
5. El archivo `src/styles/v0.8.1-polish.css` es nuevo; confirma que se haya creado.
6. No borres `.git`, `.env`, `node_modules` ni tus archivos Firebase.

Después ejecuta:

```bash
npm test
npm run build
```

Si ambos terminan correctamente:

```bash
git add -A
git commit -m "feat: AnchorGrid v0.8.1 visual polish and local mode"
git push
```

## Archivos incluidos

- `src/components/HomeScreen.tsx`
- `src/components/ThemeAtmosphere.tsx`
- `src/components/GameScreen.tsx`
- `src/components/LobbyScreen.tsx`
- `src/main.tsx`
- `src/styles/v0.8.1-polish.css` **(nuevo)**
- `package.json`
- `public/sw.js`
- `README.md`

## Qué cambia

- Cards de atmósferas rediseñadas.
- Aurora, Bloom, Crystal, Stormlight, Nebula y Garden Pulse con movimiento más vivo y continuo.
- Tablero menos transparente.
- Resultado final mejorado en PC sin alterar la presentación móvil.
- 2v2 Morado vs Naranja para fichas, paredes e indicadores.
- Apartado completo de Juego Local en el menú.
- README actualizado.
- Cache PWA actualizado a v0.8.1.
