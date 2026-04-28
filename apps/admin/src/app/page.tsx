'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase/client';

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
  unit_price: number;
  quantity: number;
  subtotal: number;
};

type MeetingRequest = {
  id: string;
  user_id: string | null;
  slot_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  requested_date: string;
  requested_time: string;
  notes: string | null;
  status: string | null;
  created_at: string | null;
};

type MeetingSlot = {
  id: string;
  slot_date: string;
  slot_time: string;
  is_active: boolean | null;
  created_at: string | null;
};

type AdminSection = 'overview' | 'quotes' | 'meetings' | 'slots';
type QuoteSort =
  | 'newest'
  | 'oldest'
  | 'customer_az'
  | 'customer_za'
  | 'total_high'
  | 'total_low';
type MeetingSort =
  | 'newest'
  | 'oldest'
  | 'date_asc'
  | 'date_desc'
  | 'customer_az'
  | 'customer_za';
type SlotSort = 'date_asc' | 'date_desc' | 'active_first' | 'inactive_first';

type ChartDatum = {
  label: string;
  value: number;
};

const STATUS_OPTIONS = [
  'draft',
  'review',
  'approved',
  'sent',
  'confirmed',
  'cancelled',
];

const DEPOSIT_STATUS_OPTIONS = ['pending', 'paid'];
const MEETING_STATUS_OPTIONS = ['pending', 'confirmed', 'cancelled'];

const ITEMS_PER_PAGE = 5;

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatMeetingDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
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

function getDepositLabel(status: string | null | undefined) {
  switch (status) {
    case 'paid':
      return 'Pagado';
    case 'pending':
      return 'Pendiente';
    default:
      return status || '—';
  }
}

function getMeetingLabel(status: string | null | undefined) {
  switch (status) {
    case 'pending':
      return 'Pendiente';
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
    padding: '7px 11px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800,
    border: '1px solid',
  } as const;

  switch (status) {
    case 'approved':
      return {
        ...base,
        background: 'rgba(34, 197, 94, 0.12)',
        color: '#86efac',
        borderColor: 'rgba(34, 197, 94, 0.30)',
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
    padding: '7px 11px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800,
    border: '1px solid',
  } as const;

  if (status === 'paid') {
    return {
      ...base,
      background: 'rgba(34, 197, 94, 0.12)',
      color: '#86efac',
      borderColor: 'rgba(34, 197, 94, 0.30)',
    };
  }

  return {
    ...base,
    background: 'rgba(250, 204, 21, 0.12)',
    color: '#fde68a',
    borderColor: 'rgba(250, 204, 21, 0.28)',
  };
}

function getMeetingBadgeStyle(status: string | null | undefined) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '7px 11px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800,
    border: '1px solid',
  } as const;

  if (status === 'confirmed') {
    return {
      ...base,
      background: 'rgba(34, 197, 94, 0.12)',
      color: '#86efac',
      borderColor: 'rgba(34, 197, 94, 0.30)',
    };
  }

  if (status === 'cancelled') {
    return {
      ...base,
      background: 'rgba(239, 68, 68, 0.12)',
      color: '#fca5a5',
      borderColor: 'rgba(239, 68, 68, 0.28)',
    };
  }

  return {
    ...base,
    background: 'rgba(250, 204, 21, 0.12)',
    color: '#fde68a',
    borderColor: 'rgba(250, 204, 21, 0.28)',
  };
}

function compareStrings(
  a: string | null | undefined,
  b: string | null | undefined
) {
  return (a || '').localeCompare(b || '', 'es', { sensitivity: 'base' });
}

