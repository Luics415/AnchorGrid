# Firebase para pruebas privadas

AnchorGrid usa Firebase sólo para identidad anónima, presencia y sincronización de salas privadas. No usa cuentas visibles ni matchmaking global.

## Activación rápida desde la propia web

AnchorGrid v0.5 también permite una configuración temporal sin recompilar: si el sitio no encuentra variables `VITE_FIREBASE_*`, el botón **Crear sala** abre un panel donde puedes pegar el objeto `firebaseConfig` de tu Web App. Se guarda en `localStorage` de ese navegador.

Cuando la configuración proviene de este modo, **Copiar invitación / Compartir** añade un parámetro `cfg` al enlace. Ese parámetro sólo contiene la configuración pública del cliente Firebase y permite que el dispositivo invitado la guarde automáticamente antes de entrar. Las reglas de seguridad de Realtime Database siguen siendo obligatorias.

Para producción estable, siguen siendo preferibles las variables de GitHub Actions indicadas más abajo.

## 1. Crear proyecto

En Firebase Console crea un proyecto nuevo. No necesitas Analytics para el juego.

## 2. Authentication

En **Build → Authentication → Sign-in method**, habilita **Anonymous**.

En **Authentication → Settings → Authorized domains** agrega `luics415.github.io` antes de probar la versión publicada en GitHub Pages.

## 3. Realtime Database

En **Build → Realtime Database**, crea una base. Para pruebas puedes usar la región más cercana disponible. Después publica las reglas incluidas en `firebase.database.rules.json`.

Estas reglas son para una beta privada: impiden listar `/rooms` públicamente, pero cualquier usuario anónimo autenticado que conozca/adivine un código puede leer/escribir esa sala. El código de 4 dígitos es una comodidad de acceso, no un secreto criptográfico.

## 4. Aplicación web

En **Project settings → Your apps**, registra una aplicación Web y copia la configuración del SDK.

Crea `.env` a partir de `.env.example`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 5. Prueba en la misma red Wi‑Fi

```bash
npm install
npm run dev -- --host
```

Vite mostrará una URL de red, por ejemplo `http://192.168.x.x:5173`. Ábrela en los demás dispositivos de la misma Wi‑Fi.

Para probar fuera de la red local, usa GitHub Pages.

## 6. GitHub Pages

El destino previsto es `https://luics415.github.io/AnchorGrid/`.

Agrega cada variable `VITE_FIREBASE_*` como **Repository secret**. El workflow incluido instala dependencias, ejecuta tests, compila y publica `dist`.

## Qué probar primero

1. Crear sala 1v1 en dispositivo A.
2. Abrir el link/código en dispositivo B.
3. Jugar varios turnos y colocar paredes.
4. Recargar B y confirmar reentrada automática.
5. Cortar la red del host A y confirmar que B toma `HOST` y aumenta `E#`.
6. Reconectar A y comprobar que conserva su ficha sin recuperar la autoridad.

Después usa `MULTIDEVICE_TEST.md` para la matriz completa de pruebas.
