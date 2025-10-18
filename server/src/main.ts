/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import serverlessExpress from '@vendia/serverless-express';

const expressApp = express();
let cachedServer: any;

async function bootstrap() {
  try {
    console.log('Starting NestJS application...');
    console.log('Environment variables:', {
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
      CLIENT_URL: process.env.CLIENT_URL || 'Not set'
    });

    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    app.enableCors({
      origin: [
        process.env.CLIENT_URL || 'http://localhost:3000',
        'https://tree-trace-rzni.vercel.app',
        'https://tree-trace.vercel.app'
      ],
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    console.log('NestJS application initialized successfully');
    return serverlessExpress({ app: expressApp });
  } catch (error) {
    console.error('Error during bootstrap:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    if (!cachedServer) {
      console.log('Creating new server instance...');
      cachedServer = await bootstrap();
    }
    return cachedServer(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
