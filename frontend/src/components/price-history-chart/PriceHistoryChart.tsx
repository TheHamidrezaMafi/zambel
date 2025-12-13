'use client';

import { useEffect, useState } from 'react';
import { ConvertRialToToman } from '@/helper/rilaToToman';
import { IoStatsChart } from 'react-icons/io5';
import { MdShowChart, MdHistory } from 'react-icons/md';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceHistoryChartProps {
  flightNumber: string;
  date: string;
  origin: string;
  destination: string;
  onClose?: () => void;
  compact?: boolean;
}

interface PriceDataPoint {
  timestamp: string;
  price: number;
  available_seats: number;
  is_available: boolean;
}

interface ProviderData {
  provider: string;
  data_points: PriceDataPoint[];
  statistics: {
    min_price: number;
    max_price: number;
    avg_price: number;
    current_price: number;
    first_price: number;
    price_change: number;
    price_change_percentage: number;
    total_snapshots: number;
    latest_update: string;
  };
}

interface PriceHistoryData {
  flight_info: {
    flight_number: string;
    flight_date: string;
    origin: string;
    destination: string;
    airline_name_fa: string;
    airline_name_en: string;
    departure_time: string;
    arrival_time: string;
  };
  overall_statistics: {
    min_price: number;
    max_price: number;
    avg_price: number;
    total_snapshots: number;
    first_tracked: string;
    last_tracked: string;
    current_lowest_price: number;
    current_lowest_provider: string;
  };
  providers: ProviderData[];
}

const providerColors: Record<string, string> = {
  alibaba: '#FF6384',
  flytoday: '#36A2EB',
  mrbilit: '#FFCE56',
  safar366: '#4BC0C0',
  safarmarket: '#9966FF',
  pateh: '#FF9F40',
};

const PriceHistoryChart = ({
  flightNumber,
  date,
  origin,
  destination,
  onClose,
  compact = false,
}: PriceHistoryChartProps) => {
  const [data, setData] = useState<PriceHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE}/flight-tracking/price-history/${flightNumber}/${date}/${origin}/${destination}`
        );

        if (!response.ok) {
          throw new Error('اطلاعاتی یافت نشد');
        }

        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'خطا در دریافت اطلاعات');
        console.error('Error fetching price history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [flightNumber, date, origin, destination, API_BASE]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('fa-IR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getChartData = () => {
    if (!data) return null;

    // Create a unified timeline from all providers
    const allTimestamps = new Set<string>();
    data.providers.forEach(provider => {
      provider.data_points.forEach(point => {
        allTimestamps.add(point.timestamp);
      });
    });

    const sortedTimestamps = Array.from(allTimestamps).sort();
    const labels = sortedTimestamps.map(formatDate);

    const datasets = data.providers.map((provider, index) => {
      const providerName = provider.provider.toLowerCase();
      const color = providerColors[providerName] || `hsl(${index * 60}, 70%, 50%)`;

      // Create data array aligned with all timestamps
      const dataPoints = sortedTimestamps.map(timestamp => {
        const point = provider.data_points.find(p => p.timestamp === timestamp);
        return point ? point.price : null;
      });

      return {
        label: provider.provider,
        data: dataPoints,
        borderColor: color,
        backgroundColor: color + '20',
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: false,
        spanGaps: true,
      };
    });

    return { labels, datasets };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'IRANSans',
            size: 12,
          },
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          family: 'IRANSans',
          size: 14,
        },
        bodyFont: {
          family: 'IRANSans',
          size: 13,
        },
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            const value = context.parsed.y;
            if (value === null) return '';
            return `${context.dataset.label}: ${ConvertRialToToman(value)} تومان`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          font: {
            family: 'IRANSans',
            size: 11,
          },
          callback: function (value: any) {
            return ConvertRialToToman(value) + ' تومان';
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        ticks: {
          font: {
            family: 'IRANSans',
            size: 10,
          },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className={`${compact ? 'h-24' : 'h-64'} flex items-center justify-center glass-strong rounded-xl`}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !data.providers || data.providers.length === 0) {
    return (
      <div className={`${compact ? 'h-24' : 'h-64'} flex items-center justify-center glass-strong rounded-xl`}>
        <div className="text-center">
          <MdHistory className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">{error || 'تاریخچه قیمت یافت نشد'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            لطفاً پس از اجرای سیستم ردیابی، دوباره تلاش کنید
          </p>
        </div>
      </div>
    );
  }

  const chartData = getChartData();

  return (
    <div className={`glass-strong rounded-xl ${compact ? 'p-3' : 'p-6'}`}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MdShowChart className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">تاریخچه قیمت پرواز {flightNumber}</h3>
          </div>
        </div>
      )}

      {/* Overall Statistics */}
      {!compact && data.overall_statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">کمترین قیمت فعلی</p>
            <p className="text-lg font-bold text-green-600">
              {ConvertRialToToman(data.overall_statistics.current_lowest_price)} تومان
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.overall_statistics.current_lowest_provider}
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">میانگین قیمت</p>
            <p className="text-lg font-bold text-blue-600">
              {ConvertRialToToman(data.overall_statistics.avg_price)} تومان
            </p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">بیشترین قیمت</p>
            <p className="text-lg font-bold text-red-600">
              {ConvertRialToToman(data.overall_statistics.max_price)} تومان
            </p>
          </div>
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">تعداد بررسی</p>
            <p className="text-lg font-bold text-primary flex items-center gap-1">
              <IoStatsChart className="w-4 h-4" />
              {data.overall_statistics.total_snapshots} بار
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData && (
        <div className="bg-card rounded-lg p-4 border border-border">
          <div style={{ height: compact ? '150px' : '400px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Provider Statistics */}
      {!compact && data.providers && (
        <div className="mt-6 space-y-3">
          <h4 className="text-md font-semibold text-foreground">آمار تامین‌کنندگان</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.providers.map((provider) => (
              <div
                key={provider.provider}
                className="bg-secondary/20 rounded-lg p-4 border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-bold text-foreground">{provider.provider}</h5>
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: providerColors[provider.provider.toLowerCase()] || '#666',
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">قیمت فعلی:</span>
                    <p className="font-bold text-foreground">
                      {ConvertRialToToman(provider.statistics.current_price)} تومان
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">تغییر قیمت:</span>
                    <p
                      className={`font-bold ${
                        provider.statistics.price_change < 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {provider.statistics.price_change_percentage.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">کمترین:</span>
                    <p className="font-bold text-green-600">
                      {ConvertRialToToman(provider.statistics.min_price)} تومان
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">بیشترین:</span>
                    <p className="font-bold text-red-600">
                      {ConvertRialToToman(provider.statistics.max_price)} تومان
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceHistoryChart;
