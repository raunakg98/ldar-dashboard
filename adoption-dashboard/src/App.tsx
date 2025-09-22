import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Heart, Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar,
  ResponsiveContainer, ComposedChart, PieChart, Pie, Cell, Area,
  ReferenceArea, ReferenceDot
} from 'recharts';

const DashboardCards = () => {
  // Visualization configurations (ORDER: 1) Predictions 2) Monthly Adoptions 3) Vaccine Clinics)
  const visualizations = [
    { id: 'predictions', title: 'Seasonality & 2025 Predictions', subtitle: 'Avg-centered bands • Aug–Dec forecast' },
    { id: 'adoptions', title: 'Monthly Adoptions Breakdown', subtitle: '2025 Cats vs Dogs Trends' },
    { id: 'vaccines', title: 'Vaccine Clinics Performance', subtitle: 'All-Time Analysis' }
  ];
  
  const [currentVizIndex, setCurrentVizIndex] = useState(0);
  const currentViz = visualizations[currentVizIndex];
  
  // Navigation functions
  const goToPrevious = () => {
    setCurrentVizIndex((prev) => (prev === 0 ? visualizations.length - 1 : prev - 1));
  };
  const goToNext = () => {
    setCurrentVizIndex((prev) => (prev === visualizations.length - 1 ? 0 : prev + 1));
  };
  
  // Key metrics data
  const keyMetrics = [
    {
      title: "YTD Adoptions",
      value: "2,346",
      subtitle: "highest in the last 4 years",
      comparison: "+9%",
      comparisonText: "vs 24 YTD (2146)",
      trend: "up",
      icon: Heart,
      bgColor: "bg-blue-50",
      textColor: "text-blue-900",
      valueColor: "text-blue-600",
      trendColor: "text-green-600"
    },
    {
      title: "Sep 2025",
      value: "211",
      subtitle: "projected 245-275",
      comparison: "-23%",
      comparisonText: "vs Sep 2024(275)",
      trend: "up",
      icon: Calendar,
      bgColor: "bg-green-50",
      textColor: "text-green-900",
      valueColor: "text-green-600",
      trendColor: "text-green-600"
    },
    {
      title: "Animals in Foster Care",
      value: "154",
      subtitle: (
        <div>
          <div>26 dogs in boarding</div>
          <div>9 cats at PetSmart</div>
          <div>20 cats at Meow Maison</div>
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
      value: "209",
      subtitle: "current snapshot",
      comparison: "+1%",
      comparisonText: "vs last week(205)",
      trend: "up",
      icon: MapPin,
      bgColor: "bg-orange-50",
      textColor: "text-orange-900",
      valueColor: "text-orange-600",
      trendColor: "text-red-600"
    },
    {
      title: "Animals in Care SC",
      value: "137",
      subtitle: "current snapshot",
      comparison: "+3%",
      comparisonText: "vs last week (133)",
      trend: "up",
      icon: MapPin,
      bgColor: "bg-pink-50",
      textColor: "text-pink-900",
      valueColor: "text-pink-600",
      trendColor: "text-green-600"
    }
  ];
  
  // 2025 Monthly breakdown cats vs dogs
  const monthly2025CatsVsDogs = [
    { month: 'Jan', dogs: 130, cats: 140, total: 270, dogPct: 48.1, catPct: 51.9 },
    { month: 'Feb', dogs: 101, cats: 110, total: 211, dogPct: 47.9, catPct: 52.1 },
    { month: 'Mar', dogs: 133, cats: 146, total: 279, dogPct: 47.7, catPct: 52.3 },
    { month: 'Apr', dogs: 104, cats: 113, total: 217, dogPct: 47.9, catPct: 52.1 },
    { month: 'May', dogs: 136, cats: 148, total: 284, dogPct: 47.9, catPct: 52.1 },
    { month: 'Jun', dogs: 145, cats: 158, total: 303, dogPct: 47.9, catPct: 52.1 },
    { month: 'Jul', dogs: 171, cats: 96, total: 267, dogPct: 66.8, catPct: 33.2 },
    { month: 'Aug', dogs: 177, cats: 127, total: 304, dogPct: 58.2, catPct: 41.8 },
    { month: 'Sep', dogs: 83, cats: 66, total: 149, dogPct: 55.7, catPct: 44.3 }
  ];
  
  // All-time Vaccine Clinic Data
  const allTimeVaccineData = [
    { date: 'Jun 28, 2024', interested: 55, attended: 25, totalAnimals: 75, totalVaccines: 120, showUpRate: 45.5, microchips: 7, cats: 36, dogs: 39 },
    { date: 'Jul 27, 2024', interested: 117, attended: 59, totalAnimals: 232, totalVaccines: 220, showUpRate: 50.4, microchips: 0, cats: 62, dogs: 170 },
    { date: 'Sep 13, 2024', interested: 122, attended: 74, totalAnimals: 165, totalVaccines: 270, showUpRate: 60.7, microchips: 83, cats: 76, dogs: 89 },
    { date: 'Dec 7, 2024', interested: 85, attended: 63, totalAnimals: 144, totalVaccines: 226, showUpRate: 74.1, microchips: 83, cats: 52, dogs: 92 },
    { date: 'Feb 22, 2025', interested: 163, attended: 24, totalAnimals: 207, totalVaccines: 298, showUpRate: 14.7, microchips: 125, cats: 64, dogs: 143 },
    { date: 'May 8, 2025', interested: 91, attended: 53, totalAnimals: 114, totalVaccines: 137, showUpRate: 58.2, microchips: 70, cats: 30, dogs: 84 },
    { date: 'Jul 25, 2025', interested: 323, attended: 191, totalAnimals: 406, totalVaccines: 658, showUpRate: 59.1, microchips: 221, cats: 131, dogs: 275 }
  ];
  
  // July 25, 2025 clinic service breakdown
  const july2025Services = [
    { name: 'DHP Vaccines', value: 209, color: '#10b981' },
    { name: 'Rabies Dog', value: 224, color: '#ef4444' },
    { name: 'Microchips', value: 221, color: '#8b5cf6' },
    { name: 'FVRCP', value: 122, color: '#3b82f6' },
    { name: 'Rabies Cat', value: 103, color: '#f59e0b' }
  ];

  const getTrendIcon = (trend: string, trendColor: string) => {
    if (trend === 'up') return <TrendingUp className={`h-4 w-4 ${trendColor}`} />;
    return <TrendingDown className={`h-4 w-4 ${trendColor}`} />;
  };

  // ===== Seasonality & 2025 Predictions (Predictions tab) =====
  // Historical averages (band center) from your 2017–2024 data
  const HIST = [
    { m: 1,  avg: 216.0 },
    { m: 2,  avg: 172.75 },
    { m: 3,  avg: 199.125 },
    { m: 4,  avg: 197.125 },
    { m: 5,  avg: 213.875 },   // bump starts
    { m: 6,  avg: 213.625 },   // bump continues
    { m: 7,  avg: 190.625 },
    { m: 8,  avg: 215.75 },    // second bump
    { m: 9,  avg: 225.25 },    // second bump peak
    { m:10,  avg: 189.5 },     // a little lower than Sep
    { m:11,  avg: 176.75 },
    { m:12,  avg: 208.875 }
  ];

  // 2025 actuals (through Aug 10)
  const ACTUAL_2025: Record<number, {adoptions:number, days:number}> = {
    1: { adoptions: 270, days: 31 },
    2: { adoptions: 211, days: 28 },
    3: { adoptions: 279, days: 31 },
    4: { adoptions: 217, days: 30 },
    5: { adoptions: 284, days: 31 },
    6: { adoptions: 303, days: 30 },
    7: { adoptions: 267, days: 31 },
    8: { adoptions: 304, days: 31 } // partial
  };

  // Predictions (Aug–Dec) — reduced by 10 each previously
  const AUG_PRED = 299;
  const SEP_PRED = 291;
  const OCT_PRED = 218;
  const NOV_PRED = 222;
  const DEC_PRED = 286;

  // Consistent band width (≈ one std dev)
  const BAND_HALF_WIDTH = 50;

  // Visual highlight ranges (category spans)
  const PEAK_RANGES: [string, string][] = [['May','Jun'], ['Aug','Sep']];
  const DIP_RANGES:  [string, string][] = [['Feb','Mar'], ['Oct','Nov']];

  // For peak/dip callout dots (based on predictions only)
  const PRED_BY_MONTH: Record<string, number> = {
    Aug: AUG_PRED, Sep: SEP_PRED, Oct: OCT_PRED, Nov: NOV_PRED, Dec: DEC_PRED
  };
  const peakPredMonth = Object.entries(PRED_BY_MONTH).reduce((a,b)=> a[1] > b[1] ? a : b)[0];
  const dipPredMonth  = Object.entries(PRED_BY_MONTH).reduce((a,b)=> a[1] < b[1] ? a : b)[0];

  const seasonalityData = useMemo(() => {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return HIST.map((h, idx) => {
      const m = h.m;
      const actual = ACTUAL_2025[m]?.adoptions ?? null;

      const bandBottom = Math.max(0, Math.round(h.avg - BAND_HALF_WIDTH));
      const bandTop    = Math.round(h.avg + BAND_HALF_WIDTH);

      // Purple line values: Jan–Jul = actuals, Aug–Dec = predictions
      let actualOrPred: number | null = null;
      if (m <= 7 && actual !== null) actualOrPred = actual;
      else if (m === 8) actualOrPred = AUG_PRED;
      else if (m === 9) actualOrPred = SEP_PRED;
      else if (m === 10) actualOrPred = OCT_PRED;
      else if (m === 11) actualOrPred = NOV_PRED;
      else if (m === 12) actualOrPred = DEC_PRED;

      return {
        month: MONTHS[idx],
        historical: Math.round(h.avg),     // band center (avg)
        actual2025: actual,                // blue bar (Jan–Aug partial)
        line2025: actualOrPred,            // purple line (Jan–Jul actuals, Aug–Dec predictions)
        bandTop,
        bandBottom,
        isAug: m === 8
      };
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Adoption Dashboard</h1>
        <p className="text-lg text-gray-600">Key metrics as of Sunday, September 7, 2025</p>
      </div>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
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
                <div className={`text-xs ${metric.textColor} opacity-75`}>{metric.subtitle}</div>
              </div>
              {metric.comparison && (
                <div className="flex items-center space-x-1">
                  {getTrendIcon(metric.trend, metric.trendColor)}
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
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${index === currentVizIndex ? 'bg-blue-600 w-8' : 'bg-gray-300 hover:bg-gray-400'}`}
                />
              ))}
            </div>
          </div>
          <button onClick={goToNext} className="p-3 bg-white rounded-full shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200 border border-gray-200" aria-label="Next visualization">
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        {/* 1) Seasonality & Predictions */}
        {currentViz.id === 'predictions' && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Seasonality & 2025 Actual/Prediction</h3>
            <ResponsiveContainer width="100%" height={460}>
              <ComposedChart data={seasonalityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                
                {/* Background highlight windows */}
                {PEAK_RANGES.map(([x1, x2], i) => (
                  <ReferenceArea key={`peak-${i}`} x1={x1} x2={x2} fill="#10b981" fillOpacity={0.08} stroke="none" />
                ))}
                {DIP_RANGES.map(([x1, x2], i) => (
                  <ReferenceArea key={`dip-${i}`} x1={x1} x2={x2} fill="#ef4444" fillOpacity={0.06} stroke="none" />
                ))}

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const d = payload[0].payload;
                      const inPeak = PEAK_RANGES.some(([a,b]) => d.month === a || d.month === b);
                      const inDip  = DIP_RANGES.some(([a,b]) => d.month === a || d.month === b);
                      return (
                        <div className="bg-white p-3 rounded shadow-lg border">
                          <p className="font-semibold">{d.month} 2025</p>
                          {d.isAug ? (
                            <>
                              <p className="text-purple-600">Prediction: {AUG_PRED}</p>
                              <p className="text-blue-600">Actual: {d.actual2025}</p>
                            </>
                          ) : d.actual2025 != null ? (
                            <p className="text-blue-600">Actual: {d.actual2025} {d.actual2025 >= d.historical ? '↑ above avg' : '↓ below avg'}</p>
                          ) : (
                            <p className="text-purple-600">Prediction: {d.line2025}</p>
                          )}
                          <p className="text-gray-600">Historical Avg (band center): {d.historical}</p>
                          <p className="text-gray-400">Band: {d.bandBottom} – {d.bandTop}</p>
                          {inPeak && <p className="text-xs text-emerald-700 mt-1">Peak window</p>}
                          {inDip  && <p className="text-xs text-red-700 mt-1">Dip window</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />

                {/* Band (avg-centered, ±50) */}
                <Area type="monotone" dataKey="bandTop" stroke="none" fill="#e5e7eb" fillOpacity={0.6} name="Expected Range (Avg ± 50)" />
                <Area type="monotone" dataKey="bandBottom" stroke="none" fill="#ffffff" fillOpacity={1} />

                {/* Historical average */}
                <Line type="monotone" dataKey="historical" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" name="Historical Average" />

                {/* 2025 line (Jan–Jul = actuals; Aug–Dec = predictions) */}
                <Line
                  type="monotone"
                  dataKey="line2025"
                  stroke="#a855f7"
                  strokeWidth={3}
                  strokeDasharray="3 3"
                  name="2025 Actual/Prediction"
                  connectNulls
                  dot={{ r: 2 }}
                  activeDot={{ r: 6 }}
                />

                {/* Peak & dip callout dots on the predictions segment */}
                <ReferenceDot x={peakPredMonth} y={PRED_BY_MONTH[peakPredMonth]} r={5} fill="#a855f7" stroke="#a855f7" />
                <ReferenceDot x={dipPredMonth}  y={PRED_BY_MONTH[dipPredMonth]}  r={5} fill="#ffffff" stroke="#ef4444" strokeWidth={2} />

                {/* 2025 actual bars (all blue) */}
                <Bar dataKey="actual2025" fill="#3b82f6" name="2025 Actual">
                  {seasonalityData.map((_, i) => <Cell key={`cell-${i}`} fill="#3b82f6" />)}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>

            {/* Legend note */}
            <div className="text-xs text-gray-600 mt-3">
              <span className="font-semibold">Reading the chart:</span> Shaded band = expected range based on historical average ± ~1 standard deviation (~50 adoptions).
              Dashed gray line = historical average (band center). Purple line = 2025 actuals through July and predictions for Aug–Dec derived from historical averages with variability considered.
              Blue bars = 2025 actuals (August is a partial month).
              <div className="mt-1">Peak windows <span className="text-emerald-700">(light green)</span>: May–Jun, Aug–Sep • Dip windows <span className="text-red-700">(light red)</span>: Feb–Mar, Oct–Nov</div>
            </div>
          </div>
        )}

        {/* 2) Monthly Adoptions Visualization */}
        {currentViz.id === 'adoptions' && (
          <div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Species Distribution Throughout 2025</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={monthly2025CatsVsDogs}>
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
                    labelFormatter={(label) => `${label} 2025`}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="dogs" fill="#3b82f6" name="Dogs" />
                  <Bar yAxisId="left" dataKey="cats" fill="#10b981" name="Cats" />
                  <Line yAxisId="right" type="monotone" dataKey="dogPct" stroke="#ef4444" strokeWidth={3} name="Dog %" />
                  <Line yAxisId="right" type="monotone" dataKey="catPct" stroke="#059669" strokeWidth={3} name="Cat %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-blue-900 mb-3">The Pattern Until June</h4>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li><strong>Consistent cat majority:</strong> 51-52% cats across Jan-Jun</li>
                  <li><strong>Stable dog percentage:</strong> Dogs hovered around 47-48%</li>
                  <li><strong>Peak performance:</strong> June hit 303 total adoptions</li>
                  <li><strong>Predictable trend:</strong> 2025 looked like the "Year of the Cat"</li>
                </ul>
              </div>
              
              <div className="bg-red-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-red-900 mb-3">July's Dramatic Shift</h4>
                <ul className="text-sm text-red-800 space-y-2">
                  <li><strong>Dogs surge to 64.9%:</strong> +17 point jump from June's 47.9%</li>
                  <li><strong>Cats drop to 35.1%:</strong> Lower than the usual 50-52%</li>
                  <li><strong>168 vs 91:</strong> Nearly 2:1 dog-to-cat ratio</li>
                  <li><strong>Breaking the pattern:</strong> Highest dog month since early 2024</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 3) Vaccine Clinics Visualization */}
        {currentViz.id === 'vaccines' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Over Time */}
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
              
              {/* July 25 Service Breakdown */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">July 25, 2025 - Record Clinic Breakdown</h3>
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
                      <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-gray-600">Dogs Served:</span><span className="font-medium text-gray-900">275</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Cats Served:</span><span className="font-medium text-gray-900">131</span></div>
                      <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-gray-600">Total Animals:</span><span className="font-medium text-gray-900">406</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Total Services:</span><span className="font-medium text-gray-900">879</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Insights */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-green-900 mb-3">Growth</h4>
                <ul className="text-sm text-green-800 space-y-2">
                  <li>• July 25 clinic: 406 animals served in ONE DAY!</li>
                  <li>• 658 vaccines administered (previous record: 298)</li>
                  <li>• 221 microchips placed (highest ever)</li>
                  <li>• 323 people interested (3x normal volume)</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-yellow-900 mb-3">Evolution</h4>
                <ul className="text-sm text-yellow-800 space-y-2">
                  <li>• Total program impact: 1,343 animals served</li>
                  <li>• 1,886 vaccines administered across all clinics</li>
                  <li>• Dogs dominate vaccine clinics (66% vs 34% cats)</li>
                  <li>• Microchip adoption growing rapidly</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCards;
