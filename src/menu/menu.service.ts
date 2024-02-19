import { Injectable } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MenuEntity } from './entities/menu.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuEntity)
    private readonly menuRepository: Repository<MenuEntity>,
  ) {}
  create(createMenuDto: CreateMenuDto) {
    const data = new MenuEntity();
    data.parentMenuId = createMenuDto?.parentMenuId || 0;
    data.title = createMenuDto?.title || '';
    data.path = createMenuDto?.path || '';
    data.component = createMenuDto?.component || '';
    data.redirect = createMenuDto?.redirect || '';
    data.name = createMenuDto?.name || '';
    data.hidden = createMenuDto?.hidden;
    return this.menuRepository.save(data);
  }

  findAll() {
    return this.menuRepository.find();
  }

  queryMenuRouters() {
    return this.menuRepository.find();
  }

  update(id: number, updateMenuDto: UpdateMenuDto) {
    return this.menuRepository.update(id, updateMenuDto);
  }
}
