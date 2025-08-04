// import React from 'react';
import { useState } from 'react';
import { TrendingUp, TrendingDown, Heart, Calendar, MapPin } from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, ResponsiveContainer, ComposedChart, PieChart, Pie, Cell } from 'recharts';
// src/main.tsx or main.jsx
import './index.css';


const DashboardCards = () => {
  // State for visualization toggle
  const [currentViz, setCurrentViz] = useState('vaccines'); // Start with vaccines first
  
  // Key metrics data
  const keyMetrics = [
    {
      title: "YTD Adoptions",
      value: "1,831",
      subtitle: "highest in the past 3 years",
      comparison: "+13%",
      comparisonText: "vs 24 YTD (1621)",
      trend: "up",
      icon: Heart,
      bgColor: "bg-blue-50",
      textColor: "text-blue-900",
      valueColor: "text-blue-600",
      trendColor: "text-green-600"
    },
    {
      title: "July 2025",
      value: "267",
      subtitle: "highest in the last 5 years 4th time this year",
      comparison: "+89",
      comparisonText: "vs July 2024(178)",
      trend: "up",
      icon: Calendar,
      bgColor: "bg-green-50",
      textColor: "text-green-900",
      valueColor: "text-green-600",
      trendColor: "text-green-600"
    },
    {
      title: "Animals in Foster Care",
      value: "159",
      subtitle: (
        <div>
          <div>20 dogs in boarding</div>
          <div>11 cats at PetSmart</div>
          <div>19 cats at Meo Maison</div>
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
      value: "210",
      subtitle: "current snapshot",
      comparison: "-14%",
      comparisonText: "vs last week(246)",
      trend: "down",
      icon: MapPin,
      bgColor: "bg-orange-50",
      textColor: "text-orange-900",
      valueColor: "text-orange-600",
      trendColor: "text-red-600"
    },
    {
      title: "Animals in Care SC",
      value: "119",
      subtitle: "current snapshot",
      comparison: "+65%",
      comparisonText: "vs last week (72)",
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
    { month: 'Jul', dogs: 171, cats: 96, total: 267, dogPct: 66.8, catPct: 33.2 }
  ];
  
  // All-time Vaccine Clinic Data (2024 + 2025)
  const allTimeVaccineData = [
    { date: 'Jun 28, 2024', interested: 55, attended: 25, totalAnimals: 75, totalVaccines: 120, showUpRate: 45.5, microchips: 7, cats: 36, dogs: 39 },
    { date: 'Jul 27, 2024', interested: 117, attended: 59, totalAnimals: 232, totalVaccines: 220, showUpRate: 50.4, microchips: 0, cats: 62, dogs: 170 },
    { date: 'Sep 13, 2024', interested: 122, attended: 74, totalAnimals: 165, totalVaccines: 270, showUpRate: 60.7, microchips: 83, cats: 76, dogs: 89 },
    { date: 'Dec 7, 2024', interested: 85, attended: 63, totalAnimals: 144, totalVaccines: 226, showUpRate: 74.1, microchips: 83, cats: 52, dogs: 92 },
    { date: 'Feb 22, 2025', interested: 163, attended: 24, totalAnimals: 207, totalVaccines: 298, showUpRate: 14.7, microchips: 125, cats: 64, dogs: 143 },
    { date: 'May 8, 2025', interested: 91, attended: 53, totalAnimals: 114, totalVaccines: 137, showUpRate: 58.2, microchips: 70, cats: 30, dogs: 84 },
    { date: 'Jul 25, 2025', interested: 323, attended: 191, totalAnimals: 406, totalVaccines: 658, showUpRate: 59.1, microchips: 221, cats: 131, dogs: 275 }
  ];
  
  // July 25, 2025 clinic service breakdown for pie chart
  const july2025Services = [
    { name: 'DHP Vaccines', value: 209, color: '#10b981' },
    { name: 'Rabies Dog', value: 224, color: '#ef4444' },
    { name: 'Microchips', value: 221, color: '#8b5cf6' },
    { name: 'FVRCP', value: 122, color: '#3b82f6' },
    { name: 'Rabies Cat', value: 103, color: '#f59e0b' }
  ];
  
  const getTrendIcon = (trend: string, trendColor: string) => {
    if (trend === 'up') {
      return <TrendingUp className={`h-4 w-4 ${trendColor}`} />;
    } else {
      return <TrendingDown className={`h-4 w-4 ${trendColor}`} />;
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Adoption Dashboard</h1>
        <p className="text-lg text-gray-600">Key metrics as of Sunday, August 3, 2025</p>
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
                  <span className={`text-sm font-medium ${metric.trendColor}`}>
                    {metric.comparison}
                  </span>
                  <span className="text-xs text-gray-500">{metric.comparisonText}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Visualization Toggle Buttons */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4 mb-6 bg-gray-100 p-2 rounded-lg max-w-md mx-auto">
          <button
            onClick={() => setCurrentViz('vaccines')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 border-2 ${
              currentViz === 'vaccines'
                ? 'bg-blue-600 text-white shadow-lg transform scale-105 border-blue-600'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border-gray-300'
            }`}
          >
            🏥 Vaccine Clinics
          </button>
          <button
            onClick={() => setCurrentViz('adoptions')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 border-2 ${
              currentViz === 'adoptions'
                ? 'bg-blue-600 text-white shadow-lg transform scale-105 border-blue-600'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border-gray-300'
            }`}
          >
            📊 Monthly Adoptions
          </button>
        </div>
        
        {/* Vaccine Clinic Visualization - Default */}
        {currentViz === 'vaccines' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Vaccine Clinic Performance (All Time)</h2>
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
              
              {/* July 25 Service Breakdown with Side-by-Side Stats */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">July 25, 2025 - Record Clinic Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pie Chart */}
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
                  
                  {/* Record Day Stats - Side by Side */}
                  <div className="bg-white p-4 rounded border border-gray-300 h-fit">
                    <h4 className="font-semibold text-gray-900 mb-3">Record Day Stats</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interested:</span>
                        <span className="font-medium text-gray-900">323</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Attended:</span>
                        <span className="font-medium text-gray-900">191 (59%)</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span className="text-gray-600">Dogs Served:</span>
                        <span className="font-medium text-gray-900">275</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cats Served:</span>
                        <span className="font-medium text-gray-900">131</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span className="text-gray-600">Total Animals:</span>
                        <span className="font-medium text-gray-900">406</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Services:</span>
                        <span className="font-medium text-gray-900">879</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* All-Time Vaccine Clinic Insights */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-green-900 mb-3">Program Evolution</h4>
                <ul className="text-sm text-green-800 space-y-2">
                  <li>Started small: First clinic served 75 animals (Jun 2024)</li>
                  <li>July 25, 2025: Record 406 animals in one day</li>
                  <li>Total program impact: 1,343 animals served</li>
                  <li>Growth trajectory: 441% increase from first to latest clinic</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-yellow-900 mb-3">Conversion Challenges</h4>
                <ul className="text-sm text-yellow-800 space-y-2">
                  <li>Best conversion: Dec 2024 (74.1% show-up rate)</li>
                  <li>Lowest conversion: Feb 2025 (14.7%)</li>
                  <li>Total no-shows: 467 people across all clinics</li>
                  <li>Summer/fall timing consistently outperforms winter</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Monthly Adoptions Visualization */}
        {currentViz === 'adoptions' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">2025 Monthly Cats vs Dogs: The July Dogs Surge</h2>
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
                      if (name === 'dogs' || name === 'cats') {
                        return [`${value} adoptions`, name === 'dogs' ? 'Dogs' : 'Cats'];
                      }
                      if (name === 'dogPct' || name === 'catPct') {
                        return [`${value}%`, name === 'dogPct' ? 'Dog %' : 'Cat %'];
                      }
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
            
            {/* Analysis of the July shift */}
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
      </div>
    </div>
  );
};

export default DashboardCards;