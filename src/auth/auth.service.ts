import { compareSyncPwd } from './../utils/tools';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { LoginDto } from 'src/user/dto/login.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import * as svgCaptcha from 'svg-captcha';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(userInfo: LoginDto): Promise<any> {
    let data = [];
    if (userInfo.email) {
      data = await this.usersService.findOneOfEmail(userInfo.email);
      if (!data.length) {
        const res = await this.usersService.create({
          email: userInfo.email,
        } as CreateUserDto);
        data.push(res);
      }
    } else {
      data = await this.usersService.findOneOfName(userInfo.userName);
      if (!data.length) {
        return {
          code: 400,
          msg: '用户不存在',
        };
      }
    }
    if (
      (data[0].userName === userInfo.userName &&
        compareSyncPwd(userInfo.password, data[0].password)) ||
      data[0].email === userInfo.email
    ) {
      /* eslint-disable */
      const { password, ...result } = data[0];
      // 签发
      return {
        code: 200,
        msg: '登录成功',
        data: {
          token: this.jwtService.sign(
            {
              result,
              id: 'wuxian',
            },
            {
              secret: jwtConstants.secret,
              expiresIn: '5h', // 过期时间
            },
          ),
          userInfo: result,
        },
      };
    }
  }

  async login(userInfo: LoginDto) {
    const res = await this.validateUser(userInfo);
    if (res) {
      return {
        ...res,
      };
    } else {
      return {
        code: 400,
        message: '用户名或密码错误',
      };
    }
  }

  code() {
    const Captcha = svgCaptcha.create({
      size: 4, // 生成验证码的个数
      fontSize: 50, //文字大小
      width: 100, //宽度
      height: 34, //高度
      background: '#cc9966', //背景颜色
    });
    return Captcha;
  }
}
