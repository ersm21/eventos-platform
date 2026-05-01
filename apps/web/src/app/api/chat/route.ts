import { NextResponse } from 'next/server';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const SYSTEM_PROMPT = `
Eres el asistente oficial de SM Events, una empresa de producción de eventos en República Dominicana.

SM Events ofrece:
- Luces
- Sonido
- Pantallas LED
- Tarimas
- Techos en truss
- DJs
- Producción técnica para bodas, cumpleaños, conciertos, eventos corporativos, bautizos, quince años y eventos privados.

Contacto principal:
WhatsApp: 829-935-9774

Tono:
- Profesional, amable, claro y directo.
- Habla en español dominicano natural cuando el cliente escriba en español.
- Si el cliente escribe en inglés, responde en inglés.
- No inventes precios exactos si el cliente no da detalles.
- Para cotizaciones, pide datos clave: tipo de evento, fecha, lugar, horario/duración, cantidad aproximada de personas, servicios que necesita y presupuesto aproximado si lo tiene.
- Invita al cliente a usar el botón de cotizar o escribir por WhatsApp.
- Si preguntan por disponibilidad, explica que deben solicitar reunión o cotización para confirmar agenda.
`;

async function supabaseRest(
  table: string,
  method: 'POST' | 'PATCH',
  body: Record<string, unknown>,
  query = ''
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${table}${query}`,
    {
      method,
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function createConversation() {
  const data = await supabaseRest('chatbot_conversations', 'POST', {
    status: 'open',
    updated_at: new Date().toISOString(),
  });

  return Array.isArray(data) ? data[0]?.id : null;
}

async function updateConversation(conversationId: string) {
  await supabaseRest(
    'chatbot_conversations',
    'PATCH',
    {
      updated_at: new Date().toISOString(),
    },
    `?id=eq.${conversationId}`
  );
}

async function saveChatMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
) {
  await supabaseRest('chatbot_messages', 'POST', {
    conversation_id: conversationId,
    role,
    content,
  });
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY no está configurada en el servidor.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const messages = (body.messages || []) as ChatMessage[];

    let conversationId =
      typeof body.conversationId === 'string' && body.conversationId.trim()
        ? body.conversationId.trim()
        : null;

    if (!conversationId) {
      conversationId = await createConversation();
    }

    const cleanMessages = messages
      .filter(
        (message) =>
          (message.role === 'user' || message.role === 'assistant') &&
          typeof message.content === 'string' &&
          message.content.trim().length > 0
      )
      .slice(-12);

    const lastUserMessage = [...cleanMessages]
      .reverse()
      .find((message) => message.role === 'user');

    if (conversationId && lastUserMessage) {
      await saveChatMessage(
        conversationId,
        'user',
        lastUserMessage.content.trim()
      );
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          ...cleanMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
        temperature: 0.5,
        max_output_tokens: 450,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            'Error llamando OpenAI desde el servidor.',
        },
        { status: response.status }
      );
    }

    const reply =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      'Ahora mismo no pude generar una respuesta. Intenta de nuevo.';

    if (conversationId) {
      await saveChatMessage(conversationId, 'assistant', reply);
      await updateConversation(conversationId);
    }

    return NextResponse.json({ reply, conversationId });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error inesperado procesando el chat.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
