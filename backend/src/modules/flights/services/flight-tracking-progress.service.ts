import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface RouteProgress {
  routeId: number;
  origin: string;
  destination: string;
  totalDays: number;
  completedDays: number;
  currentDay: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  flightsFound: number;
  flightsSaved: number;
  errors: string[];
}

export interface TrackingProgress {
  sessionId: string;
  totalRoutes: number;
  completedRoutes: number;
  currentRoute: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  routes: Map<string, RouteProgress>;
}

/**
 * Service to track and display progress of automated flight tracking
 */
@Injectable()
export class FlightTrackingProgressService {
  private readonly logger = new Logger(FlightTrackingProgressService.name);
  private currentSession: TrackingProgress | null = null;

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Start a new tracking session
   */
  startSession(routes: Array<{ id: number; origin: string; destination: string; daysAhead: number }>): string {
    const sessionId = `session_${Date.now()}`;
    
    this.currentSession = {
      sessionId,
      totalRoutes: routes.length,
      completedRoutes: 0,
      currentRoute: 0,
      status: 'running',
      startTime: new Date(),
      routes: new Map(),
    };

    // Initialize route progress
    routes.forEach((route, index) => {
      const routeKey = `${route.origin}_${route.destination}`;
      this.currentSession.routes.set(routeKey, {
        routeId: route.id,
        origin: route.origin,
        destination: route.destination,
        totalDays: route.daysAhead,
        completedDays: 0,
        currentDay: 0,
        status: 'pending',
        flightsFound: 0,
        flightsSaved: 0,
        errors: [],
      });
    });

    this.logger.log(`Started tracking session: ${sessionId} with ${routes.length} routes`);
    this.emitProgressUpdate();
    
    return sessionId;
  }

  /**
   * Update route progress
   */
  startRoute(origin: string, destination: string): void {
    if (!this.currentSession) return;

    const routeKey = `${origin}_${destination}`;
    const routeProgress = this.currentSession.routes.get(routeKey);
    
    if (routeProgress) {
      routeProgress.status = 'in-progress';
      routeProgress.startTime = new Date();
      routeProgress.currentDay = 0;
      routeProgress.completedDays = 0;
      
      this.currentSession.currentRoute++;
      
      this.logger.log(
        `📍 Route [${this.currentSession.currentRoute}/${this.currentSession.totalRoutes}]: ${origin} → ${destination}`
      );
      
      this.emitProgressUpdate();
    }
  }

  /**
   * Update day progress within a route
   */
  startDay(origin: string, destination: string, dayOffset: number, date: string): void {
    if (!this.currentSession) return;

    const routeKey = `${origin}_${destination}`;
    const routeProgress = this.currentSession.routes.get(routeKey);
    
    if (routeProgress) {
      routeProgress.currentDay = dayOffset + 1;
      
      this.logger.log(
        `  📅 Day [${routeProgress.currentDay}/${routeProgress.totalDays}]: ${date}`
      );
      
      this.emitProgressUpdate();
    }
  }

  /**
   * Mark day as completed
   */
  completeDay(origin: string, destination: string, dayOffset: number, flightsFound: number, flightsSaved: number): void {
    if (!this.currentSession) return;

    const routeKey = `${origin}_${destination}`;
    const routeProgress = this.currentSession.routes.get(routeKey);
    
    if (routeProgress) {
      routeProgress.completedDays++;
      routeProgress.flightsFound += flightsFound;
      routeProgress.flightsSaved += flightsSaved;
      
      // Calculate progress percentage
      const dayProgress = ((routeProgress.completedDays / routeProgress.totalDays) * 100).toFixed(1);
      const progressBar = this.generateProgressBar(routeProgress.completedDays, routeProgress.totalDays, 20);
      
      this.logger.log(
        `    ✅ [${progressBar}] ${dayProgress}% - Found: ${flightsFound}, Saved: ${flightsSaved}`
      );
      
      this.emitProgressUpdate();
    }
  }

  /**
   * Add error to day tracking
   */
  addDayError(origin: string, destination: string, dayOffset: number, date: string, error: string): void {
    if (!this.currentSession) return;

    const routeKey = `${origin}_${destination}`;
    const routeProgress = this.currentSession.routes.get(routeKey);
    
    if (routeProgress) {
      routeProgress.errors.push(`Day ${dayOffset + 1} (${date}): ${error}`);
      routeProgress.completedDays++;
      
      this.logger.error(`    ❌ Error on ${date}: ${error}`);
      
      this.emitProgressUpdate();
    }
  }

