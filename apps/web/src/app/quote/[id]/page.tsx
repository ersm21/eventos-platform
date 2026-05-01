'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';
import AppNavbar from '../../../components/AppNavbar';

type Quote = {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  event_type: string | null;
  notes: string | null;
  status: string | null;
  total: number | null;
  admin_final_total: number | null;
  admin_note: string | null;
  deposit_amount: number | null;
  deposit_status: string | null;
  deposit_reference: string | null;
  payment_proof_url: string | null;
  payment_proof_name: string | null;
  created_at: string | null;
};

type QuoteItem = {
  id: string;
  quote_id: string;
  product_name: string;
  product_image_url: string | null;
  product_description: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

function calculateTechnicalSupport(value: number | null | undefined) {
  const subtotal = Number(value ?? 0);

  if (subtotal >= 120001) return 35000;
  if (subtotal >= 85000) return 25000;
  if (subtotal >= 35000) return 15000;
  if (subtotal >= 1000) return 5000;

  return 0;
}

function normalizeTransportText(value: string | null | undefined) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function calculateTransport(
  value: number | null | undefined,
  locationText?: string | null
) {
  const subtotal = Number(value ?? 0);
  const location = normalizeTransportText(locationText);

  if (subtotal <= 0) return 0;

  if (location.includes('punta cana')) return 30000;
  if (location.includes('bavaro')) return 30000;
  if (location.includes('la romana')) return 30000;
  if (location.includes('mao')) return 20000;
  if (location.includes('santo domingo')) return 20000;
  if (location.includes('puerto plata')) return 15000;
  if (location.includes('la vega')) return 10000;
  if (location.includes('moca')) return 7000;
  if (location.includes('santiago')) return 7000;

  return 0;
}

function calculateTaxableBase(
  value: number | null | undefined,
  locationText?: string | null
) {
  const subtotal = Number(value ?? 0);

  return (
    subtotal +
    calculateTechnicalSupport(subtotal) +
    calculateTransport(subtotal, locationText)
  );
}

function calculateItbis(
  value: number | null | undefined,
  locationText?: string | null
) {
  return calculateTaxableBase(value, locationText) * 0.18;
}

function calculateTotalWithItbis(
  value: number | null | undefined,
  locationText?: string | null
) {
  return calculateTaxableBase(value, locationText) * 1.18;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function getStatusLabel(status: string | null | undefined) {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'review':
      return 'En revisión';
    case 'approved':
      return 'Aprobada';
    case 'sent':
      return 'Enviada';
    case 'confirmed':
      return 'Confirmada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status || '—';
  }
}

function getStatusBadgeStyle(status: string | null | undefined) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    border: '1px solid',
  } as const;

  switch (status) {
    case 'approved':
      return {
        ...base,
        background: 'rgba(34, 197, 94, 0.12)',
        color: '#86efac',
        borderColor: 'rgba(34, 197, 94, 0.3)',
      };
    case 'confirmed':
      return {
        ...base,
        background: 'rgba(59, 130, 246, 0.14)',
        color: '#93c5fd',
        borderColor: 'rgba(59, 130, 246, 0.32)',
      };
    case 'review':
      return {
        ...base,
        background: 'rgba(250, 204, 21, 0.12)',
        color: '#fde68a',
        borderColor: 'rgba(250, 204, 21, 0.28)',
      };
    case 'cancelled':
      return {
        ...base,
        background: 'rgba(239, 68, 68, 0.12)',
        color: '#fca5a5',
        borderColor: 'rgba(239, 68, 68, 0.28)',
      };
    default:
      return {
        ...base,
        background: 'rgba(148, 163, 184, 0.10)',
        color: '#cbd5e1',
        borderColor: 'rgba(148, 163, 184, 0.24)',
      };
  }
}

function getDepositBadgeStyle(status: string | null | undefined) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    border: '1px solid',
  } as const;

  if (status === 'paid') {
    return {
      ...base,
      background: 'rgba(34, 197, 94, 0.12)',
      color: '#86efac',
      borderColor: 'rgba(34, 197, 94, 0.3)',
    };
  }

  return {
    ...base,
    background: 'rgba(250, 204, 21, 0.12)',
    color: '#fde68a',
    borderColor: 'rgba(250, 204, 21, 0.28)',
  };
}

