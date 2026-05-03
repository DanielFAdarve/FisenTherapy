# FISENT — Arquitectura Frontend Integral

## RESUMEN EJECUTIVO (12 bullets)

1. **Arquitectura feature-based**: Cada módulo (pacientes, citas, pagos...) es autocontenido con su domain/data-access/ui.
2. **Contratos TypeScript estrictos**: DTOs normalizados por entidad, separando request/response del backend.
3. **Zod schemas sincronizados**: Cada regla de negocio del backend tiene su validador Zod equivalente.
4. **JWT en memoria + sessionStorage**: Token almacenado en variable de memoria con fallback a sessionStorage (más seguro que localStorage).
5. **Doble interceptor**: Request (inyecta Bearer token) + Response (normaliza errores HTTP 400/status 500, maneja 401/403).
6. **AuthGuard + PublicRoute**: Componentes wrapper que protegen rutas y redirigen automáticamente.
7. **React Context + useReducer**: Estado global ligero para auth; estado local por componente para módulos (evita overhead de Redux/NgRx).
8. **Validación de colisión de citas**: Verificación local + endpoint de colisión antes de guardar.
9. **Validación de sobrepago**: Coherencia estricta entre tipo de pago, id_paquete/id_cita, y saldo pendiente.
10. **UX clínica optimizada**: Skeletons, toasts, modales, badges de estado, progress bars en paquetes.
11. **Accesibilidad**: Labels, ARIA attributes, roles, focus management, contraste WCAG AA.
12. **Escalable a multi-sede**: Arquitectura preparada; solo requiere agregar `id_sede` a modelos y filtros.

---

## 1. ARQUITECTURA FRONTEND OBJETIVO

```
src/
├── domain/              # Capa de dominio (pura, sin dependencias)
│   ├── models.ts        # Interfaces TypeScript por entidad
│   └── schemas.ts       # Zod validators sincronizados con reglas de negocio
├── data-access/         # Capa de acceso a datos
│   ├── api.ts           # Axios instance + interceptores JWT + errores
│   └── services.ts      # Servicios fuertemente tipados por endpoint
├── context/             # Estado global (React Context)
│   └── AuthContext.tsx  # Auth state + login/logout + auto-expiry
├── components/
│   ├── ui/              # Componentes UI reutilizables (Button, Input, Modal...)
│   │   └── Components.tsx
│   └── layout/          # Layout principal
│       └── Layout.tsx   # Sidebar + Header + AuthGuard
├── pages/               # Páginas por módulo funcional
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── PatientsPage.tsx
│   ├── PackagesPage.tsx
│   ├── AppointmentsPage.tsx
│   ├── HistoryPage.tsx
│   ├── PaymentsPage.tsx
│   ├── ProfessionalsPage.tsx
│   └── Cie10Page.tsx
├── App.tsx              # Router configuration
├── main.tsx             # Entry point
└── vite-env.d.ts        # Vite types
```

### Justificación: Feature-Based + Clean-ish Architecture

- **Domain** es puro TypeScript sin dependencias de React → testeable en aislamiento.
- **Data-access** encapsula toda la comunicación HTTP → si cambia el backend, solo toca aquí.
- **Context** maneja estado global mínimo (auth) → evita complejidad innecesaria de NgRx/Redux.
- **Pages** contienen la lógica de presentación → cada módulo es independiente.

---

## 2. MAPA DE RUTAS COMPLETO

| Ruta | Componente | Acceso | Descripción |
|------|-----------|--------|-------------|
| `/login` | LoginPage | Público | Autenticación JWT |
| `/dashboard` | DashboardPage | Protegido | Resumen general + citas del día |
| `/patients` | PatientsPage | Protegido | CRUD pacientes |
| `/packages` | PackagesPage | Protegido | Gestión de paquetes de atención |
| `/appointments` | AppointmentsPage | Protegido | Agenda de citas con colisión |
| `/history` | HistoryPage | Protegido | Historia clínica/evoluciones |
| `/payments` | PaymentsPage | Protegido | Registro de pagos + resumen |
| `/professionals` | ProfessionalsPage | Protegido | Consulta de profesionales |
| `/cie10` | Cie10Page | Protegido | Catálogo CIE10 |
| `*` | Redirect | — | Redirige a /dashboard |

