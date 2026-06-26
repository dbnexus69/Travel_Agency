import { useState, useEffect } from "react";
import { WizardFormData, INITIAL_FORM } from "../components/sales/wizardData";
import { SaleProductId, Sale } from "../types";
import { todayStr } from "../utils/formatters";

interface UseNewSaleWizardParams {
  user: any;
  data: any;
  addSale: (sale: any) => Promise<any>;
  fetchClients: () => void;
  fetchUsers: () => void;
  fetchCommissionAgents: () => void;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function useNewSaleWizard({
  user,
  data,
  addSale,
  fetchClients,
  fetchUsers,
  fetchCommissionAgents,
  onClose,
  onSuccess
}: UseNewSaleWizardParams) {
  const draftKey = `moontravel_new_sale_draft_${user?.id || 'unknown'}`;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardFormData>(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_FORM;
      }
    }
    return {
      ...INITIAL_FORM,
      asesorId: user?.id ? String(user.id) : "",
      asesorName: user?.name || "",
    };
  });
  const [showOtherProducts, setShowOtherProducts] = useState(false);
  const [activeForm, setActiveForm] = useState<SaleProductId | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setShowError(true);
    setTimeout(() => setShowError(false), 4000);
  };

  // Saber si el formulario de tiquetería está completamente vacío (sin tocar)
  const isTicketFormEmpty = (() => {
    if (activeForm === "tiqueteria" && activeIdx !== null) {
      const ticket = form.tickets[activeIdx];
      if (!ticket) return true;
      
      const hasAirline = !!ticket.airline?.trim();
      const hasSupplier = !!ticket.supplier?.trim();
      const hasResNumber = !!ticket.reservationNumber?.trim();
      const paxList = ticket.passengers || ((ticket as any).passengerInfo ? [(ticket as any).passengerInfo] : []);
      const titular = paxList.find((p: any) => p.esTitular) || paxList[0];
      const hasTicketNumber = titular ? !!titular.nroTiquete?.trim() : false;
      const hasCost = ticket.supplierCost > 0;
      const hasTa = ticket.ta > 0;
      
      let hasLegsContent = false;
      if (ticket.legs && ticket.legs.length > 0) {
        hasLegsContent = ticket.legs.some(leg => 
          !!leg.origin?.trim() || !!leg.destination?.trim() || !!leg.flightNumber?.trim() || !!leg.seat?.trim() || !!leg.date?.trim() || !!leg.arrivalDate?.trim()
        );
      }
      
      let hasStopsContent = false;
      if (ticket.outboundStops && ticket.outboundStops.length > 0) {
        hasStopsContent = ticket.outboundStops.some(stop =>
          !!stop.origin?.trim() || !!stop.destination?.trim() || !!stop.flightNumber?.trim() || !!stop.seat?.trim() || !!stop.date?.trim() || !!stop.arrivalDate?.trim()
        );
      }
      
      let hasReturnContent = false;
      if (ticket.returnLeg) {
        const ret = ticket.returnLeg;
        hasReturnContent = !!ret.origin?.trim() || !!ret.destination?.trim() || !!ret.flightNumber?.trim() || !!ret.seat?.trim() || !!ret.date?.trim() || !!ret.arrivalDate?.trim();
      }
      
      let hasReturnStopsContent = false;
      if (ticket.returnStops && ticket.returnStops.length > 0) {
        hasReturnStopsContent = ticket.returnStops.some(stop =>
          !!stop.origin?.trim() || !!stop.destination?.trim() || !!stop.flightNumber?.trim() || !!stop.seat?.trim() || !!stop.date?.trim() || !!stop.arrivalDate?.trim()
        );
      }

      return !(hasAirline || hasSupplier || hasResNumber || hasTicketNumber || hasCost || hasTa || hasLegsContent || hasStopsContent || hasReturnContent || hasReturnStopsContent);
    }
    return false;
  })();

  const isHotelFormEmpty = (() => {
    if (activeForm === "hoteleria" && activeIdx !== null) {
      const hotel = form.hotels[activeIdx];
      if (!hotel) return true;
      const hasHotelName = !!hotel.hotelName?.trim();
      const hasDestination = !!hotel.destination?.trim();
      const hasSupplier = !!hotel.supplier?.trim();
      const hasReservationNumber = !!hotel.reservationNumber?.trim();
      const hasStartDate = !!hotel.startDate?.trim();
      const hasEndDate = !!hotel.endDate?.trim();
      const hasHotelType = !!hotel.hotelType?.trim();
      const hasObservations = !!hotel.observations?.trim();
      const hasCost = hotel.supplierCost > 0;
      const hasTa = hotel.ta > 0;
      
      const client = data.clients.find((c: any) => c.name === form.clientId);
      const initialGuestName = client?.name || "";
      const initialGuestDoc = client?.docNumber || "";
      
      const hasGuests = hotel.guests && hotel.guests.some(g => {
        if (g.name === initialGuestName && g.docNumber === initialGuestDoc) {
          return false;
        }
        return !!g.name?.trim() || !!g.docNumber?.trim();
      });

      return !(hasHotelName || hasDestination || hasSupplier || hasReservationNumber || hasStartDate || hasEndDate || hasHotelType || hasObservations || hasCost || hasTa || hasGuests);
    }
    return false;
  })();

  const isInsuranceFormEmpty = (() => {
    if (activeForm === "seguros_viaje" && activeIdx !== null) {
      const ins = form.insurances[activeIdx];
      if (!ins) return true;
      const hasInsuranceType = !!ins.insuranceType?.trim();
      const hasPhone = !!ins.phone?.trim();
      const hasSupplier = !!ins.supplier?.trim();
      const hasCost = ins.supplierCost > 0;
      const hasTa = ins.ta > 0;
      
      const client = data.clients.find((c: any) => c.name === form.clientId);
      const initialMemberName = client?.name || "";
      const initialMemberDoc = client?.docNumber || "";
      
      const hasMembers = ins.members && ins.members.some(m => {
        if (m.name === initialMemberName && m.docNumber === initialMemberDoc) {
          return false;
        }
        return !!m.name?.trim() || !!m.docNumber?.trim();
      });

      return !(hasInsuranceType || hasPhone || hasSupplier || hasCost || hasTa || hasMembers);
    }
    return false;
  })();

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify(form));
  }, [form, draftKey]);

  useEffect(() => {
    fetchClients();
    fetchUsers();
    fetchCommissionAgents();
  }, [fetchClients, fetchUsers, fetchCommissionAgents]);

  useEffect(() => {
    let calcSupplierCost = 0;
    let calcTa = 0;

    form.tickets.forEach(t => { calcSupplierCost += Number(t.supplierCost) || 0; calcTa += Number(t.ta) || 0; });
    form.hotels.forEach(h => { calcSupplierCost += Number(h.supplierCost) || 0; calcTa += Number(h.ta) || 0; });
    form.insurances.forEach(i => { calcSupplierCost += Number(i.supplierCost) || 0; calcTa += Number(i.ta) || 0; });
    form.plans.forEach(p => { calcSupplierCost += Number(p.supplierCost) || 0; calcTa += Number(p.ta) || 0; });
    form.checkIns.forEach(c => { calcSupplierCost += Number(c.supplierCost) || 0; calcTa += Number(c.ta) || 0; });
    form.migrations.forEach(m => { calcSupplierCost += Number(m.supplierCost) || 0; calcTa += Number(m.ta) || 0; });
    form.simCards.forEach(s => { calcSupplierCost += Number(s.supplierCost) || 0; calcTa += Number(s.ta) || 0; });
    form.carRentals.forEach(cr => { calcSupplierCost += Number(cr.supplierCost) || 0; calcTa += Number(cr.ta) || 0; });
    form.fincas.forEach(f => { calcSupplierCost += Number(f.supplierCost) || 0; calcTa += Number(f.ta) || 0; });
    form.tours.forEach(t => { calcSupplierCost += Number(t.supplierCost) || 0; calcTa += Number(t.ta) || 0; });
    form.conventions.forEach(c => { calcSupplierCost += Number(c.supplierCost) || 0; calcTa += Number(c.ta) || 0; });
    form.restaurants.forEach(r => { calcSupplierCost += Number(r.supplierCost) || 0; calcTa += Number(r.ta) || 0; });
    form.visas.forEach(v => { calcSupplierCost += Number(v.supplierCost) || 0; calcTa += Number(v.ta) || 0; });
    form.passports.forEach(p => { calcSupplierCost += Number(p.supplierCost) || 0; calcTa += Number(p.ta) || 0; });
    form.petServices.forEach(ps => { calcSupplierCost += Number(ps.supplierCost) || 0; calcTa += Number(ps.ta) || 0; });

    const calcTotal = calcSupplierCost + calcTa;

    if (
      form.supplierCost !== calcSupplierCost.toString() ||
      form.ta !== calcTa.toString() ||
      form.total !== calcTotal.toString()
    ) {
      setForm(prev => {
        const commPercentage = parseFloat(prev.commissionAgentPercentage || "0");
        const newCommAmount = calcTa * (commPercentage / 100);
        const retention = parseFloat(prev.commissionAgentRetentionPercentage || "0");
        const newCommNet = newCommAmount * (1 - retention / 100);

        return {
          ...prev,
          supplierCost: calcSupplierCost.toString(),
          ta: calcTa.toString(),
          total: calcTotal.toString(),
          commissionAgentAmount: newCommAmount.toString(),
          commissionAgentNetPayment: newCommNet.toString()
        };
      });
    }
  }, [
    form.tickets, form.hotels, form.insurances, form.plans, form.checkIns,
    form.migrations, form.simCards, form.carRentals, form.fincas, form.tours,
    form.conventions, form.restaurants, form.visas, form.passports, form.petServices
  ]);

  const set = <K extends keyof WizardFormData>(
    key: K,
    value: WizardFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    
    if (key === "creditDueDate") {
      const dateStr = value as string;
      if (dateStr) {
        const selectedDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          setErrors((prev) => ({ ...prev, creditDueDate: "La fecha de vencimiento no puede ser anterior al día de hoy" }));
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.creditDueDate;
            return next;
          });
        }
      } else {
        setErrors((prev) => ({ ...prev, creditDueDate: "La fecha de vencimiento es obligatoria" }));
      }
    } else if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  const toggleProduct = (id: SaleProductId) => {
    setForm((prev) => {
      const isSelecting = !prev.selectedProducts.includes(id);
      const nextProducts = isSelecting
        ? [...prev.selectedProducts, id]
        : prev.selectedProducts.filter((p) => p !== id);
      return { ...prev, selectedProducts: nextProducts };
    });
  };

  const validateStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!form.clientId) errs.clientId = "El cliente es obligatorio";
      if (form.commissionAgentName && !form.commissionAgentId) {
        errs.commissionAgent = "El comisionista ingresado no está registrado";
      } else if (form.commissionAgentId) {
        const agentExists = (data.commissionAgents || []).some(
          (a: any) => String(a.id) === String(form.commissionAgentId)
        );
        if (!agentExists) {
          errs.commissionAgent = "El comisionista seleccionado ya no existe en el sistema";
        }
      }
    }
    if (s === 2) {
      if (form.selectedProducts.length === 0) {
        errs.products = "Debes seleccionar al menos un producto";
      } else if (form.selectedProducts.includes("tiqueteria")) {
        if (!form.tickets || form.tickets.length === 0) {
          errs.products = "Debes configurar al menos un tiquete";
        } else {
          for (let i = 0; i < form.tickets.length; i++) {
            const ticket = form.tickets[i];
            const isStrictlyValid = (() => {
              if (!ticket) return false;
              if (!ticket.supplier?.trim()) return false;
              
              const paxList = ticket.passengers || ((ticket as any).passengerInfo ? [(ticket as any).passengerInfo] : []);
              if (paxList.length === 0) return false;
              const titular = paxList.find((p: any) => p.esTitular) || paxList[0];
              if (!titular.nroTiquete?.trim() || titular.nroTiquete.length < 8 || titular.nroTiquete.length > 16) return false;
              
              if (!ticket.legs || ticket.legs.length === 0) return false;
              for (const leg of ticket.legs) {
                if (!leg.origin?.trim() || !leg.destination?.trim() || !leg.flightNumber?.trim() || leg.flightNumber.length < 3 || leg.flightNumber.length > 6 || !leg.date?.trim() || !leg.arrivalDate?.trim()) {
                  return false;
                }
                if (!leg.airline?.trim() || !leg.reservationNumber || leg.reservationNumber.length !== 6 || !/^[A-Z0-9]+$/.test(leg.reservationNumber) || !leg.baggagePlan?.trim()) {
                  return false;
                }
                if (leg.seat && (leg.seat.length < 2 || leg.seat.length > 5)) return false;
              }
              
              if (ticket.hasStops) {
                if (!ticket.outboundStops || ticket.outboundStops.length === 0) return false;
                for (const stop of ticket.outboundStops) {
                  if (!stop.origin?.trim() || !stop.destination?.trim() || !stop.flightNumber?.trim() || stop.flightNumber.length < 3 || stop.flightNumber.length > 6 || !stop.date?.trim() || !stop.arrivalDate?.trim()) {
                    return false;
                  }
                  if (!stop.airline?.trim() || !stop.reservationNumber || stop.reservationNumber.length !== 6 || !/^[A-Z0-9]+$/.test(stop.reservationNumber) || !stop.baggagePlan?.trim()) {
                    return false;
                  }
                  if (stop.seat && (stop.seat.length < 2 || stop.seat.length > 5)) return false;
                }
              }
              
              if (ticket.flightMode === "round_trip") {
                if (!ticket.returnLeg) return false;
                const ret = ticket.returnLeg;
                if (!ret.origin?.trim() || !ret.destination?.trim() || !ret.flightNumber?.trim() || ret.flightNumber.length < 3 || ret.flightNumber.length > 6 || !ret.date?.trim() || !ret.arrivalDate?.trim()) {
                  return false;
                }
                if (!ret.airline?.trim() || !ret.reservationNumber || ret.reservationNumber.length !== 6 || !/^[A-Z0-9]+$/.test(ret.reservationNumber) || !ret.baggagePlan?.trim()) {
                  return false;
                }
                if (ret.seat && (ret.seat.length < 2 || ret.seat.length > 5)) return false;
                
                if (ticket.returnHasStops) {
                  if (!ticket.returnStops || ticket.returnStops.length === 0) return false;
                  for (const stop of ticket.returnStops) {
                    if (!stop.origin?.trim() || !stop.destination?.trim() || !stop.flightNumber?.trim() || stop.flightNumber.length < 3 || stop.flightNumber.length > 6 || !stop.date?.trim() || !stop.arrivalDate?.trim()) {
                      return false;
                    }
                    if (!stop.airline?.trim() || !stop.reservationNumber || stop.reservationNumber.length !== 6 || !/^[A-Z0-9]+$/.test(stop.reservationNumber) || !stop.baggagePlan?.trim()) {
                      return false;
                    }
                    if (stop.seat && (stop.seat.length < 2 || stop.seat.length > 5)) return false;
                  }
                }
              }
              
              if (ticket.supplierCost <= 0) return false;
              if (ticket.ta < 0) return false;
              if (!ticket.supplierPaymentMethod) return false;
              return true;
            })();

            if (!isStrictlyValid) {
              triggerError(`El servicio de Tiquetería #${i + 1} tiene campos requeridos vacíos o inválidos. Por favor, edítalo y complétalos para continuar.`);
              errs.tiqueteriaValidation = "invalid";
              break;
            }
          }
        }
      }

      if (form.selectedProducts.includes("hoteleria")) {
        if (!form.hotels || form.hotels.length === 0) {
          errs.products = "Debes configurar al menos un hotel";
        } else {
          for (let i = 0; i < form.hotels.length; i++) {
            const hotel = form.hotels[i];
            const isStrictlyValid = (() => {
              if (!hotel) return false;
              if (!hotel.hotelName || hotel.hotelName.trim().length < 2 || hotel.hotelName.trim().length > 50) return false;
              if (!hotel.destination || hotel.destination.trim().length === 0) return false;
              if (!hotel.supplier || hotel.supplier.trim().length === 0) return false;
              if (!hotel.reservationNumber || hotel.reservationNumber.trim().length === 0 || hotel.reservationNumber.trim().length > 20) return false;
              if (!hotel.startDate || !hotel.endDate) return false;
              
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              if (new Date(hotel.startDate) < now || new Date(hotel.endDate) < now) return false;

              if (hotel.supplierCost <= 0) return false;
              if (hotel.ta < 0) return false;
              if (!hotel.supplierPaymentMethod) return false;
              return true;
            })();

            if (!isStrictlyValid) {
              triggerError(`El servicio de Hotelería #${i + 1} tiene campos requeridos vacíos o inválidos. Por favor, edítalo.`);
              errs.hoteleriaValidation = "invalid";
              break;
            }
          }
        }
      }

      if (form.selectedProducts.includes("seguros_viaje")) {
        if (!form.insurances || form.insurances.length === 0) {
          errs.products = "Debes configurar al menos un seguro de viaje";
        } else {
          for (let i = 0; i < form.insurances.length; i++) {
            const ins = form.insurances[i];
            const isStrictlyValid = (() => {
              if (!ins) return false;
              if (!ins.insuranceType || ins.insuranceType.trim().length < 3 || ins.insuranceType.trim().length > 40) return false;

              const cleanedPhone = ins.phone ? ins.phone.replace(/\D/g, "") : "";
              if (cleanedPhone.length < 7 || cleanedPhone.length > 15) return false;

              if (ins.supplierCost <= 0 || ins.ta < 0) return false;
              if (!ins.supplierPaymentMethod) return false;

              return true;
            })();

            if (!isStrictlyValid) {
              triggerError(`El servicio de Seguro de Viaje #${i + 1} tiene campos requeridos vacíos o inválidos.`);
              errs.segurosValidation = "invalid";
              break;
            }
          }
        }
      }

      if (form.selectedProducts.includes("planes")) {
        if (!form.plans || form.plans.length === 0) {
          errs.products = "Debes configurar al menos un paquete";
        } else {
          for (let i = 0; i < form.plans.length; i++) {
            const plan = form.plans[i];
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
              if (!plan.supplierPaymentMethod) errorsList.push("Método de Pago Proveedor (requerido)");

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
              triggerError(`El servicio de Paquetes #${i + 1} tiene errores: ${errorsList.join(", ")}`);
              errs.planesValidation = "invalid";
              break;
            }
          }
        }
      }

      if (form.selectedProducts.includes("checkin")) {
        if (!form.checkIns || form.checkIns.length === 0) {
          errs.products = "Debes configurar al menos un Check-in";
        } else {
          for (let i = 0; i < form.checkIns.length; i++) {
            const check = form.checkIns[i];
            const errorsList: string[] = [];
            if (!check) errorsList.push("Check-in inválido");
            else {
              if (!check.passengerName || check.passengerName.trim().length === 0) errorsList.push("Nombre del pasajero (requerido)");
              if (!check.docType || check.docType.trim().length === 0) errorsList.push("Tipo de Doc (requerido)");
              if (!check.docNumber || check.docNumber.trim().length === 0) errorsList.push("Nº de Doc (requerido)");
              if (!check.flightOrReservation || check.flightOrReservation.trim().length < 3 || check.flightOrReservation.trim().length > 8) errorsList.push("Vuelo o Reserva (3-8 chars)");
              if (!check.travelDate) errorsList.push("Fecha de viaje (requerido)");
              if (check.seat && check.seat.trim().length > 10) errorsList.push("Silla Preferida (máx 10 chars)");

              const now = new Date();
              now.setHours(0, 0, 0, 0);
              if (check.travelDate && new Date(check.travelDate) < now) errorsList.push("Fecha de viaje debe ser futura");
            }

            if (errorsList.length > 0) {
              triggerError(`El servicio de Check-in #${i + 1} tiene errores: ${errorsList.join(", ")}`);
              errs.checkinValidation = "invalid";
              break;
            }
          }
        }
      }

      if (form.selectedProducts.includes("documentacion_migratoria")) {
        if (!form.migrations || form.migrations.length === 0) {
          errs.products = "Debes configurar al menos una Documentación Migratoria";
        } else {
          for (let i = 0; i < form.migrations.length; i++) {
            const mig = form.migrations[i];
            const errorsList: string[] = [];
            if (!mig) errorsList.push("Documento inválido");
            else {
              if (!mig.passengerName || mig.passengerName.trim().length === 0) errorsList.push("Nombre del pasajero (requerido)");
              if (!mig.birthDate) errorsList.push("Fecha de Nacimiento (requerida)");
              if (!mig.nationality || mig.nationality.trim().length === 0 || mig.nationality.length > 30) errorsList.push("Nacionalidad (1-30 chars)");
              if (!mig.docType) errorsList.push("Tipo de Documento (requerido)");
              if (!mig.docNumber || mig.docNumber.trim().length < 5 || mig.docNumber.length > 20) errorsList.push("Número de Documento (5-20 chars)");
              if (mig.docType === "Pasaporte" && !mig.passportExpiry) errorsList.push("Vencimiento de Documento (requerido)");
              if (!mig.destinationCountry || mig.destinationCountry.trim().length === 0) errorsList.push("País de Destino (requerido)");
              if (!mig.requestedDocType || mig.requestedDocType.trim().length === 0) errorsList.push("Trámite (requerido)");
              
              if (mig.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(mig.email)) errorsList.push("Correo electrónico inválido");
                if (!mig.email.endsWith(".com")) errorsList.push("Correo debe terminar en .com");
              }

              const now = new Date();
              now.setHours(0, 0, 0, 0);
              
              if (mig.birthDate && new Date(mig.birthDate) > now) errorsList.push("Fecha de Nacimiento no puede ser futura");
              if (mig.passportExpiry && new Date(mig.passportExpiry) < now) errorsList.push("Vencimiento de Documento no puede ser pasado");
            }

            if (errorsList.length > 0) {
              triggerError(`El servicio de Documentación Migratoria #${i + 1} tiene errores: ${errorsList.join(", ")}`);
              errs.migrationValidation = "invalid";
              break;
            }
          }
        }
      }

      if (form.selectedProducts.includes("simcard")) {
        if (!form.simCards || form.simCards.length === 0) {
          errs.products = "Debes configurar al menos una SIM Card";
        } else {
          for (let i = 0; i < form.simCards.length; i++) {
            const sim = form.simCards[i];
            const errorsList: string[] = [];
            if (!sim) errorsList.push("SIM Card inválida");
            else {
              if (!sim.passengerName || sim.passengerName.trim().length === 0) errorsList.push("Nombre del Titular (requerido)");
              if (!sim.destinationCountry || sim.destinationCountry.trim().length === 0) errorsList.push("País de Destino (requerido)");
              if (!sim.arrivalDate) errorsList.push("Fecha de Llegada (requerida)");
              if (!sim.tripDuration || isNaN(Number(sim.tripDuration)) || Number(sim.tripDuration) <= 0) errorsList.push("Duración del Viaje (mayor a 0)");
              
              if (sim.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(sim.email)) errorsList.push("Correo electrónico inválido");
                if (!sim.email.endsWith(".com")) errorsList.push("Correo debe terminar en .com");
              }

              const now = new Date();
              now.setHours(0, 0, 0, 0);
              
              if (sim.arrivalDate && new Date(sim.arrivalDate) < now) errorsList.push("Fecha de Llegada no puede ser pasada");
            }

            if (errorsList.length > 0) {
              triggerError(`El servicio de SIM Card #${i + 1} tiene errores: ${errorsList.join(", ")}`);
              errs.simCardValidation = "invalid";
              break;
            }
          }
        }
      }

      if (form.selectedProducts.includes("renta_vehiculos")) {
        if (!form.carRentals || form.carRentals.length === 0) {
          errs.products = "Debes configurar al menos una Renta de Vehículo";
        } else {
          for (let i = 0; i < form.carRentals.length; i++) {
            const car = form.carRentals[i];
            const errorsList: string[] = [];
            if (!car) errorsList.push("Renta de Vehículo inválida");
            else {
              if (!car.mainDriver || car.mainDriver.trim().length === 0) errorsList.push("Conductor Principal (requerido)");
              if (!car.pickupDate) errorsList.push("Recogida (requerida)");
              if (!car.returnDate) errorsList.push("Devolución (requerida)");
              
              const cleanLicense = car.licenseNumber ? car.licenseNumber.replace(/[\-\s]/g, "") : "";
              if (cleanLicense.length < 5 || cleanLicense.length > 18) {
                errorsList.push("Número de Licencia (5-18 caracteres)");
              }
              
              if (car.additionalDrivers === undefined || car.additionalDrivers < 0 || car.additionalDrivers > 10) {
                errorsList.push("Conductores Adicionales (0-10)");
              }

              if (!car.guaranteeCreditCard || car.guaranteeCreditCard.trim().length !== 4) {
                errorsList.push("Tarjeta de Garantía (exactamente 4 dígitos)");
              }

              const now = new Date();
              now.setHours(0, 0, 0, 0);
              
              if (car.pickupDate && new Date(car.pickupDate) < now) errorsList.push("Recogida no puede ser pasada");
              if (car.returnDate && new Date(car.returnDate) < now) errorsList.push("Devolución no puede ser pasada");
              if (car.pickupDate && car.returnDate && new Date(car.returnDate) < new Date(car.pickupDate)) errorsList.push("Devolución debe ser posterior a la Recogida");
            }

            if (errorsList.length > 0) {
              triggerError(`El servicio de Renta de Vehículo #${i + 1} tiene errores: ${errorsList.join(", ")}`);
              errs.carRentalValidation = "invalid";
              break;
            }
          }
        }
      }

      if (form.selectedProducts.includes("renta_fincas")) {
        if (!form.fincas || form.fincas.length === 0) {
          errs.products = "Debes configurar al menos una Renta de Finca";
        } else {
          for (let i = 0; i < form.fincas.length; i++) {
            const finca = form.fincas[i];
            const errorsList: string[] = [];
            if (!finca) errorsList.push("Renta de Finca inválida");
            else {
              if (!finca.fincaName || finca.fincaName.trim().length < 3 || finca.fincaName.trim().length > 30) errorsList.push("Nombre de la Finca (3-30 caracteres)");
              if (!finca.fincaCity || finca.fincaCity.trim().length < 3 || finca.fincaCity.trim().length > 50) errorsList.push("Ciudad o Pueblo (3-50 caracteres)");
              if (!finca.fincaAddress || finca.fincaAddress.trim().length < 5 || finca.fincaAddress.trim().length > 30) errorsList.push("Dirección de la Finca (5-30 caracteres)");
              if (!finca.responsibleName || finca.responsibleName.trim().length === 0) errorsList.push("Responsable (requerido)");
              if (!finca.checkInDate) errorsList.push("Check-in (requerido)");
              if (!finca.checkOutDate) errorsList.push("Check-out (requerido)");
              
              if (finca.adultsCount === undefined || isNaN(Number(finca.adultsCount)) || Number(finca.adultsCount) < 0 || Number(finca.adultsCount) > 999) errorsList.push("Número de Adultos (0-999)");
              if (finca.childrenCount === undefined || isNaN(Number(finca.childrenCount)) || Number(finca.childrenCount) < 0 || Number(finca.childrenCount) > 999) errorsList.push("Número de Niños (0-999)");

              const now = new Date();
              now.setHours(0, 0, 0, 0);
              
              if (finca.checkInDate && new Date(finca.checkInDate) < now) errorsList.push("Check-in no puede ser pasado");
              if (finca.checkOutDate && new Date(finca.checkOutDate) < now) errorsList.push("Check-out no puede ser pasado");
              if (finca.checkInDate && finca.checkOutDate && new Date(finca.checkOutDate) < new Date(finca.checkInDate)) errorsList.push("Check-out debe ser posterior al Check-in");
              if (!finca.supplierPaymentMethod) errorsList.push("Método de Pago Proveedor (requerido)");
            }

            if (errorsList.length > 0) {
              triggerError(`El servicio de Renta de Finca #${i + 1} tiene errores: ${errorsList.join(", ")}`);
              errs.fincaValidation = "invalid";
              break;
            }
          }
        }
      }

      if (form.selectedProducts.includes("tours")) {
        if (!form.tours || form.tours.length === 0) {
          errs.products = "Debes configurar al menos un Tour";
        } else {
          for (let i = 0; i < form.tours.length; i++) {
            const tour = form.tours[i];
            const errorsList: string[] = [];
            if (!tour) errorsList.push("Tour inválido");
            else {
              if (!tour.passengerName || tour.passengerName.trim().length === 0) errorsList.push("Nombre del Pasajero (requerido)");
              if (!tour.selectedTour || tour.selectedTour.trim().length < 3 || tour.selectedTour.length > 1000) errorsList.push("Tour Seleccionado (3-1000 caracteres)");
              if (!tour.pickupPoint || tour.pickupPoint.trim().length === 0 || tour.pickupPoint.length > 30) errorsList.push("Punto de Recogida (1-30 caracteres)");
              if (!tour.preferredDate) errorsList.push("Fecha y Hora Preferida (requerida)");
              
              if (tour.adultsCount === undefined || isNaN(Number(tour.adultsCount)) || Number(tour.adultsCount) < 0 || Number(tour.adultsCount) > 999) errorsList.push("Número de Adultos (0-999)");
              if (tour.childrenCount === undefined || isNaN(Number(tour.childrenCount)) || Number(tour.childrenCount) < 0 || Number(tour.childrenCount) > 999) errorsList.push("Número de Niños (0-999)");

              const now = new Date();
              now.setHours(0, 0, 0, 0);
              
              if (tour.preferredDate && new Date(tour.preferredDate) < now) errorsList.push("Fecha Preferida no puede ser pasada");
              if (!tour.supplierPaymentMethod) errorsList.push("Método de Pago Proveedor (requerido)");
            }

            if (errorsList.length > 0) {
              triggerError(`El servicio de Tour #${i + 1} tiene errores: ${errorsList.join(", ")}`);
              errs.tourValidation = "invalid";
              break;
            }
          }
        }
      }

      if (form.selectedProducts.includes("centros_convencion")) {
        if (!form.conventions || form.conventions.length === 0) {
          errs.products = "Debes configurar al menos un Centro de Convención";
        } else {
          for (let i = 0; i < form.conventions.length; i++) {
            const conv = form.conventions[i];
            const errorsList: string[] = [];
            if (!conv) errorsList.push("Convención inválida");
            else {
              if (!conv.placeName || conv.placeName.trim().length < 3 || conv.placeName.trim().length > 40) errorsList.push("Nombre del Lugar (3-40 caracteres)");
              if (!conv.city || conv.city.trim().length < 3 || conv.city.trim().length > 40) errorsList.push("Ciudad (3-40 caracteres)");
              if (!conv.address || conv.address.trim().length < 5 || conv.address.trim().length > 40) errorsList.push("Dirección (5-40 caracteres)");
              if (!conv.requiredSpace || conv.requiredSpace.trim().length < 3 || conv.requiredSpace.trim().length > 40) errorsList.push("Espacio Requerido (3-40 caracteres)");
              if (!conv.eventType || conv.eventType.trim().length < 3 || conv.eventType.trim().length > 40) errorsList.push("Tipo de Evento (3-40 caracteres)");
              if (!conv.organization || conv.organization.trim().length === 0) errorsList.push("Organización (requerido)");
              if (!conv.contactName || conv.contactName.trim().length === 0) errorsList.push("Nombre de Contacto (requerido)");
              if (!conv.startDate) errorsList.push("Fecha Inicio (requerida)");
              if (!conv.endDate) errorsList.push("Fecha Fin (requerida)");
              
              if (conv.estimatedAttendance === undefined || isNaN(Number(conv.estimatedAttendance)) || Number(conv.estimatedAttendance) < 0 || Number(conv.estimatedAttendance) > 999) errorsList.push("Asistencia Estimada (0-999)");

              if (conv.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(conv.email)) errorsList.push("Correo electrónico inválido");
                if (!conv.email.endsWith(".com")) errorsList.push("Correo debe terminar en .com");
              }

              const now = new Date();
              now.setHours(0, 0, 0, 0);
              
              if (conv.startDate && new Date(conv.startDate) < now) errorsList.push("Fecha Inicio no puede ser pasada");
              if (conv.endDate && new Date(conv.endDate) < now) errorsList.push("Fecha Fin no puede ser pasada");
              if (conv.startDate && conv.endDate && new Date(conv.endDate) < new Date(conv.startDate)) errorsList.push("Fecha Fin debe ser posterior a la de Inicio");
              if (!conv.supplierPaymentMethod) errorsList.push("Método de Pago Proveedor (requerido)");
            }

            if (errorsList.length > 0) {
              triggerError(`El servicio de Centro de Convenciones #${i + 1} tiene errores: ${errorsList.join(", ")}`);
              errs.conventionValidation = "invalid";
              break;
            }
          }
        }
      }

      if (form.selectedProducts.includes("restaurantes")) {
        if (!form.restaurants || form.restaurants.length === 0) {
          errs.products = "Debes configurar al menos un Restaurante";
        } else {
          for (let i = 0; i < form.restaurants.length; i++) {
            const rest = form.restaurants[i];
            const errorsList: string[] = [];
            if (!rest) errorsList.push("Restaurante inválido");
            else {
              if (!rest.reservationName || rest.reservationName.trim().length === 0) errorsList.push("Nombre de Reserva (requerido)");
              if (!rest.dateTime) errorsList.push("Fecha y Hora (requerida)");
              if (!rest.phone || rest.phone.trim().length === 0) errorsList.push("Celular (requerido)");
              
              if (rest.peopleCount === undefined || isNaN(Number(rest.peopleCount)) || Number(rest.peopleCount) < 1 || Number(rest.peopleCount) > 999) errorsList.push("Nº de Personas (1-999)");

              if (rest.tablePreference && (rest.tablePreference.trim().length < 3 || rest.tablePreference.length > 30)) {
                errorsList.push("Preferencia de Mesa (3-30 caracteres)");
              }
              if (rest.menuType && (rest.menuType.trim().length < 3 || rest.menuType.length > 30)) {
                errorsList.push("Tipo de Menú (3-30 caracteres)");
              }

              const now = new Date();
              now.setHours(0, 0, 0, 0);
              
              if (rest.dateTime && new Date(rest.dateTime) < now) errorsList.push("Fecha y Hora no puede ser pasada");

              if (rest.ta === undefined || rest.ta <= 0) {
                errorsList.push("Tarifa Admin (TA) obligatoria (> $0)");
              }
            }

            if (errorsList.length > 0) {
              triggerError(`El servicio de Restaurante #${i + 1} tiene errores: ${errorsList.join(", ")}`);
              errs.restaurantValidation = "invalid";
              break;
            }
          }
        }
      }

      if (form.selectedProducts.includes("visa")) {
        if (!form.visas || form.visas.length === 0) {
          errs.products = "Debes configurar al menos una Visa";
        } else {
          for (let i = 0; i < form.visas.length; i++) {
            const visa = form.visas[i];
            const errorsList: string[] = [];
            if (!visa) errorsList.push("Visa inválida");
            else {
              if (!visa.fullName || visa.fullName.trim().length === 0) errorsList.push("Nombre Completo (requerido)");
              
              if (!visa.birthDate) {
                errorsList.push("Fecha de Nacimiento (requerida)");
              } else {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                if (new Date(visa.birthDate) > now) {
                  errorsList.push("Fecha de Nacimiento no puede ser futura");
                }
              }

              if (!visa.nationality || visa.nationality.trim().length < 3 || visa.nationality.trim().length > 30) {
                errorsList.push("Nacionalidad (3-30 caracteres)");
              } else if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(visa.nationality)) {
                errorsList.push("Nacionalidad solo permite letras");
              }

              if (!visa.docType) errorsList.push("Tipo de Documento (requerido)");

              if (!visa.docNumber || visa.docNumber.trim().length < 5 || visa.docNumber.length > 20) {
                errorsList.push("Número de Documento (5-20 chars)");
              } else if (/[^a-zA-Z0-9]/.test(visa.docNumber)) {
                errorsList.push("Número de Documento debe ser alfanumérico");
              }

              if (visa.docType === "Pasaporte" && !visa.passportExpiration) {
                errorsList.push("Vencimiento de Documento (requerido)");
              } else if (visa.passportExpiration) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                if (new Date(visa.passportExpiration) < now) {
                  errorsList.push("Vencimiento de Documento no puede ser pasado");
                }
              }

              if (!visa.countryApplying || visa.countryApplying.trim().length < 3 || visa.countryApplying.trim().length > 30) {
                errorsList.push("País al que aplica (3-30 caracteres)");
              } else if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(visa.countryApplying)) {
                errorsList.push("País al que aplica solo permite letras");
              }

              if (visa.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(visa.email)) errorsList.push("Correo electrónico inválido");
                if (!visa.email.endsWith(".com")) errorsList.push("Correo debe terminar en .com");
              }

              if (visa.estimatedTravelDate) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                if (new Date(visa.estimatedTravelDate) < now) {
                  errorsList.push("Fecha Estimada de Viaje no puede ser pasada");
                }
              }
            }

            if (errorsList.length > 0) {
              triggerError(`El servicio de Visa #${i + 1} tiene errores: ${errorsList.join(", ")}`);
              errs.visaValidation = "invalid";
              break;
            }
          }
        }
      }

      if (form.selectedProducts.includes("pasaporte")) {
        if (!form.passports || form.passports.length === 0) {
          errs.products = "Debes configurar al menos un Pasaporte";
        } else {
          for (let i = 0; i < form.passports.length; i++) {
            const passport = form.passports[i];
            const errorsList: string[] = [];
            if (!passport) errorsList.push("Pasaporte inválido");
            else {
              if (!passport.fullName || passport.fullName.trim().length === 0) errorsList.push("Nombre Completo (requerido)");
              if (!passport.idNumber || passport.idNumber.trim().length === 0) errorsList.push("Número de Identificación (requerido)");
              
              if (!passport.birthDate) {
                errorsList.push("Fecha de Nacimiento (requerida)");
              } else {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                if (new Date(passport.birthDate) > now) {
                  errorsList.push("Fecha de Nacimiento no puede ser futura");
                }
              }

              if (!passport.residenceCity || passport.residenceCity.trim().length === 0) {
                errorsList.push("Ciudad de Residencia (requerida)");
              } else {
                if (passport.residenceCity.length > 85) {
                  errorsList.push("Ciudad de Residencia (máximo 85 caracteres)");
                }
                if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(passport.residenceCity)) {
                  errorsList.push("Ciudad de Residencia no debe tener números ni caracteres especiales");
                }
              }

              if (passport.estimatedTravelDate) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                if (new Date(passport.estimatedTravelDate) < now) {
                  errorsList.push("Fecha Estimada de Viaje no puede ser pasada");
                }
              }

              if (!passport.phone || passport.phone.trim().length === 0) {
                errorsList.push("Teléfono de Contacto (requerido)");
              } else {
                if (passport.phone.length > 15) {
                  errorsList.push("Teléfono de Contacto (máximo 15 caracteres)");
                }
                if (/[a-zA-Z]/.test(passport.phone)) {
                  errorsList.push("Teléfono de Contacto no puede contener letras");
                }
              }
            }

            if (errorsList.length > 0) {
              triggerError(`El trámite de Pasaporte #${i + 1} tiene errores: ${errorsList.join(", ")}`);
              errs.passportValidation = "invalid";
              break;
            }
          }
        }
      }

      if (form.selectedProducts.includes("servicio_mascotas")) {
        if (!form.petServices || form.petServices.length === 0) {
          errs.products = "Debes configurar al menos un Transporte de Mascotas";
        } else {
          for (let i = 0; i < form.petServices.length; i++) {
            const pet = form.petServices[i];
            const errorsList: string[] = [];
            if (!pet) errorsList.push("Transporte de Mascotas inválido");
            else {
              if (!pet.ownerName || pet.ownerName.trim().length === 0) {
                errorsList.push("Nombre del Dueño (requerido)");
              } else if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(pet.ownerName)) {
                errorsList.push("Nombre del Dueño solo permite letras");
              }

              if (!pet.petName || pet.petName.trim().length === 0) {
                errorsList.push("Nombre de la Mascota (requerido)");
              } else if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(pet.petName)) {
                errorsList.push("Nombre de la Mascota solo permite letras");
              }

              if (!pet.breed || pet.breed.trim().length === 0) {
                errorsList.push("Raza (requerida)");
              } else if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(pet.breed)) {
                errorsList.push("Raza solo permite letras");
              }

              if (pet.weight === undefined || isNaN(pet.weight) || pet.weight < 0 || pet.weight > 999.9) {
                errorsList.push("Peso debe ser entre 0 y 999.9 kg");
              }
              if (pet.transportCompany && (pet.transportCompany.length < 3 || pet.transportCompany.length > 40)) {
                errorsList.push("Nombre de Empresa (3-40 caracteres)");
              }

              if (!pet.travelDate) {
                errorsList.push("Fecha de Viaje (requerida)");
              } else {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                if (new Date(pet.travelDate) < now) {
                  errorsList.push("Fecha de Viaje no puede ser pasada");
                }
              }

              if (!pet.destinationCountry || pet.destinationCountry.trim().length < 3 || pet.destinationCountry.trim().length > 30) {
                errorsList.push("País Destino (3-30 caracteres)");
              } else if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(pet.destinationCountry)) {
                errorsList.push("País Destino solo permite letras");
              }

              if (!pet.phone || pet.phone.trim().length === 0) {
                errorsList.push("Teléfono (requerido)");
              } else {
                if (pet.phone.length > 15) {
                  errorsList.push("Teléfono (máximo 15 caracteres)");
                }
                if (/[a-zA-Z]/.test(pet.phone)) {
                  errorsList.push("Teléfono no puede contener letras");
                }
              }
              if (!pet.supplierPaymentMethod) errorsList.push("Método de Pago Proveedor (requerido)");
            }

            if (errorsList.length > 0) {
              triggerError(`El Transporte de Mascota #${i + 1} tiene errores: ${errorsList.join(", ")}`);
              errs.petValidation = "invalid";
              break;
            }
          }
        }
      }
    }
    if (s === 3) {
      if (!form.total || Number(form.total) <= 0) errs.total = "El valor total debe ser mayor a $0";
      
      const hasPayments = form.payments && form.payments.length > 0;
      if (form.status !== "credito" && !form.paymentMethod && !hasPayments) {
        errs.paymentMethod = "La forma de pago es obligatoria";
      }
      
      if (!form.status) {
        errs.status = "El estado de la venta es obligatorio";
      }
      
      const isCreditState = form.status === "credito" || form.status === "abonado";
      if (isCreditState) {
        if (!form.creditDueDate) {
          errs.creditDueDate = "La fecha de vencimiento es obligatoria";
        } else {
          const selectedDate = new Date(form.creditDueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          selectedDate.setHours(0, 0, 0, 0);
          if (selectedDate < today) {
            errs.creditDueDate = "La fecha de vencimiento no puede ser anterior al día de hoy";
          }
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (validateStep(step)) setStep(step + 1);
  };
  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const openForm = (type: SaleProductId, idx: number) => {
    setActiveForm(type);
    setActiveIdx(idx);
  };

  const closeActiveForm = () => {
    if (activeForm && activeIdx !== null) {
      let targetKey: string | null = null;
      switch (activeForm) {
        case "tiqueteria": targetKey = "tickets"; break;
        case "hoteleria": targetKey = "hotels"; break;
        case "seguros_viaje": targetKey = "insurances"; break;
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
        if (currentItem && isItemEmpty(currentItem, activeForm)) {
          const nextItems = [...items];
          nextItems.splice(activeIdx, 1);
          
          setForm(prev => {
            const updatedForm = { ...prev, [targetKey!]: nextItems };
            if (nextItems.length === 0) {
              updatedForm.selectedProducts = prev.selectedProducts.filter(p => p !== activeForm);
            }
            return updatedForm;
          });
        }
      }
    }
    setActiveForm(null);
    setActiveIdx(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) {
      setStep(1);
      return;
    }
    if (!validateStep(2)) {
      setStep(2);
      return;
    }
    if (!validateStep(3)) {
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    const client = data.clients.find((c: any) => c.name === form.clientId);
    if (!client) {
      setErrors({ ...errors, clientId: "El cliente no es válido" });
      setStep(1);
      return;
    }

    const fullObservations = form.observations.trim();

    const mappedTickets = form.tickets.map(t => {
      return {
        ...t,
        seatNumber: t.legs && t.legs.length > 0 ? t.legs[0].seat : ""
      };
    });

    const calculatedPaymentMethod = form.payments && form.payments.length > 0
      ? (form.payments.length === 1 ? form.payments[0].methodName : "Mixto")
      : form.paymentMethod;

    let finalStatus = form.status;
    if (form.status === "credito" && form.payments && form.payments.length > 0) {
      finalStatus = "abonado";
    }

    const mappedInsurances = form.insurances.map(ins => ({
      ...ins,
      phone: ins.phone ? ins.phone.replace(/\D/g, "") : ""
    }));

    const saleData: any = {
      clientId: client.id,
      clientName: client.name,
      asesorId: Number(form.asesorId) || user!.id,
      asesorName: form.asesorName || user!.name,
      date: todayStr(),
      createdAt: form.createdAt || undefined,
      total: Number(form.total),
      paymentMethod: calculatedPaymentMethod,
      payments: form.payments?.map(p => ({
        amount: Number(p.amount),
        method: p.methodId,
        reference: p.reference
      })),
      status: finalStatus as Sale["status"],
      responsableId: form.responsableId ? Number(form.responsableId) : undefined,
      observations: fullObservations,
      products: form.selectedProducts,
      ticketData: mappedTickets.length > 0 ? mappedTickets : undefined,
      hotelData: form.hotels.length > 0 ? form.hotels : undefined,
      insuranceData: mappedInsurances.length > 0 ? mappedInsurances : undefined,
      planData: form.plans.length > 0 ? form.plans : undefined,
      checkInData: form.checkIns.length > 0 ? form.checkIns : undefined,
      migrationData: form.migrations.length > 0 ? form.migrations : undefined,
      simCardData: form.simCards.length > 0 ? form.simCards : undefined,
      carRentalData: form.carRentals.length > 0 ? form.carRentals : undefined,
      fincaData: form.fincas.length > 0 ? form.fincas : undefined,
      tourData: form.tours.length > 0 ? form.tours : undefined,
      conventionData: form.conventions.length > 0 ? form.conventions : undefined,
      restaurantData: form.restaurants.length > 0 ? form.restaurants : undefined,
      visaData: form.visas.length > 0 ? form.visas : undefined,
      passportData: form.passports.length > 0 ? form.passports : undefined,
      petServiceData: form.petServices.length > 0 ? form.petServices : undefined,
      isCredit: form.isCredit,
      creditDueDate: form.isCredit ? form.creditDueDate : undefined,
      commissionAgentId: Number(form.commissionAgentId) || undefined,
      commissionAgentName: form.commissionAgentName || undefined,
      commissionAgentAmount: Number(form.commissionAgentAmount) || undefined,
      commissionAgentRetentionPercentage: Number(form.commissionAgentRetentionPercentage) || undefined,
      commissionAgentNetPayment: Number(form.commissionAgentNetPayment) || undefined,
      isSettled: !!form.commissionAgentId ? false : undefined,
      ta: Number(form.ta) || 0,
      supplierCost: Number(form.supplierCost) || 0,
    };

    try {
      await addSale(saleData as any);
      localStorage.removeItem(draftKey);

      const hasVouchersToSend = [
        ...form.checkIns, ...form.migrations, ...form.simCards, ...form.carRentals,
        ...form.fincas, ...form.tours, ...form.conventions, ...form.restaurants,
        ...form.visas, ...form.passports, ...form.petServices
      ].some(item => item.sendVoucher);

      if (hasVouchersToSend) {
        onSuccess("Venta registrada y vouchers enviados al cliente");
      } else {
        onSuccess("Venta registrada exitosamente");
      }
      onClose();
    } catch (err: any) {
      console.error("Error al registrar venta:", err);
      const errMsg = err?.response?.data?.error?.message || "Ocurrió un error interno en el servidor al registrar la venta. Por favor, asegúrese de reiniciar el servidor backend local para cargar los nuevos módulos de base de datos.";
      alert(`Error al registrar venta: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem(draftKey);
    onClose();
  };

  return {
    step,
    setStep,
    form,
    setForm,
    showOtherProducts,
    setShowOtherProducts,
    activeForm,
    setActiveForm,
    activeIdx,
    setActiveIdx,
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
    validateStep
  };
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