export default function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [printDocument, setPrintDocument] = useState<'quote' | 'conduce'>('quote');
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadQuote = async () => {
      const resolvedParams = await params;
      const id = resolvedParams.id;

      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single();

      if (quoteError || !quoteData) {
        setError('No pudimos cargar esta cotización.');
        setLoading(false);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', id)
        .order('created_at', { ascending: true });

      if (itemsError) {
        setError(itemsError.message);
        setLoading(false);
        return;
      }

      setQuote(quoteData as Quote);
      setItems((itemsData || []) as QuoteItem[]);
      setLoading(false);
    };

    loadQuote();
  }, [params]);

  useEffect(() => {
    if (!quote) return;

    if (searchParams.get('print') === 'conduce') {
      setPrintDocument('conduce');
      window.setTimeout(() => window.print(), 250);
    }
  }, [quote, searchParams]);

  const confirmQuote = async () => {
    if (!quote) return;

    setConfirming(true);
    setError(null);
    setSuccessMessage(null);

    const { error } = await supabase
      .from('quotes')
      .update({ status: 'confirmed' })
      .eq('id', quote.id);

    if (error) {
      setError(error.message);
      setConfirming(false);
      return;
    }

    setQuote({ ...quote, status: 'confirmed' });
    setSuccessMessage('Tu cotización fue confirmada correctamente.');
    setConfirming(false);
  };

  const uploadPaymentProof = async () => {
    if (!quote || !selectedFile) return;

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('quoteId', quote.id);

      const response = await fetch('/api/upload-payment-proof', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'No se pudo subir el comprobante.');
        setUploading(false);
        return;
      }

      setQuote({
        ...quote,
        payment_proof_url: result.publicUrl,
        payment_proof_name: result.fileName,
      });

      setSelectedFile(null);
      setSuccessMessage('Comprobante subido correctamente.');
      setUploading(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error inesperado subiendo comprobante.';
      setError(message);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <AppNavbar ctaHref="/" ctaLabel="Volver al inicio" />
          <div style={heroCardStyle}>
            <p style={eyebrowStyle}>Cotización</p>
            <h1 style={heroTitleStyle}>Cargando tu propuesta...</h1>
            <p style={heroTextStyle}>
              Un momento. Estamos preparando los detalles de tu evento.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !quote) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <AppNavbar ctaHref="/" ctaLabel="Volver al inicio" />
          <div style={heroCardStyle}>
            <p style={eyebrowStyle}>Error</p>
            <h1 style={heroTitleStyle}>Cotización no encontrada</h1>
            <p style={heroTextStyle}>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!quote) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <AppNavbar ctaHref="/" ctaLabel="Volver al inicio" />
          <div style={heroCardStyle}>
            <p style={eyebrowStyle}>Error</p>
            <h1 style={heroTitleStyle}>Cotización no encontrada</h1>
            <p style={heroTextStyle}>No pudimos cargar esta cotización.</p>
          </div>
        </div>
      </main>
    );
  }

  const finalTotal = quote.admin_final_total ?? quote.total ?? 0;
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + Number(item.subtotal ?? 0),
    0
  );
  const quoteNumber = quote.id.slice(0, 8).toUpperCase();
  const itbisAmount = calculateItbis(finalTotal, quote.notes);
  const totalWithItbis = calculateTotalWithItbis(finalTotal, quote.notes);

  const downloadQuotePdf = () => {
    setPrintDocument('quote');
    window.setTimeout(() => window.print(), 50);
  };

  const downloadConducePdf = () => {
    setPrintDocument('conduce');
    window.setTimeout(() => window.print(), 50);
  };

  return (
    <main style={pageStyle} data-print-document={printDocument}>
      <style>{`
        .print-estimate,
        .print-conduce {
          display: none;
        }

        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html,
          body {
            background: #ffffff !important;
            color: #111827 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .screen-quote,
          nav,
          button,
          input,
          textarea,
          select,
          .no-print {
            display: none !important;
          }

          main[data-print-document='quote'] .print-estimate,
          main[data-print-document='conduce'] .print-conduce {
            display: block !important;
          }

          main {
            background: #ffffff !important;
            color: #111827 !important;
            padding: 0 !important;
          }

          .no-print,
          [data-no-print="true"],
          button,
          nav,
          header:not(.print-estimate header):not(.print-conduce header),
          [style*="position: fixed"],
          [style*="position:fixed"] {
            display: none !important;
            visibility: hidden !important;
          }

          * {
            box-shadow: none !important;
            text-shadow: none !important;
          }
        }
      `}</style>
      <div style={containerStyle}>
        <section className="print-estimate" style={printEstimateStyle}>
          <header style={printHeaderStyle}>
            <div style={printBrandBlockStyle}>
              <div style={printLogoStyle}>
                <img
                  src="/sm-logo.png"
                  alt="SM Events"
                  style={printLogoImageStyle}
                />
              </div>
              <div>
                <p style={printBrandStyle}>SM Events</p>
                <p style={printMutedStyle}>Producción técnica y montaje de eventos</p>
                <p style={printContactLineStyle}>Santiago, República Dominicana</p>
              </div>
            </div>

            <div style={printHeaderMetaStyle}>
              <p style={printEstimateLabelStyle}>Estimate / Cotización</p>
              <h1 style={printEstimateTitleStyle}>#{quoteNumber}</h1>
              <p style={printMutedStyle}>Fecha: {formatDate(quote.created_at)}</p>
            </div>
          </header>

          <section className="print-info-grid" style={printInfoGridStyle}>
            <div style={printInfoBoxStyle}>
              <p style={printSectionLabelStyle}>Cliente</p>
              <h2 style={printClientNameStyle}>{quote.customer_name || 'Cliente sin nombre'}</h2>
              <p style={printInfoTextStyle}>{quote.customer_email || 'Sin email'}</p>
              <p style={printInfoTextStyle}>Evento: {quote.event_type || '—'}</p>
            </div>

            <div style={printInfoBoxStyle}>
              <p style={printSectionLabelStyle}>Resumen</p>
              <p style={printInfoTextStyle}>Estado: {getStatusLabel(quote.status)}</p>
              <p style={printInfoTextStyle}>
                Depósito: {quote.deposit_status === 'paid' ? 'Pagado' : 'Pendiente'}
              </p>
              <p style={printInfoTextStyle}>Referencia: {quote.deposit_reference || '—'}</p>
              <p style={printInfoTextStyle}>Cotización ID: {quote.id}</p>
            </div>
          </section>

          <section style={printTableSectionStyle}>
            <div className="print-table-header" style={printTableHeaderStyle}>
              <span>Servicio</span>
              <span className="print-number-header" style={printNumberHeaderStyle}>Cant.</span>
              <span className="print-number-header" style={printNumberHeaderStyle}>Precio</span>
              <span className="print-number-header" style={printNumberHeaderStyle}>Total</span>
            </div>

            {items.length === 0 ? (
              <div style={printTableEmptyStyle}>No hay servicios agregados.</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="print-table-row" style={printTableRowStyle}>
                  <div style={printItemNameWrapStyle}>
                    {item.product_image_url && (
                      <img
                        src={item.product_image_url}
                        alt={item.product_name}
                        style={printItemImageStyle}
                      />
                    )}
                    <div>
                      <strong style={printItemProductNameStyle}>
                        {item.product_name}
                      </strong>
                      {item.product_description && (
                        <p style={printItemDescriptionStyle}>
                          {item.product_description}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="print-number-cell" style={printNumberCellStyle}>
                    {Number(item.quantity ?? 0)}
                  </span>
                  <span className="print-number-cell" style={printNumberCellStyle}>
                    {formatMoney(item.unit_price)}
                  </span>
                  <strong className="print-number-cell" style={printNumberStrongCellStyle}>
                    {formatMoney(item.subtotal)}
                  </strong>
                </div>
              ))
            )}
          </section>

          <section style={printBottomGridStyle}>
            <div style={printNotesBoxStyle}>
              <p style={printSectionLabelStyle}>Notas</p>
              <p style={printInfoTextStyle}>{quote.notes || 'Sin notas adicionales.'}</p>
              <p style={printInfoTextStyle}>
                <strong>Nota del admin:</strong> {quote.admin_note || '—'}
              </p>
              <p style={printTermsTextStyle}>
                Esta cotización está sujeta a disponibilidad de fecha, disponibilidad técnica y confirmación del depósito requerido.
              </p>
            </div>

            <div style={printTotalsBoxStyle}>
              <div style={printTotalRowStyle}>
                <span>Subtotal de artículos</span>
                <strong>{formatMoney(itemsSubtotal)}</strong>
              </div>
              <div style={printTotalRowStyle}>
                <span>Subtotal aprobado sin ITBIS</span>
                <strong>{formatMoney(finalTotal)}</strong>
              </div>
              <div style={printTotalRowStyle}>
                <span>Soporte técnico</span>
                <strong>{formatMoney(calculateTechnicalSupport(finalTotal))}</strong>
              </div>
              <div style={printTotalRowStyle}>
                <span>Transporte</span>
                <strong>{formatMoney(calculateTransport(finalTotal, quote.notes))}</strong>
              </div>
              <div style={printTotalRowStyle}>
                <span>Base para ITBIS</span>
                <strong>{formatMoney(calculateTaxableBase(finalTotal, quote.notes))}</strong>
              </div>
              <div style={printTotalRowStyle}>
                <span>ITBIS 18%</span>
                <strong>{formatMoney(calculateItbis(finalTotal, quote.notes))}</strong>
              </div>
              <div style={printGrandTotalRowStyle}>
                <span>Total con ITBIS</span>
                <strong>{formatMoney(calculateTotalWithItbis(finalTotal, quote.notes))}</strong>
              </div>
              <div style={printDepositRowStyle}>
                <span>Depósito requerido</span>
                <strong>{formatMoney(quote.deposit_amount)}</strong>
              </div>
            </div>
          </section>

          <footer style={printFooterStyle}>
            <div>
              <strong>SM Events</strong>
              <p>Gracias por considerar a SM Events para tu evento.</p>
            </div>
            <div style={printFooterRightStyle}>
              <strong>Próximo paso</strong>
              <p>La fecha se asegura con la confirmación y el depósito requerido.</p>
            </div>
          </footer>
        </section>

        <section className="print-conduce" style={conducePageStyle}>
          <header style={conduceHeaderStyle}>
            <div style={printBrandBlockStyle}>
              <div style={conduceLogoStyle}>
                <img
                  src="/sm-logo.png"
                  alt="SM Events"
                  style={printLogoImageStyle}
                />
              </div>
              <div>
                <p style={conduceBrandStyle}>SM Events</p>
                <p style={conduceMutedStyle}>Conduce interno de almacén</p>
              </div>
            </div>

            <div style={conduceMetaStyle}>
              <p style={conduceLabelStyle}>Conduce / Despacho</p>
              <h1 style={conduceTitleStyle}>#{quoteNumber}</h1>
              <p style={conduceMutedStyle}>Emitido: {formatDate(quote.created_at)}</p>
            </div>
          </header>

          <section style={conduceInfoGridStyle}>
            <div style={conduceInfoBoxStyle}>
              <p style={conduceSectionLabelStyle}>Datos del evento</p>
              <p style={conduceInfoTextStyle}><strong>Cliente:</strong> {quote.customer_name || '—'}</p>
              <p style={conduceInfoTextStyle}><strong>Contacto:</strong> {quote.customer_email || '—'}</p>
              <p style={conduceInfoTextStyle}><strong>Tipo de evento:</strong> {quote.event_type || '—'}</p>
              <p style={conduceInfoTextStyle}><strong>Fecha del evento:</strong> ______________________________</p>
              <p style={conduceInfoTextStyle}><strong>Lugar del evento:</strong> ______________________________</p>
            </div>

            <div style={conduceInfoBoxStyle}>
              <p style={conduceSectionLabelStyle}>Control interno</p>
              <p style={conduceInfoTextStyle}><strong>ID cotización:</strong> {quote.id}</p>
              <p style={conduceInfoTextStyle}><strong>Preparado por:</strong> ______________________________</p>
              <p style={conduceInfoTextStyle}><strong>Despachado por:</strong> ______________________________</p>
              <p style={conduceInfoTextStyle}><strong>Recibido por:</strong> ______________________________</p>
            </div>
          </section>

          <section style={conduceTableSectionStyle}>
            <div style={conduceTableHeaderStyle}>
              <span>Equipo / producto</span>
              <span>Cantidad</span>
              <span>Observaciones</span>
            </div>

            {items.length === 0 ? (
              <div style={conduceTableEmptyStyle}>No hay productos asociados.</div>
            ) : (
              items.map((item) => (
                <div key={item.id} style={conduceTableRowStyle}>
                  <div style={printItemNameWrapStyle}>
                    {item.product_image_url && (
                      <img
                        src={item.product_image_url}
                        alt={item.product_name}
                        style={printItemImageStyle}
                      />
                    )}
                    <div>
                      <strong>{item.product_name}</strong>
                      {item.product_description && (
                        <p style={printItemDescriptionStyle}>
                          {item.product_description}
                        </p>
                      )}
                    </div>
                  </div>
                  <span>{Number(item.quantity ?? 0)}</span>
                  <span>______________________________</span>
                </div>
              ))
            )}
          </section>

          <section style={conduceNotesStyle}>
            <p style={conduceSectionLabelStyle}>Notas internas / condiciones de despacho</p>
            <p style={conduceInfoTextStyle}>{quote.admin_note || 'Sin notas internas.'}</p>
          </section>

          <section style={conduceSignaturesGridStyle}>
            <div style={conduceSignatureBoxStyle}>
              <div style={conduceSignatureLineStyle} />
              <p>Firma de despacho</p>
            </div>
            <div style={conduceSignatureBoxStyle}>
              <div style={conduceSignatureLineStyle} />
              <p>Firma de recibido</p>
            </div>
            <div style={conduceSignatureBoxStyle}>
              <div style={conduceSignatureLineStyle} />
              <p>Firma de retorno</p>
            </div>
          </section>
        </section>

        <div className="screen-quote">
          <AppNavbar ctaHref="/" ctaLabel="Volver al inicio" />

        <section style={heroCardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p style={eyebrowStyle}>Tu propuesta</p>
              <h1 style={heroTitleStyle}>Cotización para tu evento</h1>
              <p style={heroTextStyle}>
                Revisa los detalles, confirma si ya está lista y sube tu
                comprobante de pago cuando corresponda.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span style={getStatusBadgeStyle(quote.status)}>
                {getStatusLabel(quote.status)}
              </span>
              <span style={getDepositBadgeStyle(quote.deposit_status)}>
                Depósito {quote.deposit_status === 'paid' ? 'pagado' : 'pendiente'}
              </span>
              <button
                type="button"
                onClick={downloadQuotePdf}
                style={secondaryButtonStyle}
                className="no-print"
              >
                Descargar PDF
              </button>
            </div>
          </div>

          {error && <div style={errorBoxStyle}>{error}</div>}
          {successMessage && <div style={successBoxStyle}>{successMessage}</div>}
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 8,
            marginTop: 12,
          }}
        >
          {[
            {
              label: 'Subtotal sin ITBIS',
              value: formatMoney(finalTotal),
              hint: 'Monto base aprobado',
            },
            {
              label: 'Soporte técnico',
              value: formatMoney(calculateTechnicalSupport(finalTotal)),
              hint: 'Asistencia técnica del montaje',
            },
            {
              label: 'Transporte',
              value: formatMoney(calculateTransport(finalTotal, quote.notes)),
              hint: 'Según ciudad o zona del evento',
            },
            {
              label: 'Base para ITBIS',
              value: formatMoney(calculateTaxableBase(finalTotal, quote.notes)),
              hint: 'Subtotal + soporte + transporte',
            },
            {
              label: 'ITBIS 18%',
              value: formatMoney(calculateItbis(finalTotal, quote.notes)),
              hint: 'Impuesto aplicado a la base',
            },
            {
              label: 'Total con ITBIS',
              value: formatMoney(calculateTotalWithItbis(finalTotal, quote.notes)),
              hint: 'Total final a pagar',
            },
            {
              label: 'Depósito requerido',
              value: formatMoney(quote.deposit_amount),
              hint: 'Monto para asegurar fecha',
            },
            {
              label: 'Estado actual',
              value: getStatusLabel(quote.status),
              hint: 'Seguimiento de tu cotización',
            },
          ].map((card) => (
            <div key={card.label} style={statCardStyle}>
              <p style={statLabelStyle}>{card.label}</p>
              <p style={statValueStyle}>{card.value}</p>
              <p style={statHintStyle}>{card.hint}</p>
            </div>
          ))}
        </section>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 8,
            marginTop: 12,
          }}
        >
          <section style={panelStyle}>
            <h2 style={panelTitleStyle}>Datos del cliente</h2>
            <div style={detailGridStyle}>
              <p style={detailRowStyle}>
                <strong>Cliente:</strong> {quote.customer_name || '—'}
              </p>
              <p style={detailRowStyle}>
                <strong>Email:</strong> {quote.customer_email || '—'}
              </p>
              <p style={detailRowStyle}>
                <strong>Evento:</strong> {quote.event_type || '—'}
              </p>
              <p style={detailRowStyle}>
                <strong>Fecha:</strong> {formatDate(quote.created_at)}
              </p>
              <p style={detailRowStyle}>
                <strong>Notas:</strong> {quote.notes || '—'}
              </p>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={panelTitleStyle}>Revisión final</h2>
            <div style={detailGridStyle}>
              <p style={detailRowStyle}>
                <strong>Nota del admin:</strong> {quote.admin_note || '—'}
              </p>
              <p style={detailRowStyle}>
                <strong>Referencia de depósito:</strong>{' '}
                {quote.deposit_reference || '—'}
              </p>
              <p style={detailRowStyle}>
                <strong>ID:</strong> {quote.id}
              </p>
            </div>

            <div style={{ marginTop: 14 }}>
              {quote.status === 'approved' ? (
                <button
                  onClick={confirmQuote}
                  disabled={confirming}
                  style={primaryButtonStyle}
                >
                  {confirming ? 'Confirmando...' : 'Confirmar cotización'}
                </button>
              ) : quote.status === 'confirmed' ? (
                <div style={successMiniBoxStyle}>
                  Esta cotización ya fue confirmada.
                </div>
              ) : (
                <div style={infoMiniBoxStyle}>
                  Esta cotización todavía no está lista para confirmar.
                </div>
              )}
            </div>
          </section>
        </div>

        <section style={{ ...panelStyle, marginTop: 14 }}>
          <h2 style={panelTitleStyle}>Comprobante de pago</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 8,
            }}
          >
            <div>
              <p style={detailRowStyle}>
                <strong>Archivo actual:</strong>{' '}
                {quote.payment_proof_name || 'No subido todavía'}
              </p>

              {quote.payment_proof_url && (
                <a
                  href={quote.payment_proof_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 11px',
                    borderRadius: 10,
                    background:
                      'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    textDecoration: 'none',
                    marginTop: 10,
                    boxShadow: '0 12px 24px rgba(236,72,153,0.22)',
                  }}
                >
                  Abrir comprobante
                </a>
              )}
            </div>

            <div>
              <p style={{ margin: '0 0 10px', color: '#94a3b8' }}>
                Sube una imagen o PDF de tu depósito para que el admin pueda
                validarlo.
              </p>

              <div style={{ display: 'grid', gap: 10 }}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                  }}
                  style={fileInputStyle}
                />

                <button
                  onClick={uploadPaymentProof}
                  disabled={!selectedFile || uploading}
                  style={{
                    ...primaryButtonStyle,
                    opacity: !selectedFile || uploading ? 0.6 : 1,
                    cursor:
                      !selectedFile || uploading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {uploading ? 'Subiendo...' : 'Subir comprobante'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section style={{ ...panelStyle, marginTop: 14 }}>
          <div style={quoteItemsHeaderStyle}>
            <div>
              <p style={eyebrowStyle}>Detalle de servicios</p>
              <h2 style={panelTitleStyle}>Productos de tu cotización</h2>
            </div>
            <div style={quoteItemsTotalsStackStyle}>
              <strong style={quoteItemsTotalStyle}>
                Subtotal sin ITBIS:{' '}
                {formatMoney(itemsSubtotal)}
              </strong>
              <span style={quoteItemsTaxStyle}>
                ITBIS 18%:{' '}
                {formatMoney(calculateItbis(itemsSubtotal))}
              </span>
              <strong style={quoteItemsTotalStyle}>
                Total con ITBIS:{' '}
                {formatMoney(calculateTotalWithItbis(itemsSubtotal))}
              </strong>
            </div>
          </div>

          {items.length === 0 ? (
            <p style={{ margin: 0, color: '#94a3b8' }}>
              No hay productos en esta cotización.
            </p>
          ) : (
            <div style={quoteItemsTableWrapStyle}>
              <div style={quoteItemsTableHeaderStyle}>
                <span>Artículo</span>
                <span>Cantidad</span>
                <span>Unitario</span>
                <span>Subtotal</span>
              </div>

              {items.map((item) => (
                <div key={item.id} style={quoteItemsTableRowStyle}>
                  <span style={quoteItemNameWithImageStyle}>
                    {item.product_image_url && (
                      <img
                        src={item.product_image_url}
                        alt={item.product_name}
                        style={quoteItemThumbStyle}
                      />
                    )}
                    <span style={quoteItemNameStyle}>{item.product_name}</span>
                  </span>
                  <span style={printNumberCellStyle}>
                    {Number(item.quantity ?? 0)}
                  </span>
                  <span style={printNumberCellStyle}>
                    {formatMoney(item.unit_price)}
                  </span>
                  <strong style={printNumberStrongCellStyle}>
                    {formatMoney(item.subtotal)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
        </div>
      </div>
    </main>
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top left, rgba(245, 158, 11, 0.18), transparent 26%), radial-gradient(circle at top right, rgba(236, 72, 153, 0.16), transparent 24%), linear-gradient(180deg, #09090f 0%, #11101c 52%, #070711 100%)',
  color: '#e5e7eb',
  padding: '24px 14px 56px',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 980,
  margin: '0 auto',
};

const heroCardStyle: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.86) 0%, rgba(24,24,37,0.82) 48%, rgba(30,27,75,0.72) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.16)',
  borderRadius: 16,
  padding: 14,
  boxShadow: '0 14px 30px rgba(0,0,0,0.24)',
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontSize: 12,
};

const heroTitleStyle: React.CSSProperties = {
  margin: '10px 0 8px',
  fontSize: 15,
  lineHeight: 1.1,
};

const heroTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  maxWidth: 760,
};

const statCardStyle: React.CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(15,23,42,0.82) 0%, rgba(9,14,28,0.82) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  borderRadius: 14,
  padding: 14,
  boxShadow: '0 12px 30px rgba(0,0,0,0.20)',
};

const statLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  fontSize: 13,
};

const statValueStyle: React.CSSProperties = {
  margin: '10px 0 6px',
  fontSize: 19,
  fontWeight: 800,
};

const statHintStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 13,
};

const panelStyle: React.CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(15,23,42,0.82) 0%, rgba(9,14,28,0.86) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  borderRadius: 16,
  padding: 12,
  boxShadow: '0 14px 30px rgba(0,0,0,0.22)',
};

const panelTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 10,
  fontSize: 15,
};

const detailGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
};

const detailRowStyle: React.CSSProperties = {
  margin: 0,
  color: '#e5e7eb',
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 12,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(127, 29, 29, 0.30)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  color: '#fecaca',
};

const successBoxStyle: React.CSSProperties = {
  marginTop: 12,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(20, 83, 45, 0.35)',
  border: '1px solid rgba(74, 222, 128, 0.28)',
  color: '#bbf7d0',
};

const successMiniBoxStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 12,
  background: 'rgba(20, 83, 45, 0.35)',
  border: '1px solid rgba(74, 222, 128, 0.28)',
  color: '#bbf7d0',
  fontWeight: 700,
};

const infoMiniBoxStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 12,
  background: 'rgba(30, 41, 59, 0.8)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  color: '#cbd5e1',
  fontWeight: 600,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '8px 11px',
  borderRadius: 12,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 800,
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  boxShadow: '0 14px 26px rgba(236,72,153,0.24)',
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 11px',
  borderRadius: 12,
  border: '1px solid rgba(250, 204, 21, 0.18)',
  cursor: 'pointer',
  fontWeight: 800,
  background: 'rgba(2, 6, 23, 0.48)',
  color: '#f8fafc',
  textDecoration: 'none',
};

const quoteItemsHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 8,
  flexWrap: 'wrap',
  marginBottom: 8,
};

const quoteItemsTotalStyle: React.CSSProperties = {
  color: '#f8fafc',
  fontSize: 15,
};

const quoteItemsTotalsStackStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  textAlign: 'right',
};

const quoteItemsTaxStyle: React.CSSProperties = {
  color: '#fbbf24',
  fontWeight: 800,
};

const quoteItemsTableWrapStyle: React.CSSProperties = {
  overflowX: 'auto',
  borderRadius: 16,
  border: '1px solid rgba(250, 204, 21, 0.12)',
};

const quoteItemsTableHeaderStyle: React.CSSProperties = {
  minWidth: 560,
  display: 'grid',
  gridTemplateColumns: 'minmax(200px, 1.5fr) 90px 110px 110px',
  gap: 12,
  padding: '10px 12px',
  background: 'rgba(250, 204, 21, 0.08)',
  color: '#fbbf24',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
};

const quoteItemsTableRowStyle: React.CSSProperties = {
  minWidth: 560,
  display: 'grid',
  gridTemplateColumns: 'minmax(200px, 1.5fr) 90px 110px 110px',
  gap: 12,
  padding: '10px 12px',
  borderTop: '1px solid rgba(250, 204, 21, 0.10)',
  background: 'rgba(2, 6, 23, 0.28)',
  color: '#d7e2ee',
  alignItems: 'center',
};

const quoteItemNameWithImageStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
};

const quoteItemThumbStyle: React.CSSProperties = {
  width: 46,
  height: 38,
  objectFit: 'contain',
  borderRadius: 8,
  background: 'rgba(2,6,23,0.54)',
  border: '1px solid rgba(250,204,21,0.12)',
  padding: 4,
  flexShrink: 0,
};

const quoteItemNameStyle: React.CSSProperties = {
  color: '#f8fafc',
  fontWeight: 800,
};

const fileInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 12,
  border: '1px solid rgba(250, 204, 21, 0.16)',
  background: 'rgba(2, 6, 23, 0.58)',
  color: '#e5e7eb',
};

const printItemNameWrapStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
};

const printItemImageStyle: React.CSSProperties = {
  width: 42,
  height: 34,
  objectFit: 'contain',
  borderRadius: 6,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  padding: 3,
  flexShrink: 0,
};

const printEstimateStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '100vh',
  background: '#ffffff',
  color: '#111827',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  padding: 0,
};

const printHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 24,
  alignItems: 'stretch',
  background: 'linear-gradient(135deg, #111827 0%, #1f2937 58%, #92400e 100%)',
  color: '#ffffff',
  borderRadius: 22,
  padding: 22,
  marginBottom: 18,
};

