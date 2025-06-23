import { Injectable, Logger } from '@nestjs/common';
import * as speech from '@google-cloud/speech';
import { protos } from '@google-cloud/speech';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SpeechService {
  private readonly logger = new Logger(SpeechService.name);
  private readonly speechClient = new speech.SpeechClient();

  async transcribeAudio(
    filePath: string,
    languageCode: string,
    sampleRateHertz: number,
  ): Promise<string> {
    this.logger.log(
      `Transcribing audio file: ${filePath} with languageCode: ${languageCode}`,
    );

    const fileExt = path.extname(filePath).toLowerCase();
    const encoding = this.detectAudioEncoding(fileExt);

    const file = fs.readFileSync(filePath);
    const audioBytes = file.toString('base64');

    const request: protos.google.cloud.speech.v1.IRecognizeRequest = {
      audio: {
        content: audioBytes,
      },
      config: {
        encoding,
        sampleRateHertz,
        languageCode,
      },
    };

    const [response] = await this.speechClient.recognize(request);

    const transcription = response.results
      ?.map((result) => result.alternatives?.[0]?.transcript ?? '')
      .join('\n')
      .trim();

    this.logger.log(`Transcription result: ${transcription}`);

    return transcription || 'No speech detected in the audio.';
  }

  private detectAudioEncoding(
    ext: string,
  ): protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding {
    switch (ext) {
      case '.wav':
        return protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding
          .LINEAR16;
      case '.mp3':
      case '.m4a':
        return protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding
          .MP3;
      case '.flac':
        return protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding
          .FLAC;
      default:
        throw new Error(`Unsupported audio format: ${ext}`);
    }
  }
}
