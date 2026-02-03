// Verification node using Claude Haiku to verify primary LLM answers

import Anthropic from '@anthropic-ai/sdk';
import type { GraphState } from '../types';
import type { VerificationResult } from '@/lib/supabase/types';

const anthropic = new Anthropic();

const VERIFY_SYSTEM_PROMPT = `You are a verification assistant. Your job is to verify that an answer correctly represents the information in the provided source documents.

Given:
1. A question
2. An answer (from another AI)
3. Source document chunks that were used to generate the answer

Your task:
1. Check if the answer is supported by the source documents
2. Look for any factual errors or hallucinations
3. Verify that citations reference actual content in the sources

Respond in JSON format:
{
  "agrees": true/false,
  "confidence": 0.0-1.0,
  "notes": "Brief explanation of your assessment",
  "issues": ["List of any issues found (empty if agrees)"],
  "suggested_correction": "Only if agrees=false, provide corrected answer"
}`;

export interface VerifyResponseInput {
  state: GraphState;
  primaryAnswer: string;
}

export interface VerifyResponseOutput {
  verification: VerificationResult;
  shouldReconcile: boolean;
}

export async function verifyResponse(
  input: VerifyResponseInput
): Promise<VerifyResponseOutput> {
  const { state, primaryAnswer } = input;

  // Build context from reranked chunks
  const context = state.reranked_chunks
    .map((rc, idx) => `[Source ${idx + 1}] (${rc.document.filename}, p.${rc.chunk.page_number || '?'}):\n${rc.chunk.content}`)
    .join('\n\n');

  const verifyPrompt = `## Question
${state.query}

## Answer to Verify
${primaryAnswer}

## Source Documents
${context}

Please verify if this answer accurately represents the information in the source documents.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: VERIFY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: verifyPrompt }],
    });

    // Extract text content
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Parse JSON response
    let verificationData: {
      agrees: boolean;
      confidence: number;
      notes: string;
      issues?: string[];
      suggested_correction?: string;
    };

    try {
      // Extract JSON from response (may be wrapped in markdown code block)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verificationData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      // Default to agreement if parsing fails
      console.warn('[Verify] Failed to parse verification response, defaulting to agree');
      verificationData = {
        agrees: true,
        confidence: 0.5,
        notes: 'Verification parsing failed, assuming agreement',
      };
    }

    const verification: VerificationResult = {
      model: 'claude-haiku-4-5',
      agrees: verificationData.agrees,
      notes: verificationData.notes + (verificationData.issues?.length
        ? `\nIssues: ${verificationData.issues.join(', ')}`
        : ''),
    };

    return {
      verification,
      shouldReconcile: !verificationData.agrees && verificationData.confidence > 0.7,
    };
  } catch (error) {
    console.error('[Verify] Error calling Claude Haiku:', error);

    // On error, default to no verification (pass through)
    return {
      verification: {
        model: 'claude-haiku-4-5',
        agrees: true,
        notes: 'Verification failed due to API error, passing through',
      },
      shouldReconcile: false,
    };
  }
}
