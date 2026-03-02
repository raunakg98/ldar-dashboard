import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';
import {
  TrendingUp, TrendingDown, Heart, Calendar, MapPin,
  ChevronLeft, ChevronRight, LayoutDashboard, Clock
} from 'lucide-react';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar,
  ResponsiveContainer, ComposedChart, PieChart, Pie, Cell, Area,
  ReferenceArea, ReferenceLine
} from 'recharts';

// =============================================================================
// TYPES
// =============================================================================
type SpeciesRow = {
  ['Adoption Date']: string;
  Species: string;
};

type LOSRow = {
  animal_id: string;
  species: string;
  adoption_date: string;
};

type YTDPoint = { year: string; dogs: number; cats: number };

type MonthlyComparisonPoint = {
  month: string;
  dogs2024: number; cats2024: number;
  dogs2025: number; cats2025: number;
  dogs2026: number; cats2026: number;
  total2024: number; total2025: number; total2026: number;
};

// =============================================================================
// HELPERS
// =============================================================================
function formatInt(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString();
}

function toYear(d: Date) { return d.getFullYear(); }

function rangeYears(startYear: number, endYear: number): string[] {
  const out: string[] = [];
  for (let y = startYear; y <= endYear; y++) out.push(String(y));
  return out;
}

function computeYTDBySpecies(rows: SpeciesRow[], now: Date = new Date()): YTDPoint[] {
  const cutoffMonth = now.getMonth() + 1;
  const cutoffDay = now.getDate();
  const currentYear = toYear(now);
  const agg: Record<string, { dogs: number; cats: number }> = {};
  for (const r of rows) {
    const dt = new Date(r['Adoption Date']);
    if (Number.isNaN(dt.getTime())) continue;
    const y = String(dt.getFullYear());
    const m = dt.getMonth() + 1;
    const d = dt.getDate();
    if (!(m < cutoffMonth || (m === cutoffMonth && d <= cutoffDay))) continue;
    const sp = (r.Species || '').trim().toLowerCase();
    if (!agg[y]) agg[y] = { dogs: 0, cats: 0 };
    if (sp === 'dog') agg[y].dogs += 1;
    if (sp === 'cat') agg[y].cats += 1;
  }
  return rangeYears(2021, currentYear).map((y) => ({
    year: y, dogs: agg[y]?.dogs ?? 0, cats: agg[y]?.cats ?? 0,
  }));
}

function computeMonthlyComparisonMultiYear(rows: SpeciesRow[], years: string[]): MonthlyComparisonPoint[] {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const agg: Record<string, Record<number, { dogs: number; cats: number }>> = {};
  years.forEach(year => {
    agg[year] = {};
    for (let m = 1; m <= 12; m++) agg[year][m] = { dogs: 0, cats: 0 };
  });
  for (const r of rows) {
    const dt = new Date(r['Adoption Date']);
    if (Number.isNaN(dt.getTime())) continue;
    const year = String(dt.getFullYear());
    const month = dt.getMonth() + 1;
    if (!years.includes(year)) continue;
    const sp = (r.Species || '').trim().toLowerCase();
    if (!agg[year][month]) agg[year][month] = { dogs: 0, cats: 0 };
    if (sp === 'dog') agg[year][month].dogs += 1;
    if (sp === 'cat') agg[year][month].cats += 1;
  }
  return MONTHS.map((monthName, idx) => {
    const m = idx + 1;
    const d24 = agg['2024']?.[m] || { dogs: 0, cats: 0 };
    const d25 = agg['2025']?.[m] || { dogs: 0, cats: 0 };
    const d26 = agg['2026']?.[m] || { dogs: 0, cats: 0 };
    return {
      month: monthName,
      dogs2024: d24.dogs, cats2024: d24.cats,
      dogs2025: d25.dogs, cats2025: d25.cats,
      dogs2026: d26.dogs, cats2026: d26.cats,
      total2024: d24.dogs + d24.cats,
      total2025: d25.dogs + d25.cats,
      total2026: d26.dogs + d26.cats,
    };
  });
}

function getMonthData(data: MonthlyComparisonPoint[], monthIndex: number, year: '2024' | '2025' | '2026') {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = data.find(x => x.month === MONTHS[monthIndex]);
  if (!d) return null;
  if (year === '2024') return d.total2024;
  if (year === '2025') return d.total2025;
  return d.total2026;
}

function computeMonthlyBreakdown(data: MonthlyComparisonPoint[], year: '2025' | '2026') {
  return data.map(d => {
    const dogs = year === '2025' ? d.dogs2025 : d.dogs2026;
    const cats = year === '2025' ? d.cats2025 : d.cats2026;
    const total = dogs + cats;
    return {
      month: d.month, dogs, cats, total,
      dogPct: total > 0 ? Math.round((dogs / total) * 1000) / 10 : 0,
      catPct: total > 0 ? Math.round((cats / total) * 1000) / 10 : 0,
    };
  });
}

// =============================================================================
// LOS ANALYSIS TAB
// =============================================================================

// Raw CSV row shape matching actual adoptions.csv headers
type RawAdoptionRow = {
  'Animal ID': string;
  'Species': string;
  'Outcome Date': string;
  [key: string]: string;
};

