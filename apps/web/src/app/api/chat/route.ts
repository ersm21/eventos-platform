import { NextResponse } from 'next/server';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  is_active: boolean | null;
  image_url: string | null;
};

type QuoteSuggestionItem = Product & {
  quantity: number;
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
- Si el cliente quiere cotizar, ayúdalo a armar una selección inicial de servicios y explícale que puede ajustar cantidades antes de enviarla.
- Si preguntan por disponibilidad, explica que deben solicitar reunión o cotización para confirmar agenda.
`;

function normalizeText(value: string | null | undefined) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isQuoteIntent(text: string) {
  const value = normalizeText(text);

  return [
    'cotiz',
    'presupuesto',
    'precio',
    'cuanto',
    'cuanto cuesta',
    'necesito',
    'quiero',
    'armame',
    'armar',
    'paquete',
    'evento',
    'boda',
    'cumple',
    'quince',
    'concierto',
    'corporativo',
    'actividad',
    'fiesta',
  ].some((word) => value.includes(word));
}

function wantedCategories(text: string) {
  const value = normalizeText(text);
  const categories = new Set<string>();

  if (
    value.includes('sonido') ||
    value.includes('audio') ||
    value.includes('bocina') ||
    value.includes('microfono') ||
    value.includes('musica')
  ) {
    categories.add('audio');
  }

  if (
    value.includes('luz') ||
    value.includes('luces') ||
    value.includes('iluminacion') ||
    value.includes('robotica') ||
    value.includes('beam') ||
    value.includes('wash')
  ) {
    categories.add('iluminacion');
  }

  if (
    value.includes('pantalla') ||
    value.includes('led') ||
    value.includes('visual') ||
    value.includes('video')
  ) {
    categories.add('pantallas led');
  }

  if (
    value.includes('tarima') ||
    value.includes('stage') ||
    value.includes('escenario')
  ) {
    categories.add('tarimas');
  }

  if (
    value.includes('truss') ||
    value.includes('techo') ||
    value.includes('estructura')
  ) {
    categories.add('truss');
  }

  if (
    value.includes('dj') ||
    value.includes('disc jockey') ||
    value.includes('musicalizacion')
  ) {
    categories.add('dj');
  }

  if (
    value.includes('confeti') ||
    value.includes('humo') ||
    value.includes('chispa') ||
    value.includes('spark') ||
    value.includes('efecto')
  ) {
    categories.add('efectos especiales');
  }

  const eventNeedsBase =
    value.includes('boda') ||
    value.includes('cumple') ||
    value.includes('quince') ||
    value.includes('fiesta') ||
    value.includes('corporativo') ||
    value.includes('concierto') ||
    value.includes('actividad') ||
    value.includes('evento');

  if (eventNeedsBase && categories.size === 0) {
    categories.add('audio');
    categories.add('iluminacion');
  }

  if (
    value.includes('boda') ||
    value.includes('quince') ||
    value.includes('concierto') ||
    value.includes('corporativo')
  ) {
    categories.add('audio');
    categories.add('iluminacion');
  }

  return Array.from(categories);
}

function productMatchesCategory(product: Product, category: string) {
  const categoryText = normalizeText(product.category);
  const nameText = normalizeText(product.name);
  const descriptionText = normalizeText(product.description);
  const combined = `${categoryText} ${nameText} ${descriptionText}`;

  if (category === 'audio') {
    return (
      combined.includes('audio') ||
      combined.includes('sonido') ||
      combined.includes('bocina') ||
      combined.includes('microfono')
    );
  }

  if (category === 'iluminacion') {
    return (
      combined.includes('ilumin') ||
      combined.includes('luz') ||
      combined.includes('luces') ||
      combined.includes('beam') ||
      combined.includes('wash')
    );
  }

  if (category === 'pantallas led') {
    return (
      combined.includes('pantalla') ||
      combined.includes('led') ||
      combined.includes('video')
    );
  }

  if (category === 'tarimas') {
    return combined.includes('tarima') || combined.includes('stage');
  }

  if (category === 'truss') {
    return combined.includes('truss') || combined.includes('techo') || combined.includes('estructura');
  }

  if (category === 'dj') {
    return combined.includes('dj') || combined.includes('disc jockey');
  }

  if (category === 'efectos especiales') {
    return (
      combined.includes('confeti') ||
      combined.includes('humo') ||
      combined.includes('chispa') ||
      combined.includes('spark') ||
      combined.includes('efecto')
    );
  }

  return false;
}

function buildQuoteSuggestions(products: Product[], message: string): QuoteSuggestionItem[] {
  if (!isQuoteIntent(message)) return [];

  const categories = wantedCategories(message);
  if (categories.length === 0) return [];

  const selected = new Map<string, QuoteSuggestionItem>();

  categories.forEach((category) => {
    const matches = products
      .filter((product) => productMatchesCategory(product, category))
      .sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0))
      .slice(0, category === 'audio' || category === 'iluminacion' ? 2 : 1);

    matches.forEach((product) => {
      if (!selected.has(product.id)) {
        selected.set(product.id, {
          ...product,
          quantity: 1,
        });
      }
    });
  });

  return Array.from(selected.values()).slice(0, 7);
}

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

  const response = await fetch(`${supabaseUrl}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function fetchActiveProducts(): Promise<Product[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return [];
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/products?select=id,name,description,price,category,is_active,image_url&is_active=eq.true&order=category.asc,price.asc`,
    {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? (data as Product[]) : [];
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

    const activeProducts = await fetchActiveProducts();
    const quoteItems = lastUserMessage
      ? buildQuoteSuggestions(activeProducts, lastUserMessage.content)
      : [];

    if (conversationId && lastUserMessage) {
      await saveChatMessage(
        conversationId,
        'user',
        lastUserMessage.content.trim()
      );
    }

    const productContext =
      quoteItems.length > 0
        ? `
Selección inicial detectada para cotización:
${quoteItems
  .map(
    (item) =>
      `- ${item.name} | Categoría: ${item.category || 'General'} | Precio desde: ${item.price ?? 0}`
  )
  .join('\n')}

En tu respuesta, dile al cliente que preparaste una selección inicial que puede agregar a la cotización con el botón del chat. Aclara que podrá ajustar cantidades y completar ciudad, tipo de evento, fecha y notas antes de enviar.
`
        : '';

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
            content: `${SYSTEM_PROMPT}\n${productContext}`,
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

    return NextResponse.json({ reply, conversationId, quoteItems });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error inesperado procesando el chat.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
