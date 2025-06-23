import { Module } from '@nestjs/common';
import { IntentService } from './intent.service';
import { RedisService } from 'src/common/redis/redis.service';
import { GuardrailsService } from 'src/guardrails/guardrails.service';
import { BiasDetectorService } from 'src/guardrails/bias-detector.service';
import { PIIDetectorService } from 'src/guardrails/pii-detector.service';

@Module({
  providers: [
    IntentService,
    RedisService,
    GuardrailsService,
    BiasDetectorService,
    PIIDetectorService,
  ],
  exports: [IntentService],
})
export class IntentModule {}
