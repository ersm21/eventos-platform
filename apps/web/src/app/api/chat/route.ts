import { NextResponse } from 'next/server';

type ChatRequestBody = {
  message?: string;
  history?: {
    sender: 'bot' | 'user';
    text: string;
  }[];
};

const SYSTEM_PROMPT = `
Eres el asistente virtual de SM Events, una empresa de eventos en República Dominicana.
SM Events ofrece luces, sonido, pantallas LED, tarimas, techos en truss, DJs y producción de eventos como bodas, conciertos, cumpleaños, eventos corporativos, quince años, bautizos y fiestas privadas.

Objetivo principal:
- Ayudar al cliente a cotizar.
- Llevar al cliente a /cotizar cuando quiera precio o presupuesto.
- Llevar al cliente a /catalogo cuando quiera ver servicios.
- Llevar al cliente a /book-meeting cuando quiera hablar con el equipo.
- Recomendar WhatsApp cuando quiera contacto directo.

Datos importantes:
- WhatsApp principal de SM Events: 829-935-9774.
- No inventes precios exactos si no están en el catálogo o en la conversación.
- Explica que el precio final puede depender de lugar, fecha, duración, montaje, transporte y requerimientos técnicos.
- Responde en español dominicano neutral, profesional, claro y breve.
- No digas que eres ChatGPT. Di que eres el asistente virtual de SM Events.
- Si el cliente no sabe qué necesita, hazle 2 o 3 preguntas simples: tipo de evento, fecha/lugar, cantidad aproximada de personas y servicios deseados.
- Mantén las respuestas cortas, útiles y orientadas a conversión.
`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          reply:
            'Todavía no tengo configurada la IA. Puedes usar las opciones rápidas para cotizar, ver catálogo, solicitar reunión o escribir por WhatsApp.',
        },
        { status: 200 }
      );
    }

    const body = (await request.json()) as ChatRequestBody;
    const message = body.message?.trim();
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

    if (!message) {
      return NextResponse.json(
        { reply: 'Escríbeme qué necesitas para tu evento y te ayudo.' },
        { status: 200 }
      );
    }

    const conversationContext = history
      .map(
        (item) =>
          `${item.sender === 'user' ? 'Cliente' : 'Asistente'}: ${item.text}`
      )
      .join('\n');

    const input = `${SYSTEM_PROMPT}\n\nHistorial reciente:\n${conversationContext}\n\nCliente: ${message}\nAsistente:`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        input,
        max_output_tokens: 220,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);

      return NextResponse.json(
        {
          reply:
            'Ahora mismo tuve un problema respondiendo con IA. Puedes usar las opciones rápidas o escribirnos por WhatsApp al 829-935-9774.',
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    const reply =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      'Puedo ayudarte con catálogo, cotización, reuniones o WhatsApp. ¿Qué necesitas para tu evento?';

    return NextResponse.json({ reply }, { status: 200 });
  } catch (error) {
    console.error('Chat route error:', error);

    return NextResponse.json(
      {
        reply:
          'Ahora mismo tuve un problema respondiendo. Puedes intentar de nuevo o escribirnos por WhatsApp al 829-935-9774.',
      },
      { status: 200 }
    );
  }
}
