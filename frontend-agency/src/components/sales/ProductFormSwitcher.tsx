import React from "react";
import { SaleProductId } from "../../types";
import { WizardFormData } from "./wizardData";
import {
  HotelForm,
  InsuranceForm,
  CheckInForm,
  PlanForm,
  MigrationForm,
  SimCardForm,
  CarRentalForm,
  FincaForm,
  TourForm,
  ConventionForm,
  RestaurantForm,
  VisaForm,
  PassportForm,
  PetServiceForm,
  TicketForm,
} from "./forms";
import {
  INITIAL_TICKET,
  INITIAL_HOTEL,
  INITIAL_INSURANCE,
  INITIAL_PLAN,
  INITIAL_CHECKIN,
  INITIAL_MIGRATION,
  INITIAL_SIMCARD,
  INITIAL_CAR_RENTAL,
  INITIAL_FINCA,
  INITIAL_TOUR,
  INITIAL_CONVENTION,
  INITIAL_RESTAURANT,
  INITIAL_VISA,
  INITIAL_PASSPORT,
  INITIAL_PET_SERVICE,
} from "./wizardData";

interface ProductFormSwitcherProps {
  activeForm: SaleProductId | null;
  activeIdx: number | null;
  form: WizardFormData;
  client: any;
  data: any;
  set: (key: keyof WizardFormData, value: any) => void;
  triggerError: (msg: string) => void;
}

