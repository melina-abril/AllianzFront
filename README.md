# Allianz — seguros de auto

Frontend Angular con componentes standalone, signals y datos simulados por defecto. Requiere Node.js compatible con Angular 22.

```sh
npm install
npm start
```

Abrí la URL local indicada por Angular. No hace falta iniciar el backend: `src/environments/environment.ts` configura `useMock: true`.

Para usar el backend local en `http://localhost:8080`, ejecutá `npm run start:backend`; esta configuración desactiva los mocks y redirige `/api` mediante `proxy.conf.json`. Para generar la aplicación: `npm run build`.

## Funcionalidades

- **Cotizador de seguro de auto** (`/quotes`): cotización y recuperación por número y DNI.
- **Asegurados y vehículos** (`/policyholders`): búsqueda y gestión de asegurados y sus vehículos.

El encabezado permite cambiar el rol de prueba. La navegación muestra las funcionalidades disponibles para ese rol.
