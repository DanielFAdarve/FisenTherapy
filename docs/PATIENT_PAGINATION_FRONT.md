# Paginación para `GET /patient/get-patients`

No es necesario agregar un endpoint nuevo. El endpoint existente `GET /patient/get-patients` ya recibe los parámetros que envía el front:

```ts
patientService.getAll(search?: string, page = 1, limit = 20)
```

## Endpoint a usar

```http
GET /patient/get-patients?page=1&limit=20&search=ana
```

- `page`: número de página. Si no llega o llega inválido, el backend usa `1`.
- `limit`: cantidad de pacientes por página. Si no llega o llega inválido, el backend usa `20`.
- `search`: opcional. Busca coincidencias en `nombre`, `apellido` o `num_doc`.

## Respuesta del backend

El arreglo de pacientes queda en `response`, por compatibilidad con el tipado actual del front (`BackendResponse<Patient[]>`). La metadata de paginación queda en una propiedad hermana llamada `pagination`.

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
      "estado": true
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

## Ajuste recomendado en el front

Si el front solo necesita el listado, puede seguir usando:

```ts
return res.data.response;
```

Si también necesita pintar controles de paginación, conviene ampliar el modelo genérico para aceptar `pagination` como opcional:

```ts
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BackendResponse<T> {
  status: number;
  message: string;
  response: T;
  pagination?: Pagination;
}
```

Y en el servicio puedes devolver ambos valores si la pantalla lo requiere:

```ts
const res = await api.get<BackendResponse<Patient[]>>(`/patient/get-patients?${params}`);
return {
  patients: res.data.response,
  pagination: res.data.pagination,
};
```

## Remapeo aplicado

Antes el backend retornaba la paginación dentro de `response` como un objeto con forma `{ data, total, page, limit, totalPages }`. Eso rompía el contrato `BackendResponse<Patient[]>`, porque `response` dejaba de ser un arreglo.

Ahora el backend remapea internamente el resultado a:

- `response`: `Patient[]`
- `pagination`: metadata de paginación

Así el endpoint existente cubre búsqueda y paginación sin crear rutas adicionales.
