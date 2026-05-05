'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type QuoteSuggestionItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  image_url: string | null;
  is_active: boolean | null;
  quantity: number;
};

export default function SMChatbot() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hola, soy el asistente de SM Events. Puedo ayudarte con luces, sonido, pantallas LED, tarimas, DJs y también puedo armarte una selección inicial para cotizar tu evento.',
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [quoteSuggestions, setQuoteSuggestions] = useState<QuoteSuggestionItem[]>([]);

  const visibleMessages = useMemo(() => messages.slice(-14), [messages]);

  const quoteSuggestionsTotal = useMemo(
    () =>
      quoteSuggestions.reduce(
        (sum, item) => sum + Number(item.price ?? 0) * item.quantity,
        0
      ),
    [quoteSuggestions]
  );

  const formatMoney = (value: number | null | undefined) => {
    return `$${Number(value ?? 0).toLocaleString()}`;
  };

  const addSuggestionsToQuote = () => {
    if (quoteSuggestions.length === 0) return;

    const cart = quoteSuggestions.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image_url: item.image_url,
      is_active: item.is_active,
      quantity: item.quantity,
    }));

    window.localStorage.setItem('sm-events-catalog-cart', JSON.stringify(cart));
    setOpen(false);
    router.push('/cotizar?from=chatbot');
  };

  const sendMessage = async () => {
    const cleanInput = input.trim();

    if (!cleanInput || sending) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: cleanInput },
    ];

    setMessages(nextMessages);
    setInput('');
    setSending(true);
    setError(null);
    setQuoteSuggestions([]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, conversationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo responder el mensaje.');
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (Array.isArray(data.quoteItems)) {
        setQuoteSuggestions(data.quoteItems);
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.reply || 'No pude responder ahora mismo.',
        },
      ]);
    } catch (chatError) {
      const message =
        chatError instanceof Error
          ? chatError.message
          : 'Error enviando el mensaje.';

      setError(message);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            'Ahora mismo tuve un problema respondiendo. También puedes escribirnos directo por WhatsApp al 829-935-9774.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {open && (
        <section style={chatPanelStyle}>
          <div style={chatHeaderStyle}>
            <div>
              <p style={eyebrowStyle}>SM Events</p>
              <h2 style={titleStyle}>Asistente virtual</h2>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              style={closeButtonStyle}
            >
              ×
            </button>
          </div>

          <div style={messagesStyle}>
            {visibleMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={{
                  ...bubbleStyle,
                  ...(message.role === 'user'
                    ? userBubbleStyle
                    : assistantBubbleStyle),
                }}
              >
                {message.content}
              </div>
            ))}

            {quoteSuggestions.length > 0 && (
              <div style={quoteCardStyle}>
                <p style={quoteCardEyebrowStyle}>Selección sugerida</p>
                <h3 style={quoteCardTitleStyle}>Lista lista para cotizar</h3>

                <div style={quoteItemListStyle}>
                  {quoteSuggestions.map((item) => (
                    <div key={item.id} style={quoteSuggestionItemStyle}>
                      <div>
                        <p style={quoteSuggestionNameStyle}>{item.name}</p>
                        <p style={quoteSuggestionMetaStyle}>
                          {item.category || 'Servicio'} · {formatMoney(item.price)}
                        </p>
                      </div>

                      <strong style={quoteSuggestionQtyStyle}>x{item.quantity}</strong>
                    </div>
                  ))}
                </div>

                <div style={quoteSuggestionTotalStyle}>
                  <span>Subtotal estimado</span>
                  <strong>{formatMoney(quoteSuggestionsTotal)}</strong>
                </div>

                <button
                  type="button"
                  onClick={addSuggestionsToQuote}
                  style={quoteActionButtonStyle}
                >
                  Agregar y continuar a cotizar
                </button>
              </div>
            )}
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          <div style={inputRowStyle}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ej: Necesito luces y sonido para una boda..."
              style={inputStyle}
            />

            <button
              type="button"
              onClick={sendMessage}
              disabled={sending}
              style={{
                ...sendButtonStyle,
                opacity: sending ? 0.65 : 1,
                cursor: sending ? 'not-allowed' : 'pointer',
              }}
            >
              {sending ? '...' : 'Enviar'}
            </button>
          </div>
        </section>
      )}

      <button type="button" onClick={() => setOpen(true)} style={chatButtonStyle}>
        Chat
      </button>
    </>
  );
}

