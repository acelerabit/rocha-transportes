import { UploadAndProcessZipUseCase } from './../../../application/use-cases/uploadAndProcessZipUseCase';
import { BadRequestException, Controller } from '@nestjs/common';
import { Post, UploadedFile, UseInterceptors } from '@nestjs/common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class UploadAndProcessZipControllerController {
  constructor(
    private readonly uploadAndProcessZipUseCase: UploadAndProcessZipUseCase,
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
  // @Post()
  // async UploadZip() {
  //   return this.uploadAndProcessZipUseCase.execute({ file: 'heelo' });
  // }
}