export function ProductFormSwitcher({
  activeForm,
  activeIdx,
  form,
  client,
  data,
  set,
  triggerError,
}: ProductFormSwitcherProps) {
  if (activeIdx === null || activeForm === null) return null;

  switch (activeForm) {
    case "tiqueteria":
      return (
        <TicketForm
          ticket={form.tickets[activeIdx] || INITIAL_TICKET(client)}
          mainClient={client}
          onChange={(updates) => {
            const next = [...form.tickets];
            next[activeIdx] = { ...next[activeIdx], ...updates };
            set("tickets", next);
          }}
          airlines={data.config.airlines}
          suppliers={data.config.suppliers}
          paymentMethods={data.config.cards}
          airports={data.config.airports}
          baggage={data.config.baggage}
          clients={data.clients}
          triggerError={triggerError}
        />
      );
    case "hoteleria":
      return (
        <HotelForm
          hotel={form.hotels[activeIdx] || INITIAL_HOTEL(client)}
          mainClient={client}
          onChange={(updates) => {
            const next = [...form.hotels];
            next[activeIdx] = { ...next[activeIdx], ...updates };
            set("hotels", next);
          }}
          data={data}
          triggerError={triggerError}
        />
      );
    case "seguros_viaje":
      return (
        <InsuranceForm
          insurance={form.insurances[activeIdx] || INITIAL_INSURANCE(client)}
          onChange={(updates) => {
            const next = [...form.insurances];
            next[activeIdx] = { ...next[activeIdx], ...updates };
            set("insurances", next);
          }}
          data={data}
          client={client}
        />
      );
    case "planes":
      return (
        <PlanForm
          plan={form.plans[activeIdx] || INITIAL_PLAN(client)}
          mainClient={client}
          onChange={(updates) => {
            const next = [...form.plans];
            next[activeIdx] = { ...next[activeIdx], ...updates };
            set("plans", next);
          }}
          data={data}
          triggerError={triggerError}
        />
      );
    case "checkin":
      return (
        <CheckInForm
          checkIn={form.checkIns[activeIdx] || INITIAL_CHECKIN(client)}
          client={client}
          suppliers={data.config.suppliers}
          baggage={data.config.baggage}
          paymentMethods={data.config.cards}
          onChange={(updates) => {
            const next = [...form.checkIns];
            next[activeIdx] = { ...next[activeIdx], ...updates };
            set("checkIns", next);
          }}
          triggerError={triggerError}
        />
      );
    case "documentacion_migratoria":
      return (
        <MigrationForm
          migration={form.migrations[activeIdx] || INITIAL_MIGRATION(client)}
          client={client}
          suppliers={data.config.suppliers}
          paymentMethods={data.config.cards}
          onChange={(updates) => {
            const next = [...form.migrations];
            next[activeIdx] = { ...next[activeIdx], ...updates };
            set("migrations", next);
          }}
          triggerError={triggerError}
        />
      );
    case "simcard":
      return (
        <SimCardForm
          sim={form.simCards[activeIdx] || INITIAL_SIMCARD(client)}
          client={client}
          suppliers={data.config.suppliers}
          paymentMethods={data.config.cards}
          onChange={(updates) => {
            const next = [...form.simCards];
            next[activeIdx] = { ...next[activeIdx], ...updates };
            set("simCards", next);
          }}
          triggerError={triggerError}
        />
      );
    case "renta_vehiculos":
      return (
        <CarRentalForm
          car={form.carRentals[activeIdx] || INITIAL_CAR_RENTAL(client)}
          client={client}
          suppliers={data.config.suppliers}
          paymentMethods={data.config.cards}
          onChange={(updates) => {
            const next = [...form.carRentals];
            next[activeIdx] = { ...next[activeIdx], ...updates };
            set("carRentals", next);
          }}
          triggerError={triggerError}
        />
      );
    case "renta_fincas":
      return (
        <FincaForm
          finca={form.fincas[activeIdx] || INITIAL_FINCA(client)}
          client={client}
          suppliers={data.config.suppliers}
          paymentMethods={data.config.cards}
          onChange={(updates) => {
            const next = [...form.fincas];
            next[activeIdx] = { ...next[activeIdx], ...updates };
            set("fincas", next);
          }}
          triggerError={triggerError}
        />
      );
    case "tours":
      return (
        <TourForm
          tour={form.tours[activeIdx] || INITIAL_TOUR(client)}
          client={client}
          suppliers={data.config.suppliers}
          paymentMethods={data.config.cards}
          onChange={(updates) => {
            const next = [...form.tours];
            next[activeIdx] = { ...next[activeIdx], ...updates };
            set("tours", next);
          }}
          triggerError={triggerError}
        />
      );
    case "centros_convencion":
      return (
        <ConventionForm
          convention={form.conventions[activeIdx] || INITIAL_CONVENTION(client)}
          client={client}
          suppliers={data.config.suppliers}
          paymentMethods={data.config.cards}
          onChange={(updates) => {
            const next = [...form.conventions];
            next[activeIdx] = { ...next[activeIdx], ...updates };
            set("conventions", next);
          }}
          triggerError={triggerError}
        />
      );
    case "restaurantes":
      return (
        <RestaurantForm
          restaurant={form.restaurants[activeIdx] || INITIAL_RESTAURANT(client)}
          client={client}
          suppliers={data.config.suppliers}
          paymentMethods={data.config.cards}
          onChange={(updates) => {
            const next = [...form.restaurants];
            next[activeIdx] = { ...next[activeIdx], ...updates };
            set("restaurants", next);
          }}
          triggerError={triggerError}
        />
      );
    case "visa":
      return (
        <VisaForm
          visa={form.visas[activeIdx] || INITIAL_VISA(client)}
          client={client}
          suppliers={data.config.suppliers}
          paymentMethods={data.config.cards}
          onChange={(updates) => {
            const next = [...form.visas];
            next[activeIdx] = { ...next[activeIdx], ...updates };
            set("visas", next);
          }}
          triggerError={triggerError}
        />
      );
    case "pasaporte":
      return (
        <PassportForm
          passport={form.passports[activeIdx] || INITIAL_PASSPORT(client)}
          client={client}
          suppliers={data.config.suppliers}
          paymentMethods={data.config.cards}
          onChange={(updates) => {
            const next = [...form.passports];
            next[activeIdx] = { ...next[activeIdx], ...updates };
            set("passports", next);
          }}
          triggerError={triggerError}
        />
      );
    case "servicio_mascotas":
      return (
        <PetServiceForm
          pet={form.petServices[activeIdx] || INITIAL_PET_SERVICE(client)}
          client={client}
          suppliers={data.config.suppliers}
          paymentMethods={data.config.cards}
          onChange={(updates) => {
            const next = [...form.petServices];
            next[activeIdx] = { ...next[activeIdx], ...updates };
            set("petServices", next);
          }}
          triggerError={triggerError}
        />
      );

    default:
      return null;
  }
}