const chatButtonStyle: React.CSSProperties = {
  position: 'fixed',
  right: 18,
  bottom: 92,
  zIndex: 220,
  border: 'none',
  borderRadius: 999,
  padding: '12px 15px',
  background: 'linear-gradient(135deg, #f97316 0%, #ec4899 52%, #8b5cf6 100%)',
  color: '#ffffff',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 18px 38px rgba(236,72,153,0.28)',
};

const chatPanelStyle: React.CSSProperties = {
  position: 'fixed',
  right: 18,
  bottom: 150,
  zIndex: 220,
  width: 'min(390px, calc(100vw - 36px))',
  maxHeight: 'min(620px, calc(100vh - 110px))',
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto auto',
  gap: 10,
  padding: 14,
  borderRadius: 22,
  background: 'rgba(2, 6, 23, 0.94)',
  border: '1px solid rgba(250, 204, 21, 0.18)',
  boxShadow: '0 24px 70px rgba(0,0,0,0.42)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

const chatHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 10,
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
};

const titleStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: '#ffffff',
  fontSize: 19,
};

const closeButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 999,
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(15,23,42,0.86)',
  color: '#e5e7eb',
  fontSize: 22,
  fontWeight: 900,
  cursor: 'pointer',
};

const messagesStyle: React.CSSProperties = {
  overflowY: 'auto',
  display: 'grid',
  alignContent: 'start',
  gap: 9,
  padding: '4px 2px',
};

const bubbleStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 16,
  fontSize: 14,
  lineHeight: 1.45,
  whiteSpace: 'pre-wrap',
};

const assistantBubbleStyle: React.CSSProperties = {
  justifySelf: 'start',
  background: 'rgba(15,23,42,0.92)',
  color: '#dbeafe',
  border: '1px solid rgba(96,165,250,0.16)',
};

const userBubbleStyle: React.CSSProperties = {
  justifySelf: 'end',
  background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
  color: '#ffffff',
};

const quoteCardStyle: React.CSSProperties = {
  justifySelf: 'stretch',
  display: 'grid',
  gap: 9,
  padding: 12,
  borderRadius: 18,
  background:
    'linear-gradient(135deg, rgba(245,158,11,0.13), rgba(168,85,247,0.10), rgba(15,23,42,0.92))',
  border: '1px solid rgba(250,204,21,0.18)',
};

const quoteCardEyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#facc15',
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
};

const quoteCardTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 950,
};

const quoteItemListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 7,
};

const quoteSuggestionItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  padding: 9,
  borderRadius: 14,
  background: 'rgba(2,6,23,0.38)',
  border: '1px solid rgba(148,163,184,0.10)',
};

const quoteSuggestionNameStyle: React.CSSProperties = {
  margin: 0,
  color: '#f8fafc',
  fontSize: 12.5,
  fontWeight: 900,
};

const quoteSuggestionMetaStyle: React.CSSProperties = {
  margin: '3px 0 0',
  color: '#94a3b8',
  fontSize: 11,
};

const quoteSuggestionQtyStyle: React.CSSProperties = {
  color: '#facc15',
  fontSize: 12,
};

const quoteSuggestionTotalStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  color: '#fde68a',
  fontSize: 13,
  fontWeight: 900,
};

const quoteActionButtonStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 42,
  border: 'none',
  borderRadius: 14,
  background: 'linear-gradient(135deg, #fb923c, #ec4899, #8b5cf6)',
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 950,
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  padding: '9px 10px',
  borderRadius: 13,
  background: 'rgba(127,29,29,0.32)',
  border: '1px solid rgba(248,113,113,0.30)',
  color: '#fecaca',
  fontSize: 12,
  fontWeight: 800,
};

const inputRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 43,
  borderRadius: 999,
  padding: '0 13px',
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(15,23,42,0.86)',
  color: '#f8fafc',
  outline: 'none',
};

const sendButtonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 999,
  padding: '0 13px',
  background: '#f97316',
  color: '#ffffff',
  fontWeight: 900,
};
