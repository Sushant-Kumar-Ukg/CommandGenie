import { Injectable } from '@nestjs/common';
import { PIIDetectorService } from './pii-detector.service';
import { BiasDetectorService } from './bias-detector.service';

@Injectable()
export class GuardrailsService {
  constructor(
    private readonly piiDetector: PIIDetectorService,
    private readonly biasDetector: BiasDetectorService,
  ) {}

  async validate(text: string): Promise<{
    hasPII: boolean;
    piiEntities: string[];
    hasBias: boolean;
    biasKeywords: string[];
  }> {
    const pii = await this.piiDetector.detect(text);
    const bias = this.biasDetector.detect(text);

    return {
      hasPII: pii.hasPII,
      piiEntities: pii.entities,
      hasBias: bias.hasBias,
      biasKeywords: bias.keywords,
    };
  }
}
