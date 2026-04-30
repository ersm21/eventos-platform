'use client';

import AppNavbar from '../../components/AppNavbar';

const galleryItems = [
  {
    id: 'eventos-sociales',
    label: 'Eventos sociales',
    title: 'Cumpleaños, actividades privadas y celebraciones.',
    image:
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'conciertos',
    label: 'Conciertos',
    title: 'Luces, sonido, tarimas y producción en vivo.',
    image:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'bodas',
    label: 'Bodas',
    title: 'Ambientes elegantes, luces y sonido para momentos especiales.',
    image:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'corporativos',
    label: 'Corporativos',
    title: 'Presentaciones, conferencias y montajes empresariales.',
    image:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'soporte-tecnico',
    label: 'Soporte técnico',
    title: 'Asesoría, operación y soporte para proyectos técnicos.',
    image:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function GaleriaPage() {
  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <AppNavbar ctaHref="/cotizar" ctaLabel="Cotizar evento" />

        <section style={heroStyle}>
          <p style={eyebrowStyle}>Galería SM Events</p>
          <h1 style={titleStyle}>Fotos e inspiración para tu próximo montaje</h1>
          <p style={textStyle}>
            Explora referencias por tipo de evento. Esta galería sirve para que el cliente pueda visualizar el estilo de producción que podemos preparar para eventos sociales, conciertos, bodas, corporativos y soporte técnico.
          </p>
        </section>

        <section style={gridStyle}>
          {galleryItems.map((item) => (
            <article key={item.id} id={item.id} style={cardStyle}>
              <div
                style={{
                  ...imageStyle,
                  backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.12), rgba(2,6,23,0.86)), url(${item.image})`,
                }}
              >
                <span style={tagStyle}>{item.label}</span>
                <h2 style={cardTitleStyle}>{item.title}</h2>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  color: '#f8fafc',
  padding: '22px 20px 80px',
  background:
    'radial-gradient(circle at 12% 18%, rgba(168,85,247,0.20), transparent 28%), radial-gradient(circle at 88% 12%, rgba(245,158,11,0.16), transparent 28%), linear-gradient(135deg, #020617 0%, #09090f 48%, #111827 100%)',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
};

const heroStyle: React.CSSProperties = {
  marginTop: 18,
  marginBottom: 18,
  padding: 28,
  borderRadius: 34,
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.86) 0%, rgba(30,27,75,0.38) 52%, rgba(9,14,28,0.92) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  boxShadow: '0 24px 58px rgba(0,0,0,0.26)',
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
  margin: '10px 0 10px',
  fontSize: 44,
  lineHeight: 1.05,
  letterSpacing: '-0.04em',
  maxWidth: 780,
};

const textStyle: React.CSSProperties = {
  margin: 0,
  color: '#a8b8ce',
  fontSize: 16,
  lineHeight: 1.7,
  maxWidth: 850,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  minHeight: 310,
  borderRadius: 28,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(2,6,23,0.34)',
  boxShadow: '0 22px 48px rgba(0,0,0,0.24)',
  scrollMarginTop: 110,
};

const imageStyle: React.CSSProperties = {
  minHeight: 310,
  padding: 20,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const tagStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  padding: '7px 11px',
  borderRadius: 999,
  background: 'rgba(2, 6, 23, 0.72)',
  color: '#fde68a',
  fontSize: 12,
  fontWeight: 900,
};

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 23,
  lineHeight: 1.12,
  textShadow: '0 10px 28px rgba(0,0,0,0.48)',
};
