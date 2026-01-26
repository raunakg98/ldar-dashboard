import { useEffect, useMemo, useState } from 'react';
// import Papa from 'papaparse';
// import type { ParseResult } from 'papaparse';
import { TrendingUp, TrendingDown, Heart, Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar,
  ResponsiveContainer, ComposedChart, PieChart, Pie, Cell, Area,
  ReferenceArea, ReferenceLine
} from 'recharts';

type SpeciesRow = {
  ['Adoption Date']: string;
  Species: string;
};

type YTDPoint = { year: string; dogs: number; cats: number };

type MonthlyComparisonPoint = {
  month: string;
  dogs2024: number;
  cats2024: number;
  dogs2025: number;
  cats2025: number;
  dogs2026: number;
  cats2026: number;
  total2024: number;
  total2025: number;
  total2026: number;
};

// function formatInt(n: number | undefined) {
//   if (n == null || Number.isNaN(n)) return '—';
//   return n.toLocaleString();
// }

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

/** YTD-by-species using the same cutoff (today's month/day) for each year. */
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
    const include = m < cutoffMonth || (m === cutoffMonth && d <= cutoffDay);
    if (!include) continue;
    const sp = (r.Species || '').trim().toLowerCase();
    if (!agg[y]) agg[y] = { dogs: 0, cats: 0 };
    if (sp === 'dog') agg[y].dogs += 1;
    if (sp === 'cat') agg[y].cats += 1;
  }
  
  const yearsToShow = rangeYears(2021, currentYear);
  return yearsToShow.map((y) => ({
    year: y,
    dogs: agg[y]?.dogs ?? 0,
    cats: agg[y]?.cats ?? 0,
  }));
}

/** Compute monthly comparison for any years */
function computeMonthlyComparisonMultiYear(rows: SpeciesRow[], years: string[]): MonthlyComparisonPoint[] {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const agg: Record<string, Record<number, { dogs: number; cats: number }>> = {};
  
  // Initialize all years and months
  years.forEach(year => {
    agg[year] = {};
    for (let m = 1; m <= 12; m++) {
      agg[year][m] = { dogs: 0, cats: 0 };
    }
  });
  
  // Aggregate data from CSV
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
  
  // Build the comparison data
  return MONTHS.map((monthName, idx) => {
    const m = idx + 1;
    const data2024 = agg['2024']?.[m] || { dogs: 0, cats: 0 };
    const data2025 = agg['2025']?.[m] || { dogs: 0, cats: 0 };
    const data2026 = agg['2026']?.[m] || { dogs: 0, cats: 0 };
    
    return {
      month: monthName,
      dogs2024: data2024.dogs,
      cats2024: data2024.cats,
      dogs2025: data2025.dogs,
      cats2025: data2025.cats,
      dogs2026: data2026.dogs,
      cats2026: data2026.cats,
      total2024: data2024.dogs + data2024.cats,
      total2025: data2025.dogs + data2025.cats,
      total2026: data2026.dogs + data2026.cats,
    };
  });
}

/** Get data for a specific month and year */
function getMonthData(yearOverYearData: MonthlyComparisonPoint[], monthIndex: number, year: '2024' | '2025' | '2026') {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = MONTHS[monthIndex];
  const monthData = yearOverYearData.find(d => d.month === monthName);
  if (!monthData) return null;
  
  switch(year) {
    case '2024':
      return monthData.total2024;
    case '2025':
      return monthData.total2025;
    case '2026':
      return monthData.total2026;
  }
}

function computeMonthlyBreakdown(yearOverYearData: MonthlyComparisonPoint[], year: '2025' | '2026') {
  return yearOverYearData.map(d => {
    const dogs = year === '2025' ? d.dogs2025 : d.dogs2026;
    const cats = year === '2025' ? d.cats2025 : d.cats2026;
    const total = dogs + cats;
    const dogPct = total > 0 ? Math.round((dogs / total) * 1000) / 10 : 0;
    const catPct = total > 0 ? Math.round((cats / total) * 1000) / 10 : 0;
    
    return {
      month: d.month,
      dogs,
      cats,
      total,
      dogPct,
      catPct
    };
  });
}

