'use client';

import Link from 'next/link';
import { useState } from 'react';

type ChatMessage = {
  id: number;
  sender: 'bot' | 'user';
  text: string;
};

const WHATSAPP_URL =
  'https://wa.me/18299359774?text=Hola%20SM%20Events%2C%20quiero%20informaci%C3%B3n%20para%20un%20evento';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'bot',
      text: 'Hola, soy el asistente de SM Events. Puedo ayudarte a cotizar, ver el catálogo, solicitar una reunión o hablar por WhatsApp.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const addBotMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        sender: 'bot',
        text,
      },
    ]);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        sender: 'user',
        text,
      },
    ]);
  };

  const handleQuickAction = (
    action: 'quote' | 'catalog' | 'meeting' | 'whatsapp'
  ) => {
    if (action === 'quote') {
      addUserMessage('Quiero cotizar');
      addBotMessage(
        'Perfecto. Entra a Cotizar, selecciona los servicios que necesitas y completa los datos de tu evento.'
      );
      return;
    }

    if (action === 'catalog') {
      addUserMessage('Quiero ver el catálogo');
      addBotMessage(
        'Claro. En el catálogo puedes ver luces, sonido, pantallas LED, tarimas y otros servicios disponibles.'
      );
      return;
    }

    if (action === 'meeting') {
      addUserMessage('Quiero solicitar una reunión');
      addBotMessage(
        'Excelente. Puedes reservar un horario disponible para hablar con el equipo de SM Events sobre tu evento.'
      );
      return;
    }

    addUserMessage('Quiero hablar por WhatsApp');
    addBotMessage('Te dejo el acceso directo a WhatsApp para hablar con SM Events.');
  };

  const handleSendMessage = () => {
    const text = inputValue.trim();
    if (!text) return;

    addUserMessage(text);
    setInputValue('');

    const normalized = text.toLowerCase();

    if (
      normalized.includes('cotiz') ||
      normalized.includes('precio') ||
      normalized.includes('cuanto') ||
      normalized.includes('cuánto') ||
      normalized.includes('presupuesto')
    ) {
      addBotMessage(
        'Para cotizar, entra a la sección Cotizar, agrega los servicios y envía tu solicitud. El equipo puede ajustar el total final según montaje, lugar y fecha.'
      );
      return;
    }

    if (
      normalized.includes('reunion') ||
      normalized.includes('reunión') ||
      normalized.includes('cita') ||
      normalized.includes('agenda')
    ) {
      addBotMessage(
        'Puedes solicitar una reunión desde la sección Solicitar reunión. Ahí eliges un horario disponible y nos dejas tus datos.'
      );
      return;
    }

    if (
      normalized.includes('pantalla') ||
      normalized.includes('led') ||
      normalized.includes('luces') ||
      normalized.includes('sonido') ||
      normalized.includes('tarima')
    ) {
      addBotMessage(
        'SM Events trabaja luces, sonido, pantallas LED, tarimas y producción. Puedes ver los servicios en Catálogo o armar tu selección en Cotizar.'
      );
      return;
    }

    if (
      normalized.includes('whatsapp') ||
      normalized.includes('contacto') ||
      normalized.includes('hablar')
    ) {
      addBotMessage(
        'Puedes hablar directamente con SM Events por WhatsApp usando el botón de WhatsApp dentro de este chat.'
      );
      return;
    }

    addBotMessage(
      'Puedo ayudarte con cotizaciones, catálogo, reuniones o WhatsApp. Elige una opción rápida o escribe qué necesitas para tu evento.'
    );
  };

  return (
    <div style={chatRootStyle}>
      {isOpen && (
        <section style={chatWindowStyle}>
          <div style={chatHeaderStyle}>
            <div>
              <p style={chatEyebrowStyle}>SM Events</p>
              <h3 style={chatTitleStyle}>Asistente virtual</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={closeButtonStyle}
              aria-label="Cerrar chat"
            >
              ×
            </button>
          </div>

          <div style={chatBodyStyle}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  ...messageRowStyle,
                  justifyContent:
                    message.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={
                    message.sender === 'user' ? userBubbleStyle : botBubbleStyle
                  }
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div style={quickActionsStyle}>
            <Link
              href="/cotizar"
              onClick={() => handleQuickAction('quote')}
              style={quickButtonStyle}
            >
              Cotizar
            </Link>
            <Link
              href="/catalogo"
              onClick={() => handleQuickAction('catalog')}
              style={quickButtonStyle}
            >
              Catálogo
            </Link>
            <Link
              href="/book-meeting"
              onClick={() => handleQuickAction('meeting')}
              style={quickButtonStyle}
            >
              Reunión
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => handleQuickAction('whatsapp')}
              style={whatsappButtonStyle}
            >
              WhatsApp
            </a>
          </div>

          <div style={inputRowStyle}>
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              placeholder="Escribe tu pregunta..."
              style={chatInputStyle}
            />
            <button type="button" onClick={handleSendMessage} style={sendButtonStyle}>
              Enviar
            </button>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={floatingButtonStyle}
        aria-label="Abrir chat de SM Events"
      >
        {isOpen ? '×' : 'Chat'}
      </button>
    </div>
  );
}

