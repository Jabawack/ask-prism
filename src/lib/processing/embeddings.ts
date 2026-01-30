import { OpenAIEmbeddings } from '@langchain/openai';

let embeddingsClient: OpenAIEmbeddings | null = null;

function getEmbeddingsClient(): OpenAIEmbeddings {
  if (!embeddingsClient) {
    embeddingsClient = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      dimensions: 1536,
      batchSize: 100,
    });
  }
  return embeddingsClient;
}

export async function embedText(text: string): Promise<number[]> {
  const client = getEmbeddingsClient();
  return client.embedQuery(text);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }
  const client = getEmbeddingsClient();
  return client.embedDocuments(texts);
}

export async function embedLargeBatch(
  texts: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<number[][]> {
  const BATCH_SIZE = 100;
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchEmbeddings = await embedBatch(batch);
    embeddings.push(...batchEmbeddings);

    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, texts.length), texts.length);
    }
  }

  return embeddings;
}
