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
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(59,130,246,0.14), transparent 24%), linear-gradient(180deg, #0f172a 0%, #111827 50%, #0b1120 100%)',
        color: '#e5e7eb',
        padding: '40px 20px 80px',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <AppNavbar ctaHref="/my-meetings" ctaLabel="Mis reuniones" />

        <section
          style={{
            maxWidth: 760,
            margin: '0 auto',
            background: 'rgba(15, 23, 42, 0.78)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#60a5fa',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontSize: 12,
            }}
          >
            Reservar reunión
          </p>

          <h1 style={{ margin: '10px 0 8px', fontSize: 36 }}>
            Solicita una reunión
          </h1>

          <p style={{ margin: 0, color: '#94a3b8' }}>
            Elige uno de los horarios disponibles y envíanos tu solicitud.
          </p>

          {error && (
            <div
              style={{
                marginTop: 18,
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(127, 29, 29, 0.30)',
                border: '1px solid rgba(248, 113, 113, 0.32)',
                color: '#fecaca',
              }}
            >
              {error}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                marginTop: 18,
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(20, 83, 45, 0.35)',
                border: '1px solid rgba(74, 222, 128, 0.28)',
                color: '#bbf7d0',
              }}
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
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 16px',
                borderRadius: 12,
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 800,
                cursor: 'pointer',
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  color: '#94a3b8',
  fontSize: 13,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 12,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: '#0f172a',
  color: '#e5e7eb',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 110,
  resize: 'vertical',
};

const infoBoxStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  background: 'rgba(2, 6, 23, 0.34)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  color: '#94a3b8',
};