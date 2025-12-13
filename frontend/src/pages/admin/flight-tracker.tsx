import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/common/header';
import { FaPlay, FaPause, FaStop, FaSync, FaChartLine, FaRoute, FaClock, FaHistory, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface TrackingStatus {
  isRunning: boolean;
  isPaused: boolean;
  routes: number;
  currentSessionId: string | null;
}

interface ScrapingSession {
  id: string;
  trigger_type: 'cron' | 'manual' | 'api';
  status: 'running' | 'paused' | 'completed' | 'stopped' | 'failed';
  started_at: string;
  paused_at: string | null;
  resumed_at: string | null;
  completed_at: string | null;
  total_routes: number;
  completed_routes: number;
  failed_routes: number;
  total_flights_found: number;
  total_flights_saved: number;
  total_errors: number;
  duration_seconds: number;
  pause_duration_seconds: number;
  route_details: Array<{
    route: string;
    status: string;
    flights_found: number;
    flights_saved: number;
    errors: number;
  }> | null;
  error_message: string | null;
}

interface SessionStatistics {
  total_sessions: number;
  completed_sessions: number;
  failed_sessions: number;
  stopped_sessions: number;
  total_flights_saved: number;
  avg_duration_minutes: number;
}

interface ProgressSummary {
  sessionId?: string | null;
  status: 'idle' | 'running' | 'completed' | 'error';
  message?: string;
  startTime?: Date | null;
  endTime?: Date | null;
  overallProgress?: {
    totalRoutes: number;
    completedRoutes: number;
    currentRoute: number;
    percentage: string;
  };
  routes?: Array<{
    route: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    progress: {
      totalDays: number;
      completedDays: number;
      currentDay: number;
      percentage: string;
    };
    stats: {
      flightsFound: number;
      flightsSaved: number;
      errors: number;
    };
  }>;
}

const FlightTrackerAdmin = () => {
  const [status, setStatus] = useState<TrackingStatus>({ isRunning: false, isPaused: false, routes: 0, currentSessionId: null });
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [recentSessions, setRecentSessions] = useState<ScrapingSession[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStatistics | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  // Fetch status and progress
  const fetchData = useCallback(async () => {
    try {
      const [statusRes, progressRes, sessionsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/flight-tracking/status`),
        fetch(`${API_BASE}/flight-tracking/progress`),
        fetch(`${API_BASE}/flight-tracking/sessions/recent?limit=10`),
        fetch(`${API_BASE}/flight-tracking/sessions/statistics`),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgress(progressData);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setRecentSessions(sessionsData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setSessionStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [API_BASE]);

  // Auto-refresh when running
  useEffect(() => {
    fetchData();

    if (autoRefresh && (status.isRunning || progress?.status === 'running')) {
      const interval = setInterval(fetchData, 2000); // Refresh every 2 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, status.isRunning, progress?.status, fetchData]);

  // Pause tracking
  const handlePause = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/flight-tracking/control/pause`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
        setTimeout(fetchData, 500);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'خطا در توقف موقت' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setIsLoading(false);
    }
  };

  // Resume tracking
  const handleResume = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/flight-tracking/control/resume`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
        setTimeout(fetchData, 500);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'خطا در ادامه' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setIsLoading(false);
    }
  };

  // Stop tracking
  const handleStop = async () => {
    if (!confirm('آیا از متوقف کردن کامل ردیابی مطمئن هستید؟')) return;
    
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/flight-tracking/control/stop`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'info', text: data.message });
        setTimeout(fetchData, 500);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'خطا در توقف' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setIsLoading(false);
    }
  };

  // Manual trigger
  const handleManualTrack = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/flight-tracking/track/manual`, {
        method: 'POST',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'شروع ردیابی خودکار...' });
        setTimeout(fetchData, 1000);
      } else {
        setMessage({ type: 'error', text: 'خطا در شروع ردیابی' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize system
  const handleInitialize = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/flight-tracking/init`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: `سیستم راه‌اندازی شد. ${data.routes_created} مسیر ایجاد شد.` });
        setTimeout(fetchData, 1000);
      } else {
        setMessage({ type: 'error', text: 'خطا در راه‌اندازی سیستم' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'in-progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
      case 'in-progress':
        return 'در حال اجرا';
      case 'completed':
        return 'تکمیل شد';
      case 'error':
        return 'خطا';
      case 'pending':
        return 'در انتظار';
      default:
        return 'آماده';
    }
  };

  const formatDuration = (start: Date | null | undefined, end: Date | null | undefined) => {
    if (!start) return '-';
    try {
      const endTime = end ? new Date(end) : new Date();
      const startTime = new Date(start);
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } catch (error) {
      return '-';
    }
  };

  const formatDurationSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 60) {
        return `${diffMins} دقیقه پیش`;
      } else if (diffMins < 1440) {
        return `${Math.floor(diffMins / 60)} ساعت پیش`;
      } else {
        return date.toLocaleDateString('fa-IR', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      return '-';
    }
  };

  const getSessionStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500 text-white';
      case 'paused':
        return 'bg-yellow-500 text-white';
      case 'completed':
        return 'bg-green-500 text-white';
      case 'stopped':
        return 'bg-orange-500 text-white';
      case 'failed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getSessionStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return 'در حال اجرا';
      case 'paused':
        return 'متوقف شده';
      case 'completed':
        return 'تکمیل شده';
      case 'stopped':
        return 'متوقف';
      case 'failed':
        return 'ناموفق';
      default:
        return status;
    }
  };

  const getTriggerTypeText = (type: string) => {
    switch (type) {
      case 'cron':
        return 'خودکار';
      case 'manual':
        return 'دستی';
      case 'api':
        return 'API';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            مدیریت ردیابی خودکار پروازها
          </h1>
          <p className="text-muted-foreground">
            کنترل و نظارت بر سیستم ذخیره‌سازی خودکار اطلاعات پروازها
          </p>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-700'
                : message.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-700'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Control Panel */}
        <div className="glass-strong rounded-2xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Status */}
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${
                status.isRunning 
                  ? (status.isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse')
                  : 'bg-gray-400'
              }`} />
              <div>
                <p className="text-sm text-muted-foreground">وضعیت سیستم</p>
                <p className="text-lg font-semibold text-foreground">
                  {status.isRunning 
                    ? (status.isPaused ? 'متوقف موقت' : 'در حال اجرا')
                    : 'متوقف'}
                </p>
              </div>
              <div className="h-12 w-px bg-border mx-4" />
              <div>
                <p className="text-sm text-muted-foreground">تعداد مسیرها</p>
                <p className="text-lg font-semibold text-foreground">{status.routes} مسیر</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3">
              {!status.isRunning && (
                <button
                  onClick={handleManualTrack}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <FaPlay />
                  شروع ردیابی
                </button>
              )}

              {status.isRunning && !status.isPaused && (
                <button
                  onClick={handlePause}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <FaPause />
                  توقف موقت
                </button>
              )}

              {status.isRunning && status.isPaused && (
                <button
                  onClick={handleResume}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <FaPlay />
                  ادامه
                </button>
              )}

              {status.isRunning && (
                <button
                  onClick={handleStop}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <FaStop />
                  توقف کامل
                </button>
              )}
              
              {!status.isRunning && (
                <button
                  onClick={handleInitialize}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <FaSync />
                  راه‌اندازی اولیه
                </button>
              )}

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                  autoRefresh
                    ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <FaSync className={autoRefresh ? 'animate-spin' : ''} />
                {autoRefresh ? 'بروزرسانی خودکار فعال' : 'بروزرسانی خودکار'}
              </button>

              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 text-blue-700 border border-blue-500/30 rounded-lg font-medium hover:bg-blue-500/30 transition-all"
              >
                <FaHistory />
                {showHistory ? 'پنهان کردن تاریخچه' : 'نمایش تاریخچه'}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        {progress && progress.status !== 'idle' && progress.overallProgress && (
          <div className="glass-strong rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <FaChartLine />
              پیشرفت کلی
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">مسیرهای تکمیل شده</p>
                <p className="text-2xl font-bold text-foreground">
                  {progress.overallProgress.completedRoutes} / {progress.overallProgress.totalRoutes}
                </p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress.overallProgress.percentage}%` }}
                  />
                </div>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">پروازهای یافت شده</p>
                <p className="text-2xl font-bold text-green-600">
                  {progress.routes?.reduce((sum, r) => sum + r.stats.flightsFound, 0).toLocaleString() || 0}
                </p>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">پروازهای ذخیره شده</p>
                <p className="text-2xl font-bold text-primary">
                  {progress.routes?.reduce((sum, r) => sum + r.stats.flightsSaved, 0).toLocaleString() || 0}
                </p>
              </div>
            </div>

            {/* Session Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <FaClock />
                <span>مدت زمان: {formatDuration(progress.startTime, progress.endTime)}</span>
              </div>
              <div className={`px-3 py-1 rounded-full ${getStatusColor(progress.status)} text-white`}>
                {getStatusText(progress.status)}
              </div>
              {progress.routes && progress.routes.some(r => r.stats.errors > 0) && (
                <div className="text-red-600 font-medium">
                  {progress.routes.filter(r => r.stats.errors > 0).length} مسیر با خطا
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Route Progress */}
        {progress?.routes && progress.routes.some(r => r.status === 'in-progress') && (
          <div className="glass-strong rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <FaRoute />
              مسیر در حال اجرا
            </h3>
            {progress.routes.filter(r => r.status === 'in-progress').map((route, idx) => (
              <div key={idx} className="bg-secondary/30 rounded-lg p-4 mb-3 last:mb-0">
                <p className="text-lg font-medium text-foreground mb-2">
                  {route.route}
                </p>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 animate-pulse"
                    style={{ width: `${route.progress.percentage}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {route.progress.percentage}% تکمیل شده - روز {route.progress.currentDay} از {route.progress.totalDays}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Routes List */}
        {progress && progress.routes && progress.routes.length > 0 && (
          <div className="glass-strong rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">جزئیات مسیرها</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {progress.routes.map((route, index) => (
                <div
                  key={`${route.route}-${index}`}
                  className="bg-secondary/20 rounded-lg p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(route.status)}`} />
                      <span className="font-medium text-foreground">
                        {route.route}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(route.status)} text-white`}>
                        {getStatusText(route.status)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {route.progress.completedDays} / {route.progress.totalDays} روز
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>پروازهای یافت شده: {route.stats.flightsFound}</span>
                    <span>•</span>
                    <span>ذخیره شده: {route.stats.flightsSaved}</span>
                    {route.stats.errors > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-red-600">خطاها: {route.stats.errors}</span>
                      </>
                    )}
                  </div>
                  
                  {route.progress.totalDays > 0 && (
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStatusColor(route.status)}`}
                        style={{ width: `${route.progress.percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session Statistics */}
        {showHistory && sessionStats && (
          <div className="glass-strong rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <FaChartLine />
              آمار کلی جلسات
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">کل جلسات</p>
                <p className="text-2xl font-bold text-foreground">{sessionStats.total_sessions}</p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                <p className="text-sm text-muted-foreground mb-1">تکمیل شده</p>
                <p className="text-2xl font-bold text-green-600">{sessionStats.completed_sessions}</p>
              </div>
              <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                <p className="text-sm text-muted-foreground mb-1">ناموفق</p>
                <p className="text-2xl font-bold text-red-600">{sessionStats.failed_sessions}</p>
              </div>
              <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30">
                <p className="text-sm text-muted-foreground mb-1">متوقف شده</p>
                <p className="text-2xl font-bold text-orange-600">{sessionStats.stopped_sessions}</p>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                <p className="text-sm text-muted-foreground mb-1">کل پروازهای ذخیره شده</p>
                <p className="text-2xl font-bold text-blue-600">{sessionStats.total_flights_saved.toLocaleString()}</p>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                <p className="text-sm text-muted-foreground mb-1">میانگین مدت زمان</p>
                <p className="text-2xl font-bold text-purple-600">{sessionStats.avg_duration_minutes.toFixed(1)} دقیقه</p>
              </div>
            </div>
          </div>
        )}

        {/* Session History */}
        {showHistory && recentSessions.length > 0 && (
          <div className="glass-strong rounded-2xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <FaHistory />
              تاریخچه جلسات اخیر
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-secondary/20 rounded-lg p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getSessionStatusBadge(session.status)}`} />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-1 rounded ${getSessionStatusBadge(session.status)}`}>
                            {getSessionStatusText(session.status)}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-secondary text-foreground">
                            {getTriggerTypeText(session.trigger_type)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          شروع: {formatDateTime(session.started_at)}
                        </p>
                        {session.completed_at && (
                          <p className="text-sm text-muted-foreground">
                            مدت زمان: {formatDurationSeconds(session.duration_seconds)}
                            {session.pause_duration_seconds > 0 && ` (توقف: ${formatDurationSeconds(session.pause_duration_seconds)})`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {session.completed_routes} / {session.total_routes} مسیر
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                    <div className="bg-secondary/30 rounded p-2">
                      <p className="text-xs text-muted-foreground">پروازهای یافت شده</p>
                      <p className="text-lg font-semibold text-foreground">{session.total_flights_found.toLocaleString()}</p>
                    </div>
                    <div className="bg-secondary/30 rounded p-2">
                      <p className="text-xs text-muted-foreground">ذخیره شده</p>
                      <p className="text-lg font-semibold text-green-600">{session.total_flights_saved.toLocaleString()}</p>
                    </div>
                    <div className="bg-secondary/30 rounded p-2">
                      <p className="text-xs text-muted-foreground">مسیرهای ناموفق</p>
                      <p className="text-lg font-semibold text-red-600">{session.failed_routes}</p>
                    </div>
                    <div className="bg-secondary/30 rounded p-2">
                      <p className="text-xs text-muted-foreground">خطاها</p>
                      <p className="text-lg font-semibold text-orange-600">{session.total_errors}</p>
                    </div>
                  </div>

                  {session.status === 'completed' && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <FaCheckCircle />
                      <span>جلسه با موفقیت تکمیل شد</span>
                    </div>
                  )}
                  {session.status === 'failed' && session.error_message && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <FaTimesCircle />
                      <span>خطا: {session.error_message}</span>
                    </div>
                  )}
                  {session.status === 'stopped' && (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <FaStop />
                      <span>جلسه توسط کاربر متوقف شد</span>
                    </div>
                  )}

                  {session.route_details && session.route_details.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80">
                        جزئیات مسیرها ({session.route_details.length})
                      </summary>
                      <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                        {session.route_details.map((route, idx) => (
                          <div key={idx} className="text-xs bg-secondary/20 rounded p-2 flex items-center justify-between">
                            <span className="font-medium">{route.route}</span>
                            <div className="flex items-center gap-2">
                              <span>یافت شده: {route.flights_found}</span>
                              <span>•</span>
                              <span className="text-green-600">ذخیره: {route.flights_saved}</span>
                              {route.errors > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-red-600">خطا: {route.errors}</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightTrackerAdmin;
