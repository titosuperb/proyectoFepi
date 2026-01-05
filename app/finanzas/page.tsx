'use client';

import React, { useState } from 'react';
import {
  Menu,
  Bell,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCcw,
  Receipt,
  Calendar,
  ChevronRight,
  Building2,
  FileText,
} from 'lucide-react';

// Tipos
interface Multa {
  id: string;
  nombre: string;
  umas: number;
}

interface Fechas {
  creacion: string;
  limite_descuento: string;
  vencimiento: string;
}

interface ResultadoData {
  linea_captura: string;
  placa: string;
  conceptos: string[];
  monto_total: number;
  monto_con_descuento: number;
  ahorro: number;
  fechas: Fechas;
}

const CATALOGO: Multa[] = [
  { id: 'ART-09', nombre: 'Exceso de velocidad', umas: 10 },
  { id: 'ART-10', nombre: 'Estacionamiento prohibido', umas: 5 },
  { id: 'ART-12', nombre: 'Falta de documentos', umas: 20 },
  { id: 'ART-60', nombre: 'Conductor distraído (Celular)', umas: 30 },
];

export default function ModuloFinanzas() {
  const [placa, setPlaca] = useState<string>('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [resultado, setResultado] = useState<ResultadoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleSeleccion = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const formatearFecha = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selected.length === 0) {
      setError('Selecciona al menos una infraccion');
      return;
    }

    if (placa.trim().length < 4) {
      setError('Ingresa una placa valida');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/finanzas/linea-captura', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer SSC_TOKEN_2026',
        },
        body: JSON.stringify({
          placa: placa.trim(),
          motivosIds: selected,
          idOficial: 'OF-4429',
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Error del servidor');
      }

      if (json.success) {
        setResultado(json.data);
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error de conexion';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevo = () => {
    setResultado(null);
    setPlaca('');
    setSelected([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header institucional */}
      <header className="bg-[#7D1D3F] text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">FINANZAS CDMX</h1>
              <p className="text-white/80 text-xs">Secretaría de Administracion y Finanzas</p>
            </div>
          </div>
          
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors relative">
            <Bell className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-lg mx-auto p-4 space-y-4">
        
        {/* Status badge */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-green-800 font-semibold text-sm">
              SISTEMA CONECTADO (CDMX-HUB)
            </span>
          </div>
        </div>

        {!resultado ? (
          <>
            {/* Seccion de placa */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h2 className="text-[#7D1D3F] font-bold text-sm mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Datos del Vehículo
              </h2>
              <div>
                <label className="text-gray-700 text-xs font-semibold block mb-2">
                  Número de Placa
                </label>
                <input
                  type="text"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl
                           focus:border-[#7D1D3F] focus:ring-2 focus:ring-[#7D1D3F]/20 
                           outline-none transition-all text-xl font-mono tracking-widest 
                           text-center text-gray-900 placeholder-gray-500"
                  placeholder="ABC-123-A"
                  maxLength={12}
                />
              </div>
            </div>

            {/* Seccion de infracciones */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h2 className="text-[#7D1D3F] font-bold text-sm mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Infracciones a Cobrar
              </h2>
              <div className="space-y-2">
                {CATALOGO.map((multa) => {
                  const isSelected = selected.includes(multa.id);
                  return (
                    <button
                      key={multa.id}
                      type="button"
                      onClick={() => toggleSeleccion(multa.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all 
                                flex justify-between items-center ${
                                  isSelected
                                    ? 'border-[#7D1D3F] bg-[#7D1D3F]/5'
                                    : 'border-gray-200 bg-gray-50 hover:border-gray-400'
                                }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center 
                                    justify-center transition-all ${
                                      isSelected
                                        ? 'bg-[#7D1D3F] border-[#7D1D3F]'
                                        : 'border-gray-400'
                                    }`}
                        >
                          {isSelected && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {multa.nombre}
                          </p>
                          <p className="text-xs text-gray-600 font-mono">
                            {multa.id}
                          </p>
                        </div>
                      </div>
                      <span className="text-[#7D1D3F] font-bold text-sm">
                        {multa.umas} UMA
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Boton generar */}
            <button
              onClick={handleSolicitar}
              disabled={loading}
              className="w-full bg-[#7D1D3F] hover:bg-[#5C1630] disabled:bg-gray-400 
                       text-white font-bold py-4 px-6 rounded-xl shadow-lg 
                       transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Generar Línea de Captura
                </>
              )}
            </button>
          </>
        ) : (
          /* Resultado */
          <>
            {/* Card de línea de captura */}
            <div className="bg-[#7D1D3F] rounded-xl p-5 text-white shadow-lg">
              <div className="text-center">
                <p className="text-white/90 text-xs font-semibold uppercase tracking-wider mb-2">
                  Línea de Captura
                </p>
                <p className="text-2xl font-mono font-bold tracking-wider break-all">
                  {resultado.linea_captura}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-xs font-medium">Verificador Luhn valido</span>
                </div>
              </div>
            </div>

            {/* Detalles */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-[#7D1D3F] font-bold text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Resumen de Pago
              </h2>

              {/* Placa */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700 text-sm font-medium">Placa</span>
                <span className="font-mono font-bold text-gray-900">{resultado.placa}</span>
              </div>

              {/* Conceptos */}
              <div className="py-2 border-b border-gray-200">
                <span className="text-gray-700 text-sm font-medium block mb-2">Conceptos</span>
                <ul className="space-y-1">
                  {resultado.conceptos.map((c, i) => (
                    <li key={i} className="text-sm text-gray-800 flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-[#7D1D3F]" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Montos */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Subtotal</span>
                  <span className="text-gray-500 line-through">
                    ${resultado.monto_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700 font-semibold">Descuento (50%)</span>
                  <span className="text-green-700 font-semibold">
                    -${resultado.ahorro.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-2 border-t border-gray-200">
                  <span className="text-gray-900 font-semibold">Total a pagar</span>
                  <span className="text-2xl font-bold text-[#7D1D3F]">
                    ${resultado.monto_con_descuento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-amber-700 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="text-amber-900">
                    <span className="font-bold">Descuento valido hasta:</span>{' '}
                    {formatearFecha(resultado.fechas.limite_descuento)}
                  </p>
                  <p className="text-amber-800">
                    <span className="font-semibold">Vencimiento:</span>{' '}
                    {formatearFecha(resultado.fechas.vencimiento)}
                  </p>
                </div>
              </div>
            </div>

            {/* Boton nueva consulta */}
            <button
              onClick={handleNuevo}
              className="w-full bg-white hover:bg-gray-50 text-[#7D1D3F] 
                       font-bold py-4 px-6 rounded-xl border-2 border-[#7D1D3F]
                       transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-5 h-5" />
              Nueva Consulta
            </button>
          </>
        )}
      </main>

      {/* Footer / Tab bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="max-w-lg mx-auto flex justify-around">
          {[
            { icon: Building2, label: 'Inicio', active: false },
            { icon: CreditCard, label: 'Pagos', active: true },
            { icon: Receipt, label: 'Folios', active: false },
            { icon: FileText, label: 'Historial', active: false },
          ].map((tab) => (
            <button
              key={tab.label}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                tab.active
                  ? 'text-[#7D1D3F]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs font-semibold mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </footer>

      {/* Espaciador para el footer fijo */}
      <div className="h-20"></div>
    </div>
  );
}