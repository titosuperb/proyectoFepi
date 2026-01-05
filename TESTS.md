# Pruebas del Microservicio SRV3.5

## Requisitos

1. Servidor corriendo: `npm run dev`
2. Abrir: http://localhost:3000/finanzas
3. Abrir DevTools (F12) en el navegador -> Console

---

## PRUEBA 1: POST - Generar linea de captura

```
fetch('/api/finanzas/linea-captura', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SSC_TOKEN_2026'
  },
  body: JSON.stringify({
    placa: 'ABC-123-A',
    motivosIds: ['ART-09', 'ART-38'],
    idOficial: 'OF-4429',
    folioInfraccion: 'INF-2026-000001'
  })
}).then(r => r.json()).then(console.log)
````

**Resultado esperado:** `success: true`, linea de 15 digitos

---

## PRUEBA 2: GET - Consultar todas las lineas

```javascript
fetch('/api/finanzas/linea-captura', {
  headers: { 'Authorization': 'Bearer SSC_TOKEN_2026' }
}).then(r => r.json()).then(console.log)
```

**Resultado esperado:** Array con las lineas generadas

---

## PRUEBA 3: GET - Consultar por placa

```
fetch('/api/finanzas/linea-captura?placa=ABC-123-A', {
  headers: { 'Authorization': 'Bearer SSC_TOKEN_2026' }
}).then(r => r.json()).then(console.log)
```

**Resultado esperado:** Lineas filtradas por esa placa

---

## PRUEBA 4: GET - Consultar linea especifica

```
fetch('/api/finanzas/linea-captura?linea=LINEA_A_CONSULTAR', {
  headers: { 'Authorization': 'Bearer SSC_TOKEN_2026' }
}).then(r => r.json()).then(console.log)
```

**Resultado esperado:** Datos de esa linea especifica

---

## PRUEBA 5: PATCH - Marcar como pagada

```
fetch('/api/finanzas/linea-captura', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SSC_TOKEN_2026'
  },
  body: JSON.stringify({
    linea_captura: ' LINEA_A_MODIFICAR ',
    estatus: 'PAGADA'
  })
}).then(r => r.json()).then(console.log)
```

**Resultado esperado:** `message: "Linea ... actualizada a PAGADA"`

---

## PRUEBA 6: Error 400 - Placa invalida

```
fetch('/api/finanzas/linea-captura', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SSC_TOKEN_2026'
  },
  body: JSON.stringify({
    placa: 'IOQ-123-A',
    motivosIds: ['ART-09']
  })
}).then(r => r.json()).then(console.log)
```

**Resultado esperado:** Error 400 - Placa invalida (I, O, Q no permitidas)

---

## PRUEBA 7: Error 401 - Sin autorizacion

```
fetch('/api/finanzas/linea-captura', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    placa: 'ABC-123-A',
    motivosIds: ['ART-09']
  })
}).then(r => r.json()).then(console.log)
```

**Resultado esperado:** Error 401 - No autorizado

---

## Checklist de Validacion

| # | Prueba | Resultado Esperado | Estado |
|---|--------|-------------------|--------|
| 1 | POST genera linea | 15 digitos, success: true |  |
| 2 | GET retorna todas | Array con registros |  |
| 3 | GET filtra por placa | Solo esa placa |  |
| 4 | GET busca linea especifica | Datos de esa linea |  |
| 5 | PATCH cambia estatus | estatus: PAGADA |  |
| 6 | Rechaza placa invalida | Error 400 |  |
| 7 | Rechaza sin token | Error 401 |  |

---

## Criterio de Aceptacion

> "Se recibe la linea de captura de forma correcta entre los sistemas."

**Demostrado con:**
- PRUEBA 1: SSC envia datos, Finanzas responde con linea
- PRUEBA 2-4: SSC puede consultar lineas generadas
- PRUEBA 5: Finanzas puede actualizar estatus