const printBrandBlockStyle: React.CSSProperties = {
  display: 'flex',
  gap: 14,
  alignItems: 'center',
};

const printLogoStyle: React.CSSProperties = {
  width: 96,
  height: 66,
  display: 'grid',
  placeItems: 'center',
  background: 'transparent',
  border: 'none',
  overflow: 'visible',
  flexShrink: 0,
};

const printLogoImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block',
};

const printBrandStyle: React.CSSProperties = {
  margin: 0,
  color: '#ffffff',
  fontSize: 25,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const printMutedStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: '#e5e7eb',
  fontSize: 12,
};

const printContactLineStyle: React.CSSProperties = {
  margin: '7px 0 0',
  color: '#fde68a',
  fontSize: 11,
  fontWeight: 800,
};

const printHeaderMetaStyle: React.CSSProperties = {
  textAlign: 'right',
  padding: 14,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.10)',
  minWidth: 230,
};

const printEstimateLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#fde68a',
  fontSize: 11,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
};

const printEstimateTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#ffffff',
  fontSize: 32,
  lineHeight: 1,
  letterSpacing: '-0.04em',
};

const printInfoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
  marginTop: 14,
  alignItems: 'stretch',
};

const printInfoBoxStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 18,
  padding: 16,
  background: '#f9fafb',
};

