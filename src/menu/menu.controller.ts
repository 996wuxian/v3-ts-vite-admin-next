import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { arrayToTree } from '../utils/tools';
import { cloneDeep } from 'lodash';
// 接口守卫，当访问该接口，且token存在时，返回true
import { RequireLogin, RequirePermission } from '../guard/custom-decorator';

@RequireLogin()
@Controller('api/menu')
@ApiTags('菜单')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @ApiOperation({ summary: '新增/修改菜单' })
  @RequirePermission('add')
  async menu(@Body() createMenuDto: CreateMenuDto, @Res() res) {
    let data;
    if (createMenuDto.menuId) {
      data = await this.menuService.update(createMenuDto.menuId, createMenuDto);
    } else {
      data = await this.menuService.create(createMenuDto);
    }
    if (data) {
      res.send({
        code: 200,
        msg: '保存成功',
      });
    }
  }

  @Get()
  @RequirePermission('select')
  @ApiOperation({ summary: '获取菜单信息' })
  async findAll(@Res() res) {
    const data = await this.menuService.findAll();
    if (!data) return;
    res.send({
      code: 200,
      data,
    });
  }

  @Get('queryMenuRouters')
  @RequirePermission('select')
  @ApiOperation({ summary: '获取所有菜单' })
  async queryMenuRouters(@Res() res) {
    const data = await this.menuService.queryMenuRouters();
    if (!data) return;

    const newData = data.map((item) => {
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
}
