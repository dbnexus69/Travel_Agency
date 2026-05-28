import { LuDog } from "react-icons/lu";
import { FormField, Input, Combobox, Textarea , CurrencyInput} from "../../ui/Form";
import { PetServiceData } from "../../../types";
import { ClientInfoSection, VoucherField, FinancialSection } from "./VoucherField";

interface PetServiceFormProps {
  pet: PetServiceData;
  client: any;
  suppliers?: any[];
  onChange: (updates: Partial<PetServiceData>) => void;
}

export function PetServiceForm({ pet, client, suppliers, onChange }: PetServiceFormProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {client && <ClientInfoSection client={client} />}

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
          <LuDog size={14} /> Transporte de Mascotas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nombre del Dueño">
            <Input value={pet.ownerName} onChange={(e) => onChange({ ownerName: e.target.value })} placeholder="Nombre completo" />
          </FormField>
          <FormField label="Nombre de la Mascota">
            <Input value={pet.petName} onChange={(e) => onChange({ petName: e.target.value })} placeholder="Nombre de la mascota" />
          </FormField>
          <FormField label="Especie">
            <Combobox
              value={pet.species}
              onChange={(val) => onChange({ species: val })}
              options={[
                { value: "perro", label: "Perro" },
                { value: "gato", label: "Gato" },
                { value: "ave", label: "Ave" },
                { value: "otro", label: "Otro" },
              ]}
            />
          </FormField>
          <FormField label="Raza">
            <Input value={pet.breed} onChange={(e) => onChange({ breed: e.target.value })} placeholder="Ej: Labrador, Persa" />
          </FormField>
          <FormField label="Peso (kg)">
            <Input type="number" value={pet.weight} onChange={(e) => onChange({ weight: parseFloat(e.target.value) || 0 })} placeholder="0.0" />
          </FormField>
          <FormField label="Tamaño">
            <Combobox
              value={pet.size}
              onChange={(val) => onChange({ size: val })}
              options={[
                { value: "pequeño", label: "Pequeño" },
                { value: "mediano", label: "Mediano" },
                { value: "grande", label: "Grande" },
                { value: "gigante", label: "Gigante" },
              ]}
            />
          </FormField>
          <FormField label="Tipo de Viaje">
            <Combobox
              value={pet.travelType}
              onChange={(val) => onChange({ travelType: val })}
              options={[
                { value: "cabina", label: "En Cabina" },
                { value: "bodega", label: "En Bodega" },
                { value: "terrestre", label: "Terrestre" },
              ]}
            />
          </FormField>
          <FormField label="Fecha de Viaje">
            <Input type="datetime-local" value={pet.travelDate} onChange={(e) => onChange({ travelDate: e.target.value })} />
          </FormField>
          <FormField label="País Destino">
            <Input value={pet.destinationCountry} onChange={(e) => onChange({ destinationCountry: e.target.value })} placeholder="País de destino" />
          </FormField>
          <FormField label="Teléfono">
            <Input value={pet.phone} onChange={(e) => onChange({ phone: e.target.value })} placeholder="+57 300 123 4567" />
          </FormField>
          <FormField label="Condiciones Médicas" className="md:col-span-2">
            <Textarea value={pet.medicalConditions} onChange={(e) => onChange({ medicalConditions: e.target.value })} placeholder="Alergias, medicamentos, etc." rows={2} />
          </FormField>
        </div>
      </div>

      <FinancialSection 
        supplierName={pet.supplierName}
        supplierCost={pet.supplierCost}
        ta={pet.ta}
        suppliers={suppliers}
        onChange={(updates) => onChange(updates)}
      />

      <VoucherField 
        voucher={pet.voucher} 
        sendVoucher={pet.sendVoucher} 
        onChange={(updates) => onChange(updates)} 
      />
    </div>
  );
}