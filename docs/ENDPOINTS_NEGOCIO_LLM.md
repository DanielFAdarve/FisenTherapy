# Documentación integral del backend FisenT (para consumo por LLM)

> Proyecto: Backend para gestión de consultorio de fisiatría/fisioterapia.
> 
> Esta guía describe **endpoints**, **reglas de negocio**, **modelos de datos**, **formatos de respuesta** y **consideraciones de autenticación**.

## 1) Contexto funcional del sistema

Este backend cubre:

- Gestión de pacientes.
- Gestión de paquetes de atención (planes de sesiones).
- Gestión de citas por paquete/profesional.
- Registro y consulta de historia clínica/evoluciones.
- Catálogo y búsqueda de diagnósticos CIE10.
- Registro de pagos (por paquete o por cita).
- Login con JWT.
- Gestión de profesionales (consulta).

## 2) Base URL y seguridad

- Swagger: `GET /api-docs`
- Login público: `POST /auth/login`
- Rutas de negocio protegidas por JWT (middleware global `verifyToken`):
  - `/patient/*`
  - `/packages/*`
  - `/quotes/*`
  - `/history/*`
  - `/payments/*`
  - `/professionals/*`
  - `/cie10/*`

### 2.1 Header de autenticación

```http
Authorization: Bearer <token>
```

Errores estándar del middleware JWT:

- `401` `{ "message": "Token no proporcionado" }`
- `403` `{ "message": "Token inválido" }`

## 3) Contrato de respuesta global

La mayoría de controladores (excepto login y archivos binarios) responden con esta estructura:

```json
{
  "status": 200,
  "message": "Texto",
  "response": {}
}
```

> Observación importante: en algunos errores se envía `HTTP 400` con `status` interno `500` dentro del body, por cómo están implementados varios `catch`.

## 4) Modelo de dominio y entidades principales

## 4.1 Patient (pacientes)

Campos clave:

- `id` (int)
- `tipo_doc` (string, obligatorio)
- `num_doc` (string, obligatorio)
- `nombre` (string, obligatorio)
- `apellido` (string, obligatorio)
- `fecha_nacimiento` (date, obligatorio)
- `id_cie` (int, opcional, diagnóstico principal)
- `antecedentes` (string, obligatorio en BD)
- `estado` (boolean, usado para borrado lógico)
- + datos clínicos/demográficos (`genero`, `zona`, `eps`, `regimen`, antecedentes específicos, etc.)

Reglas:

- `tipo_doc` obligatorio.
- Si viene `id_cie`, debe existir en catálogo CIE10.
- Si no viene `antecedentes`, se autocompleta desde `antecedentes_personales` o con `"Sin antecedentes reportados"`.
- Borrado lógico: `delete` marca `estado=false`.

## 4.2 AttentionPackages (atencion_paquetes)

Catálogo/configuración de paquete:

- `id`
- `descripcion`
- `cantidad_sesiones`
- `valor`

## 4.3 Packages (paquetes)

Representa un paquete asignado a paciente.

Campos clave:

- `id_pacientes` (obligatorio)
- `id_paquetes_atenciones` (obligatorio)
- `id_profesional` (opcional)
- `id_cie_secundario` (opcional, motivo secundario)
- `id_estado_citas` (estado del paquete: activo/cerrado)

Reglas:

- No permite duplicar **paquete activo** del mismo tipo para un mismo paciente (`id_estado_citas = 1`).
- Si se envía `id_profesional`, debe existir.
- Si se envía `id_cie_secundario`, debe existir.
- Cierre manual: estado a `3`.
- Cierre automático disponible por servicio (`checkAndClosePackage`) cuando sesiones usadas `>= cantidad_sesiones`.

## 4.4 Quotes (citas)

Campos clave:

- `fecha_agendamiento` (date)
- `horario_inicio` (time, obligatorio)
- `horario_fin` (time, recomendado para validación de colisiones)
- `pagado` (boolean)
- `numero_sesion` (int)
- `id_estado_citas` (int)
- `motivo` (string)
- `id_profesional` (int)
- `id_paquetes` (int)

Reglas:

- Requiere `horario_inicio`.
- Requiere `id_profesional` o `id_paquetes`.
- Si trae `id_paquetes`:
  - el paquete debe existir,
  - el paquete debe estar activo (`id_estado_citas===1`),
  - hereda profesional del paquete si no se envía en la cita,
  - calcula `numero_sesion = citas_existentes_del_paquete + 1`,
  - no permite exceder `cantidad_sesiones` configurada.