---

## 3. MODELOS TYPESCRIPT POR ENTIDAD

Ver `src/domain/models.ts`. Puntos clave:

- **BackendResponse<T>**: Wrapper genérico que normaliza la respuesta `{status, message, response}`.
- **DTOs separados**: `PatientCreateDTO` vs `Patient` (el DTO no tiene id, created_at, etc.).
- **Enums tipados**: `TipoDocumento`, `PackageType`, `PaymentMethod`, etc.
- **PaginatedResponse<T>**: Preparado para paginación server-side.
- **LoadingState**: `'idle' | 'loading' | 'success' | 'error'` para estados de UI.

---

## 4. CAPA API — INTERCEPTORES

### Auth Interceptor (Request)
```typescript
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Error Interceptor (Response)
```typescript
api.interceptors.response.use(
  (response) => {
    // Normalizar: HTTP 200 pero body.status >= 400 → error
    if (response.data?.status >= 400) {
      return Promise.reject({ isBackendError: true, ...response.data });
    }
    return response;
  },
  (error) => {
    // HTTP 400 con status interno 500 en body
    if (error.response?.data) {
      const body = error.response.data;
      // 401 → logout, 403 → logout
      if (error.response.status === 401 || body.status === 401) handleAuthError();
      if (error.response.status === 403 || body.status === 403) handleAuthError();
      return Promise.reject({ status: body.status || error.response.status, message: body.message });
    }
    // Network error
    return Promise.reject({ status: 0, message: 'Error de conexión' });
  }
);
```

---

## 5. GUARDS DE AUTENTICACIÓN

```typescript
// ProtectedRoute: verifica JWT válido y no expirado
export function ProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// PublicRoute: si ya está autenticado, redirige al dashboard
export function PublicRoute({ children }) {
  if (isAuthenticated()) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
```

### Estrategia de renovación/relogin:
- Token JWT ~2h de vigencia.
- `isAuthenticated()` decodifica el payload y verifica `exp`.
- Intervalo cada 30s: si quedan < 60s → fuerza logout.
- 401/403 del interceptor → logout inmediato + redirect a /login.
- **Supuesto**: No hay refresh token en el backend actual. Si se agrega, el interceptor de request puede interceptar 401 y llamar a `/auth/refresh`.

---

## 6. ESTADO GLOBAL — JUSTIFICACIÓN

### Decisión: React Context + useReducer

| Criterio | Context+Reducer | NgRx/Redux | Signals |
|----------|----------------|------------|---------|
| Complejidad | Baja | Alta | Media |
| Bundle size | 0 KB extra | ~20 KB | ~5 KB |
| Curva aprendizaje | Baja | Alta | Media |
| Para este MVP | ✅ Suficiente | ❌ Overkill | ⚠️ No nativo React |
| Escalabilidad | Media (hasta ~15 módulos) | Alta | Alta |

**Justificación**: El MVP tiene 8 módulos con estado principalmente local (formularios, listas). Solo auth necesita estado global. Context + useReducer es la opción más pragmática. Si el proyecto crece a 20+ módulos con estado compartido complejo, migrar a Zustand o Jotai sería el siguiente paso natural.

---

## 7. MATRIZ DE TRAZABILIDAD: Regla Backend → Validación Frontend

| # | Regla Backend | Campo UI | Validador Zod | Mensaje de Error |
|---|--------------|----------|---------------|-----------------|
| 1 | `tipo_doc` obligatorio | Select Tipo Doc | `z.enum(['CC','TI','CE','PA','NIT'])` | "Tipo de documento obligatorio" |
| 2 | `num_doc` min 4 chars | Input Documento | `.min(4)` | "Documento mínimo 4 caracteres" |
| 3 | `horario_inicio` obligatorio | Input Hora Inicio | `.refine(regex HH:MM)` | "Horario inválido (HH:MM)" |
| 4 | Cita requiere `id_profesional` o `id_paquete` | Select Profesional/Paquete | `.min(1)` en id_profesional | "Seleccione un profesional" |
| 5 | Paquete activo para sesión | Select Paquete | Validación en submit | "El paquete debe estar activo" |
| 6 | No exceder `cantidad_sesiones` | Select Paquete | Validación en submit | "Sesiones consumidas" |
| 7 | Colisión agenda profesional | Fecha+Hora | `checkCollision()` + local | "Conflicto de agenda" |
| 8 | Pago `valor > 0` | Input Valor | `.min(1)` | "El valor debe ser mayor a 0" |
| 9 | `metodo_pago` obligatorio | Select Método | `z.enum([...])` | "Método de pago obligatorio" |
| 10 | Coherencia tipo/id_paquete/id_cita | Tipo selector | `.refine()` cross-field | "Debe seleccionar paquete o cita coherente" |
| 11 | Bloquear sobrepago paquete | Input Valor | Validación vs `summary.saldo` | "El valor excede el saldo pendiente" |
| 12 | Una evolución por cita | Select Cita | Validación en submit | "Ya existe una evolución para esta cita" |
| 13 | CIE10 debe existir | Select CIE10 | `.min(1)` | "Seleccione un diagnóstico CIE10" |
| 14 | Evolución min 10 chars | Textarea Evolución | `.min(10)` | "Evolución mínimo 10 caracteres" |
| 15 | No duplicar paquete activo mismo tipo | Select Tipo+Paciente | Validación en submit | "Ya existe un paquete activo de este tipo" |
| 16 | `antecedentes` valor por defecto | Textarea | `.default('Sin antecedentes...')` | N/A (auto-fill) |

---

## 8. ESTRATEGIA DE MANEJO DE ERRORES

### Capas de manejo:
1. **Interceptor** → Normaliza errores inconsistentes (HTTP 400 + status 500).
2. **Servicio** → Propaga error normalizado al componente.
3. **Componente** → Toast de error + error inline en formulario.
4. **Auth** → 401/403 → logout automático + redirect.

### Mensajes al usuario:
- **react-hot-toast**: Notificaciones globales (éxito/error) en top-right.
- **Inline errors**: Debajo de cada campo del formulario (rojo, 12px).
- **Alert banners**: Para errores de colisión (amber) o auth (red).
- **Empty states**: Cuando no hay datos, con CTA para crear.

---

## 9. PERFORMANCE — BUENAS PRÁCTICAS

| Técnica | Implementación |
|---------|---------------|
| **Lazy loading** | Rutas con `React.lazy()` (preparado para implementar) |
| **useCallback** | En funciones de carga de datos para evitar re-renders |
| **Memoización** | Filtros de búsqueda con `useMemo` (preparado) |
| **Skeletons** | `TableSkeleton` y `Skeleton` durante carga |
| **Debounced search** | Preparado para implementar en búsquedas |
| **TrackBy (key)** | Keys estables por `id` en listas |
| **Virtual scroll** | Preparado para listas > 100 items (react-window) |

---

## 10. ACCESIBILIDAD (WCAG 2.1 AA)

| Elemento | Implementación |
|----------|---------------|
| **Labels** | Todo input tiene `<label htmlFor>` asociado |
| **ARIA** | `aria-invalid`, `aria-describedby`, `aria-label`, `aria-modal`, `aria-current` |
| **Roles** | `role="dialog"`, `role="alert"`, `role="table"`, `role="navigation"` |
| **Focus** | `autoFocus` en login, focus trap en modales (preparado) |
| **Contraste** | Teal-600 sobre blanco = 4.5:1 ✅, texto gray-500 = 4.6:1 ✅ |
| **Keyboard** | Todos los botones son `<button>`, forms con `onSubmit` |
| **Screen reader** | Mensajes de error con `role="alert"` |

---

## 11. SEGURIDAD FRONTEND

| Aspecto | Implementación |
|---------|---------------|
| **Token storage** | Memoria (`_authToken`) + sessionStorage fallback. NO localStorage. |
| **XSS** | React escapa automáticamente. No se usa `dangerouslySetInnerHTML`. |
| **CSRF** | API usa JWT en header (no cookies) → CSRF no aplica. Si se migra a cookies httpOnly, agregar `XSRF-TOKEN`. |
| **Token expiry** | Verificación client-side del `exp` claim. Auto-logout a 60s de expirar. |
| **Input sanitization** | Zod valida y tipa todos los inputs antes de enviar. |
| **CSP** | Preparado para configurar en servidor. |

---

## 12. RIESGOS TÉCNICOS Y MITIGACIONES

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|-------------|------------|
| Respuestas inconsistentes (HTTP 400 + status 500) | Alto | Alta | Interceptor de normalización + fallback a mensaje genérico |
| Token expira durante operación | Medio | Media | Auto-logout + redirect a login + toast informativo |
| Colisión de citas no detectada | Alto | Baja | Doble validación: endpoint + verificación local |
| Sin refresh token | Medio | Alta | Sesión expira en ~2h → usuario debe reloguearse. **Pregunta abierta**: ¿Backend soporta refresh token? |
| API no disponible | Alto | Baja | Skeletons + toast de error de red + retry manual |
| Datos de backend incompletos | Medio | Media | Valores por defecto en DTOs + optional chaining |
| Zod v4 breaking changes | Bajo | Baja | Schemas aislados en `domain/schemas.ts` → fácil migración |

---

## 13. PLAN DE IMPLEMENTACIÓN POR FASES

### MVP (Fase 1) — 40 puntos ✅ IMPLEMENTADO
- [x] Login JWT + AuthGuard (5 pts)
- [x] CRUD Pacientes con validaciones (8 pts)
- [x] CRUD Paquetes + duplicados + cierre (6 pts)
- [x] Citas + colisión + sesiones (8 pts)
- [x] Historia clínica + evoluciones (5 pts)
- [x] Pagos + resumen + sobrepago (8 pts)

### Fase 2 — 25 puntos
- [ ] Profesionales CRUD completo (actualmente solo lectura) (5 pts)
- [ ] CIE10 CRUD completo (actualmente parcial) (3 pts)
- [ ] Reportes y estadísticas (8 pts)
- [ ] Exportación PDF de historia clínica (5 pts)
- [ ] Notificaciones de citas próximas (4 pts)

### Fase 3 — 30 puntos
- [ ] Multi-sede (8 pts)
- [ ] Calendario visual de agenda (drag & drop) (10 pts)
- [ ] Dashboard avanzado con gráficos (6 pts)
- [ ] Feature flags por módulo (3 pts)
- [ ] Observabilidad (logs, métricas UX) (3 pts)

---

## 14. DEFINITION OF DONE POR MÓDULO

| Criterio | Auth | Pacientes | Paquetes | Citas | Historia | Pagos |
|----------|------|-----------|----------|-------|----------|-------|
| Formulario con validación Zod | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CRUD completo | Login | ✅ | ✅ | ✅ | Parcial | Parcial |
| Manejo de errores (toast) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Loading states (skeletons) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Empty states | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reglas de negocio validadas | JWT | tipo_doc | duplicados | colisión | 1/cita | sobrepago |
| Accesibilidad (labels, ARIA) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Responsive | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 15. PREGUNTAS ABIERTAS / SUPUESTOS

1. **Endpoint exacto de login**: Se asume `POST /auth/login` retorna `{token, user}`. ¿Confirma estructura?
2. **Refresh token**: ¿Existe endpoint de refresh? Si no, la sesión expira en ~2h sin renovación.
3. **Paginación**: ¿Los endpoints soportan `?page=&limit=`? Implementado pero puede requerir ajuste.
4. **Cierre automático de paquetes**: ¿Hay job backend que cierre por sesiones? Frontend muestra progreso.
5. **Valor de paquete**: ¿Dónde se define el precio del paquete? No está en el modelo actual.
6. **Multi-sede**: ¿Se requiere desde el inicio? Arquitectura preparada pero no implementada.
7. **CIE10 completo**: ¿El backend tiene todo el catálogo o se carga manualmente?
8. **Roles**: ¿Hay permisos diferenciados por rol? Auth guarda `rol` pero no hay RBAC implementado.
