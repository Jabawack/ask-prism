// Reconciliation node using a reasoning model (o3) to resolve disagreements

import { ChatOpenAI } from '@langchain/openai';
import type { GraphState } from '../types';
import type { VerificationResult, ReconciliationResult } from '@/lib/supabase/types';

const RECONCILE_SYSTEM_PROMPT = `You are an expert analyst tasked with resolving disagreements between two AI models about document-based questions.

You will receive:
1. A question about some documents
2. A primary answer from one model
3. A verification result from another model explaining why it disagrees
4. The source documents themselves

Your job:
1. Carefully analyze both perspectives
2. Check the source documents to determine the truth
3. Decide which answer (if either) is correct, or synthesize a better answer
4. Provide a clear, accurate final answer

Respond in JSON format:
{
  "analysis": "Your step-by-step reasoning about both answers",
  "chosen": "primary" | "verification" | "synthesized",
  "final_answer": "The correct answer based on your analysis",
  "confidence": 0.0-1.0
}`;

export interface ReconcileInput {
  state: GraphState;
  primaryAnswer: string;
  verification: VerificationResult;
}

export interface ReconcileOutput {
  reconciliation: ReconciliationResult;
  finalAnswer: string;
  confidence: number;
}

export async function reconcileResponse(
  input: ReconcileInput
): Promise<ReconcileOutput> {
  const { state, primaryAnswer, verification } = input;

  // Use o3 or fall back to GPT-4 for reasoning
  // Note: o3 may not be available in all regions/accounts
  const model = new ChatOpenAI({
    modelName: process.env.RECONCILIATION_MODEL || 'gpt-4o',
    temperature: 0,
  });

  // Build context from reranked chunks
  const context = state.reranked_chunks
    .map((rc, idx) => `[Source ${idx + 1}] (${rc.document.filename}, p.${rc.chunk.page_number || '?'}):\n${rc.chunk.content}`)
    .join('\n\n');

  const reconcilePrompt = `## Question
${state.query}

## Primary Answer (Model A)
${primaryAnswer}

## Verification Result (Model B)
Agrees: ${verification.agrees}
Notes: ${verification.notes}

## Source Documents
${context}

Please analyze both perspectives and determine the correct answer based on the source documents.`;

  try {
    const response = await model.invoke([
      { role: 'system', content: RECONCILE_SYSTEM_PROMPT },
      { role: 'user', content: reconcilePrompt },
    ]);

    const responseText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    // Parse JSON response
    let reconcileData: {
      analysis: string;
      chosen: 'primary' | 'verification' | 'synthesized';
      final_answer: string;
      confidence: number;
    };

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reconcileData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      console.warn('[Reconcile] Failed to parse reconciliation response');
      // Default to primary answer if parsing fails
      reconcileData = {
        analysis: 'Reconciliation parsing failed',
        chosen: 'primary',
        final_answer: primaryAnswer,
        confidence: 0.5,
      };
    }

    const reconciliation: ReconciliationResult = {
      model: process.env.RECONCILIATION_MODEL || 'gpt-4o',
      resolution: reconcileData.analysis,
      chosen: reconcileData.chosen,
    };

    return {
      reconciliation,
      finalAnswer: reconcileData.final_answer,
      confidence: reconcileData.confidence,
    };
  } catch (error) {
    console.error('[Reconcile] Error calling reconciliation model:', error);

    // On error, default to primary answer
    return {
      reconciliation: {
        model: process.env.RECONCILIATION_MODEL || 'gpt-4o',
        resolution: 'Reconciliation failed due to API error, using primary answer',
        chosen: 'primary',
      },
      finalAnswer: primaryAnswer,
      confidence: 0.5,
    };
  }
}
