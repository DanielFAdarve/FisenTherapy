# Flujo frontend: paquetes, citas e historia clínica

## Convenciones generales

Base de rutas:

- Paquetes: `/packages`
- Citas: `/quotes`
- Historias clínicas: `/history`

Todas las respuestas JSON usan el envelope:

```json
{
  "status": 200,
  "message": "Mensaje",
  "response": {},
  "pagination": {}
}
```

`pagination` solo aparece en endpoints paginados.

---

## 1. Catálogo de tipos de paquete

### `GET /packages/get-packages?page=1&limit=20&search=terapia`

Usar para pintar el catálogo de paquetes/planes disponibles.

Respuesta (`response[]`):

```json
[
  {
    "id": 2,
    "descripcion": "Paquete fisioterapia 10 sesiones",
    "cantidad_sesiones": 10,
    "valor": 500000
  }
]
```

---

## 2. Crear suscripción/paquete asignado al paciente

### `POST /packages/create`

Body recomendado:

```json
{
  "id_pacientes": 1,
  "id_paquetes_atenciones": 2,
  "id_profesional": 3,
  "id_cie_secundario": 15,
  "id_estado_citas": 1
}
```

Respuesta clave (`response`):

```json
{
  "id": 30,
  "id_pacientes": 1,
  "id_paquetes_atenciones": 2,
  "id_profesional": 3,
  "id_cie_secundario": 15,
  "id_estado_citas": 1,
  "patient": {
    "id": 1,
    "nombre": "Ana",
    "apellido": "Pérez",
    "num_doc": "123"
  },
  "attentionPackage": {
    "id": 2,
    "descripcion": "Paquete fisioterapia 10 sesiones",
    "cantidad_sesiones": 10,
    "valor": 500000
  },
  "resumen_sesiones": {
    "sesiones_totales": 10,
    "sesiones_usadas": 0,
    "sesiones_disponibles": 10,
    "completo": false
  }
}
```

Consideraciones frontend:

1. Después de crear, guardar `response.id` como `id_paquete`.
2. El objeto ya viene hidratado para refrescar una tabla de paquetes asignados.
3. Si el backend responde error de duplicidad, ofrecer continuar con el paquete activo existente en vez de crear otro.

---

## 3. Consultar paquetes asignados

### `GET /packages/get-assigned?page=1&limit=20&id_paciente=1&id_estado_citas=1`

Usar para grillas administrativas.

### `GET /packages/get-by-patient/:idPaciente`

Usar para detalle del paciente.

Cada paquete incluye:

- `patient`
- `attentionPackage`
- `statusPackage`
- `professional`
- `secondaryDiagnosis`
- `Quotes[]`
- `resumen_sesiones`

---

## 4. Selector de paquetes disponibles para agendar

### Crear cita

`GET /packages/get-available-by-patient/:idPaciente`

### Editar cita

`GET /packages/get-available-by-patient/:idPaciente?quoteId=:idCita`

Respuesta (`response[]`):

```json
[
  {
    "id_paquete": 30,
    "sesiones_disponibles": 3,
    "sesiones_totales": 10,
    "sesiones_usadas": 7,
    "tipo_paquete": "Paquete fisioterapia 10 sesiones",
    "id_tipo_paquete": 2,
    "id_profesional": 3,
    "profesional": "Laura Gómez",
    "id_cie_secundario": 15,
    "motivo_secundario": "M54 - Dorsalgia",
    "tiene_cita_actual": false
  }
]
```

Consideraciones frontend:

- En edición siempre enviar `quoteId` para que no se descuente dos veces la cita actual.
- Si `tiene_cita_actual = true`, mostrarlo aunque `sesiones_disponibles` sea `0`, porque es el paquete ya seleccionado.
- Si viene `id_profesional`, precargar profesional de la cita.

---

## 5. Agendar cita

### `POST /quotes/create`

Body recomendado:

```json
{
  "fecha_agendamiento": "2026-05-20",
  "horario_inicio": "09:00",
  "horario_fin": "09:45",
  "recordatorio": false,
  "id_estado_citas": 1,
  "motivo": "Control de evolución",
  "id_paquetes": 30
}
```

Respuesta (`response`):

```json
{
  "cita": {
    "id": 101,
    "fecha_agendamiento": "2026-05-20",
    "horario_inicio": "09:00:00",
    "horario_fin": "09:45:00",
    "numero_sesion": 8,
    "id_profesional": 3,
    "id_paquetes": 30,
    "package": {},
    "professional": {},
    "status": {},
    "HistoryQuotes": [],
    "agendamiento": {
      "id_cita": 101,
      "id_paquete": 30,
      "id_paciente": 1,
      "id_profesional": 3,
      "fecha": "2026-05-20",
      "hora_inicio": "09:00:00",
      "hora_fin": "09:45:00",
      "numero_sesion": 8,
      "sesiones_totales_paquete": 10,
      "sesiones_usadas_paquete": 8,
      "sesiones_disponibles_paquete": 2,
      "paquete_completo": false,
      "tiene_historia": false,
      "id_historial": null
    }
  },
  "agendamiento": {},
  "paquete": {
    "id_paquete": 30,
    "id_estado_citas": 1,
    "sesiones_totales": 10,
    "sesiones_usadas": 8,
    "sesiones_disponibles": 2,
    "completo": false
  }
}
```

Orden recomendado en frontend:

1. Seleccionar paciente.
2. Consultar paquetes disponibles.
3. Seleccionar paquete.
4. Precargar profesional si el paquete lo tiene.
5. Consultar disponibilidad del profesional y día.
6. Enviar `POST /quotes/create`.
7. Refrescar agenda con la respuesta o con `GET /quotes/all`.

---

## 6. Validar disponibilidad del profesional

