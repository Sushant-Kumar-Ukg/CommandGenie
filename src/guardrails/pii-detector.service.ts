import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PIIDetectorService {
  private readonly logger = new Logger(PIIDetectorService.name);
  private readonly presidioUrl =
    process.env.PRESIDIO_URL || 'http://127.0.0.1:5005/analyze';

  async detect(text: string): Promise<{ hasPII: boolean; entities: string[] }> {
    try {
      const res = await axios.post(this.presidioUrl, {
        text,
        language: 'en',
        analyzer_config: {
          entities: [
            'EMAIL_ADDRESS',
            'PHONE_NUMBER',
            'CREDIT_CARD',
            'US_SOCIAL_SECURITY_NUMBER',
            'IBAN_CODE',
            'IP_ADDRESS',
          ],
          score_threshold: 0.5,
        },
      });

      const results = res.data as Array<{
        entity_type: string;
        start: number;
        end: number;
        score: number;
      }>;

      const detectedEntities = results.map((r) => r.entity_type);
      const hasPII = detectedEntities.length > 0;

      if (hasPII) {
        this.logger.warn(`PII detected: ${detectedEntities.join(', ')}`);
      }
      return { hasPII, entities: detectedEntities };
    } catch (err) {
      this.logger.error('Failed to call Presidio Analyzer', err);
      return { hasPII: false, entities: [] };
    }
  }
}
