// 登录守卫

import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { RoleEntity } from '../user/entities/role.entity';
import { Reflector } from '@nestjs/core';

declare module 'express' {
  interface Request {
    user: {
      userName: string;
      roles: RoleEntity[];
    };
  }
}

@Injectable()
export class LoginGuard implements CanActivate {
  @Inject(JwtService) private jwtService: JwtService;
  @Inject(Reflector) private reflector: Reflector;

  // 首先先经过登录守卫，然后根据token解析对应的用户信息存到request.user中
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const authorization = request.headers.authorization;

    const notLogin = this.reflector.getAllAndOverride('require-login', [
      context.getClass(),
      context.getHandler(),
    ]);

    if (!notLogin) {
      return true;
    } else if (notLogin && authorization) {
      try {
        const token = authorization.split(' ')[1];
        const data = this.jwtService.verify(token);
        request.user = data.result;
        return true;
      } catch (error) {
        throw new UnauthorizedException();
      }
    }
  }
}