### `GET /quotes/availability/:idProfesional?date=YYYY-MM-DD`

Devuelve citas ocupadas del profesional en la fecha.

Usar esta respuesta para bloquear franjas horarias en el calendario. La validación real se repite en backend al crear/actualizar, por lo que el frontend debe manejar error de colisión.

---

## 7. Listar agenda

### `GET /quotes/all?page=1&limit=20&fecha=2026-05-20&id_profesional=3`

Filtros soportados:

- `page`
- `limit`
- `search`
- `fecha`
- `fechaInicio` + `fechaFin`
- `id_profesional`
- `id_paciente`

Respuesta (`response[]`) está aplanada para grillas:

```json
[
  {
    "id": 101,
    "fecha": "2026-05-20",
    "hora_inicio": "09:00:00",
    "hora_fin": "09:45:00",
    "numero_sesion": 8,
    "pagado": false,
    "motivo": "Control de evolución",
    "id_profesional": 3,
    "id_paquetes": 30,
    "id_estado_citas": 1,
    "paciente": "Ana Pérez",
    "id_paciente": 1,
    "num_doc_paciente": "123",
    "profesional": "Laura",
    "apellido_profesional": "Gómez",
    "estado": "Agendada",
    "tipo_paquete": "Paquete fisioterapia 10 sesiones",
    "sesiones_totales_paquete": 10,
    "tiene_historia": false,
    "id_historial": null
  }
]
```

---

## 8. Actualizar cita sin romper paquete

### `PUT /quotes/update/:idCita`

Alias compatible: `PUT /quotes/:idCita`.

Body parcial permitido:

```json
{
  "fecha_agendamiento": "2026-05-21",
  "horario_inicio": "10:00",
  "horario_fin": "10:45",
  "id_paquetes": 31,
  "motivo": "Reprogramación"
}
```

Consideraciones:

- Si se edita la misma cita dentro del mismo paquete completo, el backend no la rechaza por capacidad.
- Si se mueve a otro paquete, el backend valida cupo del destino y recalcula cupos del origen y destino.
- Si se cambia horario, se valida colisión excluyendo la cita actual.

---

## 9. Precargar historia clínica por cita

### `GET /history/get-by-quote/:idCita`

Usar al abrir la pantalla de evolución clínica. Retorna datos de cita, paquete, profesional, paciente, antecedentes y la historia si ya existe.

Respuesta clave (`response`):

```json
{
  "id_cita": 101,
  "fecha": "2026-05-20",
  "hora_inicio": "09:00:00",
  "hora_fin": "09:45:00",
  "numero_sesion": 8,
  "motivo": "Control de evolución",
  "id_historial": null,
  "cie10_historia": null,
  "id_paquete": 30,
  "id_tipo_paquete": 2,
  "tipo_paquete": "Paquete fisioterapia 10 sesiones",
  "sesiones_totales_paquete": 10,
  "id_profesional": 3,
  "profesional": "Laura Gómez",
  "tipo_doc": "CC",
  "num_doc": "123",
  "nombre": "Ana",
  "apellido": "Pérez",
  "antecedentes_patologicos": "HTA",
  "cie10_paciente": {
    "id": 4,
    "codigo": "M54",
    "descripcion": "Dorsalgia"
  }
}
```

Regla frontend:

- Si `id_historial` es `null`, usar `POST /history/create`.
- Si `id_historial` tiene valor, usar `PUT /history/update/:idHistorial`.

---

## 10. Crear historia/evolución

### `POST /history/create`

Body recomendado:

```json
{
  "id_cita": 101,
  "id_cie": 4,
  "fecha_evolucion": "2026-05-20",
  "subjetivo": "Dolor disminuyó",
  "objetivo": "Mejor rango articular",
  "intervencion": "Terapia manual",
  "descripcion_estado_paciente": "Estable",
  "recomendaciones": "Continuar ejercicios en casa",
  "antecedentes_patologicos": "HTA"
}
```

Consideraciones:

- Solo se permite una historia por cita.
- Si se envían antecedentes, se sincronizan al paciente.
- La cita debe tener paquete y paciente asociado.

---

## 11. Actualizar historia/evolución

### `PUT /history/update/:idHistorial`

Body parcial permitido:

```json
{
  "objetivo": "Aumentó movilidad",
  "recomendaciones": "Ejercicios 2 veces al día"
}
```

Si se cambia `id_cita`, el backend valida que la cita destino no tenga ya otra evolución.

---

## 12. Resúmenes útiles

### `GET /history/get-summary-by-history-number/:idHistorial`

Resumen desde historia.

### `GET /history/get-summary-by-quote-number/:idCita`

Resumen desde cita. Útil después de agendar para mostrar paciente, paquete, sesión y últimos pagos.

---

## 13. Orden de integración recomendado

### Flujo nuevo paciente/paquete/cita/historia

1. Crear o seleccionar paciente.
2. `GET /packages/get-packages` para seleccionar tipo.
3. `POST /packages/create` para asignar paquete.
4. `GET /packages/get-available-by-patient/:idPaciente` para confirmar cupo.
5. `GET /quotes/availability/:idProfesional?date=YYYY-MM-DD` para pintar horarios ocupados.
6. `POST /quotes/create` para agendar.
7. `GET /history/get-by-quote/:idCita` para abrir evolución.
8. `POST /history/create` para registrar historia.

### Flujo edición de cita

1. `GET /history/get-by-quote/:idCita` o `GET /quotes/all` para cargar la cita.
2. `GET /packages/get-available-by-patient/:idPaciente?quoteId=:idCita`.
3. `GET /quotes/availability/:idProfesional?date=YYYY-MM-DD`.
4. `PUT /quotes/update/:idCita`.
5. Refrescar UI usando `response.agendamiento` y `response.paquete`.
