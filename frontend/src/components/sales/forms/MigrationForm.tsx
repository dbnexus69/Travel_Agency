import { LuMapPin } from "react-icons/lu";
import { FormField, Input, Combobox , CurrencyInput} from "../../ui/Form";
import { MigrationData } from "../../../types";
import { ClientInfoSection, VoucherField, FinancialSection } from "./VoucherField";

interface MigrationFormProps {
  migration: MigrationData;
  client: any;
  suppliers?: any[];
  onChange: (updates: Partial<MigrationData>) => void;
}

export function MigrationForm({ migration, client, suppliers, onChange }: MigrationFormProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {client && <ClientInfoSection client={client} />}

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
          <LuMapPin size={14} /> Documentación Migratoria
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nombre del Pasajero">
            <Input value={migration.passengerName} onChange={(e) => onChange({ passengerName: e.target.value })} placeholder="Nombre completo" />
          </FormField>
          <FormField label="Fecha de Nacimiento">
            <Input type="date" required max={new Date().toISOString().slice(0, 10)} value={migration.birthDate} onChange={(e) => onChange({ birthDate: e.target.value })} />
          </FormField>
          <FormField label="Nacionalidad">
            <Input 
              value={migration.nationality} 
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
                onChange({ nationality: cleaned });
              }} 
              placeholder="Ej: Colombiana" 
              maxLength={30}
            />
          </FormField>
          <FormField label="Número de Pasaporte">
            <Input 
              value={migration.passportNumber} 
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                onChange({ passportNumber: cleaned });
              }} 
              placeholder="Número de pasaporte" 
              maxLength={20}
            />
          </FormField>
          <FormField label="Vencimiento Pasaporte">
            <Input type="date" required min={new Date().toISOString().slice(0, 10)} value={migration.passportExpiry} onChange={(e) => onChange({ passportExpiry: e.target.value })} />
          </FormField>
          <FormField label="País de Destino">
            <Input 
              value={migration.destinationCountry} 
              onChange={(e) => {
                let cleaned = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
                if (cleaned.length > 0) {
                  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
                }
                onChange({ destinationCountry: cleaned });
              }} 
              placeholder="Ej: México" 
            />
          </FormField>
          <FormField label="Trámite Solicitado">
            <Combobox
              value={migration.requestedDocType}
              onChange={(val) => onChange({ requestedDocType: val })}
              options={[
                { value: "Check-Mig Colombia", label: "Check-Mig Colombia" },
                { value: "Formulario México", label: "Formulario México" },
                { value: "ETIAS Europa", label: "ETIAS Europa" },
                { value: "ESTA USA", label: "ESTA USA" },
                { value: "Otro", label: "Otro trámite" },
              ]}
            />
          </FormField>
          <FormField label="Correo Electrónico">
            <Input 
              type="email" 
              value={migration.email} 
              onChange={(e) => {
                let val = e.target.value;
                if (val.includes(".com")) {
                  val = val.substring(0, val.indexOf(".com") + 4);
                }
                onChange({ email: val.trim() });
              }} 
              placeholder="ejemplo@correo.com" 
            />
          </FormField>
        </div>
      </div>

      <FinancialSection 
        supplierName={migration.supplierName}
        supplierCost={migration.supplierCost}
        ta={migration.ta}
        suppliers={suppliers}
        onChange={(updates) => onChange(updates)}
      />

      <VoucherField 
        voucher={migration.voucher} 
        sendVoucher={migration.sendVoucher} 
        onChange={(updates) => onChange(updates)} 
      />
    </div>
  );
}