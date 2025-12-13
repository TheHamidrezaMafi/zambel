'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { fetchPriceHistoryNew, fetchPriceComparison } from '@/services/priceHistory';
import {
  PriceHistoryResponse,
  PriceComparisonResponse,
} from '@/types/flight-api.types';
import { ConvertRialToToman } from '@/helper/rilaToToman';
import moment from 'moment-jalaali';
import { IoClose, IoTrendingDown, IoTrendingUp, IoStatsChart, IoAlertCircle } from 'react-icons/io5';
import { MdHistory, MdShowChart, MdCompare } from 'react-icons/md';

interface PriceHistoryChartNewProps {
  baseFlightId: string;
  onClose?: () => void;
  compact?: boolean;
  hoursBack?: number;
}

interface ChartDataPoint {
  time: string;
  timestamp: number;
  [key: string]: number | string; // Dynamic keys for provider prices
}

const PROVIDER_COLORS: { [key: string]: string } = {
  alibaba: '#3b82f6',
  mrbilit: '#10b981',
  safarmarket: '#f59e0b',
  safar366: '#ef4444',
  flytoday: '#8b5cf6',
  pateh: '#ec4899',
};

const PriceHistoryChartNew = ({
  baseFlightId,
  onClose,
  compact = false,
  hoursBack = 168, // Default: 7 days
}: PriceHistoryChartNewProps) => {
  const [historyData, setHistoryData] = useState<PriceHistoryResponse | null>(null);
  const [comparisonData, setComparisonData] = useState<PriceComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [history, comparison] = await Promise.all([
          fetchPriceHistoryNew(baseFlightId, hoursBack),
          fetchPriceComparison(baseFlightId),
        ]);

        if (!history) {
          setError('تاریخچه قیمت یافت نشد');
          setLoading(false);
          return;
        }

        setHistoryData(history);
        setComparisonData(comparison);

        // Transform data for recharts
        const dataByTime: { [key: string]: ChartDataPoint } = {};
        const providerSet = new Set<string>();

        history.history.forEach((point) => {
          const timeKey = point.scraped_at;
          providerSet.add(point.provider_source);

          if (!dataByTime[timeKey]) {
            dataByTime[timeKey] = {
              time: moment(point.scraped_at).format('jMM/jDD HH:mm'),
              timestamp: new Date(point.scraped_at).getTime(),
            };
          }

          // Convert to Toman
          dataByTime[timeKey][point.provider_source] = ConvertRialToToman(point.adult_total_fare);
        });

        // Sort by timestamp
        const sortedData = Object.values(dataByTime).sort((a, b) => a.timestamp - b.timestamp);
        setChartData(sortedData);
        setProviders(Array.from(providerSet));

        setLoading(false);
      } catch (err) {
        console.error('Error loading price history:', err);
        setError('خطا در بارگذاری اطلاعات');
        setLoading(false);
      }
    };

    loadData();
  }, [baseFlightId, hoursBack]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="glass-strong rounded-lg shadow-2xl p-3 border border-primary/30">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3 mb-1">
            <span className="text-xs font-medium" style={{ color: entry.color }}>
              {entry.name}:
            </span>
            <span className="text-sm font-bold" style={{ color: entry.color }}>
              {entry.value.toLocaleString('fa-IR')} تومان
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`${compact ? 'h-24' : 'h-96'} flex items-center justify-center glass-strong rounded-xl`}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error || !historyData) {
    return (
      <div className={`${compact ? 'h-24' : 'h-96'} flex items-center justify-center glass-strong rounded-xl`}>
        <div className="text-center">
          <IoAlertCircle className="w-12 h-12 mx-auto mb-2 text-destructive opacity-50" />
          <p className="text-sm text-muted-foreground">{error || 'خطا در بارگذاری'}</p>
        </div>
      </div>
    );
  }

  if (!historyData.history || historyData.history.length === 0) {
    return (
      <div className={`${compact ? 'h-24' : 'h-96'} flex items-center justify-center glass-strong rounded-xl`}>
        <div className="text-center">
          <MdHistory className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">تاریخچه قیمت یافت نشد</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-strong rounded-xl ${compact ? 'p-3' : 'p-6'} relative`}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MdShowChart className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">تاریخچه قیمت پرواز</h3>
            <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded">
              {historyData.flight_number}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary/80 rounded-lg transition-colors"
            >
              <IoClose className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Statistics & Insights */}
      {!compact && historyData.insights && (
        <div className="mb-6">
          {/* Price Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="glass-strong rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">قیمت فعلی</p>
              <p className="text-lg font-bold text-foreground">
                {ConvertRialToToman(historyData.insights.current_price).toLocaleString('fa-IR')}
                <span className="text-xs font-normal mr-1">تومان</span>
              </p>
            </div>
            <div className="glass-strong rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">کمترین قیمت</p>
              <p className="text-lg font-bold text-green-500 flex items-center gap-1">
                <IoTrendingDown className="w-4 h-4" />
                {ConvertRialToToman(historyData.insights.overall_min).toLocaleString('fa-IR')}
                <span className="text-xs font-normal">تومان</span>
              </p>
            </div>
            <div className="glass-strong rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">بیشترین قیمت</p>
              <p className="text-lg font-bold text-red-500 flex items-center gap-1">
                <IoTrendingUp className="w-4 h-4" />
                {ConvertRialToToman(historyData.insights.overall_max).toLocaleString('fa-IR')}
                <span className="text-xs font-normal">تومان</span>
              </p>
            </div>
            <div className="glass-strong rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">میانگین قیمت</p>
              <p className="text-lg font-bold text-foreground flex items-center gap-1">
                <IoStatsChart className="w-4 h-4" />
                {ConvertRialToToman(historyData.insights.overall_avg).toLocaleString('fa-IR')}
                <span className="text-xs font-normal">تومان</span>
              </p>
            </div>
          </div>

          {/* Trend & Recommendation */}
          <div className="glass-strong rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">روند:</span>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded ${
                    historyData.insights.trend === 'increasing'
                      ? 'bg-red-500/20 text-red-500'
                      : historyData.insights.trend === 'decreasing'
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-blue-500/20 text-blue-500'
                  }`}
                >
                  {historyData.insights.trend === 'increasing'
                    ? 'صعودی'
                    : historyData.insights.trend === 'decreasing'
                    ? 'نزولی'
                    : 'باثبات'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">نوسان:</span>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded ${
                    historyData.insights.volatility === 'high'
                      ? 'bg-red-500/20 text-red-500'
                      : historyData.insights.volatility === 'moderate'
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : 'bg-green-500/20 text-green-500'
                  }`}
                >
                  {historyData.insights.volatility === 'high'
                    ? 'زیاد'
                    : historyData.insights.volatility === 'moderate'
                    ? 'متوسط'
                    : 'کم'}
                </span>
              </div>
              <div className="flex-1 text-sm text-foreground">
                <span className="text-muted-foreground">توصیه:</span> {historyData.insights.recommendation}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider Comparison */}
      {!compact && comparisonData && comparisonData.providers && comparisonData.providers.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MdCompare className="w-5 h-5 text-primary" />
            <h4 className="text-sm font-bold text-foreground">مقایسه قیمت تامین‌کنندگان</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {comparisonData.providers.map((provider) => (
              <div
                key={provider.provider_source}
                className={`glass-strong rounded-lg p-3 border-2 ${
                  comparisonData.best_deal?.provider_source === provider.provider_source
                    ? 'border-green-500'
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">{provider.provider_source}</span>
                  {comparisonData.best_deal?.provider_source === provider.provider_source && (
                    <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">بهترین</span>
                  )}
                </div>
                <p className="text-lg font-bold text-foreground">
                  {ConvertRialToToman(provider.adult_total_fare).toLocaleString('fa-IR')}
                  <span className="text-xs font-normal mr-1">تومان</span>
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>ظرفیت: {provider.capacity}</span>
                  <span>•</span>
                  <span>{provider.age_minutes} دقیقه پیش</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className={compact ? 'h-32' : 'h-96'}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#64748b', fontSize: 11 }}
              stroke="#94a3b8"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              stroke="#94a3b8"
              tickFormatter={(value) => value.toLocaleString('fa-IR')}
            />
            <Tooltip content={<CustomTooltip />} />
            {!compact && <Legend wrapperStyle={{ fontSize: '12px' }} />}
            
            {/* Draw average line */}
            {historyData.insights && (
              <ReferenceLine
                y={ConvertRialToToman(historyData.insights.overall_avg)}
                stroke="#8b5cf6"
                strokeDasharray="5 5"
                label={{
                  value: 'میانگین',
                  fill: '#8b5cf6',
                  fontSize: 11,
                  position: 'right',
                }}
              />
            )}

            {/* Draw lines for each provider */}
            {providers.map((provider) => (
              <Line
                key={provider}
                type="monotone"
                dataKey={provider}
                name={provider}
                stroke={PROVIDER_COLORS[provider] || '#6366f1'}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline Info */}
      {!compact && historyData.history.length > 0 && (
        <div className="mt-4 flex justify-between text-xs text-muted-foreground">
          <div>
            <div className="font-medium">از تاریخ</div>
            <div>{moment(historyData.history[0].scraped_at).format('jYYYY/jMM/jDD HH:mm')}</div>
          </div>
          <div className="text-left">
            <div className="font-medium">تا تاریخ</div>
            <div>
              {moment(historyData.history[historyData.history.length - 1].scraped_at).format(
                'jYYYY/jMM/jDD HH:mm'
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceHistoryChartNew;
