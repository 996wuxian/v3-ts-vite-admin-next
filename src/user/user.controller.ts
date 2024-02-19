import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  Session,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { randomUUID } from 'crypto';
import * as QRCode from 'qrcode';
import { RequireLogin, RequirePermission } from '../guard/custom-decorator';
import { arrayToTree } from '../utils/tools';
import { cloneDeep } from 'lodash';

@RequireLogin()
@Controller('api/user')
@ApiTags('用户')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    // private readonly permissionGuard: PermissionGuard,
  ) {}

  // 无权限的不能放在有权限后面？否则需要权限？
  @Get('init')
  async initData() {
    await this.userService.initUserRulePermission();
    return {
      code: 200,
      msg: '已初始化user表role表permission表',
    };
  }

  @Get('code')
  @ApiOperation({ summary: '获取图文验证码' })
  code(@Req() req, @Res() res, @Session() session) {
    const data = this.userService.code();
    session.code = data.text; // 记录密码赋值给session自定义变量，做校验
    res.type('image/svg+xml');
    res.send(data);
  }

  @Get('emailCode')
  @ApiOperation({ summary: '获取邮箱验证码' })
  async emailCode(@Req() req, @Res() res, @Session() session) {
    const email = req.query.email;
    const data = await this.userService.emailCode(email);
    session.code = data;
    if (!data) return;
    res.send({ code: 200, msg: '已发送，请注意查收' });
  }

  @Get('qrCode')
  @ApiOperation({ summary: '获取微信登录二维码' })
  async qrCode(@Res() res) {
    const uuid = randomUUID();
    const dataUrl = await QRCode.toDataURL(
      `http//localhost:3000/pages/confirm.html?id=${uuid}`,
    );
    res.send({
      code: 200,
      qrcode_id: uuid,
      data: dataUrl,
    });
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  async create(@Body() createUserDto: CreateUserDto) {
    const { userName } = createUserDto;
    const existUser = await this.userService.findOneOfName(userName);
    if (existUser.length) {
      throw new BadRequestException('注册用户已存在');
    }
    /* eslint-disable */
    const { password, ...data } = await this.userService.create(createUserDto);
    return {
      code: 200,
      msg: '创建成功',
      data,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiQuery({
    name: 'page',
    description: '页码',
    required: false,
    type: 'number',
  })
  @ApiQuery({
    name: 'pageSize',
    description: '每页条数',
    required: false,
    type: 'number',
  })
  @ApiQuery({
    name: 'keyWord',
    description: '关键字',
    required: false,
    type: 'string',
  })
  @RequirePermission('select')
  @ApiOperation({ summary: '查找所有用户' })
  async findAll(@Query() query, @Res() res) {
    const { data, totalCount } = await this.userService.findAll(query);
    res.send({
      code: 200,
      data,
      totalCount,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @ApiOperation({ summary: '根据id查找用户' })
  findOne(@Param('id') id: number) {
    return this.userService.findOne(+id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('roleMenu/:id')
  @RequirePermission('select')
  @ApiOperation({ summary: '根据ruleId查找菜单' })
  async findMenuByRuleId(@Param('id') id: number, @Res() res) {
    const data = await this.userService.findMenuByRoleId(+id);
    if (!data) return;

    const newData = data[0].menus.map((item) => {
      return {
        menuId: item.menuId,
        component: item.component,
        meta: {
          title: item.title,
          icon: item.icon,
          hidden: item.hidden,
        },
        redirect: item.redirect,
        name: item.name,
        parentMenuId: item.parentMenuId,
        path: item.path,
      };
    });

    const newTree = arrayToTree<any>(
      cloneDeep(newData),
      'menuId',
      'parentMenuId',
    );

    res.send({
      code: 200,
      data: newTree,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @ApiOperation({ summary: '修改用户' })
  async update(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Res() res,
  ) {
    const data = await this.userService.update(+id, updateUserDto);
    if (data) {
      res.send({
        code: 200,
        msg: '修改成功',
      });
    } else {
      res.send({
        code: 400,
        msg: '修改失败',
      });
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  remove(@Param('id') id: number) {
    return this.userService.remove(+id);
  }

  @UseGuards(AuthGuard('jwt'))
  @RequirePermission('select')
  @Get('getRole/role')
  @ApiOperation({ summary: '查询角色' })
  async GetRole(@Res() res) {
    const data = await this.userService.findRole();
    if (data) {
      res.send({
        code: 200,
        data,
      });
    }
  }
}
