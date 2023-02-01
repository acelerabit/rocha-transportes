import { UploadAndProcessZipUseCase } from './../../application/use-cases/uploadAndProcessZipUseCase';
import { UploadAndProcessZipControllerController } from './controllers/upload-and-process-zip-controller.controller';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      dest: './upload',
    }),
  ],
  controllers: [UploadAndProcessZipControllerController],
  providers: [UploadAndProcessZipUseCase],
})
export class HttpModule {}
