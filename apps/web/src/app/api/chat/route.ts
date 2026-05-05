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

type RequestedNeed =
  | 'audio'
  | 'microphones'
  | 'led_screen'
  | 'stage'
  | 'truss'
  | 'roof'
  | 'lighting'
  | 'dj'
  | 'effects'
  | 'dance_floor';

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
- Si el sistema prepara una selección inicial, explica que el cliente puede agregarla a cotización y luego ajustar cantidades, ciudad, tipo de evento, fecha y notas antes de enviarla.
- Si preguntan por disponibilidad, explica que deben solicitar reunión o cotización para confirmar agenda.
- Nunca prometas disponibilidad sin confirmación humana.
`;

function normalizeText(value: string | null | undefined) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function numberFromText(value: string) {
  const normalized = normalizeText(value)
    .replace(/rd\$|dop|pesos|peso|dominicanos|dominicano/g, '')
    .replace(/,/g, '');

  const matches = normalized.match(/\d+(?:\.\d+)?/g);
  if (!matches) return null;

  const numbers = matches.map((match) => Number(match)).filter(Number.isFinite);
  if (numbers.length === 0) return null;

  const budgetWords = [
    'presupuesto',
    'budget',
    'tengo',
    'cuento con',
    'hasta',
    'maximo',
    'máximo',
  ];

  const hasBudgetWord = budgetWords.some((word) => normalized.includes(normalizeText(word)));

  if (hasBudgetWord) {
    return Math.max(...numbers);
  }

  const possibleBudget = numbers.filter((number) => number >= 10000);
  if (possibleBudget.length > 0) {
    return Math.max(...possibleBudget);
  }

  return null;
}

function extractGuestCount(value: string) {
  const normalized = normalizeText(value);
  const peoplePattern = /(\d+)\s*(personas|persona|pax|invitados|invitado|gente|asistentes|asistente)/;
  const match = normalized.match(peoplePattern);

  if (!match) return null;

  const count = Number(match[1]);
  return Number.isFinite(count) ? count : null;
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
    'tarima',
    'pantalla',
    'sonido',
    'microfono',
    'luces',
    'truss',
    'techo',
    'dj',
  ].some((word) => value.includes(word));
}

function detectRequestedNeeds(text: string): RequestedNeed[] {
  const value = normalizeText(text);
  const needs = new Set<RequestedNeed>();

  const hasAudio =
    value.includes('sonido') ||
    value.includes('audio') ||
    value.includes('bocina') ||
    value.includes('bocinas') ||
    value.includes('speaker') ||
    value.includes('speakers');

  const hasMicrophones =
    value.includes('microfono') ||
    value.includes('microfonos') ||
    value.includes('microphone') ||
    value.includes('mic ') ||
    value.includes('mics');

  const hasLedScreen =
    value.includes('pantalla') ||
    value.includes('pantallas') ||
    value.includes('led') ||
    value.includes('video wall') ||
    value.includes('visuales') ||
    value.includes('visuales');

  const hasStage =
    value.includes('tarima') ||
    value.includes('tarimas') ||
    value.includes('stage') ||
    value.includes('escenario');

  const hasRoof =
    value.includes('techo') ||
    value.includes('roof');

  const hasTruss =
    value.includes('truss') ||
    value.includes('estructura') ||
    value.includes('rigging');

  const hasLighting =
    value.includes('luces') ||
    value.includes('luz ') ||
    value.includes('iluminacion') ||
    value.includes('iluminación') ||
    value.includes('robotica') ||
    value.includes('robótica') ||
    value.includes('beam') ||
    value.includes('wash') ||
    value.includes('par led') ||
    value.includes('laser');

  const hasDj =
    value.includes('dj') ||
    value.includes('disc jockey') ||
    value.includes('musicalizacion') ||
    value.includes('musicalización');

  const hasEffects =
    value.includes('confeti') ||
    value.includes('humo') ||
    value.includes('co2') ||
    value.includes('pirotecnia') ||
    value.includes('chispa') ||
    value.includes('chispas') ||
    value.includes('flama') ||
    value.includes('efecto especial') ||
    value.includes('efectos especiales');

  const hasDanceFloor =
    value.includes('pista') ||
    value.includes('pista de baile') ||
    value.includes('dance floor') ||
    value.includes('parquet');

  if (hasAudio) needs.add('audio');
  if (hasMicrophones) needs.add('microphones');
  if (hasLedScreen) needs.add('led_screen');
  if (hasStage) needs.add('stage');
  if (hasRoof) needs.add('roof');
  if (hasTruss) needs.add('truss');
  if (hasLighting) needs.add('lighting');
  if (hasDj) needs.add('dj');
  if (hasEffects) needs.add('effects');
  if (hasDanceFloor) needs.add('dance_floor');

  return Array.from(needs);
}

function productText(product: Product) {
  return normalizeText(`${product.name} ${product.category ?? ''} ${product.description ?? ''}`);
}

function priceOf(product: Product) {
  return Number(product.price ?? 0);
}

function getProductsByNeed(products: Product[], need: RequestedNeed) {
  return products.filter((product) => {
    const text = productText(product);

    if (need === 'audio') {
      return (
        text.includes('sonido') ||
        text.includes('speaker') ||
        text.includes('audio') ||
        text.includes('bocina')
      ) && !text.includes('microfono');
    }

    if (need === 'microphones') {
      return text.includes('microfono') || text.includes('mic ');
    }

    if (need === 'led_screen') {
      return text.includes('pantalla') || text.includes('led por metro');
    }

    if (need === 'stage') {
      return text.includes('tarima');
    }

    if (need === 'roof') {
      return text.includes('techo en truss');
    }

    if (need === 'truss') {
      return (
        text.includes('truss') ||
        text.includes('puente') ||
        text.includes('cuadro')
      ) && !text.includes('techo en truss');
    }

    if (need === 'lighting') {
      return (
        text.includes('iluminacion') ||
        text.includes('par led') ||
        text.includes('moving') ||
        text.includes('luz') ||
        text.includes('laser') ||
        text.includes('perseguidor') ||
        text.includes('minibruto')
      );
    }

    if (need === 'effects') {
      return (
        text.includes('confeti') ||
        text.includes('humo') ||
        text.includes('flama') ||
        text.includes('pirotecnia') ||
        text.includes('co2')
      );
    }

    if (need === 'dance_floor') {
      return text.includes('pista de baile') || text.includes('parquet');
    }

    if (need === 'dj') {
      return text.includes('dj');
    }

    return false;
  });
}

function pickClosestToTarget(products: Product[], target: number) {
  if (products.length === 0) return null;

  return [...products].sort((a, b) => {
    const aPrice = priceOf(a);
    const bPrice = priceOf(b);

    const aDistance = Math.abs(aPrice - target);
    const bDistance = Math.abs(bPrice - target);

    if (aDistance !== bDistance) return aDistance - bDistance;
    return bPrice - aPrice;
  })[0];
}

function pickBestAudio(products: Product[], budget: number | null, guestCount: number | null) {
  const audioProducts = getProductsByNeed(products, 'audio');

  if (audioProducts.length === 0) return null;

  let target = 15000;

  if (guestCount && guestCount <= 60) target = 12000;
  if (guestCount && guestCount > 60 && guestCount <= 120) target = 18000;
  if (guestCount && guestCount > 120 && guestCount <= 220) target = 25000;
  if (guestCount && guestCount > 220) target = 35000;

  if (budget && budget >= 100000) {
    target = Math.max(target, 25000);
  }

  return pickClosestToTarget(audioProducts, target);
}

function pickBestMicrophones(products: Product[], budget: number | null) {
  const microphoneProducts = getProductsByNeed(products, 'microphones');
  if (microphoneProducts.length === 0) return [];

  const normalized = microphoneProducts.sort((a, b) => priceOf(a) - priceOf(b));
  const wireless = normalized.find((product) => productText(product).includes('inalambrico'));
  const wired = normalized.find((product) => productText(product).includes('alambrico') && !productText(product).includes('inalambrico'));
  const podium = normalized.find((product) => productText(product).includes('podium'));

  if (budget && budget >= 80000) {
    return [wireless, podium].filter(Boolean) as Product[];
  }

  return [wireless || wired || normalized[0]].filter(Boolean) as Product[];
}

function pickBestLedScreen(products: Product[], budget: number | null, requestedNeedsCount: number) {
  const ledProducts = getProductsByNeed(products, 'led_screen');
  if (ledProducts.length === 0) return null;

  let target = 24000;

  if (budget) {
    const availableForLed = budget / Math.max(requestedNeedsCount, 1);

    if (availableForLed >= 60000) target = 60000;
    else if (availableForLed >= 30000) target = 30000;
    else target = 24000;
  }

  return pickClosestToTarget(ledProducts, target);
}

function pickBestStage(products: Product[], budget: number | null, guestCount: number | null, requestedNeedsCount: number) {
  const stageProducts = getProductsByNeed(products, 'stage');
  if (stageProducts.length === 0) return null;

  let target = 16000;

  if (guestCount && guestCount <= 80) target = 13000;
  if (guestCount && guestCount > 80 && guestCount <= 180) target = 20000;
  if (guestCount && guestCount > 180) target = 28000;

  if (budget) {
    const availableForStage = budget / Math.max(requestedNeedsCount, 1);
    target = Math.min(Math.max(target, availableForStage * 0.8), 40000);
  }

  return pickClosestToTarget(stageProducts, target);
}

function pickBestLighting(products: Product[], budget: number | null) {
  const lightingProducts = getProductsByNeed(products, 'lighting');
  if (lightingProducts.length === 0) return [];

  const sorted = lightingProducts.sort((a, b) => priceOf(a) - priceOf(b));
  const moving = sorted.find((product) => {
    const text = productText(product);
    return text.includes('moving') || text.includes('robotica');
  });

  const wash = sorted.find((product) => productText(product).includes('wash'));
  const par = sorted.find((product) => productText(product).includes('par led'));

  if (budget && budget >= 80000) {
    return [moving, wash, par].filter(Boolean) as Product[];
  }

  return [moving || wash || par || sorted[0]].filter(Boolean) as Product[];
}

function pickBestSingle(products: Product[], need: RequestedNeed, budget: number | null, requestedNeedsCount: number) {
  const matches = getProductsByNeed(products, need);
  if (matches.length === 0) return null;

  let target = 10000;

  if (budget) {
    target = budget / Math.max(requestedNeedsCount, 1);
  }

  return pickClosestToTarget(matches, target);
}

function dedupeItems(items: QuoteSuggestionItem[]) {
  const map = new Map<string, QuoteSuggestionItem>();

  items.forEach((item) => {
    if (!map.has(item.id)) {
      map.set(item.id, item);
      return;
    }

    const existing = map.get(item.id);
    if (existing) {
      map.set(item.id, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });
    }
  });

  return Array.from(map.values());
}

function buildQuoteSuggestions(products: Product[], message: string): QuoteSuggestionItem[] {
  if (!isQuoteIntent(message)) return [];

  const requestedNeeds = detectRequestedNeeds(message);
  if (requestedNeeds.length === 0) return [];

  const budget = numberFromText(message);
  const guestCount = extractGuestCount(message);

  const selected: QuoteSuggestionItem[] = [];
  const requestedNeedsCount = requestedNeeds.length;

  requestedNeeds.forEach((need) => {
    if (need === 'audio') {
      const product = pickBestAudio(products, budget, guestCount);
      if (product) selected.push({ ...product, quantity: 1 });
      return;
    }

    if (need === 'microphones') {
      const microphones = pickBestMicrophones(products, budget);
      microphones.forEach((product) => selected.push({ ...product, quantity: 1 }));
      return;
    }

    if (need === 'led_screen') {
      const product = pickBestLedScreen(products, budget, requestedNeedsCount);
      if (product) selected.push({ ...product, quantity: 1 });
      return;
    }

    if (need === 'stage') {
      const product = pickBestStage(products, budget, guestCount, requestedNeedsCount);
      if (product) selected.push({ ...product, quantity: 1 });
      return;
    }

    if (need === 'lighting') {
      const lighting = pickBestLighting(products, budget);
      lighting.forEach((product) => selected.push({ ...product, quantity: 1 }));
      return;
    }

    const product = pickBestSingle(products, need, budget, requestedNeedsCount);
    if (product) selected.push({ ...product, quantity: 1 });
  });

  return dedupeItems(selected).slice(0, 9);
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

    const requestedNeeds = lastUserMessage
      ? detectRequestedNeeds(lastUserMessage.content)
      : [];

    const productContext =
      quoteItems.length > 0
        ? `
El sistema detectó que el cliente pidió explícitamente estos tipos de servicios:
${requestedNeeds.join(', ')}

Selección inicial preparada desde productos reales del catálogo:
${quoteItems
  .map(
    (item) =>
      `- ${item.name} | Categoría: ${item.category || 'General'} | Precio desde: ${item.price ?? 0} | Cantidad: ${item.quantity}`
  )
  .join('\n')}

Importante:
- No digas que agregaste servicios que no estén en la selección.
- No menciones categorías no pedidas por el cliente.
- Explica que la selección es inicial y que puede ajustarse antes de enviar la cotización.
- Si el cliente dio presupuesto, explica que la selección intenta mantenerse razonable dentro de ese presupuesto, pero que transporte, soporte técnico e ITBIS pueden afectar el total final.
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
        temperature: 0.35,
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