function LOSAnalysis() {
  const [losRows, setLosRows] = useState<LOSRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    // Try the API first; fall back to local CSV if it fails (e.g. during local dev)
    fetch('/api/los-sheet')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(result => {
        setLosRows(result.data || []);
        setLoading(false);
      })
      .catch(() => {
        // Fallback: public/data/adoptions.csv
        // Headers: "Animal ID", "Species", "Outcome Date"
        Papa.parse('/data/adoptions.csv', {
          download: true,
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
          complete: (res: ParseResult<RawAdoptionRow>) => {
            const rows: LOSRow[] = (res.data as RawAdoptionRow[])
              .filter(r => r['Species'] && r['Outcome Date'])
              .map(r => ({
                animal_id:     r['Animal ID']    || '',
                species:       r['Species']      || '',
                adoption_date: r['Outcome Date'] || '',
              }));
            setLosRows(rows);
            setLoading(false);
          },
          error: (err: Error) => {
            setError(`Could not load CSV: ${err.message}`);
            setLoading(false);
          },
        });
      });
  }, []);

  const stats = useMemo(() => {
    const counts: Record<string, { dogs: number; cats: number; total: number }> = {
      '2024': { dogs: 0, cats: 0, total: 0 },
      '2025': { dogs: 0, cats: 0, total: 0 },
    };
    for (const row of losRows) {
      if (!row.adoption_date) continue;
      const dt = new Date(row.adoption_date);
      if (Number.isNaN(dt.getTime())) continue;
      const year = String(dt.getFullYear());
      if (!counts[year]) continue;
      const sp = (row.species || '').trim().toLowerCase();
      counts[year].total += 1;
      if (sp === 'dog') counts[year].dogs += 1;
      else if (sp === 'cat') counts[year].cats += 1;
    }
    return counts;
  }, [losRows]);

  const barData = [
    { year: '2024', Dogs: stats['2024'].dogs, Cats: stats['2024'].cats, Total: stats['2024'].total },
    { year: '2025', Dogs: stats['2025'].dogs, Cats: stats['2025'].cats, Total: stats['2025'].total },
  ];

  const pieData2024 = [
    { name: 'Dogs', value: stats['2024'].dogs, color: '#3b82f6' },
    { name: 'Cats', value: stats['2024'].cats, color: '#10b981' },
  ];
  const pieData2025 = [
    { name: 'Dogs', value: stats['2025'].dogs, color: '#1d4ed8' },
    { name: 'Cats', value: stats['2025'].cats, color: '#059669' },
  ];

  const yoyDogs  = stats['2024'].dogs  > 0 ? Math.round(((stats['2025'].dogs  - stats['2024'].dogs)  / stats['2024'].dogs)  * 100) : null;
  const yoyCats  = stats['2024'].cats  > 0 ? Math.round(((stats['2025'].cats  - stats['2024'].cats)  / stats['2024'].cats)  * 100) : null;
  const yoyTotal = stats['2024'].total > 0 ? Math.round(((stats['2025'].total - stats['2024'].total) / stats['2024'].total) * 100) : null;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Loading Length of Stay data...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-96">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
        <p className="text-red-800 font-semibold mb-2">Failed to load data</p>
        <p className="text-red-600 text-sm mb-3">{error}</p>
        <p className="text-gray-500 text-xs">Check that <code className="bg-gray-100 px-1 rounded">/api/los-sheet</code> is deployed and <code className="bg-gray-100 px-1 rounded">GOOGLE_SHEET_ID2</code> is set in Vercel.</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Length of Stay Analysis</h1>
        <p className="text-gray-500 text-sm">
          Total adoptions by species: 2024 vs 2025 &nbsp;·&nbsp; {formatInt(losRows.length)} records loaded
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Total 2024</p>
          <p className="text-2xl font-bold text-blue-800 mb-1">{formatInt(stats['2024'].total)}</p>
          <p className="text-xs text-blue-600">{formatInt(stats['2024'].dogs)} dogs · {formatInt(stats['2024'].cats)} cats</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Total 2025</p>
          <p className="text-2xl font-bold text-green-800 mb-1">{formatInt(stats['2025'].total)}</p>
          <p className="text-xs text-green-600">{formatInt(stats['2025'].dogs)} dogs · {formatInt(stats['2025'].cats)} cats</p>
        </div>
        <div className={`${yoyTotal != null && yoyTotal >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'} border rounded-xl p-5 shadow-sm`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${yoyTotal != null && yoyTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>YoY Change</p>
          <p className={`text-2xl font-bold mb-1 ${yoyTotal != null && yoyTotal >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
            {yoyTotal != null ? `${yoyTotal > 0 ? '+' : ''}${yoyTotal}%` : '—'}
          </p>
          <p className={`text-xs ${yoyTotal != null && yoyTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatInt(stats['2024'].total)} → {formatInt(stats['2025'].total)}</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">2025 Mix</p>
          <p className="text-2xl font-bold text-purple-800 mb-1">
            {stats['2025'].total > 0 ? `${Math.round((stats['2025'].dogs / stats['2025'].total) * 100)}% / ${Math.round((stats['2025'].cats / stats['2025'].total) * 100)}%` : '—'}
          </p>
          <p className="text-xs text-purple-600">dogs / cats</p>
        </div>
      </div>

      {/* Bar Chart + YoY Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Adoptions by Year &amp; Species</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={barData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(v: any, n: string) => [`${formatInt(v)} adoptions`, n]} />
              <Legend />
              <Bar dataKey="Dogs" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="Cats" fill="#10b981" radius={[4,4,0,0]} />
              <Line type="monotone" dataKey="Total" stroke="#6b7280" strokeWidth={2} dot={{ r: 5 }} name="Total" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Year over Year by Species</h3>
          <div className="space-y-5">
            {[
              { label: 'Dogs', v24: stats['2024'].dogs, v25: stats['2025'].dogs, yoy: yoyDogs, color: 'blue' },
              { label: 'Cats', v24: stats['2024'].cats, v25: stats['2025'].cats, yoy: yoyCats, color: 'green' },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{s.label}</span>
                  {s.yoy != null && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.yoy >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.yoy > 0 ? '+' : ''}{s.yoy}%
                    </span>
                  )}
                </div>
                <div className="flex gap-3 text-xs text-gray-500 mb-2">
                  <span>2024: <strong className="text-gray-800">{formatInt(s.v24)}</strong></span>
                  <span>→</span>
                  <span>2025: <strong className="text-gray-800">{formatInt(s.v25)}</strong></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.color === 'blue' ? 'bg-blue-400' : 'bg-green-400'}`}
                    style={{ width: `${Math.min(100, (s.v25 / Math.max(s.v24, s.v25, 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-gray-700">Total</span>
                {yoyTotal != null && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${yoyTotal >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {yoyTotal > 0 ? '+' : ''}{yoyTotal}%
                  </span>
                )}
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                <span>2024: <strong className="text-gray-800">{formatInt(stats['2024'].total)}</strong></span>
                <span>→</span>
                <span>2025: <strong className="text-gray-800">{formatInt(stats['2025'].total)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: '2024 Species Mix', data: pieData2024, total: stats['2024'].total },
          { title: '2025 Species Mix', data: pieData2025, total: stats['2025'].total },
        ].map((p, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-2">{p.title}</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={p.data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {p.data.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${formatInt(v)} adoptions`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {p.data.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{d.name}</p>
                      <p className="text-xs text-gray-500">{formatInt(d.value)} ({p.total > 0 ? Math.round((d.value / p.total) * 100) : 0}%)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Source: Google Sheets (GOOGLE_SHEET_ID2) · Col A: Animal ID · Col D: Species · Col Z: Adoption Date
      </p>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD (your original DashboardCards — unchanged logic)
// =============================================================================
function Dashboard() {
  const [speciesRows, setSpeciesRows] = useState<SpeciesRow[]>([]);
  const [comparisonFilter, setComparisonFilter] = useState<'total' | 'dogs' | 'cats'>('total');
  const [selectedYear, setSelectedYear] = useState<2025 | 2026>(2026);
  const [currentVizIndex, setCurrentVizIndex] = useState(0);

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/sheets')
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .then(result => {
          setSpeciesRows((result.data as SpeciesRow[]).filter(r => r['Adoption Date'] && r.Species));
        })
        .catch(() => {
          Papa.parse('/data/adoptions_by_species.csv', {
            download: true, header: true, dynamicTyping: false, skipEmptyLines: true,
            complete: (res: ParseResult<SpeciesRow>) => {
              setSpeciesRows((res.data as SpeciesRow[]).filter(r => r['Adoption Date'] && r.Species));
            },
            error: (err: Error) => console.error('CSV fallback error:', err),
          });
        });
    };
    fetchData();
    const id = setInterval(fetchData, 300000);
    return () => clearInterval(id);
  }, []);

  const reportDate = useMemo(() => selectedYear === 2025 ? new Date(2025, 11, 31) : new Date(), [selectedYear]);
  const cutoffLabel = reportDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const currentMonth = reportDate.getMonth();
  const currentMonthName = reportDate.toLocaleDateString(undefined, { month: 'short' });
  const currentMonthFullName = reportDate.toLocaleDateString(undefined, { month: 'long' });

  const ytdSpeciesData = useMemo(() => computeYTDBySpecies(speciesRows, reportDate), [speciesRows, reportDate]);
  const yearOverYearData = useMemo(() => computeMonthlyComparisonMultiYear(speciesRows, ['2024','2025','2026']), [speciesRows]);

  type ChartYTDPoint = YTDPoint & { total: number; totalYTD: number };
  const ytdSpeciesForChart: ChartYTDPoint[] = useMemo(() =>
    ytdSpeciesData.map(ytd => { const totalYTD = (ytd.dogs ?? 0) + (ytd.cats ?? 0); return { ...ytd, total: totalYTD, totalYTD }; }),
    [ytdSpeciesData]
  );

  const currentYearStr = String(reportDate.getFullYear());
  const prevYearStr = String(reportDate.getFullYear() - 1);
  const findYTDTotal = (year: string) => { const r = ytdSpeciesData.find(p => p.year === year); return r ? r.dogs + r.cats : undefined; };
  const ytdCurrent = findYTDTotal(currentYearStr);
  const ytdPrev = findYTDTotal(prevYearStr);
  const ytdPctVsPrev = ytdCurrent != null && ytdPrev ? Math.round(((ytdCurrent - ytdPrev) / ytdPrev) * 100) : undefined;
  const latestYear = currentYearStr;

  const currentMonthCurrent = getMonthData(yearOverYearData, currentMonth, selectedYear === 2025 ? '2025' : '2026');
  const currentMonthPrev = getMonthData(yearOverYearData, currentMonth, selectedYear === 2025 ? '2024' : '2025');
  const currentMonthPct = currentMonthCurrent && currentMonthPrev ? Math.round(((currentMonthCurrent - currentMonthPrev) / currentMonthPrev) * 100) : null;

  const visualizations2025 = [
    { id: 'speciesYTD',    title: 'YTD Adoptions by Species',       subtitle: 'Dogs vs Cats (YTD) + YTD Total (gray) from CSV' },
    { id: 'yearComparison',title: '2024 vs 2025 Monthly Comparison', subtitle: 'Year-over-year adoption trends by species' },
    { id: 'predictions',   title: 'Seasonality & 2025 Analysis',    subtitle: 'Historical patterns and 2025 actual data' },
    { id: 'adoptions',     title: 'Monthly Adoptions Breakdown',     subtitle: '2025 Cats vs Dogs Trends' },
    { id: 'vaccines',      title: 'Vaccine Clinics Performance',     subtitle: 'All-Time Analysis' },
  ];
  const visualizations2026 = [
    { id: 'speciesYTD',    title: 'YTD Adoptions by Species',       subtitle: 'Dogs vs Cats (YTD) including 2026 data' },
    { id: 'yearComparison',title: '2025 vs 2026 Monthly Comparison', subtitle: 'Year-over-year adoption trends' },
    { id: 'adoptions',     title: 'Monthly Adoptions Breakdown',     subtitle: '2026 Cats vs Dogs Trends' },
  ];
  const visualizations = selectedYear === 2025 ? visualizations2025 : visualizations2026;
  const safeCurrentVizIndex = Math.min(currentVizIndex, visualizations.length - 1);
  const currentViz = visualizations[safeCurrentVizIndex];
  const goToPrevious = () => setCurrentVizIndex(p => p === 0 ? visualizations.length - 1 : p - 1);
  const goToNext     = () => setCurrentVizIndex(p => p === visualizations.length - 1 ? 0 : p + 1);

  useEffect(() => { if (currentVizIndex >= visualizations.length) setCurrentVizIndex(0); }, [selectedYear, currentVizIndex, visualizations.length]);

  const keyMetrics2025 = [
    { title: "2025 YTD Adoptions", value: formatInt(findYTDTotal('2025')), subtitle: `through Dec 31`,
      comparison: ytdPctVsPrev != null ? `${ytdPctVsPrev > 0 ? '+' : ''}${ytdPctVsPrev}%` : undefined,
      comparisonText: `vs 2024 YTD (${formatInt(findYTDTotal('2024'))})`,
      trend: ytdPctVsPrev != null ? (ytdPctVsPrev >= 0 ? 'up' : 'down') : 'up', icon: Heart,
      bgColor: "bg-blue-50", textColor: "text-blue-900", valueColor: "text-blue-600",
      trendColor: ytdPctVsPrev != null ? (ytdPctVsPrev >= 0 ? "text-green-600" : "text-red-600") : "text-green-600" },
    { title: `${currentMonthFullName} 2025`, value: formatInt(currentMonthCurrent), subtitle: `adoptions this month`,
      comparison: currentMonthPct != null ? `${currentMonthPct > 0 ? '+' : ''}${currentMonthPct}%` : undefined,
      comparisonText: currentMonthPrev ? `vs ${currentMonthName} 2024 (${formatInt(currentMonthPrev)})` : undefined,
      trend: currentMonthPct != null ? (currentMonthPct >= 0 ? 'up' : 'down') : 'up', icon: Calendar,
      bgColor: "bg-green-50", textColor: "text-green-900", valueColor: "text-green-600",
      trendColor: currentMonthPct != null ? (currentMonthPct >= 0 ? "text-green-600" : "text-red-600") : "text-green-600" },
    { title: "Animals in Foster Care", value: "126",
      subtitle: (<div className="text-xs space-y-1"><div>15 dogs in boarding</div><div>9 cats at PetSmart</div><div>21 cats at Meow Maison</div></div>),
      trend: "up", icon: TrendingUp, bgColor: "bg-purple-50", textColor: "text-purple-900", valueColor: "text-purple-600", trendColor: "text-green-600" },
    { title: "Animals in Care VA", value: "171",
      subtitle: (<div className="flex gap-4 mt-1"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400"></div><span className="text-xs font-medium">76 dogs</span></div><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-300"></div><span className="text-xs font-medium">91 cats</span></div></div>),
      comparison: "-27%", comparisonText: "vs last week (173)", trend: "down", icon: MapPin,
      bgColor: "bg-orange-50", textColor: "text-orange-900", valueColor: "text-orange-600", trendColor: "text-red-600" },
    { title: "Animals in Care SC", value: "108",
      subtitle: (<div className="flex gap-4 mt-1"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-400"></div><span className="text-xs font-medium">87 dogs</span></div><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-300"></div><span className="text-xs font-medium">21 cats</span></div></div>),
      comparison: "+11%", comparisonText: "vs last week (97)", trend: "up", icon: MapPin,
      bgColor: "bg-pink-50", textColor: "text-pink-900", valueColor: "text-pink-600", trendColor: "text-green-600" },
  ];

  const keyMetrics2026 = [
    { title: "2026 YTD Adoptions", value: formatInt(ytdCurrent), subtitle: `through ${cutoffLabel}`,
      comparison: ytdPctVsPrev != null ? `${ytdPctVsPrev > 0 ? '+' : ''}${ytdPctVsPrev}%` : undefined,
      comparisonText: ytdPrev != null ? `vs 2025 YTD (${formatInt(ytdPrev)})` : undefined,
      trend: ytdPctVsPrev != null ? (ytdPctVsPrev >= 0 ? 'up' : 'down') : 'up', icon: Heart,
      bgColor: "bg-blue-50", textColor: "text-blue-900", valueColor: "text-blue-600",
      trendColor: ytdPctVsPrev != null ? (ytdPctVsPrev >= 0 ? "text-green-600" : "text-red-600") : "text-green-600" },
    ...(currentMonthCurrent && currentMonthCurrent > 0 ? [{
      title: `${currentMonthFullName} 2026`, value: formatInt(currentMonthCurrent), subtitle: `actual adoptions`,
      comparison: currentMonthPct != null ? `${currentMonthPct > 0 ? '+' : ''}${currentMonthPct}%` : undefined,
      comparisonText: currentMonthPrev ? `vs ${currentMonthName} 2025 (${formatInt(currentMonthPrev)})` : undefined,
      trend: currentMonthPct != null ? (currentMonthPct >= 0 ? 'up' : 'down') : 'up' as const, icon: Calendar,
      bgColor: "bg-green-50", textColor: "text-green-900", valueColor: "text-green-600",
      trendColor: currentMonthPct != null ? (currentMonthPct >= 0 ? "text-green-600" : "text-red-600") : "text-green-600" }] : []),
    { title: "Animals in Foster Care", value: "113",
      subtitle: (<div className="text-xs space-y-1"><div>13 dogs in boarding</div><div>2 cats at PetSmart</div><div>18 cats at Meow Maison</div></div>),
      trend: "up", icon: TrendingUp, bgColor: "bg-purple-50", textColor: "text-purple-900", valueColor: "text-purple-600", trendColor: "text-green-600" },
    { title: "Animals in Care VA", value: "168",
      subtitle: (<div className="flex gap-4 mt-1"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400"></div><span className="text-xs font-medium">110 dogs</span></div><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-300"></div><span className="text-xs font-medium">58 cats</span></div></div>),
      comparison: "-20%", comparisonText: "vs last week (146)", trend: "down", icon: MapPin,
      bgColor: "bg-orange-50", textColor: "text-orange-900", valueColor: "text-orange-600", trendColor: "text-red-600" },
    { title: "Animals in Care SC", value: "72",
      subtitle: (<div className="flex gap-4 mt-1"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-400"></div><span className="text-xs font-medium">61 dogs</span></div><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-300"></div><span className="text-xs font-medium">11 cats</span></div></div>),
      comparison: "-25%", comparisonText: "vs last week (96)", trend: "up", icon: MapPin,
      bgColor: "bg-pink-50", textColor: "text-pink-900", valueColor: "text-pink-600", trendColor: "text-green-600" },
  ];

  const keyMetrics = selectedYear === 2025 ? keyMetrics2025 : keyMetrics2026;

  const monthly2025CatsVsDogs = [
    { month: 'Jan', dogs: 130, cats: 140, total: 270, dogPct: 48.1, catPct: 51.9 },
    { month: 'Feb', dogs: 101, cats: 110, total: 211, dogPct: 47.9, catPct: 52.1 },
    { month: 'Mar', dogs: 133, cats: 146, total: 279, dogPct: 47.7, catPct: 52.3 },
    { month: 'Apr', dogs: 104, cats: 113, total: 217, dogPct: 47.9, catPct: 52.1 },
    { month: 'May', dogs: 136, cats: 148, total: 284, dogPct: 47.9, catPct: 52.1 },
    { month: 'Jun', dogs: 145, cats: 158, total: 303, dogPct: 47.9, catPct: 52.1 },
    { month: 'Jul', dogs: 171, cats: 96,  total: 267, dogPct: 64.0, catPct: 36.0 },
    { month: 'Aug', dogs: 177, cats: 127, total: 304, dogPct: 58.2, catPct: 41.8 },
    { month: 'Sep', dogs: 143, cats: 112, total: 255, dogPct: 56.1, catPct: 43.9 },
    { month: 'Oct', dogs: 155, cats: 95,  total: 250, dogPct: 62.0, catPct: 38.0 },
    { month: 'Nov', dogs: 178, cats: 107, total: 285, dogPct: 62.5, catPct: 37.5 },
    { month: 'Dec', dogs: 140, cats: 110, total: 250, dogPct: 56.0, catPct: 44.0 },
  ];
  const monthly2026CatsVsDogs = useMemo(() => computeMonthlyBreakdown(yearOverYearData, '2026'), [yearOverYearData]);

  const allTimeVaccineData = [
    { date: 'Jun 28, 2024', interested: 55,  attended: 25,  totalAnimals: 75,  totalVaccines: 120, microchips: 7,   cats: 36,  dogs: 39  },
    { date: 'Jul 27, 2024', interested: 117, attended: 59,  totalAnimals: 232, totalVaccines: 220, microchips: 0,   cats: 62,  dogs: 170 },
    { date: 'Sep 13, 2024', interested: 122, attended: 74,  totalAnimals: 165, totalVaccines: 270, microchips: 83,  cats: 76,  dogs: 89  },
    { date: 'Dec 7, 2024',  interested: 85,  attended: 63,  totalAnimals: 144, totalVaccines: 226, microchips: 83,  cats: 52,  dogs: 92  },
    { date: 'Feb 22, 2025', interested: 163, attended: 24,  totalAnimals: 207, totalVaccines: 298, microchips: 125, cats: 64,  dogs: 143 },
    { date: 'May 8, 2025',  interested: 91,  attended: 53,  totalAnimals: 114, totalVaccines: 137, microchips: 70,  cats: 30,  dogs: 84  },
    { date: 'Jul 25, 2025', interested: 323, attended: 191, totalAnimals: 406, totalVaccines: 658, microchips: 221, cats: 131, dogs: 275 },
    { date: 'Oct 3, 2025',  interested: 297, attended: 175, totalAnimals: 341, totalVaccines: 563, microchips: 208, cats: 103, dogs: 238 },
  ];
  const july2025Services = [
    { name: 'DHP Vaccines', value: 209, color: '#10b981' }, { name: 'Rabies Dog', value: 224, color: '#ef4444' },
    { name: 'Microchips',   value: 221, color: '#8b5cf6' }, { name: 'FVRCP',      value: 122, color: '#3b82f6' },
    { name: 'Rabies Cat',   value: 103, color: '#f59e0b' },
  ];
  const oct2025Services = [
    { name: 'DHP Vaccines', value: 196, color: '#10b981' }, { name: 'Rabies Dog', value: 182, color: '#ef4444' },
    { name: 'Microchips',   value: 208, color: '#8b5cf6' }, { name: 'FVRCP',      value: 94,  color: '#3b82f6' },
    { name: 'Rabies Cat',   value: 91,  color: '#f59e0b' },
  ];
  const HIST = [
    { m:1,avg:216.0},{m:2,avg:172.75},{m:3,avg:199.125},{m:4,avg:197.125},
    { m:5,avg:213.875},{m:6,avg:213.625},{m:7,avg:190.625},{m:8,avg:215.75},
    { m:9,avg:225.25},{m:10,avg:189.5},{m:11,avg:176.75},{m:12,avg:208.875},
  ];
  const ACTUAL_2025: Record<number,{adoptions:number,days:number}> = {
    1:{adoptions:270,days:31},2:{adoptions:211,days:28},3:{adoptions:279,days:31},
    4:{adoptions:217,days:30},5:{adoptions:284,days:31},6:{adoptions:303,days:30},
    7:{adoptions:267,days:31},8:{adoptions:304,days:31},9:{adoptions:255,days:30},
    10:{adoptions:250,days:31},11:{adoptions:285,days:30},12:{adoptions:250,days:31},
  };
  const seasonalityData = useMemo(() => {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return HIST.map((h, idx) => ({
      month: MONTHS[idx], historical: Math.round(h.avg), actual2025: ACTUAL_2025[h.m]?.adoptions ?? null,
      bandTop: Math.round(h.avg + 50), bandBottom: Math.max(0, Math.round(h.avg - 50)),
    }));
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Adoption Dashboard</h1>
        <p className="text-lg text-gray-600">
          Key metrics as of {reportDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Year Tabs */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button onClick={() => setSelectedYear(2026)} className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${selectedYear === 2026 ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>2026</button>
          <button onClick={() => setSelectedYear(2025)} className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${selectedYear === 2025 ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>2025</button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-${keyMetrics.length} gap-6 mb-8`}>
        {keyMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <div key={index} className={`${metric.bgColor} p-6 rounded-lg shadow-sm border border-gray-200`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold ${metric.textColor}`}>{metric.title}</h3>
                <IconComponent className={`h-5 w-5 ${metric.textColor}`} />
              </div>
              <div className="mb-2">
                <p className={`text-3xl font-bold ${metric.valueColor}`}>{metric.value}</p>
                <div className={`text-xs ${metric.textColor} opacity-75 mt-1`}>{metric.subtitle}</div>
              </div>
              {metric.comparison && (
                <div className="flex items-center space-x-1 mt-2">
                  {metric.trend === 'up' ? <TrendingUp className={`h-4 w-4 ${metric.trendColor}`} /> : <TrendingDown className={`h-4 w-4 ${metric.trendColor}`} />}
                  <span className={`text-sm font-medium ${metric.trendColor}`}>{metric.comparison}</span>
                  <span className="text-xs text-gray-500">{metric.comparisonText}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Viz Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-6 mb-6 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl shadow-sm">
          <button onClick={goToPrevious} className="p-3 bg-white rounded-full shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200 border border-gray-200" aria-label="Previous visualization">
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
          <div className="text-center min-w-[300px]">
            <h2 className="text-2xl font-bold text-gray-900">{currentViz.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{currentViz.subtitle}</p>
            <div className="flex justify-center space-x-2 mt-3">
              {visualizations.map((_, index) => (
                <div key={index} className={`h-2 w-2 rounded-full transition-all duration-300 ${index === safeCurrentVizIndex ? 'bg-blue-600 w-8' : 'bg-gray-300 hover:bg-gray-400'}`} />
              ))}
            </div>
          </div>
          <button onClick={goToNext} className="p-3 bg-white rounded-full shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200 border border-gray-200" aria-label="Next visualization">
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        {/* 1) YTD by Species */}
        {currentViz.id === 'speciesYTD' && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedYear === 2025 ? 'YTD Adoptions by Species (2021-2025)' : 'YTD Adoptions by Species (2021-2026)'}</h3>
            <ResponsiveContainer width="100%" height={420}>
              <ComposedChart data={ytdSpeciesForChart}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis />
                <Tooltip formatter={(value: any, name: string) => [`${value} adoptions`, name === 'dogs' ? 'Dogs (YTD)' : name === 'cats' ? 'Cats (YTD)' : 'Total (YTD)']} />
                <Legend />
                {latestYear && <ReferenceLine x={latestYear} stroke="#e5e7eb" strokeWidth={2} />}
                <Line type="monotone" dataKey="totalYTD" stroke="#6b7280" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Total (YTD)" />
                <Line type="monotone" dataKey="dogs" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Dogs (YTD)" />
                <Line type="monotone" dataKey="cats" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Cats (YTD)" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-600 mt-3"><span className="font-semibold">Data rule:</span> YTD = adoptions through <strong>{cutoffLabel}</strong> of each year.</div>
          </div>
        )}

        {/* 2) Year-over-Year Comparison */}
        {currentViz.id === 'yearComparison' && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedYear === 2025 ? '2024 vs 2025 Monthly Adoptions' : '2025 vs 2026 Monthly Adoptions'}</h3>
              <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
                <button onClick={() => setComparisonFilter('total')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${comparisonFilter === 'total' ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>Total</button>
                <button onClick={() => setComparisonFilter('dogs')}  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${comparisonFilter === 'dogs'  ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>Dogs Only</button>
                <button onClick={() => setComparisonFilter('cats')}  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${comparisonFilter === 'cats'  ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>Cats Only</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart data={yearOverYearData}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" />
                <YAxis label={{ value: 'Number of Adoptions', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: any, name: string) => {
                  const labels: Record<string,string> = { dogs2024:'Dogs 2024',dogs2025:'Dogs 2025',dogs2026:'Dogs 2026',cats2024:'Cats 2024',cats2025:'Cats 2025',cats2026:'Cats 2026',total2024:'Total 2024',total2025:'Total 2025',total2026:'Total 2026' };
                  return [`${value} adoptions`, labels[name] || name];
                }} />
                <Legend />
                {selectedYear === 2025 && comparisonFilter === 'total' && <><Bar dataKey="total2024" fill="#3b82f6" name="Total 2024" /><Bar dataKey="total2025" fill="#10b981" name="Total 2025" /></>}
                {selectedYear === 2025 && comparisonFilter === 'dogs'  && <><Bar dataKey="dogs2024"  fill="#3b82f6" name="Dogs 2024"  /><Bar dataKey="dogs2025"  fill="#10b981" name="Dogs 2025"  /></>}
                {selectedYear === 2025 && comparisonFilter === 'cats'  && <><Bar dataKey="cats2024"  fill="#3b82f6" name="Cats 2024"  /><Bar dataKey="cats2025"  fill="#10b981" name="Cats 2025"  /></>}
                {selectedYear === 2026 && comparisonFilter === 'total' && <><Bar dataKey="total2025" fill="#3b82f6" name="Total 2025" /><Bar dataKey="total2026" fill="#10b981" name="Total 2026" /></>}
                {selectedYear === 2026 && comparisonFilter === 'dogs'  && <><Bar dataKey="dogs2025"  fill="#3b82f6" name="Dogs 2025"  /><Bar dataKey="dogs2026"  fill="#10b981" name="Dogs 2026"  /></>}
                {selectedYear === 2026 && comparisonFilter === 'cats'  && <><Bar dataKey="cats2025"  fill="#3b82f6" name="Cats 2025"  /><Bar dataKey="cats2026"  fill="#10b981" name="Cats 2026"  /></>}
              </ComposedChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-600 mt-3"><span className="font-semibold">Data source:</span> Computed from adoptions_by_species.csv. Blue = previous year, Green = current year.</div>
          </div>
        )}

        {/* 3) Seasonality — 2025 only */}
        {selectedYear === 2025 && currentViz.id === 'predictions' && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Seasonality & 2025 Actual Data</h3>
            <ResponsiveContainer width="100%" height={460}>
              <ComposedChart data={seasonalityData}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis />
                <ReferenceArea x1="May" x2="Jun" fill="#10b981" fillOpacity={0.08} stroke="none" />
                <ReferenceArea x1="Aug" x2="Sep" fill="#10b981" fillOpacity={0.08} stroke="none" />
                <ReferenceArea x1="Feb" x2="Mar" fill="#ef4444" fillOpacity={0.06} stroke="none" />
                <ReferenceArea x1="Oct" x2="Nov" fill="#ef4444" fillOpacity={0.06} stroke="none" />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload?.[0]) {
                    const d = payload[0].payload as any;
                    const isPeak = ['May','Jun','Aug','Sep'].includes(d.month);
                    const isDip  = ['Feb','Mar','Oct','Nov'].includes(d.month);
                    return (
                      <div className="bg-white p-3 rounded shadow-lg border">
                        <p className="font-semibold">{d.month} 2025</p>
                        {d.actual2025 != null && <p className="text-blue-600">Actual: {d.actual2025} {d.actual2025 >= d.historical ? '↑ above avg' : '↓ below avg'}</p>}
                        <p className="text-gray-600">Historical Avg: {d.historical}</p>
                        <p className="text-gray-400">Range: {d.bandBottom} – {d.bandTop}</p>
                        {isPeak && <p className="text-xs text-emerald-700 mt-1">Peak window</p>}
                        {isDip  && <p className="text-xs text-red-700 mt-1">Dip window</p>}
                      </div>
                    );
                  }
                  return null;
                }} />
                <Legend />
                <Area type="monotone" dataKey="bandTop" stroke="none" fill="#e5e7eb" fillOpacity={0.6} name="Expected Range (Avg ± 50)" />
                <Area type="monotone" dataKey="bandBottom" stroke="none" fill="#ffffff" fillOpacity={1} />
                <Line type="monotone" dataKey="historical" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" name="Historical Average" />
                <Bar dataKey="actual2025" fill="#3b82f6" name="2025 Actual">
                  {seasonalityData.map((_, i) => <Cell key={`cell-${i}`} fill="#3b82f6" />)}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-600 mt-3">
              <span className="font-semibold">Reading the chart:</span> Shaded band = expected range (avg ± 50). Dashed line = historical average. Blue bars = 2025 actuals.
              <div className="mt-1">Peak windows <span className="text-emerald-700">(light green)</span>: May–Jun, Aug–Sep · Dip windows <span className="text-red-700">(light red)</span>: Feb–Mar, Oct–Nov</div>
            </div>
          </div>
        )}

        {/* 4) Monthly Adoptions */}
        {currentViz.id === 'adoptions' && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedYear === 2025 ? 'Monthly Species Distribution Throughout 2025' : 'Monthly Species Distribution Throughout 2026'}</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={selectedYear === 2025 ? monthly2025CatsVsDogs : monthly2026CatsVsDogs}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" />
                <YAxis yAxisId="left" label={{ value: 'Number of Adoptions', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" domain={[0,100]} label={{ value: 'Percentage (%)', angle: 90, position: 'insideRight' }} />
                <Tooltip formatter={(value, name) => {
                  if (name === 'dogs' || name === 'cats') return [`${value} adoptions`, name === 'dogs' ? 'Dogs' : 'Cats'];
                  if (name === 'dogPct' || name === 'catPct') return [`${value}%`, name === 'dogPct' ? 'Dog %' : 'Cat %'];
                  return [value, name];
                }} labelFormatter={label => `${label} ${selectedYear}`} />
                <Legend />
                <Bar yAxisId="left" dataKey="dogs" fill="#3b82f6" name="Dogs" />
                <Bar yAxisId="left" dataKey="cats" fill="#10b981" name="Cats" />
                <Line yAxisId="right" type="monotone" dataKey="dogPct" stroke="#ef4444" strokeWidth={3} name="Dog %" />
                <Line yAxisId="right" type="monotone" dataKey="catPct" stroke="#059669" strokeWidth={3} name="Cat %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 5) Vaccine Clinics — 2025 only */}
        {selectedYear === 2025 && currentViz.id === 'vaccines' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All-Time Clinic Growth</h3>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={allTimeVaccineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" /><YAxis yAxisId="right" orientation="right" />
                  <Tooltip /><Legend />
                  <Bar yAxisId="left" dataKey="attended" fill="#3b82f6" name="People Attended" />
                  <Bar yAxisId="left" dataKey="totalAnimals" fill="#10b981" name="Animals Served" />
                  <Line yAxisId="right" type="monotone" dataKey="totalVaccines" stroke="#ef4444" strokeWidth={3} name="Total Vaccines" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">October 3, 2025 - Vaccine Clinic Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart><Pie data={oct2025Services} cx="50%" cy="50%" labelLine={false} label={({name,value}) => `${name.split(' ')[0]}: ${value}`} outerRadius={80} dataKey="value">
                    {oct2025Services.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
                <div className="bg-white p-4 rounded border border-gray-300 h-fit">
                  <h4 className="font-semibold text-gray-900 mb-3">Vaccine Clinic Stats</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Interested:</span><span className="font-medium text-gray-900">297</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Attended:</span><span className="font-medium text-gray-900">175 (59%)</span></div>
                    <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-gray-600">Dogs:</span><span className="font-medium text-gray-900">238</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Cats:</span><span className="font-medium text-gray-900">103</span></div>
                    <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-gray-600">Total Animals:</span><span className="font-medium text-gray-900">341</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Total Services:</span><span className="font-medium text-gray-900">771</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">July 25, 2025 - Record Clinic</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart><Pie data={july2025Services} cx="50%" cy="50%" labelLine={false} label={({name,value}) => `${name.split(' ')[0]}: ${value}`} outerRadius={80} dataKey="value">
                    {july2025Services.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
                <div className="bg-white p-4 rounded border border-gray-300 h-fit">
                  <h4 className="font-semibold text-gray-900 mb-3">Record Day Stats</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Interested:</span><span className="font-medium text-gray-900">323</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Attended:</span><span className="font-medium text-gray-900">191 (59%)</span></div>
                    <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-gray-600">Dogs:</span><span className="font-medium text-gray-900">275</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Cats:</span><span className="font-medium text-gray-900">131</span></div>
                    <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-gray-600">Total Animals:</span><span className="font-medium text-gray-900">406</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Total Services:</span><span className="font-medium text-gray-900">879</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-green-900 mb-3">2025 Highlights</h4>
                <ul className="text-sm text-green-800 space-y-2">
                  <li>• July 25: 406 animals in one day!</li><li>• 658 vaccines (record high)</li>
                  <li>• 221 microchips placed</li><li>• 323 people interested</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-yellow-900 mb-3">Program Impact</h4>
                <ul className="text-sm text-yellow-800 space-y-2">
                  <li>• 1,684 animals served total</li><li>• 2,534 vaccines administered</li>
                  <li>• 67% dogs, 33% cats</li><li>• Growing microchip adoption</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// ROOT APP — sidebar + tab routing
// =============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'los'>('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',     icon: LayoutDashboard },
    { id: 'los',       label: 'LOS Analysis',  icon: Clock },
  ] as const;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className={`flex-shrink-0 ${collapsed ? 'w-16' : 'w-56'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shadow-sm`}>
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-100">
          {collapsed ? (
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center mx-auto">
              <Heart className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900 whitespace-nowrap">Lucky Dog</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : ''}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => setCollapsed(v => !v)}
            className="w-full flex items-center justify-center py-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-all"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' ? <Dashboard /> : <LOSAnalysis />}
      </main>
    </div>
  );
}