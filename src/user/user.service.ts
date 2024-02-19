import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { UserEntity } from './entities/user.entity';
import { PermissionEntity } from './entities/permission.entity';
import { RoleEntity } from './entities/role.entity';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, EntityManager, In } from 'typeorm';

import { encryptPwd } from 'src/utils/tools';

import * as svgCaptcha from 'svg-captcha';

import { Email } from 'src/utils/email';

@Injectable()
export class UserService {
  // 两种写法
  // constructor(
  //   @InjectRepository(UserEntity)
  //   private readonly userRepository: UserEntity,
  //   private readonly permissionEntity: PermissionEntity,
  //   private readonly roleEntity: RoleEntity,
  // ) {}

  @InjectEntityManager()
  entityManager: EntityManager;

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

  async emailCode(emailText) {
    const newEmail = new Email();
    const data = await newEmail.send({
      email: emailText,
    });
    return data;
  }

  create(createUserDto: CreateUserDto) {
    const data = new UserEntity();
    data.userName = createUserDto?.userName || '';
    data.password = createUserDto?.password
      ? encryptPwd(createUserDto?.password)
      : '';
    data.phone = createUserDto?.phone || '';
    data.address = createUserDto?.address || '';
    data.email = createUserDto?.email || '';
    data.state = createUserDto?.state || 1;

    return this.entityManager.save(UserEntity, data);
  }

  async findAll(query: { keyWord?: string; Page?: number; PageSize?: number }) {
    if (!query.keyWord) {
      const data = (
        await this.entityManager.find(UserEntity, {
          // Like 模糊查询
          where: {
            userName: Like(`%${query.keyWord || ''}%`),
          },
          // order: {
          //   id: 'DESC',  // 倒叙 ASC 正序
          // },
          skip: (query.Page - 1) * query.PageSize, // 从0开始
          take: query.PageSize,
          // relations: ['tag', 'user'],
          relations: {
            roles: true,
          },
        })
      ).filter((user) => delete user.password);
      const totalCount = await this.entityManager.count(UserEntity, {
        where: {
          userName: Like(`%${query.keyWord}%`),
        },
      });
      return {
        data,
        totalCount,
      };
    }

    const data = await this.entityManager.find(UserEntity, {
      // Like 模糊查询
      where: {
        userName: Like(`%${query.keyWord}%`),
      },
      // order: {
      //   id: 'DESC',  // 倒叙 ASC 正序
      // },
      skip: (query.Page - 1) * query.PageSize, // 从0开始
      take: query.PageSize,
    });
    for (let i = 0; i < data.length; i++) {
      delete data[i].password;
    }
    const totalCount = await this.entityManager.count(UserEntity, {
      where: {
        userName: Like(`%${query.keyWord}%`),
      },
    });
    return {
      data,
      totalCount,
    };
  }

  async findOne(id: number) {
    const data = await this.entityManager.find(UserEntity, {
      where: { id: id },
    });
    return data;
  }

  async findOneOfName(userName: string) {
    const data = await this.entityManager.find(UserEntity, {
      where: { userName },
      relations: {
        roles: true,
      },
    });
    return data;
  }

  async findRolesByIds(roleIds: number[]) {
    return this.entityManager.find(RoleEntity, {
      where: {
        id: In(roleIds),
      },
      relations: {
        permissions: true,
      },
    });
  }

  async findMenuByRoleId(roleId: number) {
    return this.entityManager.find(RoleEntity, {
      where: {
        id: roleId,
      },
      relations: {
        menus: true,
      },
    });
  }

  async findRole() {
    return this.entityManager.find(RoleEntity);
  }

  async findOneOfEmail(email: string) {
    const data = await this.entityManager.find(UserEntity, {
      where: { email },
    });
    return data;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.entityManager.update(UserEntity, id, updateUserDto);
  }

  remove(id: number) {
    return this.entityManager.delete(UserEntity, id);
  }

  async initUserRulePermission() {
    const adminUser = new UserEntity();
    adminUser.userName = 'admin';
    adminUser.password = '123';

    const ordinaryUser = new UserEntity();
    ordinaryUser.userName = 'wuxian';
    ordinaryUser.password = '123';

    const adminRole = new RoleEntity();
    adminRole.name = '管理员';

    const ordinaryRole = new RoleEntity();
    ordinaryRole.name = '普通用户';

    const permission1 = new PermissionEntity();
    permission1.name = 'add';

    const permission2 = new PermissionEntity();
    permission2.name = 'update';

    const permission3 = new PermissionEntity();
    permission3.name = 'delete';

    const permission4 = new PermissionEntity();
    permission4.name = 'select';

    adminRole.permissions = [
      permission1,
      permission2,
      permission3,
      permission4,
    ];

    ordinaryRole.permissions = [permission1, permission2, permission3];

    adminUser.roles = [adminRole];

    ordinaryUser.roles = [ordinaryRole];

    await this.entityManager.save(PermissionEntity, [
      permission1,
      permission2,
      permission3,
      permission4,
    ]);

    await this.entityManager.save(RoleEntity, [adminRole, ordinaryRole]);

    await this.entityManager.save(UserEntity, [adminUser, ordinaryUser]);
  }
}
