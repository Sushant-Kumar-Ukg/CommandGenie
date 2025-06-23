import { Module } from '@nestjs/common';
import { GuardrailsService } from './guardrails.service';
import { PIIDetectorService } from './pii-detector.service';
import { BiasDetectorService } from './bias-detector.service';

@Module({
  providers: [GuardrailsService, PIIDetectorService, BiasDetectorService],
  exports: [GuardrailsService, PIIDetectorService, BiasDetectorService],
})
export class GuardrailsModule {}
