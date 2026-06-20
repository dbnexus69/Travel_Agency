import {
  User,
  Package,
  CreditCard,
  ChevronLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import {
  Sale,
  SaleProductId,
  SALE_PRODUCTS,
} from "../../types";
import { ProductFormSwitcher } from "./ProductFormSwitcher";
import { Step1Client } from "./steps/Step1Client";
import { Step2Products } from "./steps/Step2Products";
import { Step3Payment } from "./steps/Step3Payment";
import { useNewSaleWizard } from "../../hooks/useNewSaleWizard";

interface Props {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const STEPS = [
  { id: 1, label: "Cliente", icon: User },
  { id: 2, label: "Productos", icon: Package },
  { id: 3, label: "Pago", icon: CreditCard },
] as const;

export default function NewSaleWizard({ onClose, onSuccess }: Props) {
  const { data, addSale, fetchClients, fetchUsers, fetchCommissionAgents } = useData();
  const { user } = useAuth();

  const {
    step,
    form,
    showOtherProducts,
    setShowOtherProducts,
    activeForm,
    activeIdx,
    errors,
    isSubmitting,
    showError,
    errorMessage,
    triggerError,
    set,
    toggleProduct,
    goNext,
    goBack,
    openForm,
    closeActiveForm,
    handleSubmit,
    handleCancel,
    isTicketFormEmpty,
    isHotelFormEmpty,
    isInsuranceFormEmpty,
  } = useNewSaleWizard({
    user,
    data,
    addSale,
    fetchClients,
    fetchUsers,
    fetchCommissionAgents,
    onClose,
    onSuccess,
  });

  const actions = {
    showOtherProducts,
    setShowOtherProducts,
    activeForm,
    activeIdx,
    openForm,
  };

  const renderActiveForm = () => {
    if (!activeForm || activeIdx === null) return null;

    const product = SALE_PRODUCTS.find((p) => p.id === activeForm);
    const client = data.clients.find((c: any) => c.name === form.clientId);

    return (
      <form 
        className="flex flex-col flex-1 min-h-0 bg-white animate-fade-in"
        onSubmit={(e) => { 
          e.preventDefault(); 
          if (activeForm === "planes" && activeIdx !== null) {
            const plan = form.plans[activeIdx];
            const errorsList: string[] = [];
            if (!plan) errorsList.push("Plan inválido");
            else {
              if (!plan.planName || plan.planName.trim().length > 50) errorsList.push("Nombre del Plan (máx 50 chars)");
              if (!plan.hotelName || plan.hotelName.trim().length < 2 || plan.hotelName.trim().length > 50) errorsList.push("Nombre del Hotel (2-50 chars)");
              if (!plan.reservationNumber || plan.reservationNumber.trim().length === 0 || plan.reservationNumber.trim().length > 20) errorsList.push("Número de Reservación (1-20 chars)");
              if (plan.adultsCount === undefined || plan.adultsCount < 0 || plan.adultsCount > 999) errorsList.push("Adultos (0-999)");
              if (plan.childrenCount === undefined || plan.childrenCount < 0 || plan.childrenCount > 999) errorsList.push("Menores (0-999)");
              
              if (!plan.flightNumber || plan.flightNumber.trim().length === 0) {
                errorsList.push("Número de Vuelo (requerido)");
              } else if (plan.flightNumber.length > 8) {
                errorsList.push("Número de Vuelo (máx 8 caracteres)");
              } else if (!/^[A-Z0-9]+$/.test(plan.flightNumber)) {
                errorsList.push("Número de Vuelo (debe ser alfanumérico en mayúsculas sin espacios ni caracteres especiales)");
              }
              
              if (!plan.ticketNumber || plan.ticketNumber.trim().length === 0) {
                errorsList.push("Número de Tiquete (requerido)");
              } else if (plan.ticketNumber.length < 13 || plan.ticketNumber.length > 14) {
                errorsList.push("Número de Tiquete (mínimo 13 y máximo 14 dígitos)");
              } else if (!/^\d+$/.test(plan.ticketNumber)) {
                errorsList.push("Número de Tiquete (debe ser estrictamente numérico)");
              }
              
              if (!plan.confirmationNumber || plan.confirmationNumber.trim().length === 0) {
                errorsList.push("Confirmación (requerido)");
              } else if (plan.confirmationNumber.length !== 6) {
                errorsList.push("Confirmación (debe tener exactamente 6 caracteres)");
              } else if (!/^[A-Z0-9]+$/.test(plan.confirmationNumber)) {
                errorsList.push("Confirmación (debe ser alfanumérico en mayúsculas sin espacios ni caracteres especiales)");
              }
              
              if (!plan.supplier || plan.supplier.trim().length === 0) errorsList.push("Proveedor (requerido)");
              
              if (!plan.flightDepartureDate) errorsList.push("Fecha Ida (requerido)");
              if (!plan.flightReturnDate) errorsList.push("Fecha Vuelta (requerido)");
              if (!plan.startDate) errorsList.push("Ingreso Hotel (requerido)");
              if (!plan.endDate) errorsList.push("Salida Hotel (requerido)");
              if (!plan.flightDepartureArrivalDate) errorsList.push("Llegada Ida (requerido)");
              if (!plan.flightReturnArrivalDate) errorsList.push("Llegada Vuelta (requerido)");

              const now = new Date();
              now.setHours(0, 0, 0, 0);
              if (plan.flightDepartureDate && new Date(plan.flightDepartureDate) < now) errorsList.push("Fecha Ida no puede ser anterior a la fecha actual");
              if (plan.flightReturnDate && new Date(plan.flightReturnDate) < now) errorsList.push("Fecha Vuelta no puede ser anterior a la fecha actual");
              if (plan.startDate && new Date(plan.startDate) < now) errorsList.push("Ingreso Hotel no puede ser anterior a la fecha actual");
              if (plan.endDate && new Date(plan.endDate) < now) errorsList.push("Salida Hotel no puede ser anterior a la fecha actual");
              if (plan.flightDepartureArrivalDate && new Date(plan.flightDepartureArrivalDate) < now) errorsList.push("Llegada Ida no puede ser anterior a la fecha actual");
              if (plan.flightReturnArrivalDate && new Date(plan.flightReturnArrivalDate) < now) errorsList.push("Llegada Vuelta no puede ser anterior a la fecha actual");

              if (plan.flightDepartureDate && plan.flightDepartureArrivalDate && new Date(plan.flightDepartureArrivalDate) < new Date(plan.flightDepartureDate)) {
                errorsList.push("Llegada Ida debe ser posterior a la Fecha Ida");
              }
              if (plan.flightReturnDate && plan.flightReturnArrivalDate && new Date(plan.flightReturnArrivalDate) < new Date(plan.flightReturnDate)) {
                errorsList.push("Llegada Vuelta debe ser posterior a la Fecha Vuelta");
              }
              if (plan.flightDepartureDate && plan.flightReturnDate && new Date(plan.flightReturnDate) < new Date(plan.flightDepartureDate)) {
                errorsList.push("Fecha Vuelta debe ser posterior a la Fecha Ida");
              }
              if (plan.startDate && plan.endDate && new Date(plan.endDate) < new Date(plan.startDate)) {
                errorsList.push("Salida Hotel debe ser posterior al Ingreso Hotel");
              }

              if (plan.supplierCost === undefined || plan.supplierCost <= 0) errorsList.push("Costo Proveedor (> $0)");
              if (plan.ta === undefined || plan.ta < 0) errorsList.push("Valor TA (>= $0)");

              if (plan.guests && plan.guests.length > 0) {
                plan.guests.forEach((g, gIdx) => {
                  if (!g.name || g.name.trim().length < 3 || g.name.trim().length > 70) {
                    errorsList.push(`Integrante #${gIdx + 1}: Nombre Completo (3-70 caracteres)`);
                  } else if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(g.name)) {
                    errorsList.push(`Integrante #${gIdx + 1}: Nombre Completo solo permite letras y espacios`);
                  }
                  if (!g.docType || g.docType.trim().length === 0) {
                    errorsList.push(`Integrante #${gIdx + 1}: Tipo de Documento es requerido`);
                  }
                  if (!g.docNumber || g.docNumber.trim().length < 5 || g.docNumber.trim().length > 20) {
                    errorsList.push(`Integrante #${gIdx + 1}: Número de Documento (5-20 caracteres)`);
                  } else if (/[^a-zA-Z0-9]/.test(g.docNumber)) {
                    errorsList.push(`Integrante #${gIdx + 1}: Número de Documento debe ser alfanumérico`);
                  }
                });
              } else {
                errorsList.push("Debes registrar al menos un integrante en el plan");
              }
            }
            if (errorsList.length > 0) {
              triggerError(`El servicio de Paquetes #${activeIdx + 1} tiene errores: ${errorsList.join(", ")}`);
              return;
            }
          }
          closeActiveForm(); 
        }}
      >
        {/* Sub-form Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-gray-50/50">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={closeActiveForm}
              className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
            >
              <ChevronLeft size={18} className="sm:hidden" />
              <ChevronLeft size={20} className="hidden sm:block" />
            </button>
            <div>
              <h3 className="font-bold text-primary flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                {product?.label}
                <span className="text-[10px] sm:text-xs font-normal text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full">
                  Item #{activeIdx + 1}
                </span>
              </h3>
              <p className="text-[9px] sm:text-[10px] text-gray-500 hidden sm:block">
                Completa la información detallada del servicio
              </p>
            </div>
          </div>
          <Button 
            type="submit"
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-white disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm px-3 sm:px-4 py-1.5"
            disabled={(() => {
              if (!activeForm || activeIdx === null) return false;
              if (activeForm === "tiqueteria") return isTicketFormEmpty;
              if (activeForm === "hoteleria") return isHotelFormEmpty;
              if (activeForm === "seguros_viaje") return isInsuranceFormEmpty;
              
              // Generic fallback checking for all other forms
              let targetKey: string | null = null;
              switch (activeForm) {
                case "planes": targetKey = "plans"; break;
                case "checkin": targetKey = "checkIns"; break;
                case "documentacion_migratoria": targetKey = "migrations"; break;
                case "simcard": targetKey = "simCards"; break;
                case "renta_vehiculos": targetKey = "carRentals"; break;
                case "renta_fincas": targetKey = "fincas"; break;
                case "tours": targetKey = "tours"; break;
                case "centros_convencion": targetKey = "conventions"; break;
                case "restaurantes": targetKey = "restaurants"; break;
                case "visa": targetKey = "visas"; break;
                case "pasaporte": targetKey = "passports"; break;
                case "servicio_mascotas": targetKey = "petServices"; break;
              }
              if (targetKey) {
                const items = (form as any)[targetKey] || [];
                const currentItem = items[activeIdx];
                return isItemEmpty(currentItem, activeForm);
              }
              return false;
            })()}
          >
            Listo
          </Button>
        </div>

        {/* Sub-form Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-8 bg-gray-light/30">
          <div className="max-w-3xl mx-auto">
            <ProductFormSwitcher
              activeForm={activeForm}
              activeIdx={activeIdx}
              form={form}
              client={client}
              data={data}
              set={set}
              triggerError={triggerError}
            />
          </div>
        </div>
      </form>
    );
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Toast Error Notification */}
      {showError && (
        <div className="fixed top-24 right-6 z-[200] bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in-right">
          <div className="bg-rose-500 text-white rounded-full p-1 flex-shrink-0">
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="font-bold text-sm">Error de Validación</p>
            <p className="text-xs opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}
      {activeForm ? renderActiveForm() : (
        <>
          {/* Header / Stepper */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-gray-50/50">
            <div className="flex justify-between items-center max-w-2xl mx-auto relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 -z-10" />
              {STEPS.map((s) => {
                const Icon = s.icon;
                const isCompleted = step > s.id;
                const isActive = step === s.id;

                return (
                  <div key={s.id} className="flex flex-col items-center gap-1.5 sm:gap-2">
                    <div
                      className={`
                        w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                        ${
                          isCompleted
                             ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100"
                             : isActive
                               ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105 sm:scale-110"
                               : "bg-white border-gray-200 text-gray-400"
                        }
                      `}
                    >
                      <Icon size={16} className="sm:hidden" />
                      <Icon size={18} className="hidden sm:block" />
                    </div>
                    <span
                      className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                        isActive ? "text-primary" : "text-gray-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 bg-gray-light/30">
            {step === 1 && <Step1Client form={form} set={set} data={data} errors={errors} />}
            {step === 2 && <Step2Products form={form} set={set} data={data} errors={errors} toggleProduct={toggleProduct} actions={actions} />}
            {step === 3 && <Step3Payment form={form} set={set} data={data} errors={errors} />}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-white flex gap-2 sm:gap-3 flex-shrink-0">
        {activeForm ? (
          <div className="flex justify-between items-center w-full gap-2">
            <Button
              variant="outline"
              onClick={closeActiveForm}
              className="px-3 sm:px-6 text-xs sm:text-sm"
            >
              Regresar
            </Button>
            <Button
              onClick={closeActiveForm}
              disabled={(() => {
                if (!activeForm || activeIdx === null) return false;
                if (activeForm === "tiqueteria") return isTicketFormEmpty;
                if (activeForm === "hoteleria") return isHotelFormEmpty;
                if (activeForm === "seguros_viaje") return isInsuranceFormEmpty;
                
                // Generic fallback checking for all other forms
                let targetKey: string | null = null;
                switch (activeForm) {
                  case "planes": targetKey = "plans"; break;
                  case "checkin": targetKey = "checkIns"; break;
                  case "documentacion_migratoria": targetKey = "migrations"; break;
                  case "simcard": targetKey = "simCards"; break;
                  case "renta_vehiculos": targetKey = "carRentals"; break;
                  case "renta_fincas": targetKey = "fincas"; break;
                  case "tours": targetKey = "tours"; break;
                  case "centros_convencion": targetKey = "conventions"; break;
                  case "restaurantes": targetKey = "restaurants"; break;
                  case "visa": targetKey = "visas"; break;
                  case "pasaporte": targetKey = "passports"; break;
                  case "servicio_mascotas": targetKey = "petServices"; break;
                }
                if (targetKey) {
                  const items = (form as any)[targetKey] || [];
                  const currentItem = items[activeIdx];
                  return isItemEmpty(currentItem, activeForm);
                }
                return false;
              })()}
              className="px-3 sm:px-6 text-xs sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Confirmar y Continuar
            </Button>
          </div>
        ) : (
          <div className="flex justify-between items-center w-full gap-2">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={step === 1}
              className="px-3 sm:px-8 border-gray-200 text-gray-500 hover:bg-gray-50 text-xs sm:text-sm"
            >
              Anterior
            </Button>

            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                className="px-3 sm:px-8 border-gray-200 text-gray-500 hover:bg-gray-50 text-xs sm:text-sm"
                onClick={handleCancel}
              >
                Cancelar
              </Button>

              {step < 3 ? (
                <Button
                  onClick={goNext}
                  disabled={step === 2 && form.selectedProducts.length === 0}
                  className="px-4 sm:px-10 group disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  Siguiente
                  <ArrowRight
                    size={16}
                    className="ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform"
                  />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-4 sm:px-10 text-white shadow-lg text-xs sm:text-sm ${
                    isSubmitting
                      ? "bg-emerald-400 cursor-not-allowed shadow-none"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creando...
                    </span>
                  ) : (
                    "Finalizar Venta"
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function isItemEmpty(item: any, category: SaleProductId): boolean {
  if (!item) return true;
  
  if (Number(item.supplierCost) > 0 || Number(item.ta) > 0) return false;
  if (item.supplierName && item.supplierName.trim() !== "") return false;

  switch (category) {
    case "tiqueteria":
      return (
        !item.airline &&
        !item.reservationNumber &&
        !item.flightNumber &&
        (!item.passengers || item.passengers.length === 0 || !item.passengers[0]?.nroTiquete) &&
        !item.seatNumber &&
        (!item.legs || item.legs.every((l: any) => !l.origin && !l.destination && !l.flightNumber))
      );
    case "hoteleria":
      return (
        !item.hotelName &&
        !item.destination &&
        !item.reservationNumber &&
        !item.observations &&
        !item.hotelType
      );
    case "seguros_viaje":
      return !item.phone && !item.insuranceType;
    case "planes":
      return (
        !item.planName &&
        !item.hotelName &&
        !item.reservationNumber &&
        !item.flightNumber &&
        !item.ticketNumber &&
        !item.airline
      );
    case "checkin":
      return (
        !item.flightOrReservation &&
        !item.travelDate &&
        !item.seat &&
        !item.baggage &&
        !item.specialNeeds
      );
    case "documentacion_migratoria":
      return (
        !item.nationality &&
        !item.docNumber &&
        !item.passportExpiry &&
        !item.destinationCountry
      );
    case "simcard":
      return (
        !item.destinationCountry &&
        !item.arrivalDate &&
        !item.tripDuration &&
        !item.dataPlan
      );
    case "renta_vehiculos":
      return (
        !item.licenseNumber &&
        !item.pickupDate &&
        !item.returnDate &&
        !item.guaranteeCreditCard
      );
    case "renta_fincas":
      return !item.checkInDate && !item.checkOutDate && !item.petType;
    case "tours":
      return (
        !item.selectedTour &&
        !item.preferredDate &&
        !item.childrenAges &&
        !item.pickupPoint &&
        !item.medicalConditions &&
        !item.observations
      );
    case "centros_convencion":
      return (
        !item.organization &&
        !item.startDate &&
        !item.endDate &&
        !item.cateringNotes
      );
    case "restaurantes":
      return !item.dateTime;
    case "visa":
      return (
        !item.nationality &&
        !item.docNumber &&
        !item.passportExpiration &&
        !item.countryApplying
      );
    case "pasaporte":
      return !item.residenceCity;
    case "servicio_mascotas":
      return (
        !item.petName &&
        !item.breed &&
        item.weight === 0 &&
        !item.travelDate &&
        !item.destinationCountry &&
        !item.medicalConditions &&
        !item.transportCompany &&
        !item.observations
      );
    default:
      return true;
  }
}
