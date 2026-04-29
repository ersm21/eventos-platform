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

export default function BookMeetingPage() {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
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

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      setError('Debes escribir tu nombre.');
      return;
    }

    if (!customerEmail.trim()) {
      setError('Debes escribir tu email.');
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

    const { error: insertError } = await supabase.from('meeting_requests').insert([
      {
        user_id: user?.id ?? null,
        slot_id: selectedSlot.id,
        customer_name: customerName,
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
          customerName,
          customerEmail,
          requestedDate: selectedSlot.slot_date,
          requestedTime: selectedSlot.slot_time,
          notes,
        }),
      });
    } catch {
      // no bloqueamos al usuario si el email falla
    }

    setSlots((prev) => prev.filter((slot) => slot.id !== selectedSlot.id));
    setSuccessMessage('Tu solicitud de reunión fue enviada correctamente.');
    setCustomerName('');
    setCustomerEmail('');
    setNotes('');
    setSelectedSlotId('');
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
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Tu nombre"
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
              <label style={labelStyle}>Horario disponible</label>

              {loadingSlots ? (
                <div style={infoBoxStyle}>Cargando horarios disponibles...</div>
              ) : slots.length === 0 ? (
                <div style={infoBoxStyle}>
                  No hay horarios disponibles en este momento.
                </div>
              ) : (
                <select
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Selecciona un horario</option>
                  {slots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.slot_date} · {slot.slot_time}
                    </option>
                  ))}
                </select>
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