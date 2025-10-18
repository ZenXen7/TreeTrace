/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let cachedApp: any;

async function bootstrap() {
  try {
    console.log('Starting NestJS application...');
    
    // Check required environment variables
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    console.log('Environment variables loaded successfully');
    
    const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
      logger: ['error', 'warn', 'log'],
    });

    app.enableCors({
      origin: true, // Allow all origins temporarily
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
    
    // Add a simple health check endpoint that doesn't require database
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
    
    console.log('Initializing application...');
    await app.init();
    console.log('Application initialized successfully');

    return app;
  } catch (error) {
    console.error('Error during bootstrap:', error);
    throw error;
  }
}

export default async function handler(req: any, res: any) {
  try {
    if (!cachedApp) {
      console.log('Creating cached app...');
      cachedApp = await bootstrap();
      console.log('Cached app created');
    }
    
    const expressApp = cachedApp.getHttpAdapter().getInstance();
    return expressApp(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}