const chatRootStyle: React.CSSProperties = {
  position: 'fixed',
  right: 22,
  bottom: 22,
  zIndex: 999,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 14,
};

const chatWindowStyle: React.CSSProperties = {
  width: 'min(380px, calc(100vw - 32px))',
  maxHeight: 'min(620px, calc(100vh - 110px))',
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto auto',
  overflow: 'hidden',
  borderRadius: 26,
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(24,24,37,0.96) 46%, rgba(30,27,75,0.94) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.18)',
  boxShadow: '0 30px 80px rgba(0,0,0,0.44)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
};

const chatHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  padding: 18,
  borderBottom: '1px solid rgba(250, 204, 21, 0.12)',
};

const chatEyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontWeight: 900,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontSize: 11,
};

const chatTitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#f8fafc',
  fontSize: 20,
};

const closeButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 999,
  border: '1px solid rgba(250, 204, 21, 0.16)',
  background: 'rgba(2, 6, 23, 0.48)',
  color: '#f8fafc',
  fontSize: 22,
  lineHeight: 1,
  cursor: 'pointer',
};

const chatBodyStyle: React.CSSProperties = {
  minHeight: 250,
  overflowY: 'auto',
  padding: 16,
  display: 'grid',
  alignContent: 'start',
  gap: 10,
};

const messageRowStyle: React.CSSProperties = {
  display: 'flex',
};

const botBubbleStyle: React.CSSProperties = {
  maxWidth: '86%',
  padding: '11px 13px',
  borderRadius: '16px 16px 16px 4px',
  background: 'rgba(2, 6, 23, 0.58)',
  border: '1px solid rgba(250, 204, 21, 0.12)',
  color: '#dbe4f0',
  lineHeight: 1.45,
  fontSize: 14,
};

const userBubbleStyle: React.CSSProperties = {
  maxWidth: '86%',
  padding: '11px 13px',
  borderRadius: '16px 16px 4px 16px',
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  lineHeight: 1.45,
  fontSize: 14,
  fontWeight: 700,
};

const quickActionsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 10,
  padding: '0 16px 16px',
};

const quickButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 12px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'rgba(2, 6, 23, 0.48)',
  color: '#f8fafc',
  border: '1px solid rgba(250, 204, 21, 0.16)',
  fontWeight: 800,
  fontSize: 13,
};

const whatsappButtonStyle: React.CSSProperties = {
  ...quickButtonStyle,
  background: 'rgba(34, 197, 94, 0.14)',
  border: '1px solid rgba(34, 197, 94, 0.28)',
  color: '#bbf7d0',
};

const inputRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 10,
  padding: 16,
  borderTop: '1px solid rgba(250, 204, 21, 0.12)',
};

const chatInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 13px',
  borderRadius: 14,
  border: '1px solid rgba(250, 204, 21, 0.14)',
  background: 'rgba(2, 6, 23, 0.68)',
  color: '#f8fafc',
  outline: 'none',
};

const sendButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 14px',
  borderRadius: 14,
  border: 'none',
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const floatingButtonStyle: React.CSSProperties = {
  minWidth: 70,
  height: 58,
  padding: '0 18px',
  borderRadius: 999,
  border: '1px solid rgba(250, 204, 21, 0.22)',
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 22px 48px rgba(236,72,153,0.32)',
};