import { NextResponse } from 'next/server';

type ChatRequestBody = {
  message?: string;
};

function buildFallbackReply(message: string) {
  const text = message.toLowerCase();

  if (
    text.includes('boda') ||
    text.includes('matrimonio') ||
    text.includes('wedding')
  ) {
    return 'Para una boda, lo ideal es revisar lugar, cantidad de invitados, horario y si necesitas luces, sonido, pantalla LED, tarima o DJ. Puedes ir a Cotizar para armar tu solicitud o escribirnos por WhatsApp al 829-935-9774 para ayudarte directo.';
  }

  if (
    text.includes('precio') ||
    text.includes('cotiz') ||
    text.includes('presupuesto') ||
    text.includes('cuanto') ||
    text.includes('cuánto')
  ) {
    return 'Para darte un precio más claro necesitamos saber tipo de evento, fecha, lugar, duración y servicios que necesitas. Puedes entrar a Cotizar y enviar tu solicitud, o escribirnos por WhatsApp al 829-935-9774.';
  }

  if (
    text.includes('pantalla') ||
    text.includes('led') ||
    text.includes('sonido') ||
    text.includes('luces') ||
    text.includes('tarima')
  ) {
    return 'SM Events trabaja luces, sonido, pantallas LED, tarimas, techos en truss, DJs y producción. Puedes ver los servicios en Catálogo o armar tu solicitud en Cotizar.';
  }

  if (
    text.includes('reunion') ||
    text.includes('reunión') ||
    text.includes('cita') ||
    text.includes('agenda')
  ) {
    return 'Claro. Puedes solicitar una reunión desde la sección Reunión para hablar con el equipo de SM Events y coordinar los detalles de tu evento.';
  }

  if (
    text.includes('whatsapp') ||
    text.includes('telefono') ||
    text.includes('teléfono') ||
    text.includes('contacto') ||
    text.includes('hablar')
  ) {
    return 'Puedes escribirnos directo por WhatsApp al 829-935-9774. También puedes usar el botón de WhatsApp dentro de este chat.';
  }

  return 'Puedo ayudarte con cotizaciones, catálogo, reuniones, luces, sonido, pantallas LED, tarimas y producción. Cuéntame qué tipo de evento estás preparando o escríbenos por WhatsApp al 829-935-9774.';
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const message = body.message?.trim() || '';

    if (!message) {
      return NextResponse.json(
        { reply: 'Escríbeme qué necesitas para tu evento y te ayudo.' },
        { status: 200 }
      );
    }

    return NextResponse.json({ reply: buildFallbackReply(message) }, { status: 200 });
  } catch (error) {
    console.error('Chat route fallback error:', error);

    return NextResponse.json(
      {
        reply:
          'Puedo ayudarte con cotizaciones, catálogo, reuniones o WhatsApp. Escríbenos directo al 829-935-9774 si quieres atención personalizada.',
      },
      { status: 200 }
    );
  }
}