const DashboardCards = () => {
  // ===== State Management =====
  const [speciesRows, setSpeciesRows] = useState<SpeciesRow[]>([]);
  // const [csvLoaded, setCsvLoaded] = useState(false);
  const [comparisonFilter, setComparisonFilter] = useState<'total' | 'dogs' | 'cats'>('total');
  const [selectedYear, setSelectedYear] = useState<2025 | 2026>(2026);
  const [currentVizIndex, setCurrentVizIndex] = useState(0);
  
  // ===== Load CSV =====
useEffect(() => {
  const fetchData = () => {
    fetch('/api/sheets')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(result => {
        const rows = (result.data as SpeciesRow[]).filter(
          r => r['Adoption Date'] && r.Species
        );
        setSpeciesRows(rows);
      })
      .catch(error => {
        console.error('Error loading Google Sheets data:', error);
        // Fallback to CSV if API fails
        Papa.parse('/data/adoptions_by_species.csv', {
          download: true,
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
          complete: (res: ParseResult<SpeciesRow>) => {
            const rows = (res.data as SpeciesRow[]).filter(
              r => r['Adoption Date'] && r.Species
            );
            setSpeciesRows(rows);
          },
          error: (error: Error) => {
            console.error('Error loading CSV fallback:', error);
          },
        });
      });
  };

  // Fetch immediately on mount
  fetchData();

  // Set up auto-refresh every 5 minutes (300000 ms)
  const intervalId = setInterval(fetchData, 300000);

  // Cleanup interval on unmount
  return () => clearInterval(intervalId);
}, []);
  
  // ===== Dynamic Report Date Based on Selected Year =====
  const reportDate = useMemo(() => {
    if (selectedYear === 2025) {
      return new Date(2025, 11, 31); // December 31, 2025
    } else {
      return new Date(); // Current date for 2026
    }
  }, [selectedYear]);
  
  const cutoffLabel = reportDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const currentMonth = reportDate.getMonth(); // 0-11
  const currentMonthName = reportDate.toLocaleDateString(undefined, { month: 'short' });
  const currentMonthFullName = reportDate.toLocaleDateString(undefined, { month: 'long' });
  
  // ===== Compute Data =====
  const ytdSpeciesData = useMemo(() => computeYTDBySpecies(speciesRows, reportDate), [speciesRows, reportDate]);
  const yearOverYearData = useMemo(() => computeMonthlyComparisonMultiYear(speciesRows, ['2024', '2025', '2026']), [speciesRows]);
  
  type ChartYTDPoint = YTDPoint & { total: number; totalYTD: number };
  const ytdSpeciesForChart: ChartYTDPoint[] = useMemo(() => {
    return ytdSpeciesData.map((ytd) => {
      const totalYTD = (ytd.dogs ?? 0) + (ytd.cats ?? 0);
      return { ...ytd, total: totalYTD, totalYTD };
    });
  }, [ytdSpeciesData]);
  
  // ===== YTD Metrics =====
  const currentYearStr = String(reportDate.getFullYear());
  const prevYearStr = String(reportDate.getFullYear() - 1);
  
  const findYTDTotal = (year: string) => {
    const row = ytdSpeciesData.find(p => p.year === year);
    return row ? row.dogs + row.cats : undefined;
  };
  
  const ytdCurrent = findYTDTotal(currentYearStr);
  const ytdPrev = findYTDTotal(prevYearStr);
  const ytdPctVsPrev =
    ytdCurrent != null && ytdPrev
      ? Math.round(((ytdCurrent - ytdPrev) / ytdPrev) * 100)
      : undefined;
  
  const latestYear = currentYearStr;
  
  // ===== Current Month Metrics (Dynamic from CSV) =====
  const currentMonthCurrent = getMonthData(yearOverYearData, currentMonth, selectedYear === 2025 ? '2025' : '2026');
  const currentMonthPrev = getMonthData(yearOverYearData, currentMonth, selectedYear === 2025 ? '2024' : '2025');
  
  const currentMonthPct = currentMonthCurrent && currentMonthPrev 
    ? Math.round(((currentMonthCurrent - currentMonthPrev) / currentMonthPrev) * 100)
    : null;
  
  // ===== Visualization Definitions =====
  const visualizations2025 = [
    { id: 'speciesYTD', title: 'YTD Adoptions by Species', subtitle: 'Dogs vs Cats (YTD) + YTD Total (gray) from CSV' },
    { id: 'yearComparison', title: '2024 vs 2025 Monthly Comparison', subtitle: 'Year-over-year adoption trends by species' },
    { id: 'predictions', title: 'Seasonality & 2025 Analysis', subtitle: 'Historical patterns and 2025 actual data' },
    { id: 'adoptions', title: 'Monthly Adoptions Breakdown', subtitle: '2025 Cats vs Dogs Trends' },
    { id: 'vaccines', title: 'Vaccine Clinics Performance', subtitle: 'All-Time Analysis' }
  ];
  
  const visualizations2026 = [
    { id: 'speciesYTD', title: 'YTD Adoptions by Species', subtitle: 'Dogs vs Cats (YTD) including 2026 data' },
    { id: 'yearComparison', title: '2025 vs 2026 Monthly Comparison', subtitle: 'Year-over-year adoption trends' },
    { id: 'adoptions', title: 'Monthly Adoptions Breakdown', subtitle: '2026 Cats vs Dogs Trends' },
  ];
  
  const visualizations = selectedYear === 2025 ? visualizations2025 : visualizations2026;
  
  // Safe current visualization index
  const safeCurrentVizIndex = Math.min(currentVizIndex, visualizations.length - 1);
  const currentViz = visualizations[safeCurrentVizIndex];
  
  const goToPrevious = () => setCurrentVizIndex((prev) => (prev === 0 ? visualizations.length - 1 : prev - 1));
  const goToNext = () => setCurrentVizIndex((prev) => (prev === visualizations.length - 1 ? 0 : prev + 1));
  
  // Reset visualization index when changing years if out of bounds
  useEffect(() => {
    if (currentVizIndex >= visualizations.length) {
      setCurrentVizIndex(0);
    }
  }, [selectedYear, currentVizIndex, visualizations.length]);
  
  // ===== Key Metrics =====
  const keyMetrics2025 = [
    {
      title: "2025 YTD Adoptions",
      value: formatInt(findYTDTotal('2025')),
      subtitle: `through Dec 31`,
      comparison: ytdPctVsPrev != null ? `${ytdPctVsPrev > 0 ? '+' : ''}${ytdPctVsPrev}%` : undefined,
      comparisonText: `vs 2024 YTD (${formatInt(findYTDTotal('2024'))})`,
      trend: ytdPctVsPrev != null ? (ytdPctVsPrev >= 0 ? 'up' : 'down') : 'up',
      icon: Heart,
      bgColor: "bg-blue-50",
      textColor: "text-blue-900",
      valueColor: "text-blue-600",
      trendColor: ytdPctVsPrev != null ? (ytdPctVsPrev >= 0 ? "text-green-600" : "text-red-600") : "text-green-600"
    },
    {
      title: `${currentMonthFullName} 2025`,
      value: formatInt(currentMonthCurrent),
      subtitle: `actual adoptions`,
      comparison: currentMonthPct != null ? `${currentMonthPct > 0 ? '+' : ''}${currentMonthPct}%` : undefined,
      comparisonText: currentMonthPrev ? `vs ${currentMonthName} 2024 (${formatInt(currentMonthPrev)})` : undefined,
      trend: currentMonthPct != null ? (currentMonthPct >= 0 ? 'up' : 'down') : 'up',
      icon: Calendar,
      bgColor: "bg-green-50",
      textColor: "text-green-900",
      valueColor: "text-green-600",
      trendColor: currentMonthPct != null ? (currentMonthPct >= 0 ? "text-green-600" : "text-red-600") : "text-green-600"
    },
    {
      title: "Animals in Foster Care",
      value: "126",
      subtitle: (
        <div className="text-xs space-y-1">
          <div>15 dogs in boarding</div>
          <div>9 cats at PetSmart</div>
          <div>21 cats at Meow Maison</div>
        </div>
      ),
      trend: "up",
      icon: TrendingUp,
      bgColor: "bg-purple-50",
      textColor: "text-purple-900",
      valueColor: "text-purple-600",
      trendColor: "text-green-600"
    },
    {
      title: "Animals in Care VA",
      value: "171",
      subtitle: (
        <div className="flex gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
            <span className="text-xs font-medium">76 dogs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-300"></div>
            <span className="text-xs font-medium">91 cats</span>
          </div>
        </div>
      ),
      comparison: "-27%",
      comparisonText: "vs last week (173)",
      trend: "down",
      icon: MapPin,
      bgColor: "bg-orange-50",
      textColor: "text-orange-900",
      valueColor: "text-orange-600",
      trendColor: "text-red-600"
    },
    {
      title: "Animals in Care SC",
      value: "108",
      subtitle: (
        <div className="flex gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-pink-400"></div>
            <span className="text-xs font-medium">87 dogs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-pink-300"></div>
            <span className="text-xs font-medium">21 cats</span>
          </div>
        </div>
      ),
      comparison: "+11%",
      comparisonText: "vs last week (97)",
      trend: "up",
      icon: MapPin,
      bgColor: "bg-pink-50",
      textColor: "text-pink-900",
      valueColor: "text-pink-600",
      trendColor: "text-green-600"
    }
  ];
  
  const keyMetrics2026 = [
    {
      title: "2026 YTD Adoptions",
      value: formatInt(ytdCurrent),
      subtitle: `through ${cutoffLabel}`,
      comparison: ytdPctVsPrev != null ? `${ytdPctVsPrev > 0 ? '+' : ''}${ytdPctVsPrev}%` : undefined,
      comparisonText: ytdPrev != null ? `vs 2025 YTD (${formatInt(ytdPrev)})` : undefined,
      trend: ytdPctVsPrev != null ? (ytdPctVsPrev >= 0 ? 'up' : 'down') : 'up',
      icon: Heart,
      bgColor: "bg-blue-50",
      textColor: "text-blue-900",
      valueColor: "text-blue-600",
      trendColor: ytdPctVsPrev != null ? (ytdPctVsPrev >= 0 ? "text-green-600" : "text-red-600") : "text-green-600"
    },
    // Conditionally add current month card if data exists
    ...(currentMonthCurrent && currentMonthCurrent > 0 ? [{
      title: `${currentMonthFullName} 2026`,
      value: formatInt(currentMonthCurrent),
      subtitle: `actual adoptions`,
      comparison: currentMonthPct != null ? `${currentMonthPct > 0 ? '+' : ''}${currentMonthPct}%` : undefined,
      comparisonText: currentMonthPrev ? `vs ${currentMonthName} 2025 (${formatInt(currentMonthPrev)})` : undefined,
      trend: currentMonthPct != null ? (currentMonthPct >= 0 ? 'up' : 'down') : 'up' as const,
      icon: Calendar,
      bgColor: "bg-green-50",
      textColor: "text-green-900",
      valueColor: "text-green-600",
      trendColor: currentMonthPct != null ? (currentMonthPct >= 0 ? "text-green-600" : "text-red-600") : "text-green-600"
    }] : []),
    {
      title: "Animals in Foster Care",
      value: "112",
      subtitle: (
        <div className="text-xs space-y-1">
          <div>5 dogs in boarding</div>
          <div>2 cats at PetSmart</div>
          <div>14 cats at Meow Maison</div>
        </div>
      ),
      trend: "up",
      icon: TrendingUp,
      bgColor: "bg-purple-50",
      textColor: "text-purple-900",
      valueColor: "text-purple-600",
      trendColor: "text-green-600"
    },
    {
      title: "Animals in Care VA",
      value: "134",
      subtitle: (
        <div className="flex gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
            <span className="text-xs font-medium">76 dogs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-300"></div>
            <span className="text-xs font-medium">56 cats</span>
          </div>
        </div>
      ),
      comparison: "-7%",
      comparisonText: "vs last week (145)",
      trend: "down",
      icon: MapPin,
      bgColor: "bg-orange-50",
      textColor: "text-orange-900",
      valueColor: "text-orange-600",
      trendColor: "text-red-600"
    },
    {
      title: "Animals in Care SC",
      value: "152",
      subtitle: (
        <div className="flex gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-pink-400"></div>
            <span className="text-xs font-medium">113 dogs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-pink-300"></div>
            <span className="text-xs font-medium">39 cats</span>
          </div>
        </div>
      ),
      comparison: "61%",
      comparisonText: "vs last week (94)",
      trend: "up",
      icon: MapPin,
      bgColor: "bg-pink-50",
      textColor: "text-pink-900",
      valueColor: "text-pink-600",
      trendColor: "text-green-600"
    }
  ];
  
  const keyMetrics = selectedYear === 2025 ? keyMetrics2025 : keyMetrics2026;
  
  // ===== 2025 Static Data =====
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
    { month: 'Dec', dogs: 140, cats: 110, total: 250, dogPct: 56.0, catPct: 44.0 }
  ];
  
  // Dynamic 2026 breakdown from CSV
  const monthly2026CatsVsDogs = useMemo(() => 
    computeMonthlyBreakdown(yearOverYearData, '2026'), 
    [yearOverYearData]
  );
  
  const allTimeVaccineData = [
    { date: 'Jun 28, 2024', interested: 55,  attended: 25,  totalAnimals: 75,  totalVaccines: 120, showUpRate: 45.5, microchips: 7,   cats: 36, dogs: 39 },
    { date: 'Jul 27, 2024', interested: 117, attended: 59,  totalAnimals: 232, totalVaccines: 220, showUpRate: 50.4, microchips: 0,   cats: 62, dogs: 170 },
    { date: 'Sep 13, 2024', interested: 122, attended: 74,  totalAnimals: 165, totalVaccines: 270, showUpRate: 60.7, microchips: 83,  cats: 76, dogs: 89 },
    { date: 'Dec 7, 2024',  interested: 85,  attended: 63,  totalAnimals: 144, totalVaccines: 226, showUpRate: 74.1, microchips: 83,  cats: 52, dogs: 92 },
    { date: 'Feb 22, 2025', interested: 163, attended: 24,  totalAnimals: 207, totalVaccines: 298, showUpRate: 14.7, microchips: 125, cats: 64, dogs: 143 },
    { date: 'May 8, 2025',  interested: 91,  attended: 53,  totalAnimals: 114, totalVaccines: 137, showUpRate: 58.2, microchips: 70,  cats: 30, dogs: 84 },
    { date: 'Jul 25, 2025', interested: 323, attended: 191, totalAnimals: 406, totalVaccines: 658, showUpRate: 59.1, microchips: 221, cats: 131, dogs: 275 },
    { date: 'Oct 3, 2025',  interested: 297, attended: 175, totalAnimals: 341, totalVaccines: 563, showUpRate: 58.9, microchips: 208, cats: 103, dogs: 238 }
  ];
  
  const july2025Services = [
    { name: 'DHP Vaccines', value: 209, color: '#10b981' },
    { name: 'Rabies Dog',   value: 224, color: '#ef4444' },
    { name: 'Microchips',   value: 221, color: '#8b5cf6' },
    { name: 'FVRCP',        value: 122, color: '#3b82f6' },
    { name: 'Rabies Cat',   value: 103, color: '#f59e0b' }
  ];
  
  const oct2025Services = [
    { name: 'DHP Vaccines', value: 196, color: '#10b981' },
    { name: 'Rabies Dog',   value: 182, color: '#ef4444' },
    { name: 'Microchips',   value: 208, color: '#8b5cf6' },
    { name: 'FVRCP',        value: 94,  color: '#3b82f6' },
    { name: 'Rabies Cat',   value: 91,  color: '#f59e0b' }
  ];
  
  const HIST = [
    { m: 1,  avg: 216.0 },   { m: 2,  avg: 172.75 },  { m: 3,  avg: 199.125 }, { m: 4,  avg: 197.125 },
    { m: 5,  avg: 213.875 }, { m: 6,  avg: 213.625 }, { m: 7,  avg: 190.625 }, { m: 8,  avg: 215.75 },
    { m: 9,  avg: 225.25 },  { m: 10, avg: 189.5 },   { m: 11, avg: 176.75 },  { m: 12, avg: 208.875 }
  ];
  
  const ACTUAL_2025: Record<number, {adoptions:number, days:number}> = {
    1: { adoptions: 270, days: 31 }, 2: { adoptions: 211, days: 28 }, 3: { adoptions: 279, days: 31 },
    4: { adoptions: 217, days: 30 }, 5: { adoptions: 284, days: 31 }, 6: { adoptions: 303, days: 30 },
    7: { adoptions: 267, days: 31 }, 8: { adoptions: 304, days: 31 }, 9: { adoptions: 255, days: 30 },
    10: { adoptions: 250, days: 31 }, 11: { adoptions: 285, days: 30 }, 12: { adoptions: 250, days: 31 }
  };
  
  const BAND_HALF_WIDTH = 50;
  
  const seasonalityData = useMemo(() => {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return HIST.map((h, idx) => {
      const m = h.m;
      const actual = ACTUAL_2025[m]?.adoptions ?? null;
      const bandBottom = Math.max(0, Math.round(h.avg - BAND_HALF_WIDTH));
      const bandTop = Math.round(h.avg + BAND_HALF_WIDTH);
      
      return {
        month: MONTHS[idx],
        historical: Math.round(h.avg),
        actual2025: actual,
        bandTop,
        bandBottom,
      };
    });
  }, []);
  
  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
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
          <button
            onClick={() => setSelectedYear(2026)}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
              selectedYear === 2026
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
             2026
          </button>
          <button
            onClick={() => setSelectedYear(2025)}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
              selectedYear === 2025
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
             2025 
          </button>
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
                  {metric.trend && (
                    <>
                      {metric.trend === 'up'
                        ? <TrendingUp className={`h-4 w-4 ${metric.trendColor}`} />
                        : <TrendingDown className={`h-4 w-4 ${metric.trendColor}`} />
                      }
                    </>
                  )}
                  <span className={`text-sm font-medium ${metric.trendColor}`}>{metric.comparison}</span>
                  <span className="text-xs text-gray-500">{metric.comparisonText}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Navigation */}
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
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${index === safeCurrentVizIndex ? 'bg-blue-600 w-8' : 'bg-gray-300 hover:bg-gray-400'}`}
                />
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedYear === 2025 ? 'YTD Adoptions by Species (2021-2025)' : 'YTD Adoptions by Species (2021-2026)'}
            </h3>
            <ResponsiveContainer width="100%" height={420}>
              <ComposedChart data={ytdSpeciesForChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    const label =
                      name === 'dogs' ? 'Dogs (YTD)' :
                      name === 'cats' ? 'Cats (YTD)' :
                      name === 'totalYTD' ? 'Total (YTD)' : name;
                    return [`${value} adoptions`, label];
                  }}
                />
                <Legend />
                {latestYear && <ReferenceLine x={latestYear} stroke="#e5e7eb" strokeWidth={2} />}
                <Line
                  type="monotone"
                  dataKey="totalYTD"
                  stroke="#6b7280"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Total (YTD)"
                />
                <Line type="monotone" dataKey="dogs" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Dogs (YTD)" />
                <Line type="monotone" dataKey="cats" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Cats (YTD)" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-600 mt-3">
              <span className="font-semibold">Data rule:</span> YTD = adoptions through <strong>{cutoffLabel}</strong> of each year.
            </div>
          </div>
        )}
        
        {/* 2) Year-over-Year Comparison */}
        {currentViz.id === 'yearComparison' && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedYear === 2025 ? '2024 vs 2025 Monthly Adoptions' : '2025 vs 2026 Monthly Adoptions'}
              </h3>
              
              <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={() => setComparisonFilter('total')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    comparisonFilter === 'total'
                      ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Total
                </button>
                <button
                  onClick={() => setComparisonFilter('dogs')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    comparisonFilter === 'dogs'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Dogs Only
                </button>
                <button
                  onClick={() => setComparisonFilter('cats')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    comparisonFilter === 'cats'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Cats Only
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart data={yearOverYearData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'Number of Adoptions', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    const label = 
                      name === 'dogs2024' ? 'Dogs 2024' :
                      name === 'dogs2025' ? 'Dogs 2025' :
                      name === 'dogs2026' ? 'Dogs 2026' :
                      name === 'cats2024' ? 'Cats 2024' :
                      name === 'cats2025' ? 'Cats 2025' :
                      name === 'cats2026' ? 'Cats 2026' :
                      name === 'total2024' ? 'Total 2024' :
                      name === 'total2025' ? 'Total 2025' :
                      name === 'total2026' ? 'Total 2026' : name;
                    return [`${value} adoptions`, label];
                  }}
                />
                <Legend />
                
                {selectedYear === 2025 && (
                  <>
                    {comparisonFilter === 'total' && (
                      <>
                        <Bar dataKey="total2024" fill="#3b82f6" name="Total 2024" />
                        <Bar dataKey="total2025" fill="#10b981" name="Total 2025" />
                      </>
                    )}
                    {comparisonFilter === 'dogs' && (
                      <>
                        <Bar dataKey="dogs2024" fill="#3b82f6" name="Dogs 2024" />
                        <Bar dataKey="dogs2025" fill="#10b981" name="Dogs 2025" />
                      </>
                    )}
                    {comparisonFilter === 'cats' && (
                      <>
                        <Bar dataKey="cats2024" fill="#3b82f6" name="Cats 2024" />
                        <Bar dataKey="cats2025" fill="#10b981" name="Cats 2025" />
                      </>
                    )}
                  </>
                )}
                
                {selectedYear === 2026 && (
                  <>
                    {comparisonFilter === 'total' && (
                      <>
                        <Bar dataKey="total2025" fill="#3b82f6" name="Total 2025" />
                        <Bar dataKey="total2026" fill="#10b981" name="Total 2026" />
                      </>
                    )}
                    {comparisonFilter === 'dogs' && (
                      <>
                        <Bar dataKey="dogs2025" fill="#3b82f6" name="Dogs 2025" />
                        <Bar dataKey="dogs2026" fill="#10b981" name="Dogs 2026" />
                      </>
                    )}
                    {comparisonFilter === 'cats' && (
                      <>
                        <Bar dataKey="cats2025" fill="#3b82f6" name="Cats 2025" />
                        <Bar dataKey="cats2026" fill="#10b981" name="Cats 2026" />
                      </>
                    )}
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-600 mt-3">
              <span className="font-semibold">Data source:</span> Computed from adoptions_by_species.csv. Blue = previous year, Green = current year.
            </div>
          </div>
        )}
        
        {/* 3) Seasonality & Predictions - 2025 ONLY */}
        {selectedYear === 2025 && currentViz.id === 'predictions' && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Seasonality & 2025 Actual Data</h3>
            <ResponsiveContainer width="100%" height={460}>
              <ComposedChart data={seasonalityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                
                <ReferenceArea x1="May" x2="Jun" fill="#10b981" fillOpacity={0.08} stroke="none" />
                <ReferenceArea x1="Aug" x2="Sep" fill="#10b981" fillOpacity={0.08} stroke="none" />
                <ReferenceArea x1="Feb" x2="Mar" fill="#ef4444" fillOpacity={0.06} stroke="none" />
                <ReferenceArea x1="Oct" x2="Nov" fill="#ef4444" fillOpacity={0.06} stroke="none" />
                
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const d = payload[0].payload as any;
                      const isPeak = (d.month === 'May' || d.month === 'Jun' || d.month === 'Aug' || d.month === 'Sep');
                      const isDip  = (d.month === 'Feb' || d.month === 'Mar' || d.month === 'Oct' || d.month === 'Nov');
                      return (
                        <div className="bg-white p-3 rounded shadow-lg border">
                          <p className="font-semibold">{d.month} 2025</p>
                          {d.actual2025 != null ? (
                            <p className="text-blue-600">Actual: {d.actual2025} {d.actual2025 >= d.historical ? '↑ above avg' : '↓ below avg'}</p>
                          ) : null}
                          <p className="text-gray-600">Historical Avg: {d.historical}</p>
                          <p className="text-gray-400">Range: {d.bandBottom} – {d.bandTop}</p>
                          {isPeak && <p className="text-xs text-emerald-700 mt-1">Peak window</p>}
                          {isDip  && <p className="text-xs text-red-700 mt-1">Dip window</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
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
              <div className="mt-1">Peak windows <span className="text-emerald-700">(light green)</span>: May–Jun, Aug–Sep • Dip windows <span className="text-red-700">(light red)</span>: Feb–Mar, Oct–Nov</div>
            </div>
          </div>
        )}
        
        {/* 4) Monthly Adoptions - Both 2025 and 2026 */}
        {currentViz.id === 'adoptions' && (
          <div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedYear === 2025 ? 'Monthly Species Distribution Throughout 2025' : 'Monthly Species Distribution Throughout 2026'}
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={selectedYear === 2025 ? monthly2025CatsVsDogs : monthly2026CatsVsDogs}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" label={{ value: 'Number of Adoptions', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: 'Percentage (%)', angle: 90, position: 'insideRight' }} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'dogs' || name === 'cats') return [`${value} adoptions`, name === 'dogs' ? 'Dogs' : 'Cats'];
                      if (name === 'dogPct' || name === 'catPct') return [`${value}%`, name === 'dogPct' ? 'Dog %' : 'Cat %'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `${label} ${selectedYear}`}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="dogs" fill="#3b82f6" name="Dogs" />
                  <Bar yAxisId="left" dataKey="cats" fill="#10b981" name="Cats" />
                  <Line yAxisId="right" type="monotone" dataKey="dogPct" stroke="#ef4444" strokeWidth={3} name="Dog %" />
                  <Line yAxisId="right" type="monotone" dataKey="catPct" stroke="#059669" strokeWidth={3} name="Cat %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* 5) Vaccine Clinics - 2025 ONLY */}
        {selectedYear === 2025 && currentViz.id === 'vaccines' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All-Time Clinic Growth</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={allTimeVaccineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="attended" fill="#3b82f6" name="People Attended" />
                    <Bar yAxisId="left" dataKey="totalAnimals" fill="#10b981" name="Animals Served" />
                    <Line yAxisId="right" type="monotone" dataKey="totalVaccines" stroke="#ef4444" strokeWidth={3} name="Total Vaccines" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">October 3, 2025 - Vaccine Clinic Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={oct2025Services}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name.split(' ')[0]}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {oct2025Services.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
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
                  <div>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={july2025Services}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name.split(' ')[0]}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {july2025Services.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
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
                    <li>• July 25: 406 animals in one day!</li>
                    <li>• 658 vaccines (record high)</li>
                    <li>• 221 microchips placed</li>
                    <li>• 323 people interested</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-yellow-900 mb-3">Program Impact</h4>
                  <ul className="text-sm text-yellow-800 space-y-2">
                    <li>• 1,684 animals served total</li>
                    <li>• 2,534 vaccines administered</li>
                    <li>• 67% dogs, 33% cats</li>
                    <li>• Growing microchip adoption</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCards;
