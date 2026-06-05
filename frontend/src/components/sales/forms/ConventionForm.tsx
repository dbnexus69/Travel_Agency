import { Building2 } from "lucide-react";
import { FormField, Input, Combobox, Textarea , CurrencyInput} from "../../ui/Form";
import { ConventionData } from "../../../types";
import { ClientInfoSection, VoucherField, FinancialSection } from "./VoucherField";
import { DateTimePicker } from "./TicketForm";

interface ConventionFormProps {
  convention: ConventionData;
  client: any;
  suppliers?: any[];
  onChange: (updates: Partial<ConventionData>) => void;
  triggerError?: (msg: string) => void;
}

export function ConventionForm({ convention, client, suppliers, onChange, triggerError }: ConventionFormProps) {
  const minDateTime = (() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  })();
  const toggleAV = (item: string) => {
    const current = convention.avEquipment;
    const next = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
    onChange({ avEquipment: next });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {client && <ClientInfoSection client={client} />}

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
          <Building2 size={14} /> Centro de Convenciones
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Organización">
            <Input 
              value={convention.organization} 
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, "");
                onChange({ organization: cleaned });
              }} 
              placeholder="Nombre de la empresa" 
            />
          </FormField>
          <FormField label="Nombre de Contacto">
            <Input value={convention.contactName} onChange={(e) => onChange({ contactName: e.target.value })} placeholder="Persona de contacto" />
          </FormField>
          <FormField label="Fecha Inicio">
            <DateTimePicker
              value={convention.startDate}
              onChange={(val) => onChange({ startDate: val })}
              min={minDateTime}
              triggerError={triggerError}
              fieldName="Inicio del evento"
            />
          </FormField>
          <FormField label="Fecha Fin">
            <DateTimePicker
              value={convention.endDate}
              onChange={(val) => onChange({ endDate: val })}
              min={minDateTime}
              triggerError={triggerError}
              fieldName="Fin del evento"
            />
          </FormField>
          <FormField label="Asistencia Estimada">
            <Input 
              type="text" 
              value={convention.estimatedAttendance} 
              onChange={(e) => {
                let cleaned = e.target.value.replace(/[^0-9]/g, "");
                if (cleaned.length > 3) cleaned = cleaned.slice(0, 3);
                onChange({ estimatedAttendance: cleaned === "" ? ("" as any) : parseInt(cleaned) });
              }} 
            />
          </FormField>
          <FormField label="Espacio Requerido">
            <Combobox
              value={convention.requiredSpace}
              onChange={(val) => onChange({ requiredSpace: val })}
              options={[
                { value: "sala A", label: "Sala A" },
                { value: "sala B", label: "Sala B" },
                { value: "sala C", label: "Sala C" },
                { value: "salón completo", label: "Salón Completo" },
              ]}
            />
          </FormField>
          <FormField label="Tipo de Evento">
            <Combobox
              value={convention.eventType}
              onChange={(val) => onChange({ eventType: val })}
              options={[
                { value: "congreso", label: "Congreso" },
                { value: "convención", label: "Convención" },
                { value: "feria", label: "Feria" },
                { value: "otro", label: "Otro" },
              ]}
            />
          </FormField>
          <FormField label="Correo Electrónico">
            <Input 
              type="email" 
              value={convention.email} 
              onChange={(e) => {
                let val = e.target.value;
                if (val.includes(".com")) {
                  val = val.substring(0, val.indexOf(".com") + 4);
                }
                onChange({ email: val.trim() });
              }} 
              placeholder="correo@empresa.com" 
            />
          </FormField>
          <div className="md:col-span-2 space-y-3">
            <label className="text-sm font-medium text-gray-700">Equipos A/V Requeridos</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {["Proyector", "Micrófono", "Streaming", "Sonido", "Iluminación", "Pantalla LED"].map((item) => (
                <label key={item} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-100 cursor-pointer hover:border-primary/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={convention.avEquipment.includes(item)}
                    onChange={() => toggleAV(item)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-gray-600">{item}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 flex flex-col gap-2 p-3 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Servicio de Catering</span>
              <button
                type="button"
                onClick={() => onChange({ hasCatering: !convention.hasCatering })}
                className={`w-10 h-5 rounded-full transition-colors relative ${convention.hasCatering ? "bg-primary" : "bg-gray-300 shadow-inner"}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${convention.hasCatering ? "right-1" : "left-1"}`} />
              </button>
            </div>
            {convention.hasCatering && (
              <Textarea
                value={convention.cateringNotes}
                onChange={(e) => onChange({ cateringNotes: e.target.value })}
                placeholder="Observaciones de catering"
                rows={2}
                className="mt-1"
              />
            )}
          </div>
        </div>
      </div>

      <FinancialSection 
        supplierName={convention.supplierName}
        supplierCost={convention.supplierCost}
        ta={convention.ta}
        suppliers={suppliers}
        onChange={(updates) => onChange(updates)}
      />

      <VoucherField 
        voucher={convention.voucher} 
        sendVoucher={convention.sendVoucher} 
        onChange={(updates) => onChange(updates)} 
      />
    </div>
  );
}