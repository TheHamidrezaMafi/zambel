import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScrapingSession } from '../models/scraping-session.entity';

@Injectable()
export class ScrapingSessionService implements OnModuleInit {
  private readonly logger = new Logger(ScrapingSessionService.name);
  private tableExists = false;

  constructor(
    @InjectRepository(ScrapingSession)
    private readonly sessionRepository: Repository<ScrapingSession>,
  ) {}

  /**
   * Check and create table on module initialization
   */
  async onModuleInit() {
    try {
      await this.ensureTableExists();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn('Could not ensure scraping_sessions table exists:', errorMessage);
    }
  }

  /**
   * Ensure the scraping_sessions table exists
   */
  private async ensureTableExists(): Promise<void> {
    try {
      const queryRunner = this.sessionRepository.manager.connection.createQueryRunner();
      
      // Check if table exists
      const tableExists = await queryRunner.hasTable('scraping_sessions');
      
      if (!tableExists) {
        this.logger.log('Creating scraping_sessions table...');
        
        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS scraping_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            trigger_type VARCHAR(50) DEFAULT 'manual',
            status VARCHAR(20) NOT NULL,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            paused_at TIMESTAMP NULL,
            resumed_at TIMESTAMP NULL,
            completed_at TIMESTAMP NULL,
            total_routes INT DEFAULT 0,
            completed_routes INT DEFAULT 0,
            failed_routes INT DEFAULT 0,
            total_flights_found INT DEFAULT 0,
            total_flights_saved INT DEFAULT 0,
            total_errors INT DEFAULT 0,
            route_details JSONB NULL,
            error_message TEXT NULL,
            duration_seconds INT DEFAULT 0,
            pause_duration_seconds INT DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE INDEX IF NOT EXISTS idx_scraping_sessions_status ON scraping_sessions(status);
          CREATE INDEX IF NOT EXISTS idx_scraping_sessions_started_at ON scraping_sessions(started_at);
          CREATE INDEX IF NOT EXISTS idx_scraping_sessions_trigger_type ON scraping_sessions(trigger_type);
        `);
        
        this.logger.log('✓ scraping_sessions table created successfully');
      }
      
      await queryRunner.release();
      this.tableExists = true;
    } catch (error) {
      this.logger.error('Error ensuring table exists:', error);
      throw error;
    }
  }

  /**
   * Create a new scraping session
   */
  async createSession(
    triggerType: 'cron' | 'manual' | 'api',
    totalRoutes: number,
  ): Promise<ScrapingSession> {
    const session = this.sessionRepository.create({
      trigger_type: triggerType,
      status: 'running',
      started_at: new Date(),
      total_routes: totalRoutes,
      completed_routes: 0,
      failed_routes: 0,
      total_flights_found: 0,
      total_flights_saved: 0,
      total_errors: 0,
      duration_seconds: 0,
      pause_duration_seconds: 0,
      route_details: [],
    });

    return await this.sessionRepository.save(session);
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string,
    status: 'running' | 'paused' | 'completed' | 'stopped' | 'failed',
    errorMessage?: string,
  ): Promise<void> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) return;

    session.status = status;
    
    if (status === 'paused') {
      session.paused_at = new Date();
      // Calculate active duration up to pause
      if (session.started_at) {
        const activeTime = Math.floor((new Date().getTime() - new Date(session.started_at).getTime()) / 1000);
        session.duration_seconds = activeTime - session.pause_duration_seconds;
      }
    } else if (status === 'running' && session.paused_at) {
      session.resumed_at = new Date();
      // Calculate pause duration
      const pauseTime = Math.floor((new Date().getTime() - new Date(session.paused_at).getTime()) / 1000);
      session.pause_duration_seconds += pauseTime;
      session.paused_at = null;
    } else if (status === 'completed' || status === 'stopped' || status === 'failed') {
      session.completed_at = new Date();
      // Calculate final duration
      if (session.started_at) {
        const totalTime = Math.floor((new Date().getTime() - new Date(session.started_at).getTime()) / 1000);
        session.duration_seconds = totalTime - session.pause_duration_seconds;
      }
    }

    if (errorMessage) {
      session.error_message = errorMessage;
    }

    await this.sessionRepository.save(session);
  }

  /**
   * Update session progress
   */
  async updateSessionProgress(
    sessionId: string,
    updates: {
      completed_routes?: number;
      failed_routes?: number;
      total_flights_found?: number;
      total_flights_saved?: number;
      total_errors?: number;
      route_details?: any[];
    },
  ): Promise<void> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) return;

    if (updates.completed_routes !== undefined) {
      session.completed_routes = updates.completed_routes;
    }
    if (updates.failed_routes !== undefined) {
      session.failed_routes = updates.failed_routes;
    }
    if (updates.total_flights_found !== undefined) {
      session.total_flights_found = updates.total_flights_found;
    }
    if (updates.total_flights_saved !== undefined) {
      session.total_flights_saved = updates.total_flights_saved;
    }
    if (updates.total_errors !== undefined) {
      session.total_errors = updates.total_errors;
    }
    if (updates.route_details) {
      session.route_details = updates.route_details;
    }

    await this.sessionRepository.save(session);
  }

  /**
   * Get current active session
   */
  async getActiveSession(): Promise<ScrapingSession | null> {
    return await this.sessionRepository.findOne({
      where: [
        { status: 'running' },
        { status: 'paused' },
      ],
      order: { started_at: 'DESC' },
    });
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ScrapingSession | null> {
    return await this.sessionRepository.findOne({ where: { id: sessionId } });
  }

  /**
   * Get session history with pagination
   */
  async getSessionHistory(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ sessions: ScrapingSession[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    
    const [sessions, total] = await this.sessionRepository.findAndCount({
      order: { started_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      sessions,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get recent sessions
   */
  async getRecentSessions(limit: number = 10): Promise<ScrapingSession[]> {
    return await this.sessionRepository.find({
      order: { started_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics(): Promise<{
    total_sessions: number;
    completed_sessions: number;
    failed_sessions: number;
    stopped_sessions: number;
    total_flights_saved: number;
    avg_duration_minutes: number;
  }> {
    const totalSessions = await this.sessionRepository.count();
    const completedSessions = await this.sessionRepository.count({ where: { status: 'completed' } });
    const failedSessions = await this.sessionRepository.count({ where: { status: 'failed' } });
    const stoppedSessions = await this.sessionRepository.count({ where: { status: 'stopped' } });

    const result = await this.sessionRepository
      .createQueryBuilder('session')
      .select('SUM(session.total_flights_saved)', 'totalFlights')
      .addSelect('AVG(session.duration_seconds)', 'avgDuration')
      .getRawOne();

    return {
      total_sessions: totalSessions,
      completed_sessions: completedSessions,
      failed_sessions: failedSessions,
      stopped_sessions: stoppedSessions,
      total_flights_saved: parseInt(result?.totalFlights || '0'),
      avg_duration_minutes: parseFloat(((result?.avgDuration || 0) / 60).toFixed(1)),
    };
  }

  /**
   * Delete old sessions (cleanup)
   */
  async deleteOldSessions(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where('started_at < :cutoffDate', { cutoffDate })
      .andWhere('status IN (:...statuses)', { statuses: ['completed', 'stopped', 'failed'] })
      .execute();

    return result.affected || 0;
  }
}
