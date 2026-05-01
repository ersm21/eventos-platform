import AppNavbar from '../../components/AppNavbar';

export default function DataDeletionPage() {
  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <AppNavbar ctaHref="/cotizar" ctaLabel="Cotizar ahora" />

        <section style={cardStyle}>
          <p style={eyebrowStyle}>SM Events</p>
          <h1 style={titleStyle}>Eliminación de datos de usuario</h1>

          <p style={textStyle}>
            Si deseas eliminar tus datos asociados a SM Events, puedes solicitarlo escribiéndonos directamente por WhatsApp o teléfono al 829-935-9774.
          </p>

          <p style={textStyle}>
            Para procesar tu solicitud, indícanos el correo electrónico usado para iniciar sesión y confirma que deseas eliminar tu información de nuestra plataforma.
          </p>

          <p style={textStyle}>
            Una vez recibida la solicitud, revisaremos la cuenta asociada y eliminaremos la información personal que corresponda, incluyendo datos de perfil y registros vinculados cuando sea aplicable.
          </p>

          <p style={textStyle}>
            También puedes contactarnos por medio de nuestros canales oficiales de SM Events para cualquier consulta relacionada con privacidad o eliminación de datos.
          </p>
        </section>
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
  maxWidth: 900,
  margin: '0 auto',
};

const cardStyle: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.84) 0%, rgba(30,27,75,0.42) 52%, rgba(9,14,28,0.92) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  borderRadius: 28,
  padding: 28,
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
  margin: '12px 0 18px',
  fontSize: 42,
  lineHeight: 1.04,
};

const textStyle: React.CSSProperties = {
  color: '#cbd5e1',
  lineHeight: 1.7,
  fontSize: 16,
};
