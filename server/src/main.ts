/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { configure } from '@vendia/serverless-express';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let cachedServer: any;

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
      origin: true, // Allow all origins temporarily for debugging
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      exposedHeaders: ['Set-Cookie'],
    });

    app.useGlobalPipes(new ValidationPipe());
    
    console.log('Initializing application...');
    await app.init();
    console.log('Application initialized successfully');

    const expressApp = app.getHttpAdapter().getInstance();
    return configure({ app: expressApp });
  } catch (error) {
    console.error('Error during bootstrap:', error);
    throw error;
  }
}

export default async function handler(req: any, res: any) {
  try {
    if (!cachedServer) {
      console.log('Creating cached server...');
      cachedServer = await bootstrap();
      console.log('Cached server created');
    }
    return cachedServer(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
