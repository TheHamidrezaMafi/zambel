'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchFlightPriceHistory, FlightPriceHistory, fetchLowestPriceHistory } from '@/services/priceHistory';
import { ConvertRialToToman } from '@/helper/rilaToToman';
import moment from 'moment-jalaali';
import { IoClose, IoTrendingDown, IoTrendingUp, IoStatsChart } from 'react-icons/io5';
import { MdHistory, MdShowChart } from 'react-icons/md';

interface PriceHistoryChartProps {
  flightNumber: string;
  date: string;
  origin: string;
  destination: string;
  onClose?: () => void;
  compact?: boolean;
}

interface TooltipData {
  x: number;
  y: number;
  price: number;
  time: string;
  provider?: string;
  visible: boolean;
}

const PriceHistoryChart = ({
  flightNumber,
  date,
  origin,
  destination,
  onClose,
  compact = false,
}: PriceHistoryChartProps) => {
  const [data, setData] = useState<FlightPriceHistory | null>(null);
  const [lowestPriceData, setLowestPriceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'lowest'>('all');
  const [tooltip, setTooltip] = useState<TooltipData>({ x: 0, y: 0, price: 0, time: '', visible: false });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [historyData, lowestData] = await Promise.all([
        fetchFlightPriceHistory(flightNumber, date, origin, destination),
        fetchLowestPriceHistory(flightNumber, date, origin, destination),
      ]);
      setData(historyData);
      setLowestPriceData(lowestData);
      setLoading(false);
    };

    loadData();
  }, [flightNumber, date, origin, destination]);

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    const displayData = viewMode === 'lowest' && lowestPriceData?.history
      ? lowestPriceData.history
      : data.price_history;

    if (!displayData || displayData.length === 0) return;

    // Data comes from backend in ascending chronological order (oldest first)
    // So we use it directly without reversing
    const chartData = displayData;

    // Prepare data
    const prices = chartData.map((point: any) => 
      viewMode === 'lowest' ? point.lowest_price : point.adult_price
    );
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Chart dimensions with more left padding for price labels
    const paddingTop = compact ? 10 : 20;
    const paddingBottom = compact ? 10 : 50; // More space for time labels
    const paddingLeft = compact ? 50 : 80; // More space for price labels
    const paddingRight = compact ? 10 : 20;
    const chartWidth = rect.width - paddingLeft - paddingRight;
    const chartHeight = rect.height - paddingTop - paddingBottom;

    // Draw grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = paddingTop + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(rect.width - paddingRight, y);
      ctx.stroke();
    }

    // Draw price line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    chartData.forEach((point: any, index: number) => {
      const price = viewMode === 'lowest' ? point.lowest_price : point.adult_price;
      const x = paddingLeft + (chartWidth / (chartData.length - 1 || 1)) * index;
      const y = paddingTop + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw gradient fill
    ctx.lineTo(rect.width - paddingRight, paddingTop + chartHeight);
    ctx.lineTo(paddingLeft, paddingTop + chartHeight);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw points
    chartData.forEach((point: any, index: number) => {
      const price = viewMode === 'lowest' ? point.lowest_price : point.adult_price;
      const x = paddingLeft + (chartWidth / (chartData.length - 1 || 1)) * index;
      const y = paddingTop + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw labels (only if not compact)
    if (!compact) {
      // Draw price labels on Y axis
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';

      for (let i = 0; i <= 5; i++) {
        const price = minPrice + (priceRange / 5) * (5 - i);
        const y = paddingTop + (chartHeight / 5) * i;
        const priceText = ConvertRialToToman(price).toLocaleString('fa-IR');
        ctx.fillText(priceText, paddingLeft - 10, y + 4);
      }

      // Draw time labels on X axis (show up to 5 time points)
      ctx.textAlign = 'center';
      const numTimeLabels = Math.min(5, chartData.length);
      const timeStep = Math.max(1, Math.floor((chartData.length - 1) / (numTimeLabels - 1)));
      
      for (let i = 0; i < numTimeLabels; i++) {
        const dataIndex = i === numTimeLabels - 1 ? chartData.length - 1 : i * timeStep;
        const point = chartData[dataIndex];
        const x = paddingLeft + (chartWidth / (chartData.length - 1 || 1)) * dataIndex;
        const y = paddingTop + chartHeight + 15;
        
        // Format time: show date and time
        const timeText = moment(point.scraped_at).format('jMM/jDD');
        const hourText = moment(point.scraped_at).format('HH:mm');
        
        ctx.fillText(timeText, x, y);
        ctx.fillText(hourText, x, y + 14);
      }
    }
  }, [data, lowestPriceData, viewMode, compact]);

  // Handle mouse move for tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!data || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const displayData = viewMode === 'lowest' && lowestPriceData?.history
      ? lowestPriceData.history
      : data.price_history;

    if (!displayData || displayData.length === 0) return;

    // Data comes from backend in ascending chronological order (oldest first)
    const chartData = displayData;

    const prices = chartData.map((point: any) => 
      viewMode === 'lowest' ? point.lowest_price : point.adult_price
    );
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const paddingTop = compact ? 10 : 20;
    const paddingBottom = compact ? 10 : 50;
    const paddingLeft = compact ? 50 : 80;
    const paddingRight = compact ? 10 : 20;
    const chartWidth = rect.width - paddingLeft - paddingRight;
    const chartHeight = rect.height - paddingTop - paddingBottom;

    // Check if mouse is near any data point
    let nearestPoint = null;
    let minDistance = Infinity;

    chartData.forEach((point: any, index: number) => {
      const price = viewMode === 'lowest' ? point.lowest_price : point.adult_price;
      const x = paddingLeft + (chartWidth / (chartData.length - 1 || 1)) * index;
      const y = paddingTop + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

      const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));

      if (distance < 15 && distance < minDistance && containerRef.current) {
        minDistance = distance;
        nearestPoint = {
          x: e.clientX - containerRef.current.getBoundingClientRect().left,
          y: e.clientY - containerRef.current.getBoundingClientRect().top,
          price,
          time: moment(point.scraped_at).format('jYYYY/jMM/jDD HH:mm'),
          provider: point.provider,
          visible: true,
        };
      }
    });

    if (nearestPoint) {
      setTooltip(nearestPoint);
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
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

  if (!data || !data.price_history || data.price_history.length === 0) {
    return (
      <div className={`${compact ? 'h-24' : 'h-64'} flex items-center justify-center glass-strong rounded-xl`}>
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
          </div>
          <div className="flex items-center gap-2">
            {lowestPriceData?.history && (
              <div className="flex gap-1 glass-strong rounded-lg p-1">
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  همه تامین‌کنندگان
                </button>
                <button
                  onClick={() => setViewMode('lowest')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'lowest'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  کمترین قیمت
                </button>
              </div>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary/80 rounded-lg transition-colors"
              >
                <IoClose className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Statistics */}
      {!compact && data.statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="glass-strong rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">قیمت فعلی</p>
            <p className="text-lg font-bold text-foreground">
              {ConvertRialToToman(data.statistics.current_price).toLocaleString('fa-IR')}
              <span className="text-xs font-normal mr-1">تومان</span>
            </p>
          </div>
          <div className="glass-strong rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">کمترین قیمت</p>
            <p className="text-lg font-bold text-green-500 flex items-center gap-1">
              <IoTrendingDown className="w-4 h-4" />
              {ConvertRialToToman(data.statistics.lowest_price).toLocaleString('fa-IR')}
              <span className="text-xs font-normal">تومان</span>
            </p>
          </div>
          <div className="glass-strong rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">بیشترین قیمت</p>
            <p className="text-lg font-bold text-red-500 flex items-center gap-1">
              <IoTrendingUp className="w-4 h-4" />
              {ConvertRialToToman(data.statistics.highest_price).toLocaleString('fa-IR')}
              <span className="text-xs font-normal">تومان</span>
            </p>
          </div>
          <div className="glass-strong rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">میانگین قیمت</p>
            <p className="text-lg font-bold text-foreground flex items-center gap-1">
              <IoStatsChart className="w-4 h-4" />
              {ConvertRialToToman(data.statistics.average_price).toLocaleString('fa-IR')}
              <span className="text-xs font-normal">تومان</span>
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div ref={containerRef} className={`relative ${compact ? 'h-20' : 'h-64'}`}>
        <canvas 
          ref={canvasRef} 
          className="w-full h-full cursor-crosshair" 
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        
        {/* Tooltip */}
        {tooltip.visible && (
          <div 
            className="absolute z-50 pointer-events-none"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y - 80}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="glass-strong rounded-lg shadow-2xl p-3 min-w-[180px] border border-primary/30">
              <div className="text-xs text-muted-foreground mb-1">{tooltip.time}</div>
              <div className="text-lg font-bold text-primary">
                {ConvertRialToToman(tooltip.price).toLocaleString('fa-IR')} تومان
              </div>
              {tooltip.provider && (
                <div className="text-xs text-muted-foreground mt-1">
                  تامین‌کننده: {tooltip.provider}
                </div>
              )}
              {/* Arrow */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent"
                style={{ borderTopColor: 'rgba(30, 41, 59, 0.95)' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Timeline - Oldest on left, newest on right */}
      {!compact && data.price_history && data.price_history.length > 0 && (
        <div className="mt-4 flex justify-between text-xs text-muted-foreground px-2">
          <div className="text-right">
            <div className="font-medium">قدیمی‌ترین</div>
            <div>{moment(data.price_history[0]?.scraped_at).format('jYYYY/jMM/jDD HH:mm')}</div>
          </div>
          <div className="text-left">
            <div className="font-medium">جدیدترین</div>
            <div>{moment(data.price_history[data.price_history.length - 1]?.scraped_at).format('jYYYY/jMM/jDD HH:mm')}</div>
          </div>
        </div>
      )}

      {/* Data Points (only if not compact) */}
      {!compact && (
        <div className="mt-4 max-h-40 overflow-y-auto">
          <div className="space-y-2">
            {(viewMode === 'lowest' && lowestPriceData?.history
              ? lowestPriceData.history
              : data.price_history
            )
              .slice()
              .reverse()
              .map((point: any, index: number) => {
                const price = viewMode === 'lowest' ? point.lowest_price : point.adult_price;
                const provider = point.provider;
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 glass-strong rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm text-foreground">
                        {moment(point.scraped_at).format('jYYYY/jMM/jDD HH:mm')}
                      </span>
                      {provider && (
                        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded">
                          {provider}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {ConvertRialToToman(price).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceHistoryChart;
