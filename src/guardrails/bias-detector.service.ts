import { Injectable } from '@nestjs/common';
import { BIAS_KEYWORDS } from 'src/common/constants';

@Injectable()
export class BiasDetectorService {
  detect(text: string): { hasBias: boolean; keywords: string[] } {
    const lowered = text.toLowerCase();
    const matched = BIAS_KEYWORDS.filter((kw) => lowered.includes(kw));
    return { hasBias: matched.length > 0, keywords: matched };
  }
}
