const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = 'ericrafaelsousamorel@gmail.com';

function formatMoney(value: unknown) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

function getNoteValue(notes: string, label: string) {
  const line = notes
    .split('\n')
    .find((item) => item.toLowerCase().startsWith(`${label.toLowerCase()}:`));

  if (!line) return '';

  return line.slice(label.length + 1).trim();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const type = body.type ?? 'generic';

    let subject = 'Notificación de Eventos Platform';
    let html = '<p>Nuevo evento en la plataforma.</p>';
    let customerEmail = body.customerEmail ?? '';

    if (type === 'meeting_request') {
      const customerName = body.customerName ?? 'Cliente';
      customerEmail = body.customerEmail ?? 'Sin email';
      const requestedDate = body.requestedDate ?? 'Sin fecha';
      const requestedTime = body.requestedTime ?? 'Sin hora';
      const notes = body.notes ?? 'Sin notas';
      const phone = getNoteValue(notes, 'Teléfono') || 'Sin teléfono';
      const company = getNoteValue(notes, 'Empresa') || 'No aplica';
      const clientNotes = getNoteValue(notes, 'Notas') || 'Sin notas';

      subject = `Nueva reunión solicitada - ${customerName}`;
      html = `
        <h2>Nueva solicitud de reunión</h2>
        <p><strong>Cliente:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Teléfono:</strong> ${phone}</p>
        <p><strong>Empresa:</strong> ${company}</p>
        <p><strong>Fecha:</strong> ${requestedDate}</p>
        <p><strong>Hora:</strong> ${requestedTime}</p>
        <p><strong>Notas:</strong> ${clientNotes}</p>
      `;
    }

    if (type === 'quote_created') {
      const customerName = body.customerName ?? 'Cliente';
      customerEmail = body.customerEmail ?? 'Sin email';
      const eventType = body.eventType ?? 'Sin tipo de evento';
      const notes = body.notes ?? 'Sin notas';
      const total = body.total ?? 0;
      const itbis = Number(total ?? 0) * 0.18;
      const totalWithItbis = Number(total ?? 0) * 1.18;
      const quoteId = body.quoteId ?? 'Sin ID';
      const items = Array.isArray(body.items) ? body.items : [];

      const itemsHtml =
        items.length === 0
          ? '<li>Sin productos</li>'
          : items
              .map(
                (item: {
                  name?: string;
                  quantity?: number;
                  unitPrice?: number;
                  subtotal?: number;
                }) => `
                  <li>
                    <strong>${item.name ?? 'Producto'}</strong> ·
                    Cantidad: ${item.quantity ?? 0} ·
                    Unitario: ${formatMoney(item.unitPrice)} ·
                    Subtotal: ${formatMoney(item.subtotal)}
                  </li>
                `
              )
              .join('');

      subject = `Nueva cotización recibida - ${customerName}`;
      html = `
        <h2>Nueva cotización creada</h2>
        <p><strong>ID:</strong> ${quoteId}</p>
        <p><strong>Cliente:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Tipo de evento:</strong> ${eventType}</p>
        <p><strong>Subtotal sin ITBIS:</strong> ${formatMoney(total)}</p>
        <p><strong>ITBIS 18%:</strong> ${formatMoney(itbis)}</p>
        <p><strong>Total con ITBIS:</strong> ${formatMoney(totalWithItbis)}</p>
        <p><strong>Notas:</strong> ${notes}</p>
        <h3>Productos</h3>
        <ul>${itemsHtml}</ul>
      `;
    }

    if (type === 'meeting_status_changed') {
      const customerName = body.customerName ?? 'Cliente';
      customerEmail = body.customerEmail ?? 'Sin email';
      const requestedDate = body.requestedDate ?? 'Sin fecha';
      const requestedTime = body.requestedTime ?? 'Sin hora';
      const status = body.status ?? 'pending';

      subject =
        status === 'confirmed'
          ? 'Reunión confirmada'
          : status === 'cancelled'
          ? 'Reunión cancelada'
          : 'Actualización de reunión';

      html = `
        <h2>Actualización de reunión</h2>
        <p><strong>Cliente:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Fecha:</strong> ${requestedDate}</p>
        <p><strong>Hora:</strong> ${requestedTime}</p>
        <p><strong>Nuevo estado:</strong> ${status}</p>
      `;
    }

    if (type === 'quote_status_changed') {
      const customerName = body.customerName ?? 'Cliente';
      customerEmail = body.customerEmail ?? 'Sin email';
      const eventType = body.eventType ?? 'Sin tipo de evento';
      const status = body.status ?? 'draft';
      const quoteId = body.quoteId ?? 'Sin ID';
      const total = body.total ?? 0;

      subject =
        status === 'approved'
          ? 'Cotización aprobada'
          : 'Actualización de cotización';

      html = `
        <h2>Actualización de cotización</h2>
        <p><strong>ID:</strong> ${quoteId}</p>
        <p><strong>Cliente:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Evento:</strong> ${eventType}</p>
        <p><strong>Total:</strong> ${formatMoney(total)}</p>
        <p><strong>Nuevo estado:</strong> ${status}</p>
      `;
    }

    const recipients = [ADMIN_EMAIL];
    const shouldNotifyCustomer =
      type === 'meeting_status_changed' || type === 'quote_status_changed';

    if (
      shouldNotifyCustomer &&
      typeof customerEmail === 'string' &&
      customerEmail.includes('@') &&
      !recipients.includes(customerEmail)
    ) {
      recipients.push(customerEmail);
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY is not configured' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Eventos Platform <onboarding@resend.dev>',
        to: recipients,
        subject,
        html,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : res.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});