# Allianz

Frontend Angular 22 para cotizar seguros de auto y gestionar asegurados y vehículos.

## Ejecutar

1. Instalá las dependencias con `npm install`.
2. Iniciá la aplicación con `npm start`. Por defecto utiliza datos simulados y no requiere backend.
3. Abrí la dirección local indicada por Angular en la terminal.

Para conectar el backend local en `http://localhost:8080`, ejecutá `npm run start:backend`. Esta configuración desactiva los mocks y redirige `/api` mediante `proxy.conf.json`. Para generar una compilación de producción, ejecutá `npm run build`.

## Módulos

- **Cotizador de seguro de auto** (`/quotes`): cotización y recuperación de propuestas.
- **Asegurados y vehículos** (`/policyholders`): búsqueda, alta y administración de asegurados y sus vehículos.

El selector de rol del encabezado permite probar la navegación disponible para asegurados, productores, operadores, liquidadores y supervisores.
