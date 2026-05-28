import { LuSmartphone } from "react-icons/lu";
import { FormField, Input, Combobox , CurrencyInput} from "../../ui/Form";
import { SimCardData } from "../../../types";
import { ClientInfoSection, VoucherField, FinancialSection } from "./VoucherField";

interface SimCardFormProps {
  sim: SimCardData;
  client: any;
  suppliers?: any[];
  onChange: (updates: Partial<SimCardData>) => void;
}

export function SimCardForm({ sim, client, suppliers, onChange }: SimCardFormProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {client && <ClientInfoSection client={client} />}
      
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
          <LuSmartphone size={14} /> Configuración de SIM Card
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nombre del Titular">
            <Input value={sim.passengerName} onChange={(e) => onChange({ passengerName: e.target.value })} placeholder="Nombre completo" />
          </FormField>
          <FormField label="Número de Documento">
            <Input value={sim.docNumber} onChange={(e) => onChange({ docNumber: e.target.value })} placeholder="C.C. o Pasaporte" />
          </FormField>
          <FormField label="País de Destino">
            <Input value={sim.destinationCountry} onChange={(e) => onChange({ destinationCountry: e.target.value })} placeholder="Ej: España, USA" />
          </FormField>
          <FormField label="Fecha y Hora de Llegada">
            <Input type="datetime-local" value={sim.arrivalDate} onChange={(e) => onChange({ arrivalDate: e.target.value })} />
          </FormField>
          <FormField label="Duración del Viaje (Días)">
            <Input type="number" value={sim.tripDuration} onChange={(e) => onChange({ tripDuration: e.target.value })} placeholder="Ej: 15" />
          </FormField>
          <FormField label="Plan de Datos">
            <Input value={sim.dataPlan} onChange={(e) => onChange({ dataPlan: e.target.value })} placeholder="Ej: 10GB, Ilimitado" />
          </FormField>
          <FormField label="Tipo de SIM">
            <Combobox
              value={sim.simType}
              onChange={(val) => onChange({ simType: val })}
              options={[
                { value: "Física", label: "SIM Física (Chip)" },
                { value: "eSIM", label: "eSIM (Digital)" },
                { value: "MicroSIM", label: "Micro SIM" },
                { value: "NanoSIM", label: "Nano SIM" },
              ]}
            />
          </FormField>
          <FormField label="Método de Entrega">
            <Combobox
              value={sim.deliveryMethod}
              onChange={(val) => onChange({ deliveryMethod: val })}
              options={[
                { value: "Correo Electrónico", label: "Correo Electrónico (Solo eSIM)" },
                { value: "Domicilio", label: "Envío a Domicilio" },
                { value: "Recogida en Oficina", label: "Recogida en Oficina" },
                { value: "Aeropuerto", label: "Entrega en Aeropuerto" },
              ]}
            />
          </FormField>
          <FormField label="Correo Electrónico" className="md:col-span-2">
            <Input type="email" value={sim.email} onChange={(e) => onChange({ email: e.target.value })} placeholder="ejemplo@correo.com" />
          </FormField>
        </div>
      </div>

      <FinancialSection 
        supplierName={sim.supplierName}
        supplierCost={sim.supplierCost}
        ta={sim.ta}
        suppliers={suppliers}
        onChange={(updates) => onChange(updates)}
      />

      <VoucherField 
        voucher={sim.voucher} 
        sendVoucher={sim.sendVoucher} 
        onChange={(updates) => onChange(updates)} 
      />
    </div>
  );
}