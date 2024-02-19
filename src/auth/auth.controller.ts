import { Body, Controller, Get, Post, Req, Res, Session } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() loginDto: LoginDto, @Session() session, @Res() res) {
    if (
      loginDto?.code?.toLocaleLowerCase() === session.code.toLocaleLowerCase()
    ) {
      res.send(await this.authService.login(loginDto));
    } else {
      res.send({
        code: 501,
        msg: '验证码错误',
      });
    }
  }

  @Get('code')
  @ApiOperation({ summary: '获取图文验证码' })
  code(@Req() req, @Res() res, @Session() session) {
    const data = this.authService.code();
    session.code = data.text; // 记录密码赋值给session自定义变量，做校验
    res.type('image/svg+xml');
    res.send(data);
  }
}
