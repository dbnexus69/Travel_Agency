import { Home } from "lucide-react";
import { FormField, Input , CurrencyInput} from "../../ui/Form";
import { FincaData } from "../../../types";
import { ClientInfoSection, VoucherField, FinancialSection } from "./VoucherField";

interface FincaFormProps {
  finca: FincaData;
  client: any;
  suppliers?: any[];
  onChange: (updates: Partial<FincaData>) => void;
}

export function FincaForm({ finca, client, suppliers, onChange }: FincaFormProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {client && <ClientInfoSection client={client} />}

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
          <Home size={14} /> Renta de Finca
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Responsable">
            <Input value={finca.responsibleName} onChange={(e) => onChange({ responsibleName: e.target.value })} placeholder="Nombre completo" />
          </FormField>
          <FormField label="Número de Documento">
            <Input value={finca.docNumber} onChange={(e) => onChange({ docNumber: e.target.value })} placeholder="C.C." />
          </FormField>
          <FormField label="Check-in (Fecha y Hora)">
            <Input type="datetime-local" required min={new Date().toISOString().slice(0, 16)} value={finca.checkInDate} onChange={(e) => onChange({ checkInDate: e.target.value })} />
          </FormField>
          <FormField label="Check-out (Fecha y Hora)">
            <Input type="datetime-local" required min={new Date().toISOString().slice(0, 16)} value={finca.checkOutDate} onChange={(e) => onChange({ checkOutDate: e.target.value })} />
          </FormField>
          <FormField label="Número de Adultos">
            <Input 
              type="text" 
              value={finca.adultsCount} 
              onChange={(e) => {
                let cleaned = e.target.value.replace(/[^0-9]/g, "");
                if (cleaned.length > 3) cleaned = cleaned.slice(0, 3);
                onChange({ adultsCount: cleaned === "" ? ("" as any) : parseInt(cleaned) });
              }} 
            />
          </FormField>
          <FormField label="Número de Niños">
            <Input 
              type="text" 
              value={finca.childrenCount} 
              onChange={(e) => {
                let cleaned = e.target.value.replace(/[^0-9]/g, "");
                if (cleaned.length > 3) cleaned = cleaned.slice(0, 3);
                onChange({ childrenCount: cleaned === "" ? ("" as any) : parseInt(cleaned) });
              }} 
            />
          </FormField>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="has-pets"
              checked={finca.hasPets}
              onChange={(e) => onChange({ hasPets: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="has-pets" className="text-sm font-medium text-gray-700">
              Tiene mascotas
            </label>
          </div>
          <FormField label="Teléfono">
            <Input value={finca.phone} onChange={(e) => onChange({ phone: e.target.value })} placeholder="+57 300 123 4567" />
          </FormField>
        </div>
      </div>

      <FinancialSection 
        supplierName={finca.supplierName}
        supplierCost={finca.supplierCost}
        ta={finca.ta}
        suppliers={suppliers}
        onChange={(updates) => onChange(updates)}
      />

      <VoucherField 
        voucher={finca.voucher} 
        sendVoucher={finca.sendVoucher} 
        onChange={(updates) => onChange(updates)} 
      />
    </div>
  );
}