# Copiado — Sistema de gestión de ventas

Aplicación desarrollada con **React, TypeScript y Vite** para la gestión de las operaciones de un centro de copiado.

El sistema permite administrar clientes, productos y servicios, registrar ventas, consultar la tasa de cambio oficial, generar reportes en PDF y Excel, consultar el historial mensual y realizar el cierre de períodos.

La aplicación funciona sin una base de datos ni un backend propio, utilizando almacenamiento local del navegador y una arquitectura hexagonal para mantener separadas las reglas de negocio, los casos de uso, la infraestructura y la interfaz.

## Demo

**Enlace de la aplicación:** [https://copiado.vercel.app]

## Tecnologías

* React
* TypeScript
* Vite
* React Router
* LocalStorage
* jsPDF
* SheetJS (xlsx)
* Lucide React

## Cómo ejecutar

### Requisitos

* Node.js 18 o superior
* npm

### Instalación

```bash
npm install
```

### Variables de entorno

Crea un archivo `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Las variables disponibles permiten configurar el proveedor de la tasa de cambio y el intervalo de actualización.

```env
VITE_EXCHANGE_RATE_API_URL=
VITE_EXCHANGE_RATE_API_KEY=
VITE_EXCHANGE_RATE_REFRESH_MINUTES=5
```

> En Windows también puedes crear el archivo `.env` manualmente en la raíz del proyecto.

### Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible normalmente en:

```text
http://localhost:5173
```

### Ejecutar en producción

Para generar la versión optimizada:

```bash
npm run build
```

Para previsualizar la compilación:

```bash
npm run preview
```

## Arquitectura

El proyecto utiliza una **arquitectura hexagonal**, buscando mantener el dominio independiente de las tecnologías externas y facilitar el mantenimiento y la evolución del sistema.

```text
src/
├── domain/
│   ├── entities/
│   ├── ports/
│   ├── services/
│   └── errors/
│
├── application/
│   └── use-cases/
│
├── infrastructure/
│   ├── persistence/
│   ├── exchange-rate/
│   ├── pdf/
│   ├── excel/
│   └── container.ts
│
├── presentation/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   └── hooks/
│
└── shared/
    ├── constants/
    ├── types/
    └── utils/
```

### Principios de diseño

* **Dominio independiente:** las entidades y reglas de negocio no dependen de React, LocalStorage, jsPDF, SheetJS ni de otros detalles de infraestructura.
* **Puertos y adaptadores:** los casos de uso trabajan mediante interfaces como `ClientRepository`, `SaleRepository`, `ExchangeRateProvider`, `PdfGenerator` y `ExcelExporter`.
* **Infraestructura desacoplada:** los adaptadores concretos implementan los puertos definidos por el dominio.
* **Composition Root:** `container.ts` centraliza la creación y conexión de las implementaciones.
* **Separación de responsabilidades:** cada capa tiene una responsabilidad definida, facilitando las pruebas, el mantenimiento y la sustitución de componentes.
* **Snapshot de ventas:** la información relevante de una venta queda registrada en el momento en que se realiza, evitando que modificaciones posteriores del catálogo alteren el historial existente.

## Funcionalidades

### Gestión de clientes

* Registro de clientes.
* Edición y eliminación.
* Consulta de información registrada.
* Persistencia local de los datos.

### Productos y servicios

* Gestión del catálogo.
* Creación, edición y eliminación de productos o servicios.
* Configuración de precios.
* Soporte para diferentes tipos de servicios ofrecidos por un centro de copiado.

### Gestión de ventas

* Registro de ventas.
* Cálculo automático de cantidades y totales.
* Selección de clientes y productos.
* Registro de la tasa de cambio utilizada en la operación.
* Conservación de la información de la venta para el historial.

### Tasa de cambio

El sistema integra un proveedor externo para consultar la tasa de cambio oficial.

La consulta se realiza automáticamente según el intervalo configurado y también puede actualizarse manualmente desde la aplicación.

El sistema contempla mecanismos de respaldo para mantener disponible la última tasa válida almacenada localmente cuando el proveedor externo no se encuentra disponible.

La integración está desacoplada mediante el puerto:

```text
ExchangeRateProvider
```

Esto permite sustituir el proveedor de datos sin modificar la lógica principal de la aplicación.

### Reportes

El sistema permite generar información de las operaciones registradas mediante:

* Reportes en PDF.
* Exportación de datos a Excel.
* Resúmenes de ventas.
* Historial de períodos.

### Cierre de período mensual

El sistema permite gestionar el cierre de los períodos mensuales.

Al detectar un nuevo período, la aplicación puede preparar el resumen correspondiente y permitir la generación del reporte antes de cerrar el período anterior.

El cierre elimina las ventas del período operativo correspondiente, mientras mantiene la información estructural del sistema, como clientes, productos y configuraciones.

## Persistencia

Los datos se almacenan localmente en el navegador mediante una capa de persistencia abstraída por interfaces.

Esta decisión permite que la aplicación funcione como una solución frontend independiente, manteniendo la posibilidad de sustituir posteriormente el mecanismo de almacenamiento por otra tecnología, como IndexedDB o un servicio backend.

## Autora

**Desarrollado por Elia**
