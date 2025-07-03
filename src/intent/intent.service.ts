import { Injectable, Logger } from '@nestjs/common';
import { GenerativeModel, VertexAI } from '@google-cloud/vertexai';
import { INTENT_PROMPT } from './constants';
// import { RedisService } from 'src/common/redis/redis.service';
import { GuardrailsService } from 'src/guardrails/guardrails.service';

@Injectable()
export class IntentService {
  private readonly logger = new Logger(IntentService.name);
  private readonly vertexAI = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.VERTEX_LOCATION,
  });

  private readonly model: GenerativeModel = this.vertexAI.getGenerativeModel({
    model: process.env.VERTEX_MODEL || 'gemini-1.5-flash',
  });
  constructor(
    // private readonly redisService: RedisService,
    private readonly guardrailsService: GuardrailsService,
  ) {}

  async detectIntents(text: string): Promise<{
    confirmation_prompt: string;
    workflow_steps: {
      step_id: number;
      intent: string;
      api_details: {
        endpoint: string;
        method: string;
        payload: Record<string, any>;
        param_sources?: Record<
          string,
          { source_step_id: number; source_path: string }
        >;
      };
      display: {
        on_success_speech: string;
        on_failure_speech: string;
      };
    }[];
  }> {
    this.logger.log(`Detecting intents for text: "${text}"`);
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `intent-cache:${text.trim().toLowerCase()}`;
    // const cached =
    //   await this.redisService.get<{ intent: string; params: any }[]>(cacheKey);
    // if (cached) {
    //   this.logger.log(`Cache hit for key "${cacheKey}"`);
    //   // return cached;
    // }
    const req = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${INTENT_PROMPT}\n\nToday's date is: ${today}\n\nNow process the following user text: "${text}"`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 8192,
      },
    };

    const res = await this.model.generateContent(req);

    const rawResponse =
      res.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    this.logger.log(`Raw intent model response: "${rawResponse}"`);

    const cleanedRawResponse = rawResponse
      .replace(/```json\s*|```/g, '')
      .trim();

    this.logger.log(`Cleaned raw response: "${cleanedRawResponse}"`);
    await this.guardrailsService.validate(cleanedRawResponse);
    let parsed: {
      confirmation_prompt: string;
      workflow_steps: {
        step_id: number;
        intent: string;
        api_details: {
          endpoint: string;
          method: string;
          payload: Record<string, any>;
          param_sources?: Record<
            string,
            { source_step_id: number; source_path: string }
          >;
        };
        display: {
          on_success_speech: string;
          on_failure_speech: string;
        };
      }[];
    };

    try {
      parsed = JSON.parse(cleanedRawResponse);
    } catch (err) {
      this.logger.error('Failed to parse LLM response as JSON.', err);
      parsed = {
        confirmation_prompt: '',
        workflow_steps: [],
      };
    }

    // await this.redisService.set(cacheKey, parsed, 3600);
    return parsed;
  }
}
