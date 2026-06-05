import { Plane, MapPin, User, Briefcase, Trash2, PlusCircle, ArrowRight, ArrowLeftRight, ArrowLeft } from "lucide-react";
import { FormField, Input, Combobox, Select, CurrencyInput } from "../../ui/Form";
import { Button } from "../../ui/Button";
import { TicketData, FlightLeg } from "../../../types";

interface TicketFormProps {
  ticket: TicketData;
  onChange: (updates: Partial<TicketData>) => void;
  airlines: { name: string }[];
  suppliers: { name: string }[];
  airports: any[];
  paymentMethods: { name: string; lastFourDigits?: string }[];
  baggage: {
    id: number;
    airlineName: string;
    fareType: string;
    personalItem: string;
    carryOn: string;
    checkedBag: string;
    notes: string;
  }[];
  triggerError?: (msg: string) => void;
}

const FLIGHT_MODE_TABS = [
  {
    id: "one_way" as const,
    label: "Solo Ida",
    icon: ArrowRight,
    description: "Un único trayecto de origen a destino",
  },
  {
    id: "round_trip" as const,
    label: "Ida y Vuelta",
    icon: ArrowLeftRight,
    description: "Trayecto de ida con regreso incluido",
  },
];

const STOP_TYPE_PILLS = [
  { id: false, label: "Directo", desc: "Sin escalas intermedias" },
  { id: true,  label: "Con Escalas", desc: "Paradas en aeropuertos intermedios" },
];