  /**
   * Complete a route
   */
  completeRoute(origin: string, destination: string): void {
    if (!this.currentSession) return;

    const routeKey = `${origin}_${destination}`;
    const routeProgress = this.currentSession.routes.get(routeKey);
    
    if (routeProgress) {
      routeProgress.status = 'completed';
      routeProgress.endTime = new Date();
      this.currentSession.completedRoutes++;
      
      const duration = routeProgress.endTime.getTime() - routeProgress.startTime!.getTime();
      const durationSec = (duration / 1000).toFixed(1);
      
      const overallProgress = ((this.currentSession.completedRoutes / this.currentSession.totalRoutes) * 100).toFixed(1);
      const overallBar = this.generateProgressBar(
        this.currentSession.completedRoutes,
        this.currentSession.totalRoutes,
        30
      );
      
      this.logger.log(
        `✓ Completed ${origin} → ${destination} in ${durationSec}s (${routeProgress.flightsFound} flights found, ${routeProgress.flightsSaved} saved)`
      );
      
      this.logger.log(
        `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📊 Overall Progress: [${overallBar}] ${overallProgress}%\n` +
        `   Routes: ${this.currentSession.completedRoutes}/${this.currentSession.totalRoutes}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      );
      
      this.emitProgressUpdate();
    }
  }

  /**
   * Mark route as failed
   */
  failRoute(origin: string, destination: string, error: string): void {
    if (!this.currentSession) return;

    const routeKey = `${origin}_${destination}`;
    const routeProgress = this.currentSession.routes.get(routeKey);
    
    if (routeProgress) {
      routeProgress.status = 'failed';
      routeProgress.endTime = new Date();
      routeProgress.errors.push(`Route failed: ${error}`);
      this.currentSession.completedRoutes++;
      
      this.logger.error(`✗ Failed ${origin} → ${destination}: ${error}`);
      
      this.emitProgressUpdate();
    }
  }

  /**
   * Complete the entire session
   */
  completeSession(): void {
    if (!this.currentSession) return;

    this.currentSession.status = 'completed';
    this.currentSession.endTime = new Date();
    
    const duration = this.currentSession.endTime.getTime() - this.currentSession.startTime!.getTime();
    const durationMin = (duration / 60000).toFixed(1);
    
    // Calculate statistics
    let totalFlightsFound = 0;
    let totalFlightsSaved = 0;
    let totalErrors = 0;
    let successfulRoutes = 0;
    
    this.currentSession.routes.forEach((route) => {
      totalFlightsFound += route.flightsFound;
      totalFlightsSaved += route.flightsSaved;
      totalErrors += route.errors.length;
      if (route.status === 'completed') successfulRoutes++;
    });
    
    this.logger.log(
      `\n${'═'.repeat(60)}\n` +
      `🎉 TRACKING SESSION COMPLETED\n` +
      `${'═'.repeat(60)}\n` +
      `Session ID: ${this.currentSession.sessionId}\n` +
      `Duration: ${durationMin} minutes\n` +
      `Routes: ${successfulRoutes}/${this.currentSession.totalRoutes} successful\n` +
      `Flights Found: ${totalFlightsFound}\n` +
      `Flights Saved: ${totalFlightsSaved}\n` +
      `Errors: ${totalErrors}\n` +
      `${'═'.repeat(60)}\n`
    );
    
    this.emitProgressUpdate();
    
    // Keep session for 5 minutes for status queries
    setTimeout(() => {
      this.currentSession = null;
    }, 300000);
  }

  /**
   * Get current progress
   */
  getCurrentProgress(): TrackingProgress | null {
    return this.currentSession;
  }

  /**
   * Get progress summary
   */
  getProgressSummary() {
    if (!this.currentSession) {
      return { status: 'idle', message: 'No tracking session active' };
    }

    const routes = Array.from(this.currentSession.routes.values());
    
    return {
      sessionId: this.currentSession.sessionId,
      status: this.currentSession.status,
      overallProgress: {
        totalRoutes: this.currentSession.totalRoutes,
        completedRoutes: this.currentSession.completedRoutes,
        currentRoute: this.currentSession.currentRoute,
        percentage: ((this.currentSession.completedRoutes / this.currentSession.totalRoutes) * 100).toFixed(1),
      },
      routes: routes.map(route => ({
        route: `${route.origin} → ${route.destination}`,
        status: route.status,
        progress: {
          totalDays: route.totalDays,
          completedDays: route.completedDays,
          currentDay: route.currentDay,
          percentage: ((route.completedDays / route.totalDays) * 100).toFixed(1),
        },
        stats: {
          flightsFound: route.flightsFound,
          flightsSaved: route.flightsSaved,
          errors: route.errors.length,
        },
      })),
      startTime: this.currentSession.startTime,
      endTime: this.currentSession.endTime,
    };
  }

  /**
   * Generate a progress bar string
   */
  private generateProgressBar(current: number, total: number, length: number = 20): string {
    const filled = Math.floor((current / total) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * Emit progress update event
   */
  private emitProgressUpdate(): void {
    if (this.currentSession) {
      this.eventEmitter.emit('flight.tracking.progress', this.getProgressSummary());
    }
  }
}
