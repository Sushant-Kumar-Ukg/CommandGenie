import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  Body,
  Logger,
} from '@nestjs/common';
import { SpeechService } from './speech.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { SpeechToTextDto } from './dto/speech-to-text.dto';
import { IntentService } from 'src/intent/intent.service';

@Controller()
export class SpeechController {
  private readonly logger = new Logger(SpeechController.name);
  constructor(
    private readonly speechService: SpeechService,
    private readonly intentService: IntentService,
  ) {}

  @Post('process-audio')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
    }),
  )
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @Body() body?: SpeechToTextDto,
  ) {
    if (!file) {
      throw new HttpException(
        'Audio file is required.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const lang = body?.languageCode || 'en-US';
    const sampleRateHertz = body?.sampleRateHertz || 16000;

    try {
      const transcription = await this.speechService.transcribeAudio(
        file.path,
        lang,
        sampleRateHertz,
      );

      const response = await this.intentService.detectIntents(transcription);

      fs.unlinkSync(file.path);

      return {
        languageCode: lang,
        response,
      };
    } catch (error) {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      if (error instanceof Error) {
        this.logger.error(`Error in /speech-to-text: ${error.message}`);
      } else {
        this.logger.error('Unknown error in /speech-to-text', error);
      }

      throw new HttpException(
        'Failed to process audio.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/process-text')
  async processText(@Body('text') text: string) {
    if (!text || text.trim().length === 0) {
      throw new HttpException('Text is required.', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Processing text: "${text}"`);

    try {
      const response = await this.intentService.detectIntents(text);

      return {
        response,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error in /process-text: ${error.message}`);
      } else {
        this.logger.error('Unknown error in /process-text', error);
      }

      throw new HttpException(
        'Failed to process text.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