export function TicketForm({
  ticket,
  onChange,
  airlines,
  suppliers,
  airports,
  paymentMethods,
  baggage,
  triggerError,
}: TicketFormProps) {
  const airportOptions = airports.map((a) => ({
    value: a.abbreviation,
    label: `${a.abbreviation} - ${a.name} (${a.location})`,
  }));

  // Obtener fecha y hora actual en la zona horaria local para la validación de min
  const minDateTime = (() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  })();

  const validateDateInput = (value: string, fieldName: string): boolean => {
    if (!value) return true;
    if (value.length < 16) return true;
    const inputDate = new Date(value);
    const now = new Date();
    now.setSeconds(0, 0);
    if (!isNaN(inputDate.getTime()) && inputDate < now) {
      if (triggerError) {
        triggerError(`La fecha de ${fieldName} del tiquete no puede ser anterior a la fecha y hora actual.`);
      }
      return false;
    }
    return true;
  };

  /* ─── Legs ─────────────────────────────────────────────────── */
  const updateLeg = (idx: number, updates: Partial<FlightLeg>) => {
    const next = [...ticket.legs];
    next[idx] = { ...next[idx], ...updates };
    onChange({ legs: next });
  };
  const addLeg = () =>
    onChange({ legs: [...ticket.legs, { origin: "", destination: "", flightNumber: "", seat: "", date: "", arrivalDate: "" }] });
  const removeLeg = (idx: number) =>
    onChange({ legs: ticket.legs.filter((_, i) => i !== idx) });

  /* ─── Stops ─────────────────────────────────────────────────── */
  const addStop = (type: "outbound" | "return") => {
    const key = type === "outbound" ? "outboundStops" : "returnStops";
    const currentStops = ticket[key] || [];
    onChange({
      [key]: [
        ...currentStops,
        { origin: "", destination: "", flightNumber: "", seat: "", date: "", arrivalDate: "" },
      ],
    });
  };
  const updateStop = (
    type: "outbound" | "return",
    idx: number,
    updates: Partial<FlightLeg>
  ) => {
    const key = type === "outbound" ? "outboundStops" : "returnStops";
    const next = [...(ticket[key] || [])];
    next[idx] = { ...next[idx], ...updates };
    onChange({ [key]: next });
  };
  const removeStop = (type: "outbound" | "return", idx: number) => {
    const key = type === "outbound" ? "outboundStops" : "returnStops";
    onChange({ [key]: (ticket[key] || []).filter((_, i) => i !== idx) });
  };

  /* ─── Helpers ─────────────────────────────────────────────── */
  const setFlightMode = (mode: "one_way" | "round_trip") => {
    onChange({ flightMode: mode, returnLeg: undefined, returnStops: [] });
  };

  const isRoundTrip = ticket.flightMode === "round_trip";

  /* ─── Shared stop-list component ─────────────────────────── */
  const StopList = ({
    type,
    color = "primary",
  }: {
    type: "outbound" | "return";
    color?: "primary" | "blue";
  }) => {
    const stops = type === "outbound" ? ticket.outboundStops : ticket.returnStops;
    const colorMap = {
      primary: {
        title: "text-primary",
        btn: "text-primary bg-primary/5 hover:bg-primary/10",
        empty: "text-gray-400",
      },
      blue: {
        title: "text-blue-600",
        btn: "text-blue-600 bg-blue-50 hover:bg-blue-100",
        empty: "text-blue-400/60",
      },
    };
    const c = colorMap[color];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${c.title}`}>
            <MapPin size={11} />
            Escalas {type === "outbound" ? "de Ida" : "de Vuelta"} (Opcional)
          </span>
          <button
            type="button"
            onClick={() => addStop(type)}
            className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md transition-colors ${c.btn}`}
          >
            <PlusCircle size={10} /> Añadir Escala
          </button>
        </div>
        <div className="space-y-4">
          {(stops || []).map((stop, sIdx) => (
            <div
              key={sIdx}
              className={`p-4 rounded-xl border relative group transition-all duration-200 ${
                color === "primary"
                  ? "bg-primary/5/10 border-primary/20 hover:border-primary/40 bg-white"
                  : "bg-blue-50/30 border-blue-100 hover:border-blue-300 bg-white"
              }`}
            >
              <div className="absolute -top-2.5 left-3 bg-white px-2 py-0.5 rounded-full border border-gray-150 shadow-sm flex items-center gap-1">
                <span className={`text-[9px] font-extrabold uppercase tracking-wide ${color === "primary" ? "text-primary" : "text-blue-600"}`}>
                  Escala #{sIdx + 1}
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => removeStop(type, sIdx)}
                className="absolute -top-2.5 right-3 bg-red-50 text-red-500 border border-red-100 rounded-full p-1 hover:bg-red-100 transition-colors shadow-sm"
                title="Eliminar Escala"
              >
                <Trash2 size={11} />
              </button>

              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FormField label="Origen">
                    <Combobox
                      value={stop.origin || ""}
                      onChange={(val) => updateStop(type, sIdx, { origin: val })}
                      options={airportOptions}
                      placeholder="BOG"
                      className="text-xs"
                    />
                  </FormField>
                  
                  <FormField label="Destino">
                    <Combobox
                      value={stop.destination || ""}
                      onChange={(val) => updateStop(type, sIdx, { destination: val })}
                      options={airportOptions}
                      placeholder="MDE"
                      className="text-xs"
                    />
                  </FormField>
                  
                  <FormField label="N° Vuelo">
                    <Input
                      required
                      value={stop.flightNumber || ""}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                        updateStop(type, sIdx, { flightNumber: cleaned });
                      }}
                      placeholder="AV93"
                      className="text-xs"
                    />
                  </FormField>
                  
                  <FormField label="Asiento">
                    <Input
                      value={stop.seat || ""}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                        updateStop(type, sIdx, { seat: cleaned });
                      }}
                      placeholder="12A"
                      className="text-xs"
                    />
                  </FormField>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Salida">
                    <Input
                      type="datetime-local" required min={minDateTime}
                      value={stop.date || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (validateDateInput(val, "Salida de la escala")) {
                          updateStop(type, sIdx, { date: val });
                        } else {
                          updateStop(type, sIdx, { date: minDateTime });
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (!validateDateInput(val, "Salida de la escala")) {
                          updateStop(type, sIdx, { date: minDateTime });
                        }
                      }}
                      className="text-xs"
                    />
                  </FormField>
                  
                  <FormField label="Llegada">
                    <Input
                      type="datetime-local" required min={minDateTime}
                      value={stop.arrivalDate || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (validateDateInput(val, "Llegada de la escala")) {
                          updateStop(type, sIdx, { arrivalDate: val });
                        } else {
                          updateStop(type, sIdx, { arrivalDate: minDateTime });
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (!validateDateInput(val, "Llegada de la escala")) {
                          updateStop(type, sIdx, { arrivalDate: minDateTime });
                        }
                      }}
                      className="text-xs"
                    />
                  </FormField>
                </div>
              </div>
            </div>
          ))}
          {(stops || []).length === 0 && (
            <p className={`text-[10px] italic col-span-full text-center py-1 ${c.empty}`}>
              No hay escalas registradas.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <datalist id="cities-list-ticket">
        {airports?.map((a) => <option key={a.abbreviation} value={a.abbreviation} />)}
      </datalist>

      {/* ── Información General ─────────────────────────────── */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
          <Plane size={14} /> Información General del Vuelo
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Aerolínea">
            <Combobox
              value={ticket.airline}
              onChange={(val) => onChange({ airline: val })}
              options={airlines.map((a) => ({ value: a.name, label: a.name }))}
              placeholder="Ej: Avianca"
            />
          </FormField>
          <FormField label="Proveedor">
            <Combobox
              value={ticket.supplier}
              onChange={(val) => onChange({ supplier: val })}
              options={suppliers.map((s) => ({ value: s.name, label: s.name }))}
              placeholder="Ej: Viajes Éxito"
            />
          </FormField>
          <FormField label="Número de Reserva">
            <Input
              required
              maxLength={6}
              value={ticket.reservationNumber}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                onChange({ reservationNumber: cleaned });
              }}
              placeholder="6 caracteres"
            />
          </FormField>
        </div>
      </div>

      {/* ── TABS Tipo de Vuelo ───────────────────────────────── */}
      <div className="space-y-4">
        {/* Tab Principal: Solo Ida / Ida y Vuelta */}
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            Tipo de Vuelo
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FLIGHT_MODE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = ticket.flightMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFlightMode(tab.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    isActive
                      ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isActive ? "text-primary" : "text-gray-700"}`}>
                      {tab.label}
                    </p>
                    <p className="text-[10px] text-gray-400">{tab.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pills: Directo / Con Escalas — para la IDA */}
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            Tipo de Trayecto de Ida
          </p>
          <div className="flex gap-2">
            {STOP_TYPE_PILLS.map((pill) => {
              const isActive = ticket.hasStops === pill.id;
              return (
                <button
                  key={String(pill.id)}
                  type="button"
                  onClick={() => onChange({ hasStops: pill.id, outboundStops: [] })}
                  className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold border-2 transition-all ${
                    isActive
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {pill.label}
                  <span className={`block text-[9px] font-normal mt-0.5 ${isActive ? "text-white/70" : "text-gray-400"}`}>
                    {pill.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Trayectos de Ida ────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h5 className="text-[10px] font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
              <ArrowRight size={12} className="text-primary" />
              Trayecto{ticket.legs.length > 1 ? "s" : ""} de Ida
            </h5>
            <Button variant="outline" size="sm" onClick={addLeg} className="h-7 text-[10px]">
              <PlusCircle size={11} className="mr-1" /> Añadir Tramo
            </Button>
          </div>

          {ticket.legs.map((leg, lIdx) => (
            <div key={lIdx} className="bg-gray-50 rounded-lg p-3 relative group border border-gray-100">
              {ticket.legs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLeg(lIdx)}
                  className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <Trash2 size={11} />
                </button>
              )}
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FormField label="Origen">
                    <Combobox value={leg.origin} onChange={(val) => updateLeg(lIdx, { origin: val })} options={airportOptions} placeholder="BOG" className="text-xs" />
                  </FormField>
                  <FormField label="Destino">
                    <Combobox value={leg.destination} onChange={(val) => updateLeg(lIdx, { destination: val })} options={airportOptions} placeholder="MDE" className="text-xs" />
                  </FormField>
                  <FormField label="N° Vuelo">
                    <Input
                      required
                      value={leg.flightNumber}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                        updateLeg(lIdx, { flightNumber: cleaned });
                      }}
                      placeholder="AV93"
                      className="text-xs"
                    />
                  </FormField>
                  <FormField label="Asiento">
                    <Input
                      value={leg.seat}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                        updateLeg(lIdx, { seat: cleaned });
                      }}
                      placeholder="12A"
                      className="text-xs"
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Salida">
                    <Input
                      type="datetime-local" required min={minDateTime}
                      value={leg.date}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (validateDateInput(val, "Salida del tramo")) {
                          updateLeg(lIdx, { date: val });
                        } else {
                          updateLeg(lIdx, { date: minDateTime });
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (!validateDateInput(val, "Salida del tramo")) {
                          updateLeg(lIdx, { date: minDateTime });
                        }
                      }}
                      className="text-xs"
                    />
                  </FormField>
                  <FormField label="Llegada">
                    <Input
                      type="datetime-local" required min={minDateTime}
                      value={leg.arrivalDate || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (validateDateInput(val, "Llegada del tramo")) {
                          updateLeg(lIdx, { arrivalDate: val });
                        } else {
                          updateLeg(lIdx, { arrivalDate: minDateTime });
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (!validateDateInput(val, "Llegada del tramo")) {
                          updateLeg(lIdx, { arrivalDate: minDateTime });
                        }
                      }}
                      className="text-xs"
                    />
                  </FormField>
                </div>
              </div>
            </div>
          ))}

          {/* Escalas de Ida: solo visibles si hasStops = true */}
          {ticket.hasStops && (
            <div className="pt-3 border-t border-dashed border-gray-200">
              <StopList type="outbound" color="primary" />
            </div>
          )}
        </div>

        {/* ── Sección de Regreso (solo si Ida y Vuelta) ─────── */}
        {isRoundTrip && (
          <div className="rounded-xl border-2 border-blue-100 bg-blue-50/20 p-4 space-y-4 animate-fade-in">
            {/* Pills: Directo / Con Escalas — para la VUELTA */}
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <ArrowLeft size={11} /> Tipo de Trayecto de Vuelta
              </p>
              <div className="flex gap-2">
                {STOP_TYPE_PILLS.map((pill) => {
                  const isActive = ticket.returnHasStops === pill.id;
                  return (
                    <button
                      key={String(pill.id)}
                      type="button"
                      onClick={() => onChange({ returnHasStops: pill.id, returnStops: [] })}
                      className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold border-2 transition-all ${
                        isActive
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : "border-blue-200 bg-white text-blue-700 hover:border-blue-300"
                      }`}
                    >
                      {pill.label}
                      <span className={`block text-[9px] font-normal mt-0.5 ${isActive ? "text-white/70" : "text-blue-400"}`}>
                        {pill.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campos del Trayecto de Regreso */}
            <div className="bg-white rounded-lg border border-blue-100 p-3 space-y-3">
              <h5 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest flex items-center gap-2">
                <Plane size={11} className="rotate-180" /> Trayecto de Regreso
              </h5>
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FormField label="Origen Vuelta">
                    <Combobox
                      value={ticket.returnLeg?.origin || ""}
                      onChange={(val) => onChange({ returnLeg: { ...ticket.returnLeg!, origin: val } })}
                      options={airportOptions}
                      placeholder="MDE"
                      className="text-xs"
                    />
                  </FormField>
                  <FormField label="Destino Vuelta">
                    <Combobox
                      value={ticket.returnLeg?.destination || ""}
                      onChange={(val) => onChange({ returnLeg: { ...ticket.returnLeg!, destination: val } })}
                      options={airportOptions}
                      placeholder="BOG"
                      className="text-xs"
                    />
                  </FormField>
                  <FormField label="N° Vuelo Vuelta">
                    <Input
                      required
                      value={ticket.returnLeg?.flightNumber || ""}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                        onChange({ returnLeg: { ...ticket.returnLeg!, flightNumber: cleaned } });
                      }}
                      placeholder="AV94"
                      className="text-xs"
                    />
                  </FormField>
                  <FormField label="Asiento Vuelta">
                    <Input
                      value={ticket.returnLeg?.seat || ""}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                        onChange({ returnLeg: { ...ticket.returnLeg!, seat: cleaned } });
                      }}
                      placeholder="14C"
                      className="text-xs"
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Salida Vuelta">
                    <Input
                      type="datetime-local" required min={minDateTime}
                      value={ticket.returnLeg?.date || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (validateDateInput(val, "Salida de vuelta")) {
                          onChange({ returnLeg: { ...ticket.returnLeg!, date: val } });
                        } else {
                          onChange({ returnLeg: { ...ticket.returnLeg!, date: minDateTime } });
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (!validateDateInput(val, "Salida de vuelta")) {
                          onChange({ returnLeg: { ...ticket.returnLeg!, date: minDateTime } });
                        }
                      }}
                      className="text-xs"
                    />
                  </FormField>
                  <FormField label="Llegada Vuelta">
                    <Input
                      type="datetime-local" required min={minDateTime}
                      value={ticket.returnLeg?.arrivalDate || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (validateDateInput(val, "Llegada de vuelta")) {
                          onChange({ returnLeg: { ...ticket.returnLeg!, arrivalDate: val } });
                        } else {
                          onChange({ returnLeg: { ...ticket.returnLeg!, arrivalDate: minDateTime } });
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (!validateDateInput(val, "Llegada de vuelta")) {
                          onChange({ returnLeg: { ...ticket.returnLeg!, arrivalDate: minDateTime } });
                        }
                      }}
                      className="text-xs"
                    />
                  </FormField>
                </div>
              </div>

              {/* Escalas de Vuelta: solo visibles si returnHasStops = true */}
              {ticket.returnHasStops && (
                <div className="pt-3 border-t border-dashed border-blue-100">
                  <StopList type="return" color="blue" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Información del Pasajero ────────────────────────── */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
          <User size={14} /> Información del Pasajero
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nombre Completo">
            <Input value={ticket.passengerInfo.name} disabled className="bg-gray-100 cursor-not-allowed" />
          </FormField>
          <FormField label="Documento">
            <div className="flex gap-2">
              <Input value={ticket.passengerInfo.docType} disabled className="w-20 bg-gray-100 cursor-not-allowed" />
              <Input value={ticket.passengerInfo.docNumber} disabled className="flex-1 bg-gray-100 cursor-not-allowed" />
            </div>
          </FormField>
          <FormField label="Fecha de Nacimiento">
            <Input type="date" required value={ticket.passengerInfo.birthDate} disabled className="bg-gray-100 cursor-not-allowed" />
          </FormField>
          <FormField label="N° de Tiquete">
            <Input
              required
              maxLength={13}
              value={ticket.ticketNumber}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                onChange({ ticketNumber: cleaned });
              }}
              placeholder="Máx 13 caracteres (sin especiales)"
            />
          </FormField>
        </div>
      </div>

      {/* ── Finanzas y Equipaje ──────────────────────────────── */}
      <div className="bg-emerald-50/20 p-4 rounded-xl border border-emerald-100">
        <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Briefcase size={14} /> Detalles Financieros y Equipaje
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Valor Pagado al Proveedor">
            <CurrencyInput
              required
              value={ticket.supplierCost === 0 ? "" : ticket.supplierCost}
              onChange={(val) => onChange({ supplierCost: val === "" ? 0 : Number(val) })}
            />
          </FormField>
          <FormField label="Valor TA">
            <CurrencyInput
              required
              value={ticket.ta === 0 ? "" : ticket.ta}
              onChange={(val) => onChange({ ta: val === "" ? 0 : Number(val) })}
            />
          </FormField>
          <FormField label="Método de Pago Proveedor">
            <Select
              value={ticket.supplierPaymentMethod}
              onChange={(e) => onChange({ supplierPaymentMethod: e.target.value })}
              options={paymentMethods.map((m) => ({
                value: m.name,
                label: m.lastFourDigits ? `${m.name} (**${m.lastFourDigits})` : m.name,
              }))}
            />
          </FormField>
          <FormField label="Plan de Equipaje">
            <Combobox
              value={ticket.baggagePlan}
              onChange={(val) => onChange({ baggagePlan: val })}
              options={baggage.map((b) => ({
                value: `${b.airlineName} - ${b.fareType}`,
                label: `${b.airlineName} - ${b.fareType}`,
              }))}
              placeholder="Buscar plan..."
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}