import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());

  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 200,
  });

  app.useGlobalPipes(new ValidationPipe());
  
  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
  });
  
  // Add a simple health check endpoint
  app.use('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      env: {
        mongodb_set: !!process.env.MONGODB_URI,
        jwt_secret_set: !!process.env.JWT_SECRET,
        client_url: process.env.CLIENT_URL
      }
    });
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
