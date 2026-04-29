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
  return date.toLocaleString();
}

function formatMeetingDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
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
    padding: '7px 11px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800,
    border: '1px solid',
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

export default function MyMeetingsPage() {
  const router = useRouter();

  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
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
              ? `Sesión iniciada como ${userEmail}. Aquí puedes seguir el estado de tus reuniones.`
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
          <div style={{ display: 'grid', gap: 18, marginTop: 22 }}>
            {meetings.map((meeting) => (
              <article key={meeting.id} style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div>
                    <p style={smallLabelStyle}>Reunión</p>
                    <h2 style={cardTitleStyle}>
                      {meeting.customer_name || 'Solicitud de reunión'}
                    </h2>
                    <p style={mutedTextStyle}>
                      Enviada: {formatDate(meeting.created_at)}
                    </p>
                  </div>

                  <span style={getMeetingBadgeStyle(meeting.status)}>
                    {getMeetingLabel(meeting.status)}
                  </span>
                </div>

                <div style={infoGridStyle}>
                  <section style={subCardStyle}>
                    <h3 style={subCardTitleStyle}>Fecha y hora</h3>
                    <p style={rowTextStyle}>
                      <strong>Fecha:</strong> {formatMeetingDate(meeting.requested_date)}
                    </p>
                    <p style={rowTextStyle}>
                      <strong>Hora:</strong> {meeting.requested_time}
                    </p>
                    <p style={rowTextStyle}>
                      <strong>Email:</strong> {meeting.customer_email || '—'}
                    </p>
                  </section>

                  <section style={subCardStyle}>
                    <h3 style={subCardTitleStyle}>Notas</h3>
                    <p style={notesTextStyle}>
                      {meeting.notes || 'Sin notas adicionales.'}
                    </p>
                  </section>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  color: '#f8fafc',
  padding: '34px 20px 80px',
  background:
    'radial-gradient(circle at 12% 18%, rgba(168,85,247,0.20), transparent 28%), radial-gradient(circle at 88% 12%, rgba(245,158,11,0.16), transparent 28%), linear-gradient(135deg, #020617 0%, #09090f 48%, #111827 100%)',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
};

const heroCardStyle: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.84) 0%, rgba(24,24,37,0.88) 42%, rgba(30,27,75,0.86) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.16)',
  borderRadius: 34,
  padding: 32,
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

const heroTitleStyle: React.CSSProperties = {
  margin: '10px 0 8px',
  fontSize: 44,
  lineHeight: 1.04,
  letterSpacing: '-0.04em',
  textShadow: '0 18px 60px rgba(0,0,0,0.42)',
};

const heroTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.6,
};

const infoBoxStyle: React.CSSProperties = {
  marginTop: 22,
  padding: '18px 16px',
  borderRadius: 16,
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  color: '#a7b5c9',
  boxShadow: '0 18px 40px rgba(0,0,0,0.22)',
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 22,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(127, 29, 29, 0.30)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  color: '#fecaca',
  boxShadow: '0 14px 28px rgba(0,0,0,0.18)',
};

const emptyStateStyle: React.CSSProperties = {
  marginTop: 22,
  padding: '22px 18px',
  borderRadius: 18,
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.82) 0%, rgba(30,27,75,0.38) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  boxShadow: '0 18px 40px rgba(0,0,0,0.22)',
};

const emptyTitleStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 800,
  fontSize: 20,
};

const emptyTextStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#94a3b8',
};

const cardStyle: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.84) 0%, rgba(30,27,75,0.42) 52%, rgba(9,14,28,0.92) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  borderRadius: 24,
  padding: 22,
  boxShadow: '0 22px 48px rgba(0,0,0,0.24)',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  flexWrap: 'wrap',
  marginBottom: 18,
};

const smallLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 900,
};

const cardTitleStyle: React.CSSProperties = {
  margin: '8px 0 6px',
  fontSize: 24,
};

const mutedTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  fontSize: 14,
};

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 16,
};

const subCardStyle: React.CSSProperties = {
  background: 'rgba(2, 6, 23, 0.42)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  borderRadius: 18,
  padding: 16,
};

const subCardTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
  fontSize: 16,
};

const rowTextStyle: React.CSSProperties = {
  margin: '0 0 8px',
  color: '#d7e2ee',
};

const notesTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#d7e2ee',
  lineHeight: 1.6,
};

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 15px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  fontWeight: 900,
  boxShadow: '0 18px 34px rgba(236,72,153,0.24)',
};