import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Res,
  Req,
  Delete,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
// 上传文件限制
import { multerConfig } from '../config/multerConfig';
// 编码管道,但未产生作用
// import { FileNameEncodePipe } from './upload.pipe';
import { RequireLogin, RequirePermission } from '../guard/custom-decorator';

@RequireLogin() // 校验token
@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @RequirePermission('add') //给添加权限
  // 代表使用FileInterceptor处理上传的form data里的 file 字段的数据，也可以不指定字段名，直接处理整个表单数据。
  // 图片保存位置在module中进行配置
  @UseInterceptors(FileInterceptor('file', multerConfig))
  // 使用UploadedFile装饰器从 request 中取出 file。
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.upload(file);
  }

  @Post('addFile')
  @RequirePermission('add') //给添加权限
  async create(@Req() req, @Res() res) {
    const data = await this.uploadService.create(req.body);
    if (data) {
      res.send({
        code: 200,
        msg: '新增成功',
      });
    }
  }

  @Get()
  @RequirePermission('select') //给查询权限
  async getAllFile(@Res() res) {
    const data = await this.uploadService.findAll();
    if (data) {
      res.send({
        code: 200,
        data,
      });
    }
  }

  @Get(':id')
  async getFile(@Req() req, @Res() res) {
    const data = await this.uploadService.findOne(req.params.id);

    data[0].fileName = `http://localhost:${process.env.PORT}/uploadFile/${data[0].fileName}`;

    if (!data.length) return;
    res.send({
      code: 200,
      data,
    });
  }

  @Delete(':id')
  @RequirePermission('delete') //给添加权限
  async deleteFile(@Req() req, @Res() res) {
    const data = await this.uploadService.delete(req.params.id);
    res.send({
      code: 200,
      data,
      msg: '删除成功',
    });
  }

  @Get('download/:id')
  async export(@Req() req, @Res() res) {
    const data = await this.uploadService.export(req.params.id);
    res.download(data);
  }
}
