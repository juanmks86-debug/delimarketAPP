# DeliMarket

Marketplace de comida rápida y delivery: conecta clientes con locales (pizzerías, casas de empanadas, hamburgueserías, etc.) para pedir productos con entrega a domicilio.

🔗 **Demo en producción:** https://delimarket-app.vercel.app

## Índice
- [Stack](#stack)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Funcionalidades](#funcionalidades)
- [Base de datos (Supabase)](#base-de-datos-supabase)
- [Cómo correrlo en local](#cómo-correrlo-en-local)
- [Roadmap / pendientes](#roadmap--pendientes)

## Stack
- **Frontend:** HTML, CSS y JavaScript vanilla (sin frameworks ni build step) — pensado como SPA simple por página.
- **Backend:** [Supabase](https://supabase.com) (Postgres + Auth-less RPC propio + Storage).
- **Hosting:** [Vercel](https://vercel.com), deploy automático desde este repo.
- **PWA:** instalable desde el navegador (manifest + service worker).

## Estructura del proyecto
```
├── index.html            Página del cliente (home, carrito, checkout, mis pedidos)
├── vendedor.html          Login/registro (cliente y vendedor) + panel del vendedor
├── admin.html             Panel de administración
├── terminos.html          Términos y condiciones
├── privacidad.html        Política de privacidad
├── manifest.json / sw.js  Configuración PWA
├── css/
│   ├── estilos.css            Estilos del cliente (index.html)
│   ├── estilos-vendedor.css   Estilos de login/registro/panel vendedor
│   ├── estilos-admin.css      Estilos del panel admin
│   └── estilos-banners.css    Estilos del carrusel de banners
├── js/
│   ├── main.js             Lógica del cliente: productos, carrito, checkout, pedidos, reseñas
│   ├── vendedor.js         Login/registro de cliente y vendedor, panel del vendedor (productos, pedidos, perfil)
│   ├── admin.js            Panel de administración (vendedores, clientes, productos)
│   ├── banners.js          Carrusel de banners promocionales
│   ├── temas.js            Temas decorativos estacionales + reseñas
│   ├── carousel.js         Carrusel de "Productos destacados"
│   └── supabase-config.js  Cliente de Supabase + helpers compartidos (loader, compresión de imágenes)
└── api/                   Funciones serverless (login de admin)
```

## Funcionalidades
**Cliente**
- Explorar productos por categoría, franja horaria (desayuno/almuerzo/merienda/cena) y proveedor.
- Filas destacadas en el home: ofertas manuales, favoritos, mejor calificados y productos recién agregados.
- Carrito, checkout y seguimiento de pedido en tiempo real con animación de delivery.
- Calificar el pedido al recibirlo.
- Requiere cuenta para agregar al carrito y confirmar pedidos.

**Vendedor**
- Registro con aprobación manual del admin.
- Alta/edición/borrado de productos con foto (comprimida automáticamente antes de subir).
- Foto de perfil del negocio editable.
- Ver y actualizar el estado de sus pedidos.
- Ver su calificación promedio.

**Admin**
- Aprobar/rechazar/eliminar vendedores.
- Gestionar clientes y productos.
- Configurar banners promocionales y el tema decorativo estacional del home.

## Base de datos (Supabase)
Tablas principales: `clientes`, `vendedores`, `administradores`, `productos`, `pedidos`, `banners`, `resenas`, `ajustes_sitio`.
Buckets de Storage: `productos-imagenes`, `vendedores-logos`, `banners-imagenes`.

Las contraseñas se hashean en el servidor vía funciones RPC de Postgres (no hay Supabase Auth tradicional; el login es propio).

## Cómo correrlo en local
1. Cloná el repo:
   ```bash
   git clone https://github.com/juanmks86-debug/delimarketAPP.git
   cd delimarketAPP
   ```
2. Como es HTML/JS estático, alcanza con abrir `index.html` con un servidor local (por ejemplo la extensión "Live Server" de VS Code, o `npx serve`). No hace falta build ni `npm install`.
3. Las credenciales de conexión a Supabase están en `js/supabase-config.js`.

## Roadmap / pendientes
- Verificación anti-bot real en el registro (hoy solo hay una animación de espera).
- Revisar y endurecer las políticas de Supabase (varias tablas aceptan insert/update abiertos).
- Subir la foto de perfil del cliente (hoy solo se previsualiza).
- Paginación en las listas del panel admin.
- Notificaciones push de cambio de estado del pedido.
- Permitir calificar por separado a cada vendedor en pedidos con productos de varios locales.
