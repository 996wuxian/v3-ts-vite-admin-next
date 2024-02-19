// 获取.env环境变量
import 'dotenv/config';
// 日志
import { Logger } from '@nestjs/common';

const startTime = new Date().getTime();

import { NestFactory, Reflector } from '@nestjs/core';
console.info(`NestFactory ${new Date().getTime() - startTime}`);

import { AppModule } from './app.module';
console.info(`AppModule耗时：${new Date().getTime() - startTime}`);

import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as session from 'express-session';
import corsOptionsDelegate from './cors/cors';
import * as fs from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
console.info(`AllAppModule耗时：${new Date().getTime() - startTime}`);

export const IS_DEV = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 8080;
const PREFIX = process.env.PREFIX || '/';

async function bootstrap() {
  const logger: Logger = new Logger('main.ts');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // 开启日志级别打印
    logger: IS_DEV ? ['log', 'debug', 'error', 'warn'] : ['error', 'warn'],
  });

  // 静态资源虚拟路径
  app.useStaticAssets(join(__dirname, 'uploadFile'), {
    prefix: '/uploadFile',
  });

  console.info(`执行至 create 耗时 ${new Date().getTime() - startTime}`);
  app.enableCors(corsOptionsDelegate);
  // 接口参数验证
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // session
  app.use(
    session({
      secret: 'wuxian',
      resave: false,
      name: 'wuxian.sid',
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: false,
      },
    }),
  );
  // swagger
  const options = new DocumentBuilder()
    .setTitle('nest-shop')
    // .setDescription('nest-shop')
    .setVersion('1.0')
    .setExternalDoc('api-json', 'http://localhost:3000/api-json')
    .build();

  const document = SwaggerModule.createDocument(app, options);

  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));
  SwaggerModule.setup('/api-docs', app, document);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(PORT, () => {
    logger.log(
      `服务已经启动,接口请访问:http://wwww.localhost:${PORT}/${PREFIX}`,
    );
  });
  console.info(`执行至 listen 耗时 ${new Date().getTime() - startTime}`);
}

bootstrap();
