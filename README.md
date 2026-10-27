# Allianz

Frontend de autogestión para una aseguradora de autos, desarrollado con Angular 22.

## Iniciar sin backend

```sh
npm install
npm start
```

Abrí la dirección local que muestra Angular. La configuración predeterminada usa datos simulados y no necesita un servidor de API.

## Conectar el backend local

Con el backend disponible en `http://localhost:8080`, ejecutá `npm run start:backend`. Esta configuración desactiva los mocks y redirige las solicitudes `/api` mediante `proxy.conf.json`. Para generar una compilación de producción, ejecutá `npm run build`.

## Funcionalidades

- **Cotizador de seguro de auto:** cotización y recuperación de propuestas.
- **Asegurados y vehículos:** búsqueda, ficha, altas, modificaciones y bajas permitidas.

El selector «Rol de prueba» del encabezado permite revisar la navegación disponible para cada perfil.
