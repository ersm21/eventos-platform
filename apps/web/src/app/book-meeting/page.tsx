'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import AppNavbar from '../../components/AppNavbar';

type MeetingSlot = {
  id: string;
  slot_date: string;
  slot_time: string;
  is_active: boolean | null;
  created_at: string | null;
};

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-DO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatShortDay(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('es-DO', { weekday: 'short' });
}

function formatDayNumber(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return '';

  return String(date.getDate());
}

function formatMonthLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('es-DO', { month: 'short' });
}

function buildNextThirtyDays() {
  const days: string[] = [];
  const today = new Date();

  for (let index = 0; index < 30; index += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    days.push(date.toISOString().slice(0, 10));
  }

  return days;
}

export default function BookMeetingPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadSlots = async () => {
      setLoadingSlots(true);
      setError(null);

      const { data, error } = await supabase
        .from('meeting_slots')
        .select('*')
        .eq('is_active', true)
        .gte('slot_date', new Date().toISOString().slice(0, 10))
        .lte(
          'slot_date',
          new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10)
        )
        .order('slot_date', { ascending: true })
        .order('slot_time', { ascending: true });

      if (error) {
        setError(error.message);
        setLoadingSlots(false);
        return;
      }

      setSlots((data || []) as MeetingSlot[]);
      setLoadingSlots(false);
    };

    loadSlots();
  }, []);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId) || null,
    [slots, selectedSlotId]
  );

  const nextThirtyDays = useMemo(() => buildNextThirtyDays(), []);

  const slotsByDate = useMemo(() => {
    return slots.reduce<Record<string, MeetingSlot[]>>((accumulator, slot) => {
      accumulator[slot.slot_date] = accumulator[slot.slot_date] || [];
      accumulator[slot.slot_date].push(slot);
      return accumulator;
    }, {});
  }, [slots]);

  const selectedDateSlots = selectedDate ? slotsByDate[selectedDate] || [] : [];

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      setError('Debes escribir tu nombre.');
      return;
    }

    if (!lastName.trim()) {
      setError('Debes escribir tu apellido.');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Debes escribir tu número de teléfono.');
      return;
    }

    if (!customerEmail.trim()) {
      setError('Debes escribir tu email.');
      return;
    }

    if (!selectedDate) {
      setError('Debes elegir una fecha disponible.');
      return;
    }

    if (!selectedSlot) {
      setError('Debes elegir un horario disponible.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const extraNotes = [
      `Teléfono: ${phoneNumber.trim()}`,
      companyName.trim() ? `Empresa: ${companyName.trim()}` : 'Empresa: No aplica',
      notes.trim() ? `Notas: ${notes.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const { error: insertError } = await supabase.from('meeting_requests').insert([
      {
        user_id: user?.id ?? null,
        slot_id: selectedSlot.id,
        customer_name: fullName,
        customer_email: customerEmail,
        requested_date: selectedSlot.slot_date,
        requested_time: selectedSlot.slot_time,
        notes,
        status: 'pending',
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    const { error: slotUpdateError } = await supabase
      .from('meeting_slots')
      .update({ is_active: false })
      .eq('id', selectedSlot.id);

    if (slotUpdateError) {
      setError(slotUpdateError.message);
      setSaving(false);
      return;
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meeting_request',
          fullName,
          customerEmail,
          requestedDate: selectedSlot.slot_date,
          requestedTime: selectedSlot.slot_time,
          notes: extraNotes,
        }),
      });
    } catch {
      // no bloqueamos al usuario si el email falla
    }

    setSlots((prev) => prev.filter((slot) => slot.id !== selectedSlot.id));
    setSuccessMessage('Tu solicitud de reunión fue enviada correctamente.');
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    setCompanyName('');
    setCustomerEmail('');
    setNotes('');
    setSelectedSlotId('');
    setSelectedDate('');
    setSaving(false);
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <AppNavbar ctaHref="/my-meetings" ctaLabel="Mis reuniones" />

        <section style={cardStyle}>
          <p style={eyebrowStyle}>
            Reservar reunión
          </p>

          <h1 style={titleStyle}>Solicita una reunión</h1>

          <p style={textStyle}>
            Elige uno de los horarios disponibles y envíanos tu solicitud.
          </p>

          {error && (
            <div
              style={errorBoxStyle}
            >
              {error}
            </div>
          )}

          {successMessage && (
            <div
              style={successBoxStyle}
            >
              {successMessage}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
              marginTop: 20,
            }}
          >
            <div>
              <label style={labelStyle}>Nombre</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Tu nombre"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Apellido</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Tu apellido"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Número de teléfono</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ej: 829-935-9774"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>
                Empresa <span style={optionalLabelStyle}>(si aplica)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nombre de la empresa"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Tu email"
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Fecha disponible</label>

              {loadingSlots ? (
                <div style={infoBoxStyle}>Cargando horarios disponibles...</div>
              ) : slots.length === 0 ? (
                <div style={infoBoxStyle}>
                  No hay horarios disponibles en este momento.
                </div>
              ) : (
                <>
                  <div style={calendarGridStyle}>
                    {nextThirtyDays.map((date) => {
                      const availableCount = slotsByDate[date]?.length || 0;
                      const isSelected = selectedDate === date;
                      const isAvailable = availableCount > 0;

                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => {
                            if (!isAvailable) return;
                            setSelectedDate(date);
                            setSelectedSlotId('');
                            setError(null);
                          }}
                          disabled={!isAvailable}
                          style={getCalendarDayStyle(isSelected, isAvailable)}
                        >
                          <span style={calendarWeekdayStyle}>{formatShortDay(date)}</span>
                          <strong style={calendarDayNumberStyle}>
                            {formatDayNumber(date)}
                          </strong>
                          <span style={calendarMonthStyle}>{formatMonthLabel(date)}</span>
                          <small style={calendarAvailabilityStyle}>
                            {isAvailable ? `${availableCount} horarios` : 'No disp.'}
                          </small>
                        </button>
                      );
                    })}
                  </div>

                  <div style={selectedDatePanelStyle}>
                    <div>
                      <p style={selectedDateLabelStyle}>Fecha seleccionada</p>
                      <strong>
                        {selectedDate
                          ? formatDateLabel(selectedDate)
                          : 'Selecciona una fecha del calendario'}
                      </strong>
                    </div>

                    {selectedDate && (
                      <div style={timeSlotsGridStyle}>
                        {selectedDateSlots.map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlotId(slot.id)}
                            style={getTimeSlotStyle(selectedSlotId === slot.id)}
                          >
                            {slot.slot_time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Notas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Cuéntanos sobre tu evento o lo que quieres hablar"
                style={textareaStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              onClick={handleSubmit}
              disabled={saving || loadingSlots}
              style={{
                ...primaryButtonStyle,
                opacity: saving || loadingSlots ? 0.7 : 1,
              }}
            >
              {saving ? 'Enviando...' : 'Solicitar reunión'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  color: '#f8fafc',
  padding: '40px 20px 80px',
  background:
    'radial-gradient(circle at 12% 18%, rgba(168,85,247,0.20), transparent 28%), radial-gradient(circle at 88% 12%, rgba(245,158,11,0.16), transparent 28%), linear-gradient(135deg, #020617 0%, #09090f 48%, #111827 100%)',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
};

const cardStyle: React.CSSProperties = {
  maxWidth: 760,
  margin: '0 auto',
  position: 'relative',
  overflow: 'hidden',
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.84) 0%, rgba(24,24,37,0.88) 44%, rgba(30,27,75,0.74) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.16)',
  borderRadius: 30,
  padding: 26,
  boxShadow: '0 30px 80px rgba(0,0,0,0.34)',
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontWeight: 900,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontSize: 12,
};

const titleStyle: React.CSSProperties = {
  margin: '10px 0 8px',
  fontSize: 38,
  letterSpacing: '-0.04em',
  lineHeight: 1.04,
  textShadow: '0 18px 60px rgba(0,0,0,0.42)',
};

const textStyle: React.CSSProperties = {
  margin: 0,
  color: '#a7b5c9',
  lineHeight: 1.6,
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 18,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(127, 29, 29, 0.30)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  color: '#fecaca',
  boxShadow: '0 14px 28px rgba(0,0,0,0.18)',
};

const successBoxStyle: React.CSSProperties = {
  marginTop: 18,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(20, 83, 45, 0.35)',
  border: '1px solid rgba(74, 222, 128, 0.28)',
  color: '#bbf7d0',
  boxShadow: '0 14px 28px rgba(0,0,0,0.18)',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  borderRadius: 14,
  border: 'none',
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 18px 34px rgba(236,72,153,0.24)',
};

const optionalLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontWeight: 600,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 14,
  border: '1px solid rgba(250, 204, 21, 0.14)',
  background: 'rgba(2, 6, 23, 0.68)',
  color: '#f8fafc',
  outline: 'none',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 110,
  resize: 'vertical',
};

const infoBoxStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 14,
  background: 'rgba(2, 6, 23, 0.42)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  color: '#a7b5c9',
};

const calendarGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))',
  gap: 10,
  marginTop: 8,
};

const calendarWeekdayStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 900,
  textTransform: 'uppercase',
};

const calendarDayNumberStyle: React.CSSProperties = {
  color: '#f8fafc',
  fontSize: 22,
  lineHeight: 1,
};

const calendarMonthStyle: React.CSSProperties = {
  color: '#fbbf24',
  fontSize: 12,
  fontWeight: 800,
  textTransform: 'uppercase',
};

const calendarAvailabilityStyle: React.CSSProperties = {
  color: '#a7b5c9',
  fontSize: 11,
};

function getCalendarDayStyle(
  selected: boolean,
  available: boolean
): React.CSSProperties {
  return {
    minHeight: 104,
    display: 'grid',
    gap: 5,
    justifyItems: 'center',
    alignContent: 'center',
    padding: 10,
    borderRadius: 16,
    border: selected
      ? '1px solid rgba(250, 204, 21, 0.52)'
      : '1px solid rgba(250, 204, 21, 0.12)',
    background: selected
      ? 'linear-gradient(135deg, rgba(245,158,11,0.26) 0%, rgba(236,72,153,0.20) 100%)'
      : available
      ? 'rgba(2, 6, 23, 0.52)'
      : 'rgba(15, 23, 42, 0.30)',
    color: '#f8fafc',
    cursor: available ? 'pointer' : 'not-allowed',
    opacity: available ? 1 : 0.42,
  };
}

const selectedDatePanelStyle: React.CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 18,
  background: 'rgba(2, 6, 23, 0.42)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  display: 'grid',
  gap: 14,
};

const selectedDateLabelStyle: React.CSSProperties = {
  margin: '0 0 5px',
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const timeSlotsGridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

function getTimeSlotStyle(selected: boolean): React.CSSProperties {
  return {
    padding: '9px 12px',
    borderRadius: 999,
    border: selected
      ? '1px solid rgba(250, 204, 21, 0.60)'
      : '1px solid rgba(250, 204, 21, 0.16)',
    background: selected
      ? 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)'
      : 'rgba(2, 6, 23, 0.58)',
    color: '#fff',
    fontWeight: 900,
    cursor: 'pointer',
  };
}