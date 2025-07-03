import { Module } from '@nestjs/common';
import { SpeechService } from './speech.service';
import { SpeechController } from './speech.controller';
import { IntentService } from 'src/intent/intent.service';
// import { RedisService } from 'src/common/redis/redis.service';
import { GuardrailsService } from 'src/guardrails/guardrails.service';
import { BiasDetectorService } from 'src/guardrails/bias-detector.service';
import { PIIDetectorService } from 'src/guardrails/pii-detector.service';

@Module({
  imports: [],
  controllers: [SpeechController],
  providers: [
    SpeechService,
    IntentService,
    // RedisService,
    GuardrailsService,
    BiasDetectorService,
    PIIDetectorService,
  ],
})
export class SpeechModule {}
