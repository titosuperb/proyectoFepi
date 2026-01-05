# Microservicio de Lineas de Captura

## HU017 - Comunicacion de lineas de captura con Finanzas

> **Proyecto FEPI** - Sistema de Infracciones CDMX

> Microservicio que simula el sistema de la Secretaria de Administracion y Finanzas para la generacion de lineas de captura.

---

## Descripcion

Como SSC, quiero solicitar las lineas de captura de pago a la Secretaria de Finanzas brindando los datos de la placa y el motivo de la infraccion, para permitir que el ciudadano realice el pago correspondiente de la sancion de forma correcta.

### Criterio de Aceptacion

- Se recibe la linea de captura de forma correcta entre los sistemas.

---

## Tecnologias

| Tecnologia | Version | Uso |
|------------|---------|-----|
| Next.js | 16.x | Framework principal |
| TypeScript | 5.x | Tipado estatico |
| Tailwind CSS | 3.x | Estilos |
| React | 19.x | Interfaz de usuario |

---

## Instalacion

# Clonar el repositorio
`git clone https://github.com/titosuperb/proyectoFepi.git`

`cd proyectoFepi/finanzas-srv`

# Instalar dependencias
`npm install`

# Iniciar servidor de desarrollo
`npm run dev`

Abrir `http://localhost:3000/finanzas`

---

## Endpoints

### POST /api/finanzas/linea-captura

Genera una nueva linea de captura.

**Headers:**
```
Content-Type: application/
Authorization: Bearer <token>
```

**Request:**
```
{
  "placa": "ABC-123-A",
  "motivosIds": ["ART-09", "ART-38"],
  "idOficial": "OF-4429",
  "folioInfraccion": "INF-2026-000001"
}
```

**Response (201):**
```
{
  "success": true,
  "data": {
    "linea_captura": "260105433459174",
    "placa": "ABC-123-A",
    "conceptos": ["Exceso de velocidad", "Conductor distraido (Celular)"],
    "monto_total": 4525.60,
    "monto_con_descuento": 2262.80,
    "ahorro": 2262.80,
    "fechas": {
      "creacion": "2026-01-05T12:00:00.000Z",
      "limite_descuento": "2026-01-20T12:00:00.000Z",
      "vencimiento": "2026-02-04T12:00:00.000Z"
    },
    "metadatos": {
      "id_registro": 1,
      "algoritmo": "Luhn Mod10",
      "estatus": "PENDIENTE"
    }
  }
}
```

---

### GET /api/finanzas/linea-captura

Consulta lineas de captura.

| Parametro | Descripcion |
|-----------|-------------|
| `?linea=X` | Buscar por linea especifica |
| `?placa=X` | Buscar por placa |
| (ninguno) | Listar todas |

---

### PATCH /api/finanzas/linea-captura

Actualiza el estatus de una linea.

**Request:**
```
{
  "linea_captura": "260105433459174",
  "estatus": "PAGADA"
}
```

**Valores permitidos:** `PENDIENTE`, `PAGADA`, `VENCIDA`, `CANCELADA`

---

## Catalogo de Infracciones

| Codigo | Descripcion | UMAs | Monto (2025) |
|--------|-------------|------|--------------|
| ART-09 | Exceso de velocidad | 10 | $1,131.40 |
| ART-30 | Estacionamiento prohibido | 10 | $1,131.40 |
| ART-38 | Conductor distraido (Celular) | 30 | $3,394.20 |
| ART-11 | No respetar semaforo | 10 | $1,131.40 |

> Valor UMA 2025: $113.14 (vigente feb 2025 - ene 2026)

---

## Validaciones

### Placas (NOM-001-SCT-2-2016)
- 3 letras + 2-4 numeros + 0-2 caracteres
- Excluye letras: I, O, Q

### Linea de Captura
- 15 digitos
- Algoritmo Luhn (Modulo 10)

---

## Flujo

```
1. Oficial detecta infraccion
         |
2. SSC envia POST (placa, motivos)
         |
3. Finanzas genera linea de captura  <-- Este servicio
         |
4. SSC entrega boleta al ciudadano
         |
5. Ciudadano paga con la linea
         |
6. Finanzas marca como PAGADA (PATCH)
```

---

## Pruebas

Ver archivo `TESTS.md` para comandos de prueba.