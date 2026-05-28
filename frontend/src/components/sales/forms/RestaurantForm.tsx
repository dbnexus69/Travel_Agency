import { LuUtensils } from "react-icons/lu";
import { FormField, Input, Combobox , CurrencyInput} from "../../ui/Form";
import { RestaurantData } from "../../../types";
import { ClientInfoSection, VoucherField, FinancialSection } from "./VoucherField";

interface RestaurantFormProps {
  restaurant: RestaurantData;
  client: any;
  suppliers?: any[];
  onChange: (updates: Partial<RestaurantData>) => void;
}

export function RestaurantForm({ restaurant, client, suppliers, onChange }: RestaurantFormProps) {
  const toggleRestriction = (res: string) => {
    const current = restaurant.dietaryRestrictions;
    const next = current.includes(res) ? current.filter((i) => i !== res) : [...current, res];
    onChange({ dietaryRestrictions: next });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {client && <ClientInfoSection client={client} />}

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
          <LuUtensils size={14} /> Reserva de Restaurante
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nombre de la Reserva *">
            <Input value={restaurant.reservationName} onChange={(e) => onChange({ reservationName: e.target.value })} placeholder="A nombre de..." />
          </FormField>
          <FormField label="Fecha y Hora *">
            <Input type="datetime-local" value={restaurant.dateTime} onChange={(e) => onChange({ dateTime: e.target.value })} />
          </FormField>
          <FormField label="Nº de Personas *">
            <Input type="number" min={1} value={restaurant.peopleCount} onChange={(e) => onChange({ peopleCount: parseInt(e.target.value) || 1 })} />
          </FormField>
          <FormField label="Preferencia de Mesa">
            <Combobox
              value={restaurant.tablePreference}
              onChange={(val) => onChange({ tablePreference: val })}
              options={[
                { value: "interior", label: "Interior" },
                { value: "terraza", label: "Terraza" },
                { value: "privado", label: "Privado" },
                { value: "barra", label: "Barra" },
              ]}
            />
          </FormField>
          <FormField label="Tipo de Menú">
            <Combobox
              value={restaurant.menuType}
              onChange={(val) => onChange({ menuType: val })}
              options={[
                { value: "à la carte", label: "À la carte" },
                { value: "menú fijo", label: "Menú Fijo" },
                { value: "maridaje", label: "Maridaje" },
              ]}
            />
          </FormField>
          <FormField label="Ocasión Especial">
            <Combobox
              value={restaurant.specialOccasion}
              onChange={(val) => onChange({ specialOccasion: val })}
              options={[
                { value: "cumpleaños", label: "Cumpleaños" },
                { value: "aniversario", label: "Aniversario" },
                { value: "cena negocio", label: "Cena de Negocios" },
                { value: "otro", label: "Otro" },
              ]}
            />
          </FormField>
          <FormField label="Celular *">
            <Input type="tel" value={restaurant.phone} onChange={(e) => onChange({ phone: e.target.value })} placeholder="+57 300 123 4567" />
          </FormField>
          <div className="md:col-span-2 space-y-3">
            <label className="text-sm font-medium text-gray-700">Restricciones Alimentarias</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["Vegano", "Sin Gluten", "Halal", "Lactosa", "Nueces", "Mariscos"].map((res) => (
                <label key={res} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-100 cursor-pointer hover:border-primary/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={restaurant.dietaryRestrictions.includes(res)}
                    onChange={() => toggleRestriction(res)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-gray-600">{res}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <FinancialSection 
        supplierName={restaurant.supplierName}
        supplierCost={restaurant.supplierCost}
        ta={restaurant.ta}
        suppliers={suppliers}
        onChange={(updates) => onChange(updates)}
      />

      <VoucherField 
        voucher={restaurant.voucher} 
        sendVoucher={restaurant.sendVoucher} 
        onChange={(updates) => onChange(updates)} 
      />
    </div>
  );
}