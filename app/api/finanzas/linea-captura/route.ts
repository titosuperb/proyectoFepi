import { NextRequest, NextResponse } from 'next/server';

/**
 * SRV3.5: MICROSERVICIO DE FINANZAS - VERSION CON PERSISTENCIA
 * HU017 - Comunicacion de lineas de captura con Finanzas
 */

const UMA_VALOR = 108.57;

const CATALOGO_MULTAS: Record<string, { descripcion: string; umas: number }> = {
  'ART-09': { descripcion: 'Exceso de velocidad', umas: 10 },
  'ART-10': { descripcion: 'Estacionamiento prohibido', umas: 5 },
  'ART-12': { descripcion: 'Falta de documentos', umas: 20 },
  'ART-60': { descripcion: 'Conductor distraido (Celular)', umas: 30 },
};

const PLACA_REGEX = /^[A-Z0-9]{2,3}-?[A-Z0-9]{2,3}-?[A-Z0-9]{0,2}$/i;

// ==========================================
// BASE DE DATOS EN MEMORIA (Simulacion)
// ==========================================
interface LineaCaptura {
  id: number;
  linea_captura: string;
  placa: string;
  conceptos: string[];
  monto_total: number;
  monto_con_descuento: number;
  ahorro: number;
  fecha_creacion: string;
  fecha_limite_descuento: string;
  fecha_vencimiento: string;
  estatus: 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'CANCELADA';
  id_oficial: string;
  folio_infraccion: string;
}

// Almacenamiento en memoria (simula tabla de BD)
const baseDeDatos: LineaCaptura[] = [];
let autoIncrementId = 1;

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function generarLineaCaptura(): string {
  const fecha = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  const base = `${fecha}${random}`;

  let suma = 0;
  let alternar = false;

  for (let i = base.length - 1; i >= 0; i--) {
    let n = parseInt(base[i], 10);
    if (alternar) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    suma += n;
    alternar = !alternar;
  }

  const verificador = (10 - (suma % 10)) % 10;
  return `${base}${verificador}`;
}

function validarAutenticacion(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  return authHeader.startsWith('Bearer ');
}

function buscarLineaPorCodigo(linea: string): LineaCaptura | undefined {
  return baseDeDatos.find((l) => l.linea_captura === linea);
}

function buscarLineasPorPlaca(placa: string): LineaCaptura[] {
  return baseDeDatos.filter((l) => l.placa === placa.toUpperCase());
}

// ==========================================
// ENDPOINTS
// ==========================================

interface SolicitudLineaCaptura {
  placa: string;
  motivosIds: string[];
  idOficial?: string;
  folioInfraccion?: string;
}

