import React, { forwardRef } from 'react';
import { Sale, TicketData } from '../../types';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatters';
import { type AirportInfo } from '../../utils/airportInfo';
import './VoucherPDF.css';

interface VoucherPDFProps {
  sale: Sale | null;
  airportMap?: Record<string, AirportInfo>;
  baggageList?: any[];
}

function FlightBlock({ ticket, idx, airportMap, baggageList }: { ticket: TicketData; idx: number; airportMap?: Record<string, AirportInfo>; baggageList?: any[] }) {
  const mainLegs = ticket.legs && ticket.legs.length > 0 ? ticket.legs : [];
  const returnLeg = ticket.returnLeg ? [ticket.returnLeg] : [];
  const allLegs = [...mainLegs, ...returnLeg];

  const legsToRender = allLegs.length > 0 ? allLegs : [{
    origin: '—',
    destination: '—',
    flightNumber: ticket.flightNumber || '—',
    seat: ticket.seatNumber || '—',
    date: ticket.departureDate,
    time: undefined,
    arrivalDate: ticket.arrivalDate,
  }];

  const formatTimeAMPM = (time24: string) => {
    if (!time24) return '—';
    const [hour, minute] = time24.split(':');
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 ? h % 12 : 12;
    return `${h.toString().padStart(2, '0')}:${minute} ${ampm}`;
  };

  const airlineName = (ticket as any).airlineName || ticket.airline || '—';
  const bg = baggageList?.find(b => b.fareType === ticket.baggagePlan && (b.airlineName === airlineName || !airlineName));

  return (
    <div className="v-strip-flight">
      <div className="v-flight-brand">
        <div className="v-airline-name">{airlineName}</div>
        <div className="v-res-number">Reserva: <strong>{ticket.reservationNumber || '—'}</strong></div>
        <div className="v-ticket-number">Tiquete: <strong>{ticket.ticketNumber || (ticket.passengers && ticket.passengers[0]?.nroTiquete) || '—'}</strong></div>
      </div>
      
      <div className="v-flight-legs">
        {legsToRender.map((leg, li) => {
          // Resolve airline for this segment
          const segAirline = (leg as any).airlineName || leg.airline || (li === 0 ? ((ticket as any).airlineName || ticket.airline) : '');
          
          // Resolve baggage plan for this segment
          const segBaggage = leg.baggagePlan || (li === 0 ? ticket.baggagePlan : '');

          // Resolve reservation number for this segment
          const segReservation = leg.reservationNumber || (li === 0 ? ticket.reservationNumber : '');

          return (
            <div className="v-leg-wrapper" key={`leg-${idx}-${li}`} style={{ borderBottom: li === legsToRender.length - 1 ? 'none' : '1px solid #e2e8f0', paddingBottom: li === legsToRender.length - 1 ? '0' : '8px', marginBottom: li === legsToRender.length - 1 ? '0' : '8px' }}>
              <div className="v-leg-row">
                <div className="v-leg-point">
                  <span className="v-leg-code">{leg.origin}</span>
                  <span className="v-leg-date">{leg.date ? formatDate(leg.date) : '—'} {formatTimeAMPM((leg as any).time)}</span>
                </div>
                <div className="v-leg-plane">
                  <span className="v-flight-meta">{leg.flightNumber || '—'}</span>
                  <div className="v-plane-icon">✈</div>
                </div>
                <div className="v-leg-point right">
                  <span className="v-leg-code">{leg.destination}</span>
                  <span className="v-leg-date">{(leg as any).arrivalDate ? formatDate((leg as any).arrivalDate) : (leg.date ? formatDate(leg.date) : '—')} {formatTimeAMPM((leg as any).arrivalTime)}</span>
                </div>
              </div>
              <div className="v-leg-details" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', marginTop: '4px', padding: '0 4px' }}>
                <div><strong>Aerolínea:</strong> {segAirline || '—'}</div>
                <div><strong>Equipaje:</strong> {segBaggage || '—'}</div>
                <div><strong>Reserva:</strong> {segReservation || '—'}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="v-flight-info">
        <div className="v-info-col">
          <span>Equipaje Autorizado</span>
          <strong>{ticket.baggagePlan || 'No especificado'}</strong>
          {bg && <div className="v-baggage-detail">P: {bg.personalItem} / C: {bg.carryOn} / B: {bg.checkedBag}</div>}
        </div>
        <div className="v-pax-list">
          <span>Pasajeros Confirmados</span>
          <div className="v-pax-grid">
            {ticket.passengers?.map((p, i) => (
              <div className="v-pax-item" key={i}>
                <strong>{p.name}</strong> {p.docNumber} {p.asiento ? `(Silla: ${p.asiento})` : ''} {p.esTitular && <span className="v-titular-badge">TITULAR</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="v-strip-flight">
      <div className="v-flight-brand">
        <div className="v-airline-name">{airlineName}</div>
        <div className="v-res-number">Reserva: <strong>{ticket.reservationNumber || '—'}</strong></div>
        <div className="v-ticket-number">Tiquete: <strong>{ticket.ticketNumber || (ticket.passengers && ticket.passengers[0]?.nroTiquete) || '—'}</strong></div>
      </div>
      
      <div className="v-flight-legs">
        {legsToRender.map((leg, li) => (
          <div className="v-leg-row" key={`leg-${idx}-${li}`}>
            <div className="v-leg-point">
              <span className="v-leg-code">{leg.origin}</span>
              <span className="v-leg-date">{leg.date ? formatDate(leg.date) : '—'} {formatTimeAMPM((leg as any).time)}</span>
            </div>
            <div className="v-leg-plane">
              <span className="v-flight-meta">{leg.flightNumber || '—'}</span>
              <div className="v-plane-icon">✈</div>
            </div>
            <div className="v-leg-point right">
              <span className="v-leg-code">{leg.destination}</span>
              <span className="v-leg-date">{(leg as any).arrivalDate ? formatDate((leg as any).arrivalDate) : (leg.date ? formatDate(leg.date) : '—')} {formatTimeAMPM((leg as any).arrivalTime)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="v-flight-info">
        <div className="v-info-col">
          <span>Equipaje Autorizado</span>
          <strong>{ticket.baggagePlan || 'No especificado'}</strong>
          {bg && <div className="v-baggage-detail">P: {bg.personalItem} / C: {bg.carryOn} / B: {bg.checkedBag}</div>}
        </div>
        <div className="v-pax-list">
          <span>Pasajeros Confirmados</span>
          <div className="v-pax-grid">
            {ticket.passengers?.map((p, i) => (
              <div className="v-pax-item" key={i}>
                <strong>{p.name}</strong> {p.docNumber} {p.asiento ? `(Silla: ${p.asiento})` : ''} {p.esTitular && <span className="v-titular-badge">TITULAR</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const VoucherPDF = forwardRef<HTMLDivElement, VoucherPDFProps>(({ sale, airportMap, baggageList }, ref) => {
  if (!sale) {
    return <div className="moontravel-voucher"><div ref={ref} /></div>;
  }

  const currentDate = new Date().toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const tickets     = sale.ticketData      || [];
  const hotels      = sale.hotelData       || [];
  const insurances  = sale.insuranceData   || [];
  const plans       = sale.planData        || [];
  const checkIns    = sale.checkInData     || [];
  const migrations  = sale.migrationData   || [];
  const simCards    = sale.simCardData     || [];
  const carRentals  = sale.carRentalData   || [];
  const fincas      = sale.fincaData       || [];
  const tours       = sale.tourData        || [];
  const conventions = sale.conventionData  || [];
  const restaurants = sale.restaurantData  || [];
  const visas       = sale.visaData        || [];
  const passports   = sale.passportData    || [];
  const pets        = sale.petServiceData  || [];

  const hasOtherProducts = [hotels, insurances, plans, checkIns, migrations, simCards, carRentals, fincas, tours, conventions, restaurants, visas, passports, pets].some(a => a.length > 0);
  const hasAnyProduct = tickets.length > 0 || hasOtherProducts;

  const ServiceStrip = ({ title, icon, children }: { title: string, icon: string, children: React.ReactNode }) => (
    <div className="v-service-strip">
      <div className="v-strip-left">
        <span className="v-strip-icon">{icon}</span>
        <span className="v-strip-title">{title}</span>
      </div>
      <div className="v-strip-content">
        {children}
      </div>
    </div>
  );

  return (
    <div className="moontravel-voucher">
      <div className="v-premium-page" ref={ref}>
        
        {/* HEADER */}
        <header className="v-premium-header">
          <div className="v-header-left">
            <div className="v-agency-name">Moon Travel co </div>
            <div className="v-agency-info">RTN: 264489</div>
            <div className="v-agency-info">NIT: 1102809922-0</div>
            <div className="v-agency-info">Dirección:Cra. 54 #35 21 Obrero,Bello</div>
            <div className="v-agency-info">Correo: gerencia@moontravelco.net</div>
            <div className="v-agency-info">Web: www.moontravelco.com</div>
            <div className="v-agency-info">Tel: 3046495250</div>
          </div>

          
          <div className="v-header-center">
            <img className="v-logo-img" src="/moon-logo.png" alt="Moon Travel Logo" crossOrigin="anonymous" />
          </div>
          
          <div className="v-header-right">
            <div className="v-res-label">RESERVA N°</div>
            <div className="v-res-id">#{sale.id}</div>
            <div className="v-res-dates">
              <div>Venta: {formatDate(sale.date)}</div>
              <div>Impresión: {currentDate}</div>
            </div>
            <div className="v-status-badge">
              {sale.status === 'credito' ? 'CRÉDITO' : sale.status?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* HERO BANNER */}
        <div className="v-premium-hero">
          <div className="v-hero-title">ITINERARIO DE VIAJE</div>
          <div className="v-hero-client">
            <span>Preparado especialmente para:</span>
            <strong>{sale.clientName}</strong>
          </div>
        </div>

        <div className="v-premium-content">
          {/* FLIGHTS */}
          {tickets.length > 0 && (
            <div className="v-section">
              <h3 className="v-section-title">VUELOS CONFIRMADOS</h3>
              {tickets.map((ticket, i) => <FlightBlock key={`ticket-${i}`} ticket={ticket} idx={i} airportMap={airportMap} baggageList={baggageList} />)}
            </div>
          )}

          {/* OTHER SERVICES AS STRIPS */}
          {hasOtherProducts && (
            <div className="v-section">
              <h3 className="v-section-title">SERVICIOS ADICIONALES</h3>
              <div className="v-strips-container">
                
                {hotels.map((hotel, i) => (
                  <ServiceStrip key={`hotel-${i}`} title="Alojamiento" icon="🏨">
                    <div className="v-strip-grid">
                      <div><strong>Hotel:</strong> {hotel.hotelName}</div>
                      <div><strong>Destino:</strong> {hotel.destination}</div>
                      <div><strong>In/Out:</strong> {hotel.startDate ? formatDate(hotel.startDate) : '—'} a {hotel.endDate ? formatDate(hotel.endDate) : '—'}</div>
                      <div><strong>Reserva:</strong> {hotel.reservationNumber || 'Pendiente'}</div>
                      <div className="v-col-full"><strong>Huéspedes:</strong> {(hotel.guests || []).map(g => g.name).join(', ') || '—'}</div>
                      {hotel.observations && <div className="v-col-full"><strong>Observaciones:</strong> {hotel.observations}</div>}
                    </div>
                  </ServiceStrip>
                ))}

                {insurances.map((ins, i) => (
                  <ServiceStrip key={`ins-${i}`} title="Seguro Médico" icon="🛡️">
                    <div className="v-strip-grid">
                      <div><strong>Tipo:</strong> {ins.insuranceType}</div>
                      <div><strong>Proveedor:</strong> {ins.supplier}</div>
                      <div><strong>Teléfono:</strong> {ins.phone}</div>
                      <div className="v-col-full"><strong>Asegurados:</strong> {(ins.members || []).map(m => m.name).join(', ') || '—'}</div>
                    </div>
                  </ServiceStrip>
                ))}

                {plans.map((plan, i) => (
                  <ServiceStrip key={`plan-${i}`} title="Paquete Turístico" icon="📦">
                    <div className="v-strip-grid">
                      <div><strong>Plan:</strong> {plan.planName || plan.packageName}</div>
                      <div><strong>Hotel:</strong> {plan.hotelName}</div>
                      <div><strong>Reserva:</strong> {plan.reservationNumber}</div>
                      <div><strong>Vuelo:</strong> {plan.flightNumber}</div>
                      <div><strong>Fechas:</strong> {plan.startDate ? formatDate(plan.startDate) : '—'} al {plan.endDate ? formatDate(plan.endDate) : '—'}</div>
                    </div>
                  </ServiceStrip>
                ))}

                {[
                  { data: checkIns, title: 'Check-In', icon: '✅', render: (item: any) => <><div className="v-col-full"><strong>Pasajero:</strong> {item.passengerName}</div><div><strong>Vuelo:</strong> {item.flightOrReservation}</div><div><strong>Silla/Equipaje:</strong> {item.seat} / {item.baggage}</div></> },
                  { data: migrations, title: 'Migración', icon: '📋', render: (item: any) => <><div className="v-col-full"><strong>Pasajero:</strong> {item.passengerName}</div><div><strong>Nacionalidad:</strong> {item.nationality}</div><div><strong>Destino:</strong> {item.destinationCountry}</div></> },
                  { data: simCards, title: 'SIM Card', icon: '📱', render: (item: any) => <><div className="v-col-full"><strong>Titular:</strong> {item.mainDriver || item.passengerName}</div><div><strong>País:</strong> {item.destinationCountry}</div><div><strong>Plan:</strong> {item.dataPlan}</div></> },
                  { data: carRentals, title: 'Renta Auto', icon: '🚗', render: (item: any) => <><div className="v-col-full"><strong>Conductor:</strong> {item.mainDriver}</div><div><strong>Vehículo:</strong> {item.vehicleCategory}</div><div><strong>Fechas:</strong> {item.pickupDate ? formatDate(item.pickupDate) : ''} - {item.returnDate ? formatDate(item.returnDate) : ''}</div></> },
                  { data: fincas, title: 'Renta Finca', icon: '🏡', render: (item: any) => <><div className="v-col-full"><strong>Responsable:</strong> {item.responsibleName}</div><div><strong>Fechas:</strong> {item.checkInDate ? formatDate(item.checkInDate) : ''} - {item.checkOutDate ? formatDate(item.checkOutDate) : ''}</div><div><strong>Personas:</strong> {item.adultsCount} Ad. {item.childrenCount} Niñ.</div></> },
                  { data: tours, title: 'Tour', icon: '🧭', render: (item: any) => <>
                  <div className="v-col-full"><strong>Titular:</strong> {item.passengerName}</div>
                  <div className="v-col-full" style={{ whiteSpace: 'pre-wrap' }}><strong>Tour / Planes Seleccionados:</strong><br />{item.selectedTour}</div>
                  <div><strong>Fecha:</strong> {item.preferredDate ? formatDate(item.preferredDate) : ''}</div>
                  <div><strong>Pasajeros:</strong> {item.adultsCount} Ad. {item.childrenCount} Niñ.</div>
                  {item.guideLanguage && <div><strong>Idioma:</strong> {item.guideLanguage}</div>}
                  {item.phone && <div><strong>Teléfono:</strong> {item.phone}</div>}
                  {item.needsTransport && <div><strong>Transporte:</strong> Sí ({item.pickupPoint})</div>}
                </> },
                  { data: conventions, title: 'Convención', icon: '🏛️', render: (item: any) => <><div className="v-col-full"><strong>Organización:</strong> {item.organization}</div><div><strong>Evento:</strong> {item.eventType}</div><div><strong>Espacio:</strong> {item.requiredSpace}</div></> },
                  { data: restaurants, title: 'Restaurante', icon: '🍽️', render: (item: any) => <><div className="v-col-full"><strong>Reserva a nombre de:</strong> {item.reservationName}</div><div><strong>Personas:</strong> {item.peopleCount}</div><div><strong>Fecha/Hora:</strong> {item.dateTime ? formatDateTime(item.dateTime) : ''}</div></> },
                  { data: visas, title: 'Trámite Visa', icon: '🪪', render: (item: any) => <><div className="v-col-full"><strong>Aplicante:</strong> {item.fullName}</div><div><strong>País:</strong> {item.countryApplying}</div><div><strong>Tipo:</strong> {item.visaType}</div></> },
                  { data: passports, title: 'Pasaporte', icon: '📘', render: (item: any) => <><div className="v-col-full"><strong>Solicitante:</strong> {item.fullName}</div><div><strong>Ciudad:</strong> {item.residenceCity}</div><div><strong>Tipo:</strong> {item.processType}</div></> },
                  { data: pets, title: 'Mascota', icon: '🐾', render: (item: any) => <><div className="v-col-full"><strong>Propietario:</strong> {item.ownerName}</div><div><strong>Mascota:</strong> {item.petName} ({item.species})</div><div><strong>Destino:</strong> {item.destinationCountry}</div></> },
                ].map((category) => category.data.map((item: any, idx: number) => (
                  <ServiceStrip key={`${category.title}-${idx}`} title={category.title} icon={category.icon}>
                    <div className="v-strip-grid">
                      {category.render(item)}
                    </div>
                  </ServiceStrip>
                )))}

              </div>
            </div>
          )}

          {!hasAnyProduct && (
             <div className="v-empty-state">No hay servicios detallados en esta reserva.</div>
          )}
        </div>

        {/* PAYMENT SUMMARY & FOOTER */}
        <div className="v-premium-footer">
          <div className="v-payment-box">
            <div className="v-pay-title">RESUMEN FINANCIERO</div>
            <div className="v-pay-line"><span>Asesor:</span> <strong>{sale.asesorName}</strong></div>
            <div className="v-pay-line"><span>Método Pago:</span> <strong>{sale.paymentMethod || (sale.payments && sale.payments.length > 0 ? (sale.payments.length > 1 ? 'Mixto' : sale.payments[0].method) : '—')}</strong></div>
            {(sale.creditPaidAmount ?? 0) > 0 && (
              <div className="v-pay-line"><span>Total Abonado:</span> <strong>{formatCurrency(sale.creditPaidAmount!)}</strong></div>
            )}
            <div className="v-pay-total"><span>VALOR TOTAL:</span> <strong>{formatCurrency(sale.total)}</strong></div>
          </div>
          <div className="v-terms-box">
            <h4>TÉRMINOS Y RECOMENDACIONES</h4>
            <ul>
              <li>Vuelos nacionales: presentación 2h antes. Vuelos internacionales: 4h antes.</li>
              <li>Reconfirmar horarios entre 24 y 48 horas previas al vuelo.</li>
              <li>Es responsabilidad del pasajero portar sus documentos de identidad originales y vigentes.</li>
              <li>El web check-in habilitado 24h previas es responsabilidad del pasajero; la agencia no asume cargos por omisión.</li>
            </ul>
            <div className="v-warning-box">
              ⚠️ <strong>Importante:</strong> Por favor revise minuciosamente toda la información descrita en este voucher. Si encuentra alguna inconsistencia o dato erróneo, comuníquese inmediatamente con su asesor de viajes.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
});

VoucherPDF.displayName = 'VoucherPDF';
