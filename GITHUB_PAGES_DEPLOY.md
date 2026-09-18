# Publicación de AnchorGrid en GitHub Pages

Destino previsto:

```text
Repositorio: Luics415/AnchorGrid
Sitio: https://luics415.github.io/AnchorGrid/
```

## 1. Crear el repositorio

El repositorio ya existe en `Luics415/AnchorGrid`. Sube el contenido de esta carpeta a la raíz del repositorio.

Ejemplo desde la carpeta del proyecto:

```bash
git init
git branch -M main
git add .
git commit -m "feat: AnchorGrid v0.5.0"
git remote add origin https://github.com/Luics415/AnchorGrid.git
git push -u origin main
```

## 2. Preparar Firebase para el dominio público

En Firebase Console:

1. Authentication → Sign-in method → habilita **Anonymous**.
2. Authentication → Settings → Authorized domains → añade:

```text
luics415.github.io
```

3. Crea Realtime Database.
4. Publica `firebase.database.rules.json` para la fase de pruebas privadas.

## 3. Añadir secrets al repositorio

GitHub → `AnchorGrid` → Settings → Secrets and variables → Actions → New repository secret.

Añade:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Los valores salen de Firebase → Project settings → Your apps → Web app → Firebase SDK configuration.

## 4. Activar GitHub Pages

GitHub → Settings → Pages → Build and deployment → Source:

```text
GitHub Actions
```

El archivo `.github/workflows/deploy-pages.yml` realizará pruebas, build y despliegue en cada push a `main`.

## 5. Primera prueba pública

Abre:

```text
https://luics415.github.io/AnchorGrid/
```

Dispositivo A:

```text
Crear sala → 4826
```

Comparte:

```text
https://luics415.github.io/AnchorGrid/?room=4826
```

Dispositivo B abre el enlace, introduce su nombre y entra.

## 6. Prueba de migración de host

1. A crea la sala y queda como HOST.
2. B entra.
3. Inicia la partida.
4. Desconecta la red de A.
5. B debe asumir HOST y aumentar `E#` sin reiniciar el tablero.
6. A vuelve a conectarse y recupera su asiento, pero B conserva el host actual.

## 7. Nota sobre la portada social

`index.html` apunta a:

```text
https://luics415.github.io/AnchorGrid/og-anchorgrid.jpg
```

Cuando el repositorio esté publicado, ese archivo será la vista social de AnchorGrid.
