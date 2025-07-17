import { Injectable, Logger } from "@nestjs/common";
import { GenerativeModel, VertexAI } from "@google-cloud/vertexai";
import {
  INTENT_PROMPT,
  SENTIMENT_ANALYSIS_PROMPT,
  SUCCESS_RESPONSE_GENERATION_PROMPT,
} from "./constants";
// import { RedisService } from 'src/common/redis/redis.service';
// import { GuardrailsService } from "src/guardrails/guardrails.service";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class IntentService {
  private readonly logger = new Logger(IntentService.name);
  private vertexAI: VertexAI;
  private model: GenerativeModel;

  constructor() {
    const credsPath = path.join("/tmp", "gcp-creds.json");
    if (!process.env.GCP_CREDS) {
      throw new Error("GCP_CREDS env variable is missing");
    }
    fs.writeFileSync(credsPath, process.env.GCP_CREDS);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;

    this.vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.VERTEX_LOCATION,
    });

    this.model = this.vertexAI.getGenerativeModel({
      model: process.env.VERTEX_MODEL || "gemini-1.5-flash",
    });
  }

  async detectIntents(text: string): Promise<{
    confirmation_prompt: string;
    workflow_steps: any[];
  }> {
    this.logger.log(`Detecting intents for text: "${text}"`);
    const today = new Date().toISOString().split("T")[0];
    // const cacheKey = `intent-cache:${text.trim().toLowerCase()}`;
    // const cached = await this.redisService.get<any[]>(cacheKey);
    // if (cached) {
    //   this.logger.log(`Cache hit for key "${cacheKey}"`);
    // }

    const req = {
      contents: [
        {
          role: "user",
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
      res.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    this.logger.log(`Raw intent model response: "${rawResponse}"`);

    const cleanedRawResponse = rawResponse
      .replace(/```json\s*|```/g, "")
      .trim();

    this.logger.log(`Cleaned raw response: "${cleanedRawResponse}"`);

    // await this.guardrailsService.validate(cleanedRawResponse);

    let parsed: { confirmation_prompt: string; workflow_steps: any[] };

    try {
      parsed = JSON.parse(cleanedRawResponse);
    } catch (err) {
      this.logger.error("Failed to parse LLM response as JSON.", err);
      parsed = {
        confirmation_prompt: "",
        workflow_steps: [],
      };
    }

    return parsed;
  }

  async findSentiments(text: string): Promise<string> {
    this.logger.log(`Finding sentiment for text: "${text}"`);
    const today = new Date().toISOString().split("T")[0];
    const req = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${SENTIMENT_ANALYSIS_PROMPT}\n\nToday's date is: ${today}\n\nNow process the following user text: "${text}"`,
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
      res.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    this.logger.log(`Raw intent model response: "${rawResponse}"`);

    const cleanedRawResponse = rawResponse
      .replace(/```json\s*|```/g, "")
      .trim();

    this.logger.log(`Cleaned raw response: "${cleanedRawResponse}"`);

    return cleanedRawResponse;
  }

  async constructSpeech(text: any): Promise<string> {
    this.logger.log(
      `Constructing success speech for: "${JSON.stringify(text, null, 2)}"`
    );
    // const today = new Date().toISOString().split("T")[0];
    const req = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${SUCCESS_RESPONSE_GENERATION_PROMPT}\n\nNow analyse the following user text: "${JSON.stringify(text)}" and provide me the dynamic success response`,
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
      res.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    this.logger.log(`Raw intent model response: "${rawResponse}"`);

    const cleanedRawResponse = rawResponse
      .replace(/```json\s*|```/g, "")
      .trim();

    this.logger.log(`Cleaned raw response: "${cleanedRawResponse}"`);

    return cleanedRawResponse;
  }

  classifyTransfers({ coverageDetails, employeeDetails }) {
    const byQualifier: any = coverageDetails.reduce(
      (
        acc,
        { orgJobRef: { qualifier }, underCoverageCount, overCoverageCount }
      ) => {
        if (!acc[qualifier]) acc[qualifier] = [];
        acc[qualifier].push({ underCoverageCount, overCoverageCount });
        return acc;
      },
      {}
    );

    const qualifiedForTransfer: any = Object.entries(byQualifier)
      .filter(([qualifier, slots]: any) => {
        const allUnderZero = slots.every((s) => s.underCoverageCount === 0);
        const anyOverPositive = slots.some((s) => s.overCoverageCount > 0);
        return allUnderZero && anyOverPositive;
      })
      .map(([qualifier]) => qualifier);

    const canBeTransferred: any = [];
    const canNotBeTransferred: any = [];

    employeeDetails.forEach((emp: any) => {
      if (qualifiedForTransfer.includes(emp.currentLocation)) {
        canBeTransferred.push(emp);
      } else {
        canNotBeTransferred.push(emp);
      }
    });

    return { canBeTransferred, canNotBeTransferred };
  }
}