const printSectionLabelStyle: React.CSSProperties = {
  margin: '0 0 10px',
  color: '#92400e',
  fontSize: 11,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
};

const printClientNameStyle: React.CSSProperties = {
  margin: '0 0 6px',
  color: '#111827',
  fontSize: 21,
  letterSpacing: '-0.03em',
};

const printInfoTextStyle: React.CSSProperties = {
  margin: '0 0 5px',
  color: '#374151',
  fontSize: 12,
  lineHeight: 1.45,
};

const printTableSectionStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 18,
  overflow: 'hidden',
  marginBottom: 16,
};

const printTableHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 56px 82px 82px',
  columnGap: 12,
  alignItems: 'center',
  background: '#0f172a',
  color: '#ffffff',
  padding: '10px 12px',
  borderRadius: '14px 14px 0 0',
  fontSize: 10,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
};

const printNumberHeaderStyle: React.CSSProperties = {
  textAlign: 'right',
};

const printTableRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 56px 82px 82px',
  columnGap: 12,
  alignItems: 'center',
  padding: '11px 12px',
  borderBottom: '1px solid #e5e7eb',
  breakInside: 'avoid',
  pageBreakInside: 'avoid',
};

const printTableEmptyStyle: React.CSSProperties = {
  padding: 14,
  color: '#6b7280',
  fontSize: 12,
};

const printBottomGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 330px',
  gap: 16,
  alignItems: 'start',
};

const printNotesBoxStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 18,
  padding: 16,
  background: '#ffffff',
};

const printTotalsBoxStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 18,
  padding: 16,
  background: '#f9fafb',
};

const printTotalRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '8px 0',
  borderBottom: '1px solid #e5e7eb',
  color: '#374151',
  fontSize: 12,
};

const printGrandTotalRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '13px 14px',
  margin: '8px -4px 8px',
  color: '#111827',
  fontSize: 18,
  fontWeight: 950,
  borderRadius: 14,
  background: '#fbbf24',
};

const printDepositRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '9px 0 0',
  color: '#111827',
  fontSize: 12,
  fontWeight: 900,
};

const printTermsTextStyle: React.CSSProperties = {
  margin: '12px 0 0',
  color: '#6b7280',
  fontSize: 11,
  lineHeight: 1.45,
};

const printFooterStyle: React.CSSProperties = {
  marginTop: 20,
  paddingTop: 14,
  borderTop: '1px solid #e5e7eb',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
  color: '#6b7280',
  fontSize: 11,
};

const printFooterRightStyle: React.CSSProperties = {
  textAlign: 'right',
};

const conducePageStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '100vh',
  background: '#ffffff',
  color: '#111827',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const conduceHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 24,
  alignItems: 'stretch',
  border: '2px solid #111827',
  borderRadius: 18,
  padding: 18,
  marginBottom: 16,
};

const conduceLogoStyle: React.CSSProperties = {
  width: 92,
  height: 62,
  display: 'grid',
  placeItems: 'center',
  background: '#111827',
  borderRadius: 14,
  padding: 6,
  flexShrink: 0,
};

const conduceBrandStyle: React.CSSProperties = {
  margin: 0,
  color: '#111827',
  fontSize: 24,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const conduceMutedStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: '#6b7280',
  fontSize: 12,
};

const conduceMetaStyle: React.CSSProperties = {
  textAlign: 'right',
  minWidth: 230,
};

const conduceLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#92400e',
  fontSize: 11,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
};

const conduceTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#111827',
  fontSize: 30,
  lineHeight: 1,
  letterSpacing: '-0.04em',
};

const conduceInfoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
  marginBottom: 16,
};

const conduceInfoBoxStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 16,
  padding: 14,
  background: '#f9fafb',
};

const conduceSectionLabelStyle: React.CSSProperties = {
  margin: '0 0 10px',
  color: '#92400e',
  fontSize: 11,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
};

const conduceInfoTextStyle: React.CSSProperties = {
  margin: '0 0 7px',
  color: '#374151',
  fontSize: 12,
  lineHeight: 1.45,
};

const conduceTableSectionStyle: React.CSSProperties = {
  border: '1px solid #111827',
  borderRadius: 16,
  overflow: 'hidden',
  marginBottom: 16,
};

const conduceTableHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 90px 240px',
  gap: 10,
  background: '#111827',
  color: '#ffffff',
  padding: '11px 12px',
  fontSize: 11,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
};

const conduceTableRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 90px 240px',
  gap: 10,
  padding: '11px 12px',
  borderTop: '1px solid #d1d5db',
  color: '#111827',
  fontSize: 12,
  alignItems: 'center',
};

const conduceTableEmptyStyle: React.CSSProperties = {
  padding: 14,
  color: '#6b7280',
  fontSize: 12,
};

const conduceNotesStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 16,
  padding: 14,
  background: '#ffffff',
  marginBottom: 28,
};

const conduceSignaturesGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 18,
  marginTop: 36,
};

const conduceSignatureBoxStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#374151',
  fontSize: 12,
  fontWeight: 800,
};

const conduceSignatureLineStyle: React.CSSProperties = {
  borderTop: '1.5px solid #111827',
  marginBottom: 8,
};


const printItemProductNameStyle: React.CSSProperties = {
  display: 'block',
  color: '#111827',
  fontSize: 13,
  lineHeight: 1.2,
};

const printNumberCellStyle: React.CSSProperties = {
  textAlign: 'right',
  color: '#111827',
  fontSize: 11,
  whiteSpace: 'nowrap',
};

const printNumberStrongCellStyle: React.CSSProperties = {
  textAlign: 'right',
  color: '#111827',
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: 'nowrap',
};

const printItemDescriptionStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: '#64748b',
  fontSize: 10.5,
  lineHeight: 1.35,
  fontWeight: 500,
};
