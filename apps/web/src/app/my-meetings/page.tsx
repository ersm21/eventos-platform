'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';
import AppNavbar from '../../components/AppNavbar';

type MeetingRequest = {
  id: string;
  user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  requested_date: string;
  requested_time: string;
  notes: string | null;
  status: string | null;
  created_at: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatMeetingDate(value: string | null | undefined) {
  if (!value) return '—';

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-DO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getMeetingLabel(status: string | null | undefined) {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'confirmed':
      return 'Confirmada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status || '—';
  }
}

function getMeetingBadgeStyle(status: string | null | undefined) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 900,
    border: '1px solid',
    whiteSpace: 'nowrap',
  } as const;

  if (status === 'confirmed') {
    return {
      ...base,
      background: 'rgba(34,197,94,0.12)',
      color: '#86efac',
      borderColor: 'rgba(34,197,94,0.28)',
    };
  }

  if (status === 'cancelled') {
    return {
      ...base,
      background: 'rgba(239,68,68,0.12)',
      color: '#fca5a5',
      borderColor: 'rgba(239,68,68,0.28)',
    };
  }

  return {
    ...base,
    background: 'rgba(250,204,21,0.12)',
    color: '#fde68a',
    borderColor: 'rgba(250,204,21,0.28)',
  };
}

function getMeetingNoteValue(notes: string | null | undefined, label: string) {
  if (!notes) return '';

  const line = notes
    .split('\n')
    .find((item) => item.toLowerCase().startsWith(`${label.toLowerCase()}:`));

  if (!line) return '';

  return line.slice(label.length + 1).trim();
}

function getMeetingPhone(notes: string | null | undefined) {
  return getMeetingNoteValue(notes, 'Teléfono') || '—';
}

function getMeetingCompany(notes: string | null | undefined) {
  const company = getMeetingNoteValue(notes, 'Empresa');

  if (!company || company.toLowerCase() === 'no aplica') return '—';

  return company;
}

function getMeetingClientNotes(notes: string | null | undefined) {
  return getMeetingNoteValue(notes, 'Notas') || notes || 'Sin notas adicionales.';
}

export default function MyMeetingsPage() {
  const router = useRouter();

  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const loadMeetings = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        router.replace('/login');
        return;
      }

      setUserEmail(user.email ?? null);

      const { data, error } = await supabase
        .from('meeting_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setMeetings((data || []) as MeetingRequest[]);
      setLoading(false);
    };

    loadMeetings();
  }, [router]);

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <AppNavbar ctaHref="/book-meeting" ctaLabel="Solicitar reunión" />

        <section style={heroCardStyle}>
          <p style={eyebrowStyle}>Área de cliente</p>
          <h1 style={heroTitleStyle}>Mis reuniones</h1>
          <p style={heroTextStyle}>
            {userEmail
              ? `Sesión iniciada como ${userEmail}. Revisa tus solicitudes de reunión.`
              : 'Aquí podrás revisar el estado de tus reuniones.'}
          </p>
        </section>

        {loading && <div style={infoBoxStyle}>Cargando reuniones...</div>}
        {error && <div style={errorBoxStyle}>{error}</div>}

        {!loading && !error && meetings.length === 0 && (
          <div style={emptyStateStyle}>
            <p style={emptyTitleStyle}>Todavía no has solicitado reuniones.</p>
            <p style={emptyTextStyle}>
              Cuando envíes una solicitud de reunión, aparecerá aquí.
            </p>
            <div style={{ marginTop: 14 }}>
              <Link href="/book-meeting" style={primaryLinkStyle}>
                Solicitar reunión
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && meetings.length > 0 && (
          <div style={meetingsListStyle}>
            {meetings.map((meeting) => {
              const isOpen = expandedMeetingId === meeting.id;

              return (
                <article key={meeting.id} style={cardStyle}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMeetingId((current) =>
                        current === meeting.id ? null : meeting.id
                      )
                    }
                    style={meetingSummaryButtonStyle}
                  >
                    <div style={summaryMainStyle}>
                      <p style={smallLabelStyle}>Reunión</p>
                      <h2 style={cardTitleStyle}>
                        {meeting.customer_name || 'Solicitud de reunión'}
                      </h2>
                      <p style={mutedTextStyle}>
                        Enviada: {formatDate(meeting.created_at)}
                      </p>
                    </div>

                    <div style={dateBoxStyle}>
                      <span style={dateLabelStyle}>Fecha</span>
                      <strong>{formatMeetingDate(meeting.requested_date)}</strong>
                      <small>{meeting.requested_time}</small>
                    </div>

                    <div style={summaryBadgesStyle}>
                      <span style={getMeetingBadgeStyle(meeting.status)}>
                        {getMeetingLabel(meeting.status)}
                      </span>
                    </div>

                    <span style={chevronStyle}>{isOpen ? '−' : '+'}</span>
                  </button>

                  {isOpen && (
                    <div style={detailsWrapStyle}>
                      <div style={infoGridStyle}>
                        <section style={subCardStyle}>
                          <h3 style={subCardTitleStyle}>Fecha y hora</h3>
                          <p style={rowTextStyle}>
                            <strong>Fecha:</strong>{' '}
                            {formatMeetingDate(meeting.requested_date)}
                          </p>
                          <p style={rowTextStyle}>
                            <strong>Hora:</strong> {meeting.requested_time}
                          </p>
                          <p style={rowTextStyle}>
                            <strong>Estado:</strong>{' '}
                            {getMeetingLabel(meeting.status)}
                          </p>
                        </section>

                        <section style={subCardStyle}>
                          <h3 style={subCardTitleStyle}>Contacto</h3>
                          <p style={rowTextStyle}>
                            <strong>Email:</strong> {meeting.customer_email || '—'}
                          </p>
                          <p style={rowTextStyle}>
                            <strong>Teléfono:</strong>{' '}
                            {getMeetingPhone(meeting.notes)}
                          </p>
                          <p style={rowTextStyle}>
                            <strong>Empresa:</strong>{' '}
                            {getMeetingCompany(meeting.notes)}
                          </p>
                        </section>
                      </div>

                      <section style={subCardStyle}>
                        <h3 style={subCardTitleStyle}>Notas</h3>
                        <p style={notesTextStyle}>
                          {getMeetingClientNotes(meeting.notes)}
                        </p>
                      </section>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  color: '#f8fafc',
  padding: '24px 14px 64px',
  background:
    'radial-gradient(circle at 12% 18%, rgba(168,85,247,0.20), transparent 28%), radial-gradient(circle at 88% 12%, rgba(245,158,11,0.16), transparent 28%), linear-gradient(135deg, #020617 0%, #09090f 48%, #111827 100%)',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 980,
  margin: '0 auto',
};

const heroCardStyle: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.84) 0%, rgba(24,24,37,0.88) 42%, rgba(30,27,75,0.86) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.16)',
  borderRadius: 24,
  padding: 20,
  boxShadow: '0 16px 34px rgba(0,0,0,0.28)',
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontWeight: 900,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontSize: 12,
};

const heroTitleStyle: React.CSSProperties = {
  margin: '8px 0 6px',
  fontSize: 36,
  lineHeight: 1.02,
  letterSpacing: '-0.04em',
};

const heroTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.55,
  fontSize: 14,
};

const infoBoxStyle: React.CSSProperties = {
  marginTop: 12,
  padding: '16px',
  borderRadius: 16,
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  color: '#a7b5c9',
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 12,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(127, 29, 29, 0.30)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  color: '#fecaca',
};

const emptyStateStyle: React.CSSProperties = {
  marginTop: 12,
  padding: 18,
  borderRadius: 18,
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.82) 0%, rgba(30,27,75,0.38) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
};

const emptyTitleStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 900,
  fontSize: 18,
};

const emptyTextStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#94a3b8',
};

const meetingsListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 12,
};

const cardStyle: React.CSSProperties = {
  overflow: 'hidden',
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(30,27,75,0.34) 52%, rgba(9,14,28,0.96) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.13)',
  borderRadius: 20,
  boxShadow: '0 14px 26px rgba(0,0,0,0.20)',
};

const meetingSummaryButtonStyle: React.CSSProperties = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 1fr) minmax(160px, auto) auto 32px',
  gap: 14,
  alignItems: 'center',
  padding: 16,
  border: 'none',
  background: 'transparent',
  color: '#f8fafc',
  textAlign: 'left',
  cursor: 'pointer',
};

const summaryMainStyle: React.CSSProperties = {
  minWidth: 0,
};

const smallLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 900,
};

const cardTitleStyle: React.CSSProperties = {
  margin: '6px 0 4px',
  fontSize: 20,
  lineHeight: 1.15,
};

const mutedTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  fontSize: 13,
  lineHeight: 1.45,
};

const dateBoxStyle: React.CSSProperties = {
  display: 'grid',
  gap: 3,
  textAlign: 'right',
  color: '#f8fafc',
};

const dateLabelStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const summaryBadgesStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const chevronStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 999,
  display: 'grid',
  placeItems: 'center',
  color: '#fbbf24',
  border: '1px solid rgba(250,204,21,0.18)',
  background: 'rgba(2,6,23,0.30)',
  fontSize: 20,
  fontWeight: 900,
};

const detailsWrapStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: '0 16px 16px',
};

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 10,
};

const subCardStyle: React.CSSProperties = {
  background: 'rgba(2, 6, 23, 0.38)',
  border: '1px solid rgba(250, 204, 21, 0.11)',
  borderRadius: 16,
  padding: 14,
};

const subCardTitleStyle: React.CSSProperties = {
  margin: '0 0 10px',
  fontSize: 16,
};

const rowTextStyle: React.CSSProperties = {
  margin: '0 0 7px',
  color: '#d7e2ee',
  fontSize: 13,
  lineHeight: 1.5,
};

const notesTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#d7e2ee',
  lineHeight: 1.55,
  fontSize: 13,
};

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 13px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  fontWeight: 900,
  boxShadow: '0 14px 26px rgba(236,72,153,0.20)',
};
