import { UploadAndProcessXmlUseCase } from './../../../application/use-cases/uploadAndProcessXmlUseCase';
import { UploadAndProcessZipUseCase } from './../../../application/use-cases/uploadAndProcessZipUseCase';
import { BadRequestException, Controller } from '@nestjs/common';
import { Post, UploadedFile, UseInterceptors } from '@nestjs/common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class UploadAndProcessZipControllerController {
  constructor(
    private readonly uploadAndProcessZipUseCase: UploadAndProcessZipUseCase,
    private readonly uploadAndProcessXmlUseCase: UploadAndProcessXmlUseCase,
  ) {}

  @UseInterceptors(FileInterceptor('file'))
  @Post()
  async UploadZip(@UploadedFile() file: Express.Multer.File) {
    if (file.mimetype !== 'application/zip') {
      throw new BadRequestException(
        'Invalid file format. Only .zip files are allowed.',
      );
    } else {
      return this.uploadAndProcessZipUseCase.execute();
    }
  }

  @Post('/single-xml')
  @UseInterceptors(FileInterceptor('file'))
  async uploadXml(@UploadedFile() file) {
    return this.uploadAndProcessXmlUseCase.execute(file);
  }
}
