// import React from 'react';
import { TrendingUp, TrendingDown, Heart, Calendar, MapPin } from 'lucide-react';
import {  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, ResponsiveContainer, ComposedChart } from 'recharts';

const DashboardCards = () => {
  // Key metrics data
  const keyMetrics = [
    {
      title: "YTD Adoptions",
      value: "1,823",
      subtitle: "highest in the past 3 years",
      comparison: "+12.4%",
      comparisonText: "vs 2024 YTD",
      trend: "up",
      icon: Heart,
      bgColor: "bg-blue-50",
      textColor: "text-blue-900",
      valueColor: "text-blue-600",
      trendColor: "text-green-600"
    },
    {
      title: "July 2025",
      value: "259",
      subtitle: "highest in the last 5 years third month in a row",
      comparison: "+45%",
      comparisonText: "vs July 2024",
      trend: "up",
      icon: Calendar,
      bgColor: "bg-green-50",
      textColor: "text-green-900",
      valueColor: "text-green-600",
      trendColor: "text-green-600"
    },
    {
      title: "Animals in Foster Care",
      value: "192",
      subtitle: (
  <div>
    <div>27 dogs in boarding</div>
    <div>10 cats at PetSmart</div>
    <div>17 cats at Meo Maison</div>
  </div>
),
      // comparison: "10 cats at PetSmart",
      // comparisonText: "17 cats at Meo Maison",
      trend: "up",
      icon: TrendingUp,
      bgColor: "bg-purple-50",
      textColor: "text-purple-900",
      valueColor: "text-purple-600",
      trendColor: "text-green-600"
    },
    {
      title: "Animals in Care VA",
      value: "246",
      subtitle: "current snapshot",
      comparison: "+19%",
      comparisonText: "vs last week",
      trend: "up",
      icon: MapPin,
      bgColor: "bg-orange-50",
      textColor: "text-orange-900",
      valueColor: "text-orange-600",
      trendColor: "text-green-600"
    },
    {
      title: "Animals in Care SC",
      value: "72",
      subtitle: "current snapshot",
      comparison: "-53.1%",
      comparisonText: "vs last week (155)",
      trend: "down",
      icon: MapPin,
      bgColor: "bg-pink-50",
      textColor: "text-pink-900",
      valueColor: "text-pink-600",
      trendColor: "text-red-600"
    }
  ];

  // 2025 Monthly breakdown
  const monthly2025CatsVsDogs = [
    { month: 'Jan', dogs: 130, cats: 140, total: 270, dogPct: 48.1, catPct: 51.9 },
    { month: 'Feb', dogs: 101, cats: 110, total: 211, dogPct: 47.9, catPct: 52.1 },
    { month: 'Mar', dogs: 133, cats: 146, total: 279, dogPct: 47.7, catPct: 52.3 },
    { month: 'Apr', dogs: 104, cats: 113, total: 217, dogPct: 47.9, catPct: 52.1 },
    { month: 'May', dogs: 136, cats: 148, total: 284, dogPct: 47.9, catPct: 52.1 },
    { month: 'Jun', dogs: 145, cats: 158, total: 303, dogPct: 47.9, catPct: 52.1 },
    { month: 'Jul', dogs: 168, cats: 91, total: 259, dogPct: 64.9, catPct: 35.1 }
  ];

  const getTrendIcon = (trend, trendColor) => {
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
        <p className="text-lg text-gray-600">Key metrics as of Sunday, July 27, 2025</p>
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
                <p className={`text-xs ${metric.textColor} opacity-75`}>{metric.subtitle}</p>
              </div>
              
              <div className="flex items-center space-x-1">
                {getTrendIcon(metric.trend, metric.trendColor)}
                <span className={`text-sm font-medium ${metric.trendColor}`}>
                  {metric.comparison}
                </span>
                <span className="text-xs text-gray-500">{metric.comparisonText}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Critical Insight Alert */}
      {/* <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-3">
          <div className="bg-amber-100 rounded-full p-2">
            <TrendingUp className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">🚨 Critical Species Trend Alert</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-amber-200">
                <h4 className="font-semibold text-amber-900">July Species Breakdown</h4>
                <div className="mt-2 space-y-1">
                  <p className="text-sm"><span className="font-medium">Dogs:</span> 168 adoptions (64.9%)</p>
                  <p className="text-sm"><span className="font-medium">Cats:</span> 91 adoptions (35.1%)</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded border border-amber-200">
                <h4 className="font-semibold text-amber-900">Vs 2025 Normal Trend</h4>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-red-600">
                    <span className="font-medium">Dogs:</span> +17.0 percentage points higher than normal
                  </p>
                  <p className="text-sm text-blue-600">
                    <span className="font-medium">Cats:</span> -17.0 percentage points lower than normal
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 bg-amber-100 p-3 rounded">
              <p className="text-sm text-amber-800">
                <strong>Key Finding:</strong> July shows a dramatic reversal of the 2025 cat-majority trend. 
                Dogs represented 64.9% of adoptions vs the normal 47.9% (Jan-Jun average). 
                This is the highest dog percentage since early 2024.
              </p>
            </div>
          </div>
        </div>
      </div> */}

      {/* Quick Actions */}
      {/* <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions Needed</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold text-gray-900 mb-2">Investigate July Dog Surge</h4>
            <p className="text-sm text-gray-700">Analyze what drove the 17-point swing toward dogs. Seasonal? Program change? Market shift?</p>
          </div>
          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold text-gray-900 mb-2">SC Capacity Management</h4>
            <p className="text-sm text-gray-700">SC animals in care up 8.1%. Monitor capacity and consider transfer protocols if needed.</p>
          </div>
          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold text-gray-900 mb-2">August Strategy</h4>
            <p className="text-sm text-gray-700">Build on July's success (259 adoptions) while monitoring species balance trends.</p>
          </div>
        </div>
      </div> */}

      {/* 2025 Monthly Cats vs Dogs Chart */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">2025 Monthly Cats vs Dogs: The July Dogs Surge  </h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Species Distribution Throughout 2025</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={monthly2025CatsVsDogs}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" label={{ value: 'Number of Adoptions', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: 'Percentage (%)', angle: 90, position: 'insideRight' }} />
              <Tooltip 
                formatter={(value, name, props) => {
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
              <li> <strong>Consistent cat majority:</strong> 51-52% cats across Jan-Jun</li>
              <li> <strong>Stable dog percentage:</strong> Dogs hovered around 47-48%</li>
              <li> <strong>Peak performance:</strong> June hit 303 total adoptions</li>
              <li> <strong>Predictable trend:</strong> 2025 looked like the "Year of the Cat"</li>
            </ul>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-red-900 mb-3">July's Dramatic Shift</h4>
            <ul className="text-sm text-red-800 space-y-2">
              <li> <strong>Dogs surge to 64.9%:</strong> +17 point jump from June's 47.9%</li>
              <li> <strong>Cats drop to 35.1%:</strong> Lowest percentage all year</li>
              <li> <strong>168 vs 91:</strong> Nearly 2:1 dog-to-cat ratio</li>
              <li> <strong>Breaking the pattern:</strong> Highest dog month since early 2024</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;