function compareDates(a: string | null | undefined, b: string | null | undefined) {
  return new Date(a || 0).getTime() - new Date(b || 0).getTime();
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function escapeCsvCell(value: unknown) {
  const stringValue = String(value ?? '');
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

function downloadBlob(filename: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const csv = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n');

  downloadBlob(`${filename}.csv`, csv, 'text/csv;charset=utf-8;');
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function exportToExcel(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const headerHtml = headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join('');

  const rowsHtml = rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${escapeHtml(cell)}</td>`)
          .join('')}</tr>`
    )
    .join('');

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>${headerHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  downloadBlob(`${filename}.xls`, html, 'application/vnd.ms-excel;charset=utf-8;');
}

function getMonthKey(dateValue: string | null | undefined) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const month = date.toLocaleDateString('es', { month: 'short' });
  return `${month} ${String(date.getFullYear()).slice(-2)}`;
}

function buildLastSixMonthsData(values: (string | null | undefined)[]) {
  const now = new Date();
  const buckets: Record<string, number> = {};

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.toLocaleDateString('es', { month: 'short' });
    const key = `${month} ${String(d.getFullYear()).slice(-2)}`;
    buckets[key] = 0;
  }

  values.forEach((value) => {
    const key = getMonthKey(value);
    if (key in buckets) {
      buckets[key] += 1;
    }
  });

  return Object.entries(buckets).map(([label, value]) => ({ label, value }));
}

function buildDistribution(
  items: string[],
  mapLabel?: (value: string) => string
): ChartDatum[] {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const key = item || 'sin_estado';
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({
      label: mapLabel ? mapLabel(label) : label,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

function BarChartCard({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: ChartDatum[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <section style={chartCardStyle}>
      <div style={{ marginBottom: 14 }}>
        <p style={chartTitleStyle}>{title}</p>
        <p style={chartSubtitleStyle}>{subtitle}</p>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {data.map((item) => (
          <div key={item.label} style={{ display: 'grid', gap: 6 }}>
            <div style={chartRowLabelStyle}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div style={chartBarTrackStyle}>
              <div
                style={{
                  ...chartBarFillStyle,
                  width: `${(item.value / max) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DonutChartCard({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: ChartDatum[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const safeTotal = total || 1;
  let cursor = 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const colors = ['#3b82f6', '#22c55e', '#facc15', '#ef4444', '#a78bfa', '#14b8a6'];

  return (
    <section style={chartCardStyle}>
      <div style={{ marginBottom: 14 }}>
        <p style={chartTitleStyle}>{title}</p>
        <p style={chartSubtitleStyle}>{subtitle}</p>
      </div>

      <div style={donutWrapStyle}>
        <svg width="150" height="150" viewBox="0 0 150 150">
          <g transform="translate(75 75) rotate(-90)">
            <circle
              r={radius}
              cx="0"
              cy="0"
              fill="transparent"
              stroke="rgba(148, 163, 184, 0.14)"
              strokeWidth="16"
            />
            {data.map((item, index) => {
              const fraction = item.value / safeTotal;
              const dash = fraction * circumference;
              const gap = circumference - dash;
              const offset = -cursor * circumference;
              cursor += fraction;

              return (
                <circle
                  key={item.label}
                  r={radius}
                  cx="0"
                  cy="0"
                  fill="transparent"
                  stroke={colors[index % colors.length]}
                  strokeWidth="16"
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                />
              );
            })}
          </g>
          <text
            x="75"
            y="70"
            textAnchor="middle"
            fill="#e5e7eb"
            fontSize="28"
            fontWeight="800"
          >
            {total}
          </text>
          <text
            x="75"
            y="92"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="12"
          >
            total
          </text>
        </svg>

        <div style={{ display: 'grid', gap: 10, minWidth: 220 }}>
          {data.map((item, index) => (
            <div key={item.label} style={legendRowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    ...legendDotStyle,
                    background: colors[index % colors.length],
                  }}
                />
                <span>{item.label}</span>
              </div>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AdminPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [meetingSlots, setMeetingSlots] = useState<MeetingSlot[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingMeetingId, setSavingMeetingId] = useState<string | null>(null);
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);
  const [creatingSlot, setCreatingSlot] = useState(false);

  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [newSlotActive, setNewSlotActive] = useState(true);

  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState('all');
  const [depositFilter, setDepositFilter] = useState('all');
  const [quoteSort, setQuoteSort] = useState<QuoteSort>('newest');
  const [quotePage, setQuotePage] = useState(1);

  const [meetingSearch, setMeetingSearch] = useState('');
  const [meetingStatusFilter, setMeetingStatusFilter] = useState('all');
  const [meetingSort, setMeetingSort] = useState<MeetingSort>('newest');
  const [meetingPage, setMeetingPage] = useState(1);

  const [slotSearch, setSlotSearch] = useState('');
  const [slotActiveFilter, setSlotActiveFilter] = useState('all');
  const [slotSort, setSlotSort] = useState<SlotSort>('date_asc');
  const [slotPage, setSlotPage] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meeting_requests')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: slotsData, error: slotsError } = await supabase
        .from('meeting_slots')
        .select('*')
        .order('slot_date', { ascending: true })
        .order('slot_time', { ascending: true });

      if (quotesError) {
        setError(quotesError.message);
        setLoading(false);
        return;
      }

      if (itemsError) {
        setError(itemsError.message);
        setLoading(false);
        return;
      }

      if (meetingsError) {
        setError(meetingsError.message);
        setLoading(false);
        return;
      }

      if (slotsError) {
        setError(slotsError.message);
        setLoading(false);
        return;
      }

      setQuotes((quotesData || []) as Quote[]);
      setQuoteItems((itemsData || []) as QuoteItem[]);
      setMeetingRequests((meetingsData || []) as MeetingRequest[]);
      setMeetingSlots((slotsData || []) as MeetingSlot[]);
      setLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    setQuotePage(1);
  }, [quoteSearch, quoteStatusFilter, depositFilter, quoteSort]);

  useEffect(() => {
    setMeetingPage(1);
  }, [meetingSearch, meetingStatusFilter, meetingSort]);

  useEffect(() => {
    setSlotPage(1);
  }, [slotSearch, slotActiveFilter, slotSort]);

  const totals = useMemo(() => {
    return {
      totalQuotes: quotes.length,
      approved: quotes.filter((q) => q.status === 'approved').length,
      confirmed: quotes.filter((q) => q.status === 'confirmed').length,
      paidDeposits: quotes.filter((q) => q.deposit_status === 'paid').length,
      totalMeetings: meetingRequests.length,
      pendingMeetings: meetingRequests.filter((m) => m.status === 'pending').length,
      confirmedMeetings: meetingRequests.filter((m) => m.status === 'confirmed').length,
      totalSlots: meetingSlots.length,
      activeSlots: meetingSlots.filter((s) => s.is_active).length,
      inactiveSlots: meetingSlots.filter((s) => !s.is_active).length,
      quoteRevenue: quotes.reduce(
        (sum, q) => sum + Number(q.admin_final_total ?? q.total ?? 0),
        0
      ),
      depositsRequested: quotes.reduce(
        (sum, q) => sum + Number(q.deposit_amount ?? 0),
        0
      ),
    };
  }, [quotes, meetingRequests, meetingSlots]);

  const quotesByMonth = useMemo(
    () => buildLastSixMonthsData(quotes.map((q) => q.created_at)),
    [quotes]
  );

  const meetingsByMonth = useMemo(
    () => buildLastSixMonthsData(meetingRequests.map((m) => m.created_at)),
    [meetingRequests]
  );

  const quoteStatusDistribution = useMemo(
    () =>
      buildDistribution(quotes.map((q) => q.status || 'sin_estado'), (value) =>
        getStatusLabel(value)
      ),
    [quotes]
  );

  const meetingStatusDistribution = useMemo(
    () =>
      buildDistribution(
        meetingRequests.map((m) => m.status || 'sin_estado'),
        (value) => getMeetingLabel(value)
      ),
    [meetingRequests]
  );

  const depositDistribution = useMemo(
    () =>
      buildDistribution(
        quotes.map((q) => q.deposit_status || 'pending'),
        (value) => getDepositLabel(value)
      ),
    [quotes]
  );

  const slotsDistribution = useMemo(
    () =>
      buildDistribution(
        meetingSlots.map((slot) => (slot.is_active ? 'Activo' : 'Inactivo'))
      ),
    [meetingSlots]
  );

  const filteredQuotes = useMemo(() => {
    const term = quoteSearch.trim().toLowerCase();

    const filtered = quotes.filter((quote) => {
      const matchesSearch =
        term === '' ||
        quote.id.toLowerCase().includes(term) ||
        (quote.customer_name || '').toLowerCase().includes(term) ||
        (quote.customer_email || '').toLowerCase().includes(term) ||
        (quote.event_type || '').toLowerCase().includes(term) ||
        (quote.notes || '').toLowerCase().includes(term);

      const matchesStatus =
        quoteStatusFilter === 'all' || (quote.status || '') === quoteStatusFilter;

      const matchesDeposit =
        depositFilter === 'all' ||
        (quote.deposit_status || 'pending') === depositFilter;

      return matchesSearch && matchesStatus && matchesDeposit;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (quoteSort) {
        case 'oldest':
          return compareDates(a.created_at, b.created_at);
        case 'customer_az':
          return compareStrings(a.customer_name, b.customer_name);
        case 'customer_za':
          return compareStrings(b.customer_name, a.customer_name);
        case 'total_high':
          return (
            Number(b.admin_final_total ?? b.total ?? 0) -
            Number(a.admin_final_total ?? a.total ?? 0)
          );
        case 'total_low':
          return (
            Number(a.admin_final_total ?? a.total ?? 0) -
            Number(b.admin_final_total ?? b.total ?? 0)
          );
        case 'newest':
        default:
          return compareDates(b.created_at, a.created_at);
      }
    });

    return sorted;
  }, [quotes, quoteSearch, quoteStatusFilter, depositFilter, quoteSort]);

  const filteredMeetings = useMemo(() => {
    const term = meetingSearch.trim().toLowerCase();

    const filtered = meetingRequests.filter((meeting) => {
      const matchesSearch =
        term === '' ||
        meeting.id.toLowerCase().includes(term) ||
        (meeting.customer_name || '').toLowerCase().includes(term) ||
        (meeting.customer_email || '').toLowerCase().includes(term) ||
        (meeting.notes || '').toLowerCase().includes(term) ||
        meeting.requested_date.toLowerCase().includes(term) ||
        meeting.requested_time.toLowerCase().includes(term);

      const matchesStatus =
        meetingStatusFilter === 'all' ||
        (meeting.status || 'pending') === meetingStatusFilter;

      return matchesSearch && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (meetingSort) {
        case 'oldest':
          return compareDates(a.created_at, b.created_at);
        case 'date_asc': {
          const aKey = `${a.requested_date} ${a.requested_time}`;
          const bKey = `${b.requested_date} ${b.requested_time}`;
          return aKey.localeCompare(bKey);
        }
        case 'date_desc': {
          const aKey = `${a.requested_date} ${a.requested_time}`;
          const bKey = `${b.requested_date} ${b.requested_time}`;
          return bKey.localeCompare(aKey);
        }
        case 'customer_az':
          return compareStrings(a.customer_name, b.customer_name);
        case 'customer_za':
          return compareStrings(b.customer_name, a.customer_name);
        case 'newest':
        default:
          return compareDates(b.created_at, a.created_at);
      }
    });

    return sorted;
  }, [meetingRequests, meetingSearch, meetingStatusFilter, meetingSort]);

  const filteredSlots = useMemo(() => {
    const term = slotSearch.trim().toLowerCase();

    const filtered = meetingSlots.filter((slot) => {
      const matchesSearch =
        term === '' ||
        slot.id.toLowerCase().includes(term) ||
        slot.slot_date.toLowerCase().includes(term) ||
        slot.slot_time.toLowerCase().includes(term);

      const activeValue = slot.is_active ? 'active' : 'inactive';
      const matchesActive =
        slotActiveFilter === 'all' || activeValue === slotActiveFilter;

      return matchesSearch && matchesActive;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (slotSort) {
        case 'date_desc': {
          const aKey = `${a.slot_date} ${a.slot_time}`;
          const bKey = `${b.slot_date} ${b.slot_time}`;
          return bKey.localeCompare(aKey);
        }
        case 'active_first':
          if (a.is_active === b.is_active) {
            const aKey = `${a.slot_date} ${a.slot_time}`;
            const bKey = `${b.slot_date} ${b.slot_time}`;
            return aKey.localeCompare(bKey);
          }
          return a.is_active ? -1 : 1;
        case 'inactive_first':
          if (a.is_active === b.is_active) {
            const aKey = `${a.slot_date} ${a.slot_time}`;
            const bKey = `${b.slot_date} ${b.slot_time}`;
            return aKey.localeCompare(bKey);
          }
          return a.is_active ? 1 : -1;
        case 'date_asc':
        default: {
          const aKey = `${a.slot_date} ${a.slot_time}`;
          const bKey = `${b.slot_date} ${b.slot_time}`;
          return aKey.localeCompare(bKey);
        }
      }
    });

    return sorted;
  }, [meetingSlots, slotSearch, slotActiveFilter, slotSort]);

  const quotePageCount = Math.max(
    1,
    Math.ceil(filteredQuotes.length / ITEMS_PER_PAGE)
  );
  const meetingPageCount = Math.max(
    1,
    Math.ceil(filteredMeetings.length / ITEMS_PER_PAGE)
  );
  const slotPageCount = Math.max(
    1,
    Math.ceil(filteredSlots.length / ITEMS_PER_PAGE)
  );

  const paginatedQuotes = useMemo(
    () =>
      paginate(
        filteredQuotes,
        Math.min(quotePage, quotePageCount),
        ITEMS_PER_PAGE
      ),
    [filteredQuotes, quotePage, quotePageCount]
  );

  const paginatedMeetings = useMemo(
    () =>
      paginate(
        filteredMeetings,
        Math.min(meetingPage, meetingPageCount),
        ITEMS_PER_PAGE
      ),
    [filteredMeetings, meetingPage, meetingPageCount]
  );

  const paginatedSlots = useMemo(
    () =>
      paginate(filteredSlots, Math.min(slotPage, slotPageCount), ITEMS_PER_PAGE),
    [filteredSlots, slotPage, slotPageCount]
  );

  const sendAdminStatusEmail = async (payload: Record<string, unknown>) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // no rompemos el flujo del admin si el correo falla
    }
  };

  const updateStatus = async (quoteId: string, newStatus: string) => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) return;

    setSavingId(quoteId);
    setError(null);

    const { error } = await supabase
      .from('quotes')
      .update({ status: newStatus })
      .eq('id', quoteId);

    if (error) {
      setError(error.message);
      setSavingId(null);
      return;
    }

    setQuotes((prev) =>
      prev.map((item) =>
        item.id === quoteId ? { ...item, status: newStatus } : item
      )
    );

    if (newStatus === 'approved') {
      await sendAdminStatusEmail({
        type: 'quote_status_changed',
        quoteId: quote.id,
        customerName: quote.customer_name,
        customerEmail: quote.customer_email,
        eventType: quote.event_type,
        status: newStatus,
        total: quote.admin_final_total ?? quote.total ?? 0,
      });
    }

    setSavingId(null);
  };

  const updateQuoteField = async (
    quoteId: string,
    field:
      | 'admin_final_total'
      | 'admin_note'
      | 'deposit_amount'
      | 'deposit_status'
      | 'deposit_reference',
    value: string
  ) => {
    setQuotes((prev) =>
      prev.map((quote) =>
        quote.id === quoteId
          ? {
              ...quote,
              [field]:
                field === 'admin_final_total' || field === 'deposit_amount'
                  ? value === ''
                    ? null
                    : Number(value)
                  : value,
            }
          : quote
      )
    );
  };

  const saveAdminReview = async (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) return;

    setSavingId(quoteId);
    setError(null);

    const { error } = await supabase
      .from('quotes')
      .update({
        admin_final_total: quote.admin_final_total,
        admin_note: quote.admin_note,
        deposit_amount: quote.deposit_amount,
        deposit_status: quote.deposit_status,
        deposit_reference: quote.deposit_reference,
      })
      .eq('id', quoteId);

    if (error) {
      setError(error.message);
      setSavingId(null);
      return;
    }

    setSavingId(null);
  };

  const updateMeetingStatus = async (
    meetingId: string,
    newStatus: string
  ) => {
    const meeting = meetingRequests.find((m) => m.id === meetingId);
    if (!meeting) return;

    setSavingMeetingId(meetingId);
    setError(null);

    const { error } = await supabase
      .from('meeting_requests')
      .update({ status: newStatus })
      .eq('id', meetingId);

    if (error) {
      setError(error.message);
      setSavingMeetingId(null);
      return;
    }

    if (newStatus === 'cancelled' && meeting.slot_id) {
      const { error: slotError } = await supabase
        .from('meeting_slots')
        .update({ is_active: true })
        .eq('id', meeting.slot_id);

      if (slotError) {
        setError(slotError.message);
        setSavingMeetingId(null);
        return;
      }

      setMeetingSlots((prev) =>
        prev.map((slot) =>
          slot.id === meeting.slot_id ? { ...slot, is_active: true } : slot
        )
      );
    }

    setMeetingRequests((prev) =>
      prev.map((item) =>
        item.id === meetingId ? { ...item, status: newStatus } : item
      )
    );

    if (newStatus === 'confirmed' || newStatus === 'cancelled') {
      await sendAdminStatusEmail({
        type: 'meeting_status_changed',
        customerName: meeting.customer_name,
        customerEmail: meeting.customer_email,
        requestedDate: meeting.requested_date,
        requestedTime: meeting.requested_time,
        status: newStatus,
      });
    }

    setSavingMeetingId(null);
  };

  const createMeetingSlot = async () => {
    if (!newSlotDate) {
      setError('Debes elegir una fecha para el horario.');
      return;
    }

    if (!newSlotTime) {
      setError('Debes elegir una hora para el horario.');
      return;
    }

    setCreatingSlot(true);
    setError(null);

    const { data, error } = await supabase
      .from('meeting_slots')
      .insert([
        {
          slot_date: newSlotDate,
          slot_time: newSlotTime,
          is_active: newSlotActive,
        },
      ])
      .select()
      .single();

    if (error) {
      setError(error.message);
      setCreatingSlot(false);
      return;
    }

    setMeetingSlots((prev) =>
      [data as MeetingSlot, ...prev].sort((a, b) => {
        const aKey = `${a.slot_date} ${a.slot_time}`;
        const bKey = `${b.slot_date} ${b.slot_time}`;
        return aKey.localeCompare(bKey);
      })
    );

    setNewSlotDate('');
    setNewSlotTime('');
    setNewSlotActive(true);
    setCreatingSlot(false);
  };

  const toggleMeetingSlot = async (slotId: string, nextValue: boolean) => {
    setSavingSlotId(slotId);
    setError(null);

    const { error } = await supabase
      .from('meeting_slots')
      .update({ is_active: nextValue })
      .eq('id', slotId);

    if (error) {
      setError(error.message);
      setSavingSlotId(null);
      return;
    }

    setMeetingSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId ? { ...slot, is_active: nextValue } : slot
      )
    );

    setSavingSlotId(null);
  };

  const exportQuotesCsv = () => {
    const headers = [
      'ID',
      'Cliente',
      'Email',
      'Evento',
      'Estado',
      'Total inicial',
      'Total final',
      'Deposito requerido',
      'Estado deposito',
      'Referencia deposito',
      'Nota admin',
      'Notas cliente',
      'Fecha creada',
    ];

    const rows = filteredQuotes.map((quote) => [
      quote.id,
      quote.customer_name || '',
      quote.customer_email || '',
      quote.event_type || '',
      quote.status || '',
      quote.total ?? 0,
      quote.admin_final_total ?? 0,
      quote.deposit_amount ?? 0,
      quote.deposit_status || '',
      quote.deposit_reference || '',
      quote.admin_note || '',
      quote.notes || '',
      formatDate(quote.created_at),
    ]);

    exportToCsv('admin_cotizaciones', headers, rows);
  };

  const exportQuotesExcel = () => {
    const headers = [
      'ID',
      'Cliente',
      'Email',
      'Evento',
      'Estado',
      'Total inicial',
      'Total final',
      'Deposito requerido',
      'Estado deposito',
      'Referencia deposito',
      'Nota admin',
      'Notas cliente',
      'Fecha creada',
    ];

    const rows = filteredQuotes.map((quote) => [
      quote.id,
      quote.customer_name || '',
      quote.customer_email || '',
      quote.event_type || '',
      quote.status || '',
      quote.total ?? 0,
      quote.admin_final_total ?? 0,
      quote.deposit_amount ?? 0,
      quote.deposit_status || '',
      quote.deposit_reference || '',
      quote.admin_note || '',
      quote.notes || '',
      formatDate(quote.created_at),
    ]);

    exportToExcel('admin_cotizaciones', headers, rows);
  };

  const exportMeetingsCsv = () => {
    const headers = [
      'ID',
      'Cliente',
      'Email',
      'Fecha solicitada',
      'Hora solicitada',
      'Estado',
      'Notas',
      'Fecha creada',
    ];

    const rows = filteredMeetings.map((meeting) => [
      meeting.id,
      meeting.customer_name || '',
      meeting.customer_email || '',
      meeting.requested_date,
      meeting.requested_time,
      meeting.status || '',
      meeting.notes || '',
      formatDate(meeting.created_at),
    ]);

    exportToCsv('admin_reuniones', headers, rows);
  };

  const exportMeetingsExcel = () => {
    const headers = [
      'ID',
      'Cliente',
      'Email',
      'Fecha solicitada',
      'Hora solicitada',
      'Estado',
      'Notas',
      'Fecha creada',
    ];

    const rows = filteredMeetings.map((meeting) => [
      meeting.id,
      meeting.customer_name || '',
      meeting.customer_email || '',
      meeting.requested_date,
      meeting.requested_time,
      meeting.status || '',
      meeting.notes || '',
      formatDate(meeting.created_at),
    ]);

    exportToExcel('admin_reuniones', headers, rows);
  };

  const exportSlotsCsv = () => {
    const headers = ['ID', 'Fecha', 'Hora', 'Estado', 'Fecha creada'];

    const rows = filteredSlots.map((slot) => [
      slot.id,
      slot.slot_date,
      slot.slot_time,
      slot.is_active ? 'Activo' : 'Inactivo',
      formatDate(slot.created_at),
    ]);

    exportToCsv('admin_horarios', headers, rows);
  };

  const exportSlotsExcel = () => {
    const headers = ['ID', 'Fecha', 'Hora', 'Estado', 'Fecha creada'];

    const rows = filteredSlots.map((slot) => [
      slot.id,
      slot.slot_date,
      slot.slot_time,
      slot.is_active ? 'Activo' : 'Inactivo',
      formatDate(slot.created_at),
    ]);

    exportToExcel('admin_horarios', headers, rows);
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <section style={heroCardStyle}>
            <p style={eyebrowStyle}>Backoffice</p>
            <h1 style={heroTitleStyle}>Panel Admin</h1>
            <p style={heroTextStyle}>
              Cargando cotizaciones, reuniones y horarios...
            </p>
          </section>
        </div>
      </main>
    );
  }

  const renderOverview = () => (
    <>
      <div style={statsGridStyle}>
        {[
          {
            label: 'Cotizaciones',
            value: totals.totalQuotes,
            hint: 'Solicitudes registradas',
          },
          {
            label: 'Reuniones',
            value: totals.totalMeetings,
            hint: 'Solicitudes recibidas',
          },
          {
            label: 'Ingresos estimados',
            value: formatMoney(totals.quoteRevenue),
            hint: 'Suma de totales',
          },
          {
            label: 'Depósitos solicitados',
            value: formatMoney(totals.depositsRequested),
            hint: 'Total acumulado',
          },
          {
            label: 'Aprobadas',
            value: totals.approved,
            hint: 'Cotizaciones listas',
          },
          {
            label: 'Depósitos pagados',
            value: totals.paidDeposits,
            hint: 'Pagos validados',
          },
          {
            label: 'Horarios activos',
            value: totals.activeSlots,
            hint: 'Disponibles',
          },
          {
            label: 'Horarios inactivos',
            value: totals.inactiveSlots,
            hint: 'Ocupados o cerrados',
          },
        ].map((card) => (
          <div key={card.label} style={statCardStyle}>
            <p style={statLabelStyle}>{card.label}</p>
            <p style={statValueStyle}>{card.value}</p>
            <p style={statHintStyle}>{card.hint}</p>
          </div>
        ))}
      </div>

      <div style={dashboardGridStyle}>
        <BarChartCard
          title="Cotizaciones por mes"
          subtitle="Últimos 6 meses"
          data={quotesByMonth}
        />
        <BarChartCard
          title="Reuniones por mes"
          subtitle="Últimos 6 meses"
          data={meetingsByMonth}
        />
        <DonutChartCard
          title="Estados de cotizaciones"
          subtitle="Distribución actual"
          data={quoteStatusDistribution}
        />
        <DonutChartCard
          title="Estados de reuniones"
          subtitle="Distribución actual"
          data={meetingStatusDistribution}
        />
        <DonutChartCard
          title="Depósitos"
          subtitle="Pendientes vs pagados"
          data={depositDistribution}
        />
        <DonutChartCard
          title="Horarios"
          subtitle="Activos vs inactivos"
          data={slotsDistribution}
        />
      </div>
    </>
  );

  const renderMeetings = () => (
    <section style={sectionStyle}>
      <div style={sectionHeaderRowStyle}>
        <div>
          <p style={sectionEyebrowStyle}>Solicitudes</p>
          <h2 style={sectionTitleStyle}>Reuniones solicitadas</h2>
        </div>

        <div style={exportButtonsWrapStyle}>
          <button onClick={exportMeetingsCsv} style={secondaryButtonStyle}>
            Exportar CSV
          </button>
          <button onClick={exportMeetingsExcel} style={primaryButtonStyle}>
            Exportar Excel
          </button>
        </div>
      </div>

      <div style={filtersBarStyleMeetings}>
        <input
          type="text"
          placeholder="Buscar por nombre, email, fecha, hora, notas o ID"
          value={meetingSearch}
          onChange={(e) => setMeetingSearch(e.target.value)}
          style={searchInputStyle}
        />
        <select
          value={meetingStatusFilter}
          onChange={(e) => setMeetingStatusFilter(e.target.value)}
          style={filterSelectStyle}
        >
          <option value="all">Todos los estados</option>
          {MEETING_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={meetingSort}
          onChange={(e) => setMeetingSort(e.target.value as MeetingSort)}
          style={filterSelectStyle}
        >
          <option value="newest">Más nuevas</option>
          <option value="oldest">Más antiguas</option>
          <option value="date_asc">Fecha ascendente</option>
          <option value="date_desc">Fecha descendente</option>
          <option value="customer_az">Cliente A-Z</option>
          <option value="customer_za">Cliente Z-A</option>
        </select>
      </div>

      <p style={resultsTextStyle}>
        {filteredMeetings.length} resultado
        {filteredMeetings.length === 1 ? '' : 's'} · página{' '}
        {Math.min(meetingPage, meetingPageCount)} de {meetingPageCount}
      </p>

      {paginatedMeetings.length === 0 ? (
        <div style={cardStyle}>
          <p style={mutedTextStyle}>
            No hay reuniones que coincidan con los filtros.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 18 }}>
          {paginatedMeetings.map((meeting) => (
            <article key={meeting.id} style={cardStyle}>
              <div style={cardHeaderWrapStyle}>
                <div>
                  <h3 style={articleTitleStyle}>
                    {meeting.customer_name || 'Cliente sin nombre'}
                  </h3>
                  <p style={articleMetaStyle}>
                    Email: {meeting.customer_email || '—'}
                  </p>
                  <p style={articleMetaStyle}>
                    Fecha solicitada: {formatMeetingDate(meeting.requested_date)}
                  </p>
                  <p style={articleMetaStyle}>
                    Hora solicitada: {meeting.requested_time}
                  </p>
                  <p style={articleMetaStyle}>
                    Creada: {formatDate(meeting.created_at)}
                  </p>
                </div>

                <span style={getMeetingBadgeStyle(meeting.status)}>
                  {getMeetingLabel(meeting.status)}
                </span>
              </div>

              <section style={subPanelStyle}>
                <h4 style={subPanelTitleStyle}>Notas del cliente</h4>
                <p style={notesTextStyle}>
                  {meeting.notes || 'Sin notas adicionales.'}
                </p>
              </section>

              <section style={{ ...subPanelStyle, marginTop: 16 }}>
                <h4 style={subPanelTitleStyle}>Estado de la reunión</h4>

                <div style={actionRowStyle}>
                  <select
                    value={meeting.status || 'pending'}
                    onChange={(e) =>
                      updateMeetingStatus(meeting.id, e.target.value)
                    }
                    disabled={savingMeetingId === meeting.id}
                    style={{ ...inputStyle, minWidth: 220 }}
                  >
                    {MEETING_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  {savingMeetingId === meeting.id && (
                    <span style={mutedTextStyle}>Guardando...</span>
                  )}
                </div>
              </section>
            </article>
          ))}

          <PaginationControls
            page={Math.min(meetingPage, meetingPageCount)}
            pageCount={meetingPageCount}
            onPrev={() => setMeetingPage((p) => Math.max(1, p - 1))}
            onNext={() =>
              setMeetingPage((p) => Math.min(meetingPageCount, p + 1))
            }
          />
        </div>
      )}
    </section>
  );

  const renderQuotes = () => (
    <section style={sectionStyle}>
      <div style={sectionHeaderRowStyle}>
        <div>
          <p style={sectionEyebrowStyle}>Cotizaciones</p>
          <h2 style={sectionTitleStyle}>Cotizaciones recibidas</h2>
        </div>

        <div style={exportButtonsWrapStyle}>
          <button onClick={exportQuotesCsv} style={secondaryButtonStyle}>
            Exportar CSV
          </button>
          <button onClick={exportQuotesExcel} style={primaryButtonStyle}>
            Exportar Excel
          </button>
        </div>
      </div>

      <div style={filtersBarStyleQuotes}>
        <input
          type="text"
          placeholder="Buscar por cliente, email, evento, notas o ID"
          value={quoteSearch}
          onChange={(e) => setQuoteSearch(e.target.value)}
          style={searchInputStyle}
        />
        <select
          value={quoteStatusFilter}
          onChange={(e) => setQuoteStatusFilter(e.target.value)}
          style={filterSelectStyle}
        >
          <option value="all">Todos los estados</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={depositFilter}
          onChange={(e) => setDepositFilter(e.target.value)}
          style={filterSelectStyle}
        >
          <option value="all">Todos los depósitos</option>
          {DEPOSIT_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={quoteSort}
          onChange={(e) => setQuoteSort(e.target.value as QuoteSort)}
          style={filterSelectStyle}
        >
          <option value="newest">Más nuevas</option>
          <option value="oldest">Más antiguas</option>
          <option value="customer_az">Cliente A-Z</option>
          <option value="customer_za">Cliente Z-A</option>
          <option value="total_high">Total mayor-menor</option>
          <option value="total_low">Total menor-mayor</option>
        </select>
      </div>

      <p style={resultsTextStyle}>
        {filteredQuotes.length} resultado
        {filteredQuotes.length === 1 ? '' : 's'} · página{' '}
        {Math.min(quotePage, quotePageCount)} de {quotePageCount}
      </p>

      {paginatedQuotes.length === 0 ? (
        <div style={cardStyle}>
          <p style={mutedTextStyle}>
            No hay cotizaciones que coincidan con los filtros.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 22 }}>
          {paginatedQuotes.map((quote) => {
            const itemsForQuote = quoteItems.filter(
              (item) => item.quote_id === quote.id
            );

            return (
              <article key={quote.id} style={cardStyle}>
                <div style={cardHeaderWrapStyle}>
                  <div>
                    <p style={smallLabelStyle}>Cotización</p>
                    <h2 style={articleTitleStyle}>
                      {quote.customer_name || 'Cliente sin nombre'}
                    </h2>
                    <p style={articleMetaStyle}>ID: {quote.id}</p>
                  </div>

                  <div style={badgeRowStyle}>
                    <span style={getStatusBadgeStyle(quote.status)}>
                      {getStatusLabel(quote.status)}
                    </span>
                    <span style={getDepositBadgeStyle(quote.deposit_status)}>
                      Depósito {getDepositLabel(quote.deposit_status)}
                    </span>
                  </div>
                </div>

                <div style={infoGridStyle}>
                  <section style={subPanelStyle}>
                    <h3 style={subPanelTitleStyle}>Datos del cliente</h3>
                    <p style={rowTextStyle}>
                      <strong>Cliente:</strong> {quote.customer_name || '—'}
                    </p>
                    <p style={rowTextStyle}>
                      <strong>Email:</strong> {quote.customer_email || '—'}
                    </p>
                    <p style={rowTextStyle}>
                      <strong>Evento:</strong> {quote.event_type || '—'}
                    </p>
                    <p style={rowTextStyle}>
                      <strong>Fecha:</strong> {formatDate(quote.created_at)}
                    </p>
                    <p style={rowTextStyle}>
                      <strong>Notas:</strong> {quote.notes || '—'}
                    </p>
                  </section>

                  <section style={subPanelStyle}>
                    <h3 style={subPanelTitleStyle}>Resumen económico</h3>
                    <p style={rowTextStyle}>
                      <strong>Total inicial:</strong> {formatMoney(quote.total)}
                    </p>
                    <p style={rowTextStyle}>
                      <strong>Total final:</strong>{' '}
                      {formatMoney(quote.admin_final_total)}
                    </p>
                    <p style={rowTextStyle}>
                      <strong>Depósito requerido:</strong>{' '}
                      {formatMoney(quote.deposit_amount)}
                    </p>
                    <p style={rowTextStyle}>
                      <strong>Referencia:</strong>{' '}
                      {quote.deposit_reference || '—'}
                    </p>
                    <p style={rowTextStyle}>
                      <strong>Nota interna:</strong> {quote.admin_note || '—'}
                    </p>
                  </section>
                </div>

                <section style={{ ...subPanelStyle, marginTop: 16 }}>
                  <h3 style={subPanelTitleStyle}>Comprobante</h3>

                  {quote.payment_proof_url ? (
                    <div style={{ display: 'grid', gap: 10 }}>
                      <p style={rowTextStyle}>
                        <strong>Archivo:</strong>{' '}
                        {quote.payment_proof_name || 'Sin nombre'}
                      </p>
                      <div>
                        <a
                          href={quote.payment_proof_url}
                          target="_blank"
                          rel="noreferrer"
                          style={primaryLinkStyle}
                        >
                          Abrir comprobante
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p style={mutedTextStyle}>
                      No se ha subido comprobante todavía.
                    </p>
                  )}
                </section>

                <section style={{ ...subPanelStyle, marginTop: 16 }}>
                  <h3 style={subPanelTitleStyle}>Controles del admin</h3>

                  <div style={controlsGridStyle}>
                    <div>
                      <label style={labelStyle}>Estado</label>
                      <select
                        value={quote.status || 'draft'}
                        onChange={(e) => updateStatus(quote.id, e.target.value)}
                        disabled={savingId === quote.id}
                        style={inputStyle}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Total final</label>
                      <input
                        type="number"
                        placeholder="Precio final ajustado"
                        value={quote.admin_final_total ?? ''}
                        onChange={(e) =>
                          updateQuoteField(
                            quote.id,
                            'admin_final_total',
                            e.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Depósito requerido</label>
                      <input
                        type="number"
                        placeholder="Monto del depósito"
                        value={quote.deposit_amount ?? ''}
                        onChange={(e) =>
                          updateQuoteField(
                            quote.id,
                            'deposit_amount',
                            e.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Estado del depósito</label>
                      <select
                        value={quote.deposit_status || 'pending'}
                        onChange={(e) =>
                          updateQuoteField(
                            quote.id,
                            'deposit_status',
                            e.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        {DEPOSIT_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                    <div>
                      <label style={labelStyle}>Referencia del depósito</label>
                      <input
                        type="text"
                        placeholder="Referencia del depósito"
                        value={quote.deposit_reference ?? ''}
                        onChange={(e) =>
                          updateQuoteField(
                            quote.id,
                            'deposit_reference',
                            e.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Nota interna</label>
                      <textarea
                        placeholder="Nota interna del admin"
                        value={quote.admin_note ?? ''}
                        onChange={(e) =>
                          updateQuoteField(quote.id, 'admin_note', e.target.value)
                        }
                        style={{
                          ...inputStyle,
                          minHeight: 96,
                          resize: 'vertical',
                        }}
                      />
                    </div>

                    <div>
                      <button
                        onClick={() => saveAdminReview(quote.id)}
                        disabled={savingId === quote.id}
                        style={{
                          ...primaryButtonStyle,
                          opacity: savingId === quote.id ? 0.72 : 1,
                        }}
                      >
                        {savingId === quote.id
                          ? 'Guardando...'
                          : 'Guardar revisión'}
                      </button>
                    </div>
                  </div>
                </section>

                <section style={{ ...subPanelStyle, marginTop: 16 }}>
                  <h3 style={subPanelTitleStyle}>Productos solicitados</h3>

                  {itemsForQuote.length === 0 ? (
                    <p style={mutedTextStyle}>No hay productos asociados.</p>
                  ) : (
                    <div style={productsGridStyle}>
                      {itemsForQuote.map((item) => (
                        <div key={item.id} style={miniProductCardStyle}>
                          <p style={miniProductTitleStyle}>{item.product_name}</p>
                          <p style={miniProductMetaStyle}>
                            Cantidad: {item.quantity}
                          </p>
                          <p style={miniProductMetaStyle}>
                            Unitario: {formatMoney(item.unit_price)}
                          </p>
                          <p style={miniProductSubtotalStyle}>
                            Subtotal: {formatMoney(item.subtotal)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </article>
            );
          })}

          <PaginationControls
            page={Math.min(quotePage, quotePageCount)}
            pageCount={quotePageCount}
            onPrev={() => setQuotePage((p) => Math.max(1, p - 1))}
            onNext={() => setQuotePage((p) => Math.min(quotePageCount, p + 1))}
          />
        </div>
      )}
    </section>
  );

  const renderSlots = () => (
    <section style={sectionStyle}>
      <div style={sectionHeaderRowStyle}>
        <div>
          <p style={sectionEyebrowStyle}>Agenda</p>
          <h2 style={sectionTitleStyle}>Horarios disponibles</h2>
        </div>

        <div style={exportButtonsWrapStyle}>
          <button onClick={exportSlotsCsv} style={secondaryButtonStyle}>
            Exportar CSV
          </button>
          <button onClick={exportSlotsExcel} style={primaryButtonStyle}>
            Exportar Excel
          </button>
        </div>
      </div>

      <div style={filtersBarStyleSlots}>
        <input
          type="text"
          placeholder="Buscar por fecha, hora o ID"
          value={slotSearch}
          onChange={(e) => setSlotSearch(e.target.value)}
          style={searchInputStyle}
        />
        <select
          value={slotActiveFilter}
          onChange={(e) => setSlotActiveFilter(e.target.value)}
          style={filterSelectStyle}
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <select
          value={slotSort}
          onChange={(e) => setSlotSort(e.target.value as SlotSort)}
          style={filterSelectStyle}
        >
          <option value="date_asc">Fecha ascendente</option>
          <option value="date_desc">Fecha descendente</option>
          <option value="active_first">Activos primero</option>
          <option value="inactive_first">Inactivos primero</option>
        </select>
      </div>

      <p style={resultsTextStyle}>
        {filteredSlots.length} resultado
        {filteredSlots.length === 1 ? '' : 's'} · página{' '}
        {Math.min(slotPage, slotPageCount)} de {slotPageCount}
      </p>

      <div style={twoColumnStyle}>
        <section style={cardStyle}>
          <h3 style={cardTitleStyle}>Crear horario</h3>

          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={labelStyle}>Fecha</label>
              <input
                type="date"
                value={newSlotDate}
                onChange={(e) => setNewSlotDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Hora</label>
              <input
                type="time"
                value={newSlotTime}
                onChange={(e) => setNewSlotTime(e.target.value)}
                style={inputStyle}
              />
            </div>

            <label style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={newSlotActive}
                onChange={(e) => setNewSlotActive(e.target.checked)}
              />
              Crear como activo
            </label>

            <button
              onClick={createMeetingSlot}
              disabled={creatingSlot}
              style={primaryButtonStyle}
            >
              {creatingSlot ? 'Creando...' : 'Crear horario'}
            </button>
          </div>
        </section>

        <section style={cardStyle}>
          <h3 style={cardTitleStyle}>Lista de horarios</h3>

          {paginatedSlots.length === 0 ? (
            <p style={mutedTextStyle}>
              No hay horarios que coincidan con los filtros.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {paginatedSlots.map((slot) => (
                <div key={slot.id} style={listItemStyle}>
                  <div>
                    <p style={listItemTitleStyle}>
                      {formatMeetingDate(slot.slot_date)} · {slot.slot_time}
                    </p>
                    <p style={listItemMetaStyle}>
                      Estado: {slot.is_active ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleMeetingSlot(slot.id, !slot.is_active)}
                    disabled={savingSlotId === slot.id}
                    style={{
                      ...secondaryButtonStyle,
                      background: slot.is_active
                        ? 'rgba(127,29,29,0.26)'
                        : '#0f172a',
                      color: '#e5e7eb',
                      borderColor: slot.is_active
                        ? 'rgba(248,113,113,0.22)'
                        : 'rgba(148,163,184,0.18)',
                      opacity: savingSlotId === slot.id ? 0.72 : 1,
                    }}
                  >
                    {savingSlotId === slot.id
                      ? 'Guardando...'
                      : slot.is_active
                      ? 'Desactivar'
                      : 'Activar'}
                  </button>
                </div>
              ))}

              <PaginationControls
                page={Math.min(slotPage, slotPageCount)}
                pageCount={slotPageCount}
                onPrev={() => setSlotPage((p) => Math.max(1, p - 1))}
                onNext={() => setSlotPage((p) => Math.min(slotPageCount, p + 1))}
              />
            </div>
          )}
        </section>
      </div>
    </section>
  );

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={heroCardStyle}>
          <div style={heroHeaderRowStyle}>
            <div>
              <p style={eyebrowStyle}>Backoffice</p>
              <h1 style={heroTitleStyle}>Panel Admin</h1>
              <p style={heroTextStyle}>
                Ahora con dashboard visual, secciones, búsqueda, filtros, orden,
                paginación y exportación.
              </p>
            </div>

            <div style={heroBadgeCardStyle}>
              <p style={heroBadgeLabelStyle}>Estado general</p>
              <p style={heroBadgeValueStyle}>
                {totals.totalQuotes} cotizaciones · {totals.totalMeetings}{' '}
                reuniones
              </p>
              <p style={heroBadgeHintStyle}>
                {totals.activeSlots} horarios activos
              </p>
            </div>
          </div>
        </section>

        <section style={tabsWrapStyle}>
          <button
            onClick={() => setActiveSection('overview')}
            style={getTabStyle(activeSection === 'overview')}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveSection('quotes')}
            style={getTabStyle(activeSection === 'quotes')}
          >
            Cotizaciones
          </button>
          <button
            onClick={() => setActiveSection('meetings')}
            style={getTabStyle(activeSection === 'meetings')}
          >
            Reuniones
          </button>
          <button
            onClick={() => setActiveSection('slots')}
            style={getTabStyle(activeSection === 'slots')}
          >
            Horarios
          </button>
        </section>

        {error && <div style={errorBoxStyle}>{error}</div>}

        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'quotes' && renderQuotes()}
        {activeSection === 'meetings' && renderMeetings()}
        {activeSection === 'slots' && renderSlots()}
      </div>
    </main>
  );
}

function PaginationControls({
  page,
  pageCount,
  onPrev,
  onNext,
}: {
  page: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div style={paginationWrapStyle}>
      <button
        onClick={onPrev}
        disabled={page <= 1}
        style={paginationButtonStyle(page <= 1)}
      >
        Anterior
      </button>
      <span style={paginationTextStyle}>
        Página {page} de {pageCount}
      </span>
      <button
        onClick={onNext}
        disabled={page >= pageCount}
        style={paginationButtonStyle(page >= pageCount)}
      >
        Siguiente
      </button>
    </div>
  );
}

function getTabStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    borderRadius: 14,
    border: active
      ? '1px solid rgba(59,130,246,0.30)'
      : '1px solid rgba(148,163,184,0.16)',
    background: active
      ? 'linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(59,130,246,0.14) 100%)'
      : 'rgba(15,23,42,0.78)',
    color: active ? '#dbeafe' : '#cbd5e1',
    fontWeight: 800,
    cursor: 'pointer',
  };
}

function paginationButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid rgba(148, 163, 184, 0.18)',
    background: '#0f172a',
    color: '#e5e7eb',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  color: '#e5e7eb',
  padding: '34px 20px 80px',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1280,
  margin: '0 auto',
};

const heroCardStyle: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(9,14,28,0.94) 100%)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 30,
  padding: 28,
  boxShadow: '0 24px 60px rgba(0,0,0,0.24)',
};

const heroHeaderRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#60a5fa',
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontSize: 12,
};

const heroTitleStyle: React.CSSProperties = {
  margin: '10px 0 8px',
  fontSize: 42,
  lineHeight: 1.04,
};

const heroTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.6,
  maxWidth: 760,
};

const heroBadgeCardStyle: React.CSSProperties = {
  background: 'rgba(2, 6, 23, 0.34)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  borderRadius: 20,
  padding: 18,
  minWidth: 280,
};

const heroBadgeLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  fontSize: 13,
};

const heroBadgeValueStyle: React.CSSProperties = {
  margin: '8px 0 6px',
  fontSize: 24,
  fontWeight: 900,
};

const heroBadgeHintStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 13,
};

const tabsWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 18,
  marginBottom: 10,
};

const filtersBarStyleQuotes: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(240px, 1fr) repeat(3, minmax(180px, 220px))',
  gap: 12,
  marginBottom: 12,
};

const filtersBarStyleMeetings: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(240px, 1fr) repeat(2, minmax(180px, 220px))',
  gap: 12,
  marginBottom: 12,
};

const filtersBarStyleSlots: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(240px, 1fr) repeat(2, minmax(180px, 220px))',
  gap: 12,
  marginBottom: 12,
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.16)',
  background: '#0b1220',
  color: '#e5e7eb',
};

const filterSelectStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.16)',
  background: '#0b1220',
  color: '#e5e7eb',
};

const resultsTextStyle: React.CSSProperties = {
  margin: '0 0 14px',
  color: '#94a3b8',
  fontSize: 14,
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
  marginTop: 22,
};

const statCardStyle: React.CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(15,23,42,0.84) 0%, rgba(9,14,28,0.92) 100%)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 20,
  padding: 18,
  boxShadow: '0 14px 30px rgba(0,0,0,0.16)',
};

const statLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  fontSize: 13,
};

const statValueStyle: React.CSSProperties = {
  margin: '10px 0 6px',
  fontSize: 30,
  fontWeight: 900,
};

const statHintStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 13,
};

const dashboardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: 18,
  marginTop: 24,
};

const chartCardStyle: React.CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(15,23,42,0.84) 0%, rgba(9,14,28,0.92) 100%)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 24,
  padding: 20,
  boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
};

const chartTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 800,
};

const chartSubtitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#94a3b8',
  fontSize: 14,
};

const chartRowLabelStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  color: '#dbe5f3',
  fontSize: 14,
};

const chartBarTrackStyle: React.CSSProperties = {
  width: '100%',
  height: 12,
  borderRadius: 999,
  background: 'rgba(148, 163, 184, 0.12)',
  overflow: 'hidden',
};

const chartBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: 999,
  background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
};

const donutWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: 18,
  alignItems: 'center',
  flexWrap: 'wrap',
};

const legendRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  color: '#dbe5f3',
};

const legendDotStyle: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: 999,
  display: 'inline-block',
};

const sectionStyle: React.CSSProperties = {
  marginTop: 24,
};

const sectionHeaderRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  marginBottom: 16,
};

const sectionEyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#60a5fa',
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontSize: 12,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  fontSize: 30,
};

const twoColumnStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(320px, 420px) 1fr',
  gap: 18,
};

const exportButtonsWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const cardStyle: React.CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(15,23,42,0.84) 0%, rgba(9,14,28,0.92) 100%)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 24,
  padding: 22,
  boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
};

const cardTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 14,
  fontSize: 22,
};

const cardHeaderWrapStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  marginBottom: 18,
};

const subPanelStyle: React.CSSProperties = {
  background: 'rgba(2, 6, 23, 0.34)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  borderRadius: 18,
  padding: 16,
};

const subPanelTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
  fontSize: 16,
};

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 16,
};

const controlsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
};

const productsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
};

const articleTitleStyle: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 24,
};

const articleMetaStyle: React.CSSProperties = {
  margin: '0 0 6px',
  color: '#94a3b8',
};

const smallLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const badgeRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center',
};

const rowTextStyle: React.CSSProperties = {
  margin: '0 0 8px',
  color: '#d7e2ee',
};

const notesTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#d7e2ee',
  lineHeight: 1.6,
};

const listItemStyle: React.CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.14)',
  borderRadius: 16,
  padding: 14,
  background: 'rgba(2, 6, 23, 0.34)',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap',
};

const listItemTitleStyle: React.CSSProperties = {
  margin: '0 0 6px',
  fontWeight: 800,
};

const listItemMetaStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
};

const miniProductCardStyle: React.CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.14)',
  borderRadius: 16,
  padding: 14,
  background: 'rgba(15, 23, 42, 0.5)',
};

const miniProductTitleStyle: React.CSSProperties = {
  margin: '0 0 8px',
  fontWeight: 800,
};

const miniProductMetaStyle: React.CSSProperties = {
  margin: '0 0 6px',
  color: '#94a3b8',
};

const miniProductSubtotalStyle: React.CSSProperties = {
  margin: 0,
  color: '#e5e7eb',
  fontWeight: 800,
};

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'center',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.16)',
  background: '#0b1220',
  color: '#e5e7eb',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 7,
  color: '#a5b4c7',
  fontSize: 13,
  fontWeight: 600,
};

const checkboxRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: '#e5e7eb',
  fontSize: 14,
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  borderRadius: 14,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 800,
  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  color: '#fff',
  boxShadow: '0 14px 24px rgba(37,99,235,0.22)',
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 14px',
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  cursor: 'pointer',
  fontWeight: 800,
  background: '#0f172a',
  color: '#e5e7eb',
};

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 15px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  color: '#fff',
  fontWeight: 800,
};

const mutedTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 18,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(127, 29, 29, 0.30)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  color: '#fecaca',
};

const paginationWrapStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  paddingTop: 4,
};

const paginationTextStyle: React.CSSProperties = {
  color: '#94a3b8',
};