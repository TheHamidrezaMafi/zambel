import { ClientOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

export const grpcScraperClientOptions: ClientOptions = {
  transport: Transport.GRPC,
  options: {
    package: 'scraper',
    protoPath: join(__dirname, '../../../proto/scraper.proto'),
    url: 'scraper:50051',
    loader: {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    },
  },
};
