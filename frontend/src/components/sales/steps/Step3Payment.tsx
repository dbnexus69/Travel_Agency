import { CreditCard, Coins } from "lucide-react";
import { FormField, Input, Select, Textarea, Combobox , CurrencyInput} from "../../ui/Form";
import { WizardFormData } from "../wizardData";

export function Step3Payment({ form, set, data, errors }: any) {
  return (
    <div className="animate-fade-in space-y-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CreditCard size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-primary text-base">
              Observaciones y Pago
            </h3>
            <p className="text-xs text-gray-500">
              Agrega comentarios y configura la forma de pago.
            </p>
          </div>
        </div>

        <FormField label="Observaciones / Comentarios">
          <Textarea
            value={form.observations}
            onChange={(e) => set("observations", e.target.value)}
            placeholder="Detalles adicionales sobre los productos seleccionados..."
            rows={3}
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Valor Total *" error={errors.total}>
            <CurrencyInput
              value={form.total}
              readOnly
              className="bg-gray-100"
              placeholder="0"
              error={errors.total}
            />
          </FormField>

          <FormField
            label="Forma de Pago *"
            error={errors.paymentMethod}
          >
            <Combobox
              value={form.paymentMethod}
              onChange={(val) => set("paymentMethod", val)}
              options={data.config.paymentMethods.map((p: any) => ({
                value: p.name,
                label: p.name,
              }))}
              placeholder="Selecciona o escribe..."
              error={errors.paymentMethod}
            />
          </FormField>

          <FormField label="T.A. (Tarifa Administrativa)">
            <CurrencyInput
              value={form.ta}
              readOnly
              className="bg-gray-100"
              placeholder="0"
            />
          </FormField>

          <FormField label="Costo Proveedores">
            <CurrencyInput
              value={form.supplierCost}
              readOnly
              className="bg-gray-100"
              placeholder="0"
            />
          </FormField>

          <FormField label="Estado" error={errors.status}>
            <Combobox
              value={form.status}
              onChange={(val) => {
                set("status", val);
                set("isCredit", val === "credito");
              }}
              placeholder="Selecciona un estado..."
              options={[
                { value: "credito", label: "Crédito" },
                { value: "abonado", label: "Completado" },
                { value: "pagado", label: "Finalizado" },
              ]}
              error={errors.status}
            />
          </FormField>


        {form.isCredit && (
          <FormField label="Fecha de Vencimiento" error={errors.creditDueDate}>
            <Input
              type="date"
              value={form.creditDueDate}
              onChange={(e) => set("creditDueDate", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              error={errors.creditDueDate}
            />
          </FormField>
        )}
        </div>

        {/* Sección Comisionista */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
          {form.commissionAgentId ? (
            <div className="col-span-2 flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Coins size={16} />
              </div>
              <p className="text-sm font-bold text-primary">Comisionista: {form.commissionAgentName}</p>
            </div>
          ) : (
            <p className="col-span-2 text-xs text-gray-400 italic">Venta directa (sin comisionista asignado)</p>
          )}

          {form.commissionAgentId && (
            <>
              <FormField label="Comisión Bruta (monto acordado)">
                <CurrencyInput
                  value={form.commissionAgentAmount}
                  onChange={(val) => {
                    if (val.length > 8) return;
                    const gross = parseFloat(val) || 0;
                    const retention = parseFloat(form.commissionAgentRetentionPercentage) || 0;
                    const net = gross * (1 - retention / 100);
                    set("commissionAgentAmount", val);
                    set("commissionAgentNetPayment", net.toString());
                  }}
                  placeholder="0"
                />
              </FormField>
              <FormField label="% Retención para Oficina">
                <Input
                  type="number"
                  value={form.commissionAgentRetentionPercentage}
                  onChange={(e) => {
                    let val = e.target.value;
                    let retention = parseFloat(val) || 0;
                    if (retention > 100) {
                      retention = 100;
                      val = "100";
                    }
                    const gross = parseFloat(form.commissionAgentAmount) || 0;
                    const net = gross * (1 - retention / 100);
                    set("commissionAgentRetentionPercentage", val);
                    set("commissionAgentNetPayment", net.toString());
                  }}
                  min="0"
                  max="100"
                  placeholder="Ej. 10.5"
                />
              </FormField>
              <FormField label="Neto a Pagar al Comisionista">
                <CurrencyInput
                  value={form.commissionAgentNetPayment}
                  readOnly
                  className="bg-gray-100 font-bold text-emerald-600"
                  placeholder="0"
                />
              </FormField>
            </>
          )}
        </div>

        {/* Summary card */}
        {Number(form.total) > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mt-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Resumen Financiero
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  Total
                </p>
                <p className="font-black text-gray-800">
                  ${Number(form.total).toLocaleString("es-CO")}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  Proveedores
                </p>
                <p className="font-black text-rose-600">
                  ${(Number(form.supplierCost) || 0).toLocaleString("es-CO")}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  Comisionista
                </p>
                <p className="font-black text-amber-600">
                  ${(Number(form.commissionAgentNetPayment) || 0).toLocaleString("es-CO")}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  Ganancia Oficina
                </p>
                <p className="font-black text-emerald-600">
                  $
                  {(
                    Number(form.total) -
                    (Number(form.supplierCost) || 0) -
                    (Number(form.commissionAgentNetPayment) || 0)
                  ).toLocaleString("es-CO")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
