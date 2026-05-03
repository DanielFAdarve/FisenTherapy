# FisenT - Sistema de Fisiatría y Terapia

## Inicio Rápido

```bash
npm install
cp .env.example .env.local
npm run dev
npm run build
```

## Sistema de Diseño Centralizado

### CSS Variables (`src/index.css`)
Variables en `:root` para colores, espaciado, bordes, sombras, tipografía, layout.

### Design Tokens (`src/styles/tokens.ts`)
```typescript
import { colors, layouts, padding, text, gridCols } from '../styles/tokens';
// Layouts: cardGrid, statGrid, formGrid, twoColumn, threeColumn
// Padding: page, card, cardHeader, modal, table
// Text: pageTitle, sectionTitle, cardTitle, body, caption
```

### Hooks (`src/hooks/useHooks.ts`)
```typescript
import { useResponsive, useIsMobile, useDebounce, useLocalStorage } from '../hooks/useHooks';
```

## Calendario - Flujo por Modales

### Slot Vacío → Crear Cita (4 pasos)

```
Click en slot vacío
    ↓
┌─────────────────────────────────┐
│ PASO 1: Seleccionar Paciente    │
│ - Select con pacientes activos  │
│ - Muestra paquetes activos      │
│ - Detecta si no hay paquetes    │
│         ↓                       │
│ [Siguiente]                     │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ PASO 2: Seleccionar Paquete     │
│ - Lista de paquetes activos     │
│ - Progress bar por paquete      │
│ - Botón "Crear nuevo paquete"   │
│         ↓                       │
│ [Siguiente]                     │
└─────────────────────────────────┘
    ↓ (si no hay paquetes)
┌─────────────────────────────────┐
│ PASO 2b: Crear Paquete          │
│ - Tipo de paquete               │
│ - Nombre + sesiones             │
│ - Crea paquete inline           │
│ - Regresa al paso 2             │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ PASO 3: Detalles de Cita        │
│ - Profesional + Fecha + Hora    │
│ - Validación de colisión        │
│ - Observaciones                 │
│         ↓                       │
│ [Revisar]                       │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ PASO 4: Confirmar               │
│ - Resumen completo              │
│ - Paciente, profesional, fecha  │
│ - Paquete y sesión #            │
│         ↓                       │
│ [Confirmar Cita]                │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ ✅ ÉXITO                        │
│ - Mensaje de confirmación       │
│ - [Cerrar]                      │
└─────────────────────────────────┘
```

### Slot con Cita → Gestionar (3 opciones)

```
Click en cita existente
    ↓
┌─────────────────────────────────┐
│ DETALLE DE CITA                 │
│ - Paciente + Profesional        │
│ - Horario + Estado              │
│ - Paquete + Sesión #            │
│ - Progress bar del paquete      │
│                                 │
│ [Editar] [Pagar] [Cancelar]     │
└─────────────────────────────────┘
    ↓ Editar
┌─────────────────────────────────┐
│ EDITAR CITA                     │
│ - Modificar profesional/hora    │
│ - Validación de colisión        │
│         ↓                       │
│ [Confirmar Cambios]             │
└─────────────────────────────────┘
    ↓ Pagar
┌─────────────────────────────────┐
│ REGISTRAR PAGO                  │
│ - Valor + Método de pago        │
│ - Observaciones                 │
│         ↓                       │
│ [Revisar]                       │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ CONFIRMAR PAGO                  │
│ - Resumen del pago              │
│         ↓                       │
│ [Confirmar Pago]                │
└─────────────────────────────────┘
    ↓ Cancelar
┌─────────────────────────────────┐
│ ⚠️ CONFIRMAR CANCELACIÓN       │
│ - Datos de la cita              │
│         ↓                       │
│ [Sí, cancelar]  [No, volver]    │
└─────────────────────────────────┘
```

## Validaciones Implementadas

| Validación | Dónde se ejecuta |
|------------|------------------|
| Paciente obligatorio | Paso 1 |
| Paquete activo requerido | Paso 2 (redirige a 2b si no hay) |
| No duplicar paquete mismo tipo | Paso 2b |
| Profesional obligatorio | Paso 3 |
| Fecha/hora obligatorios | Paso 3 |
| Horario fin > inicio | Paso 3 |
| Colisión de agenda | Paso 3 (en tiempo real) |
| Sesiones no excedidas | Paso 2 |
| Valor > 0 | Pago |
| Método de pago obligatorio | Pago |

## Módulos

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Login | `/login` | Autenticación JWT |
| Dashboard | `/dashboard` | KPIs + citas del día |
| Calendario | `/calendar` | **Google Calendar + flujos modales** |
| Pacientes | `/patients` | CRUD completo |
| Paquetes | `/packages` | Gestión con progress bars |
| Citas | `/appointments` | Lista con colisión |
| Historia | `/history` | Evoluciones por cita |
| Pagos | `/payments` | Registro + resumen |
| Reportes | `/reports` | KPIs + gráficos + alertas |
| Profesionales | `/professionals` | Listado con cards |
| CIE10 | `/cie10` | Catálogo diagnósticos |

## Estructura

```
src/
├── config/env.ts              # Variables de entorno
├── styles/tokens.ts           # Design tokens
├── hooks/useHooks.ts          # Hooks (responsive, debounce)
├── domain/
│   ├── models.ts              # Interfaces
│   └── schemas.ts             # Zod validators
├── data-access/
│   ├── api.ts                 # Axios + interceptores
│   └── services.ts            # Servicios
├── context/AuthContext.tsx    # Auth state
├── components/
│   ├── ui/Components.tsx      # UI components
│   └── layout/Layout.tsx      # Layout + bottom nav
├── pages/                     # 11 páginas
├── App.tsx
├── main.tsx
└── index.css                  # CSS Variables
```

## Responsividad

| Breakpoint | Sidebar | Bottom Nav | Grid |
|------------|---------|------------|------|
| <640px | Overlay + Bottom Nav | Sí | 1 col |
| 640-1023px | Overlay | Sí | 2 cols |
| ≥1024px | Colapsable fijo | No | 3-4 cols |

## Tecnologías
React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + React Router + Axios + Zod + date-fns + react-hot-toast + lucide-react