- Valida colisión de agenda por profesional y fecha cuando hay `horario_fin` en ambas citas.

## 4.5 HistoryQuote (historia_cita)

Evolución clínica asociada a una cita.

Campos clave:

- `id_cita` (obligatorio)
- `id_cie` (obligatorio)
- `fecha_evolucion` (si no se envía, se autocompleta con fecha actual)
- `subjetivo`, `objetivo`, `intervencion`
- `descripcion_estado_paciente`
- `recomendaciones`

Reglas:

- Deben existir cita y CIE10.
- Solo una evolución por cita (en `create` valida unicidad por `id_cita`).
- Al crear/actualizar, si vienen antecedentes clínicos en el payload, se sincronizan al paciente dueño de la cita.

## 4.6 Payment (pagos)

Campos clave:

- `id_paquete` (nullable)
- `id_cita` (nullable)
- `valor` (obligatorio, > 0)
- `metodo_pago` (obligatorio)
- `fecha_pago` (default NOW)
- `observacion`
- `tipo` (`"paquete"` o `"cita"`)

Reglas:

- Si no llega `tipo`, se infiere: `cita` si existe `id_cita`, en otro caso `paquete`.
- Coherencia estricta:
  - pago de paquete requiere `id_paquete` y no `id_cita`,
  - pago de cita requiere `id_cita` y no `id_paquete`.
- En pagos de paquete, bloquea sobrepago si supera saldo pendiente.
- Pago de cita marca la cita como `pagado=true`.
- Permite consultar resumen de pagos por paquete (`total_paquete`, `abonado`, `saldo`, `estado_pago`).

## 4.7 Professional, Cie10, User

- `Professional`: actualmente expone listado.
- `Cie10`: CRUD parcial (crear y consultar).
- `User`: usado en login con contraseña hasheada (`bcrypt`) y rol.

## 5) Endpoints detallados

## 5.1 Autenticación

### POST `/auth/login`

Descripción: autentica usuario y retorna JWT de 2 horas.

Request body:

```json
{
  "username": "admin",
  "password": "123456"
}
```

Respuestas:

- `200`

```json
{
  "token": "<jwt>"
}
```

- `400` faltan credenciales.
- `401` usuario no existe o contraseña incorrecta.
- `500` error interno.

## 5.2 Pacientes (`/patient`)

### GET `/patient/get-patients`

Retorna pacientes con `estado=true` e incluye diagnóstico principal (`diagnosis`).

- `200`

Query params opcionales:

- `search`: busca por `nombre`, `apellido` o `num_doc`.
- `page`: página solicitada; por defecto `1`.
- `limit`: cantidad de registros por página; por defecto `20`.

