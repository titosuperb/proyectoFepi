/**
 * Validador de checklist HU012.
 * Responsabilidad única: Validar estructura y valores permitidos del checklist.
 *
 * Nota: Aunque el motor valida requests, mantenemos esta validación
 * para proteger integridad de datos y evitar guardar basura en BD.
 * Si falla, lanzamos Error y dejamos que la capa superior maneje el HTTP status.
 */

const ESTADOS_CRISTALES = new Set(["OK", "DAÑADO", "ROTO"]);
const ESTADOS_CARROCERIA = new Set(["OK", "GOLPES", "RAYONES", "DAÑO_SEVERO"]);
const ESTADOS_LUCES = new Set(["OK", "FALTANTE", "DAÑADA"]);
const ESTADOS_OBJETOS = new Set(["SIN_OBJETOS", "CON_OBJETOS"]);

/**
 * Valida el checklist conforme al contrato documentado.
 * @param {object} checklist
 * @throws {Error} si es inválido
 */
export function validarChecklistHU012(checklist) {
  if (!checklist || typeof checklist !== "object") {
    throw new Error("Checklist es obligatorio y debe ser un objeto JSON.");
  }

  // Helpers
  const assertBlock = (blockName) => {
    if (!checklist[blockName] || typeof checklist[blockName] !== "object") {
      throw new Error(`Checklist inválido: falta el bloque '${blockName}'.`);
    }
    if (!("estado" in checklist[blockName])) {
      throw new Error(`Checklist inválido: falta 'estado' en '${blockName}'.`);
    }
    if (typeof checklist[blockName].estado !== "string") {
      throw new Error(`Checklist inválido: 'estado' en '${blockName}' debe ser string.`);
    }
  };

  // Bloques obligatorios HU012
  assertBlock("cristales");
  assertBlock("carroceria");
  assertBlock("luces");
  assertBlock("objetosVisibles");

  // Enums permitidos
  if (!ESTADOS_CRISTALES.has(checklist.cristales.estado)) {
    throw new Error(
      `Checklist inválido: cristales.estado debe ser uno de: ${[...ESTADOS_CRISTALES].join(", ")}`
    );
  }
  if (!ESTADOS_CARROCERIA.has(checklist.carroceria.estado)) {
    throw new Error(
      `Checklist inválido: carroceria.estado debe ser uno de: ${[...ESTADOS_CARROCERIA].join(", ")}`
    );
  }
  if (!ESTADOS_LUCES.has(checklist.luces.estado)) {
    throw new Error(
      `Checklist inválido: luces.estado debe ser uno de: ${[...ESTADOS_LUCES].join(", ")}`
    );
  }
  if (!ESTADOS_OBJETOS.has(checklist.objetosVisibles.estado)) {
    throw new Error(
      `Checklist inválido: objetosVisibles.estado debe ser uno de: ${[...ESTADOS_OBJETOS].join(", ")}`
    );
  }

  // Reglas suaves (opcionales)
  // - Si CON_OBJETOS, se recomienda descripción
  if (
    checklist.objetosVisibles.estado === "CON_OBJETOS" &&
    checklist.objetosVisibles.descripcion &&
    typeof checklist.objetosVisibles.descripcion !== "string"
  ) {
    throw new Error("Checklist inválido: objetosVisibles.descripcion debe ser string si existe.");
  }

  if (
    "observacionesGenerales" in checklist &&
    checklist.observacionesGenerales != null &&
    typeof checklist.observacionesGenerales !== "string"
  ) {
    throw new Error("Checklist inválido: observacionesGenerales debe ser string si existe.");
  }
}
