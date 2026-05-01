import AppNavbar from '../../components/AppNavbar';

export default function PrivacyPage() {
  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <AppNavbar ctaHref="/cotizar" ctaLabel="Cotizar ahora" />

        <section style={cardStyle}>
          <p style={eyebrowStyle}>SM Events</p>
          <h1 style={titleStyle}>Política de privacidad</h1>

          <p style={textStyle}>
            En SM Events respetamos la privacidad de nuestros clientes y usuarios. La información que recopilamos se utiliza para gestionar solicitudes de cotización, reuniones, comunicación comercial y acceso a funciones de la plataforma.
          </p>

          <p style={textStyle}>
            Podemos recopilar datos como nombre, correo electrónico, teléfono, foto de perfil, solicitudes de servicios, comentarios, cotizaciones y comprobantes relacionados con eventos. Esta información no se vende a terceros.
          </p>

          <p style={textStyle}>
            Si usas inicio de sesión con Google, Facebook u otros proveedores, recibimos la información básica necesaria para crear o identificar tu cuenta, como nombre, correo electrónico e imagen de perfil cuando el proveedor la comparte.
          </p>

          <p style={textStyle}>
            Para solicitar eliminación de tus datos, puedes escribirnos por WhatsApp o teléfono al 829-935-9774, o visitar nuestra página de eliminación de datos.
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