```json
{
  "status": 200,
  "message": "Listado de Pacientes",
  "response": [
    {
      "id": 1,
      "tipo_doc": "CC",
      "num_doc": "123456",
      "nombre": "Ana",
      "apellido": "Pérez",
      "id_cie": 10,
      "estado": true,
      "diagnosis": {
        "id": 10,
        "codigo": "M54.5",
        "descripcion": "Lumbalgia"
      }
    }
  ],
  "pagination": {
    "total": 57,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### GET `/patient/get-patient/:id`

Retorna paciente por PK.

### GET `/patient/get-patient-by-doc/:id`

Retorna paciente por `num_doc`.

### POST `/patient/create-patient`

Crea paciente.

Body recomendado (ejemplo):

```json
{
  "tipo_doc": "CC",
  "num_doc": "10101010",
  "nombre": "María",
  "apellido": "Gómez",
  "fecha_nacimiento": "1992-02-12",
  "telefono": "3001112233",
  "id_cie": 10,
  "antecedentes_personales": "Ninguno"
}
```

Reglas de negocio específicas:

- valida `tipo_doc`.
- valida existencia de CIE10 principal si se envía.
- autocompleta `antecedentes`.

### PUT `/patient/update-patient/:id`

Actualiza paciente; valida CIE10 si se envía `id_cie`.

### DELETE `/patient/delete-patient/:id`

Borrado lógico (`estado=false`).

## 5.3 Paquetes (`/packages`)

### GET `/packages/get-packages`

Devuelve catálogo de tipos de paquete (`atencion_paquetes`), no los paquetes asignados.

### POST `/packages/create`

Crea paquete para paciente.

Body ejemplo:

```json
{
  "id_pacientes": 1,
  "id_paquetes_atenciones": 2,
  "id_profesional": 3,
  "id_cie_secundario": 15,
  "id_estado_citas": 1
}
```

Reglas:

- evita paquete activo duplicado (mismo paciente + mismo tipo + estado activo).
- valida profesional/CIE10 secundario si vienen.

### GET `/packages/get-by-patient/:id`

Lista paquetes de un paciente, incluyendo:

- `attentionPackage`
- `statusPackage`
- `professional`
- `secondaryDiagnosis`
- `Quotes` (resumen de sesiones)

### GET `/packages/get/:id`

Detalle de paquete con relaciones amplias (paciente, tipo, estado, profesional, CIE10 secundario, citas).

### PUT `/packages/close/:id`

Cierra paquete (`id_estado_citas = 3`).

## 5.4 Citas (`/quotes`)

### GET `/quotes/all`

Lista todas las citas.

### GET `/quotes/all-attention-packages`

Lista catálogo de configuraciones de paquetes (`atencion_paquetes`).

### POST `/quotes/create`

Crea cita.

Body ejemplo:

```json
{
  "fecha_agendamiento": "2026-04-22",
  "horario_inicio": "09:00",
  "horario_fin": "09:45",
  "recordatorio": false,
  "id_estado_citas": 1,
  "motivo": "Control post-operatorio",
  "id_paquetes": 5
}
```

Reglas importantes:

- exige `horario_inicio`.
- exige profesional o paquete.
- valida capacidad del paquete y calcula `numero_sesion` automáticamente.
- valida colisiones por agenda del profesional.

### GET `/quotes/get-by-package/:id`

Lista citas de un paquete.

### GET `/quotes/availability/:id?date=YYYY-MM-DD`

Disponibilidad real (retorna citas ocupadas) por profesional y fecha.

Parámetro:

- `:id` = `id_profesional`
- query `date` obligatoria

### DELETE `/quotes/:id`

Elimina cita físicamente.

## 5.5 Historias clínicas (`/history`)

### POST `/history/create`

Crea evolución para una cita.

Body ejemplo:

```json
{
  "id_cita": 20,
  "id_cie": 10,
  "fecha_evolucion": "2026-04-19",
  "subjetivo": "Dolor disminuyó",
  "objetivo": "Mejor rango articular",
  "intervencion": "Terapia manual",
  "descripcion_estado_paciente": "Estable",
  "recomendaciones": "Continuar ejercicios en casa",
  "antecedentes_patologicos": "HTA"
}
```

Reglas:

- solo una evolución por cita.
- valida cita y CIE10.
- sincroniza antecedentes al paciente asociado.

### PUT `/history/update/:id`

Actualiza evolución existente; revalida consistencia de cita y CIE.

### GET `/history/get-by-quote/:id`

Lista historias por `id_cita`.

### GET `/history/export-pdf/:id`

Exporta **DOCX** (aunque la ruta diga pdf) con `Content-Disposition: attachment; filename=historia.docx`.

- Respuesta binaria `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.

## 5.6 Pagos (`/payments`)

### GET `/payments/`

Lista todos los pagos.

### GET `/payments/:id`

Obtiene un pago por ID.

### GET `/payments/package-summary/:id`

Resumen de pagos de un paquete:

```json
{
  "status": 200,
  "message": "Resumen de pagos del paquete",
  "response": {
    "id_paquete": 5,
    "total_paquete": 280000,
    "total_abonado": 120000,
    "saldo_pendiente": 160000,
    "estado_pago": "abonado",
    "cantidad_abonos": 2
  }
}
```

`estado_pago` posibles:

- `pendiente`
- `abonado`
- `pagado`

### GET `/payments/package-all-summary/:id`

Igual al resumen anterior, pero agrega `pagos: []`.

### POST `/payments/`

Registra pago.

Ejemplo pago de paquete:

```json
{
  "id_paquete": 5,
  "valor": 50000,
  "metodo_pago": "efectivo",
  "observacion": "abono inicial"
}
```

Ejemplo pago de cita:

```json
{
  "id_cita": 44,
  "tipo": "cita",
  "valor": 60000,
  "metodo_pago": "transferencia"
}
```

Reglas:

- `valor > 0`.
- `metodo_pago` obligatorio.
- coherencia de IDs según tipo.
- en pago de paquete, no permite sobrepasar saldo.
- en pago de cita, marca cita como pagada.

Respuesta típica:

```json
{
  "status": 200,
  "message": "Pago registrado",
  "response": {
    "payment": {
      "id": 1,
      "id_paquete": 5,
      "id_cita": null,
      "valor": 50000,
      "metodo_pago": "efectivo",
      "tipo": "paquete"
    },
    "package_summary": {
      "id_paquete": 5,
      "total_paquete": 280000,
      "total_abonado": 50000,
      "saldo_pendiente": 230000,
      "estado_pago": "abonado",
      "cantidad_abonos": 1
    }
  }
}
```

### PUT `/payments/:id`

Actualiza pago (sin validación de negocio adicional en servicio más allá de update plano).

### DELETE `/payments/:id`

Elimina pago físicamente.

## 5.7 Profesionales (`/professionals`)

### GET `/professionals/get-all`

Lista todos los profesionales.

## 5.8 CIE10 (`/cie10`)

### POST `/cie10/create`

Crea código CIE10.

Body:

```json
{
  "codigo": "M54.5",
  "descripcion": "Lumbalgia"
}
```

Reglas:

- `codigo` y `descripcion` obligatorios.
- `codigo` se normaliza a mayúscula.
- no permite duplicados por código.

### GET `/cie10/all?q=...&codigo=...`

Consulta CIE10 con filtros:

- `codigo` exacto (normalizado)
- `q` búsqueda parcial en código o descripción

### GET `/cie10/:id`

Obtiene por ID.

### GET `/cie10/code/:code`

Obtiene por código.

## 6) Reglas transversales y consideraciones para un LLM

1. **Autorización**: salvo login y swagger, todo exige JWT Bearer.
2. **Respuesta envolvente**: casi todos endpoints devuelven `status/message/response`.
3. **Errores inconsistentes**: hay casos con HTTP `400` y `status` interno `500`; conviene que el consumidor lea ambos.
4. **Soft delete en pacientes**: no elimina físicamente.
5. **Integridad clínica**:
   - historia exige cita + CIE10 válidos,
   - una historia por cita,
   - antecedentes se propagan al paciente.
6. **Integridad operativa de paquetes/citas**:
   - paquete activo único por tipo/paciente,
   - citas no pueden exceder sesiones,
   - validación de colisión horaria por profesional.
7. **Pagos robustos**:
   - evita sobrepago en paquete,
   - clasifica estado de cuenta (`pendiente/abonado/pagado`),
   - pago de cita cambia bandera `pagado`.
8. **Export de historia**:
   - endpoint nombrado `export-pdf` pero entrega DOCX.

## 7) Mapa rápido de endpoints

- `POST /auth/login`
- `GET /patient/get-patients`
- `GET /patient/get-patient/:id`
- `GET /patient/get-patient-by-doc/:id`
- `POST /patient/create-patient`
- `PUT /patient/update-patient/:id`
- `DELETE /patient/delete-patient/:id`
- `GET /packages/get-packages`
- `POST /packages/create`
- `GET /packages/get-by-patient/:id`
- `GET /packages/get/:id`
- `PUT /packages/close/:id`
- `GET /quotes/all`
- `GET /quotes/all-attention-packages`
- `POST /quotes/create`
- `GET /quotes/get-by-package/:id`
- `GET /quotes/availability/:id?date=YYYY-MM-DD`
- `DELETE /quotes/:id`
- `POST /history/create`
- `PUT /history/update/:id`
- `GET /history/get-by-quote/:id`
- `GET /history/export-pdf/:id`
- `GET /payments/`
- `GET /payments/:id`
- `GET /payments/package-summary/:id`
- `GET /payments/package-all-summary/:id`
- `POST /payments/`
- `PUT /payments/:id`
- `DELETE /payments/:id`
- `GET /professionals/get-all`
- `POST /cie10/create`
- `GET /cie10/all`
- `GET /cie10/:id`
- `GET /cie10/code/:code`

## 8) Sugerencia para alimentar un LLM

Para mejor performance de RAG/LLM:

- Indexar este archivo por secciones (dominio, endpoints, reglas, ejemplos JSON).
- Añadir snapshots reales de respuestas por entorno (dev/staging) como anexos.
- Versionar este documento junto al código para mantener trazabilidad.

