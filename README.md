# HU Tracker

Aplicación React para gestionar iniciativas y sus historias de usuario con autenticación y persistencia en Supabase.

## Requisitos previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com/) y un proyecto configurado con las tablas `initiatives`, `hus` y `contacts`.

## Configuración

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Crea un archivo `.env.local` en la raíz del proyecto con tus credenciales públicas de Supabase:

   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anon
   ```

   > Asegúrate de habilitar la autenticación por correo/contraseña en Supabase e
   > inicializar las tablas con las migraciones indicadas por tu proyecto.

3. Ejecuta la aplicación en modo desarrollo:

   ```bash
   npm run dev
   ```

## Scripts disponibles

- `npm run dev`: inicia el servidor de desarrollo de Vite.
- `npm run build`: genera la versión de producción.
- `npm run preview`: sirve el build generado.
- `npm run lint`: ejecuta ESLint.
- `npm run test`: ejecuta la suite de pruebas con Jest.

## Notas de integración con Supabase

- La autenticación utiliza `supabase.auth.signInWithPassword`. Se debe crear el
  usuario manualmente o mediante la consola de Supabase.
- Las políticas RLS deben permitir que cada usuario acceda únicamente a sus
  iniciativas, historias (`hus`) y contactos, tal como se detalla en las
  políticas de ejemplo proporcionadas anteriormente.
- Si las variables de entorno no están configuradas, la interfaz mostrará un
  aviso y deshabilitará las acciones que requieren comunicación con Supabase.