// POST: Generar nueva linea de captura
export async function POST(req: NextRequest) {
  try {
    if (!validarAutenticacion(req)) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere token de autenticacion SSC.' },
        { status: 401 }
      );
    }

    const body: SolicitudLineaCaptura = await req.json();
    const { placa, motivosIds, idOficial, folioInfraccion } = body;

    // Validaciones
    if (!placa || !motivosIds || motivosIds.length === 0) {
      return NextResponse.json(
        { error: 'Datos incompletos. Se requiere: placa, motivosIds[]' },
        { status: 400 }
      );
    }

    if (!PLACA_REGEX.test(placa)) {
      return NextResponse.json(
        { error: 'Formato de placa invalido. Ejemplo valido: ABC-123-A' },
        { status: 400 }
      );
    }

    // Calcular montos
    let totalUmas = 0;
    const conceptos: string[] = [];
    const motivosInvalidos: string[] = [];

    for (const id of motivosIds) {
      const multa = CATALOGO_MULTAS[id];
      if (multa) {
        totalUmas += multa.umas;
        conceptos.push(multa.descripcion);
      } else {
        motivosInvalidos.push(id);
      }
    }

    if (motivosInvalidos.length > 0) {
      return NextResponse.json(
        { error: `Motivos no reconocidos: ${motivosInvalidos.join(', ')}` },
        { status: 400 }
      );
    }

    const montoTotal = Math.round(totalUmas * UMA_VALOR * 100) / 100;
    const montoConDescuento = Math.round(montoTotal * 0.5 * 100) / 100;
    const ahorro = Math.round((montoTotal - montoConDescuento) * 100) / 100;

    // Calcular fechas
    const hoy = new Date();

    const fechaLimiteDescuento = new Date(hoy);
    fechaLimiteDescuento.setDate(hoy.getDate() + 15);

    const fechaVencimiento = new Date(hoy);
    fechaVencimiento.setDate(hoy.getDate() + 30);

    // Generar linea de captura única
    let lineaCaptura = generarLineaCaptura();
    
    // Verificar que no exista (poco probable pero por seguridad)
    while (buscarLineaPorCodigo(lineaCaptura)) {
      lineaCaptura = generarLineaCaptura();
    }

    // Crear registro
    const nuevoRegistro: LineaCaptura = {
      id: autoIncrementId++,
      linea_captura: lineaCaptura,
      placa: placa.toUpperCase(),
      conceptos,
      monto_total: montoTotal,
      monto_con_descuento: montoConDescuento,
      ahorro,
      fecha_creacion: hoy.toISOString(),
      fecha_limite_descuento: fechaLimiteDescuento.toISOString(),
      fecha_vencimiento: fechaVencimiento.toISOString(),
      estatus: 'PENDIENTE',
      id_oficial: idOficial || 'N/A',
      folio_infraccion: folioInfraccion || 'N/A',
    };

    // Guardar en "base de datos"
    baseDeDatos.push(nuevoRegistro);

    // Log para demostrar persistencia
    console.log('[SRV3.5 FINANZAS] Linea guardada en BD:', {
      id: nuevoRegistro.id,
      linea: nuevoRegistro.linea_captura,
      placa: nuevoRegistro.placa,
      total_registros: baseDeDatos.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        linea_captura: nuevoRegistro.linea_captura,
        placa: nuevoRegistro.placa,
        conceptos: nuevoRegistro.conceptos,
        monto_total: nuevoRegistro.monto_total,
        monto_con_descuento: nuevoRegistro.monto_con_descuento,
        ahorro: nuevoRegistro.ahorro,
        fechas: {
          creacion: nuevoRegistro.fecha_creacion,
          limite_descuento: nuevoRegistro.fecha_limite_descuento,
          vencimiento: nuevoRegistro.fecha_vencimiento,
        },
        metadatos: {
          id_registro: nuevoRegistro.id,
          algoritmo: 'Luhn Mod10',
          oficial_solicitante: nuevoRegistro.id_oficial,
          folio_infraccion: nuevoRegistro.folio_infraccion,
          estatus: nuevoRegistro.estatus,
        },
      },
    }, { status: 201 });

  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[SRV3.5 FINANZAS] Error:', mensaje);

    return NextResponse.json(
      { error: 'Error interno del microservicio de Finanzas' },
      { status: 500 }
    );
  }
}

// GET: Consultar linea de captura
export async function GET(req: NextRequest) {
  if (!validarAutenticacion(req)) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const linea = searchParams.get('linea');
  const placa = searchParams.get('placa');

  // Consultar por linea de captura especifica
  if (linea) {
    const registro = buscarLineaPorCodigo(linea);

    if (!registro) {
      return NextResponse.json(
        { error: 'Linea de captura no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: registro,
    });
  }

  // Consultar por placa (todas las lineas de esa placa)
  if (placa) {
    const registros = buscarLineasPorPlaca(placa);

    return NextResponse.json({
      success: true,
      data: registros,
      total: registros.length,
    });
  }

  // Si no hay parametros, devolver todas (para debug)
  return NextResponse.json({
    success: true,
    data: baseDeDatos,
    total: baseDeDatos.length,
  });
}

// PATCH: Actualizar estatus de linea de captura
export async function PATCH(req: NextRequest) {
  if (!validarAutenticacion(req)) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  try {
    const { linea_captura, estatus } = await req.json();

    if (!linea_captura || !estatus) {
      return NextResponse.json(
        { error: 'Se requiere: linea_captura, estatus' },
        { status: 400 }
      );
    }

    const estatusValidos = ['PENDIENTE', 'PAGADA', 'VENCIDA', 'CANCELADA'];
    if (!estatusValidos.includes(estatus)) {
      return NextResponse.json(
        { error: `Estatus invalido. Valores permitidos: ${estatusValidos.join(', ')}` },
        { status: 400 }
      );
    }

    const registro = buscarLineaPorCodigo(linea_captura);

    if (!registro) {
      return NextResponse.json(
        { error: 'Linea de captura no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar estatus
    registro.estatus = estatus;

    console.log('[SRV3.5 FINANZAS] Estatus actualizado:', {
      linea: registro.linea_captura,
      nuevo_estatus: estatus,
    });

    return NextResponse.json({
      success: true,
      message: `Linea ${linea_captura} actualizada a ${estatus}`,
      data: registro,
    });

  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[SRV3.5 FINANZAS] Error:', mensaje);

    return NextResponse.json(
      { error: 'Error interno del microservicio' },
      { status: 500 }
    );
  }
}