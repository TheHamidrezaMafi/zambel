import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateScrapingSessionsTable1734100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'scraping_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'trigger_type',
            type: 'varchar',
            length: '50',
            default: "'manual'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'started_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'paused_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'resumed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'total_routes',
            type: 'int',
            default: 0,
          },
          {
            name: 'completed_routes',
            type: 'int',
            default: 0,
          },
          {
            name: 'failed_routes',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_flights_found',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_flights_saved',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_errors',
            type: 'int',
            default: 0,
          },
          {
            name: 'route_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'duration_seconds',
            type: 'int',
            default: 0,
          },
          {
            name: 'pause_duration_seconds',
            type: 'int',
            default: 0,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for better query performance
    await queryRunner.createIndex(
      'scraping_sessions',
      new TableIndex({
        name: 'IDX_scraping_sessions_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'scraping_sessions',
      new TableIndex({
        name: 'IDX_scraping_sessions_started_at',
        columnNames: ['started_at'],
      }),
    );

    await queryRunner.createIndex(
      'scraping_sessions',
      new TableIndex({
        name: 'IDX_scraping_sessions_trigger_type',
        columnNames: ['trigger_type'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scraping_sessions');
  }
}
