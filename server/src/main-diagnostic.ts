/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let cachedApp: any;

// Create a minimal test module without database dependencies
import { Module, Controller, Get, Post, Body } from '@nestjs/common';

@Controller('auth')
class TestAuthController {
  @Get('login')
  async loginGet() {
    return {
      statusCode: 200,
      message: 'Login endpoint available - use POST method',
      method: 'POST',
      endpoint: '/auth/login'
    };
  }

  @Post('login')
  async login(@Body() body: any) {
    console.log('Login attempt:', body);
    return {
      statusCode: 200,
      message: 'Login test successful',
      data: {
        access_token: 'test-token',
        user: { id: 'test-user', email: body.email }
      }
    };
  }

  @Get('register')
  async registerGet() {
    return {
      statusCode: 200,
      message: 'Register endpoint available - use POST method',
      method: 'POST',
      endpoint: '/auth/register'
    };
  }

  @Post('register')
  async register(@Body() body: any) {
    console.log('Register attempt:', body);
    return {
      statusCode: 201,
      message: 'Registration test successful',
      data: {
        access_token: 'test-token',
        user: { id: 'test-user', email: body.email }
      }
    };
  }
}

@Controller()
class TestController {
  @Get()
  getHello() {
    return { message: 'Hello from TreeTrace API!' };
  }
  
  @Get('health')
  getHealth() {
    return { 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      env: {
        mongodb_set: !!process.env.MONGODB_URI,
        jwt_secret_set: !!process.env.JWT_SECRET,
        client_url: process.env.CLIENT_URL,
        node_env: process.env.NODE_ENV
      }
    };
  }
}

@Module({
  imports: [],
  controllers: [TestController, TestAuthController],
  providers: [],
})
class TestModule {}

async function bootstrap() {
  try {
    console.log('Starting diagnostic NestJS application...');
    
    // Check required environment variables
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    console.log('Environment variables loaded successfully');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
    console.log('CLIENT_URL:', process.env.CLIENT_URL || 'NOT SET');
    
    const app = await NestFactory.create(TestModule, new ExpressAdapter(), {
      logger: ['error', 'warn', 'log'],
    });

    app.enableCors({
      origin: process.env.CLIENT_URL || 'https://tree-trace-rzni.vercel.app',
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

    console.log('Initializing application...');
    await app.init();
    console.log('Application initialized successfully');

    return app;
  } catch (error) {
    console.error('Error during bootstrap:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

export default async function handler(req: any, res: any) {
  try {
    console.log('Handler called with method:', req.method, 'path:', req.path);
    
    if (!cachedApp) {
      console.log('Creating cached app...');
      cachedApp = await bootstrap();
      console.log('Cached app created');
    }
    
    console.log('Processing request...');
    const expressApp = cachedApp.getHttpAdapter().getInstance();
    return expressApp(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    console.error('Handler error stack:', error.stack);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}
