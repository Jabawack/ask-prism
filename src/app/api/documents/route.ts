import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { createDocument, listDocuments } from '@/lib/supabase/client';
import { detectFileType } from '@/lib/processing/extractors';
import { processDocumentV2, ProcessingMode } from '@/lib/processing/processor-v2';
import { Document } from '@/lib/supabase/types';

const DEMO_USER_ID = 'demo-user';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const processingMode = (formData.get('processingMode') as ProcessingMode) || 'basic';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileType = detectFileType(file.name);
    if (!fileType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Supported: PDF, TXT, DOCX' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate processing mode
    if (!['basic', 'standard', 'advanced'].includes(processingMode)) {
      return NextResponse.json(
        { error: 'Invalid processing mode. Supported: basic, standard, advanced' },
        { status: 400 }
      );
    }

    const blob = await put(`documents/${uuidv4()}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    const document = await createDocument({
      user_id: DEMO_USER_ID,
      filename: file.name,
      storage_url: blob.url,
      status: 'uploading',
      file_type: fileType,
      file_size: file.size,
      processing_mode: processingMode,
    });

    // Process asynchronously with the selected mode
    processDocumentAsync(document, file, processingMode);

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('[API] Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const documents = await listDocuments(DEMO_USER_ID);
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('[API] List documents error:', error);
    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    );
  }
}

async function processDocumentAsync(
  document: Document,
  file: File,
  mode: ProcessingMode
) {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processDocumentV2(document, buffer, { mode });

    if (!result.success) {
      console.error('[API] Document processing failed:', result.error);
    } else {
      console.log(`[API] Document processed: ${result.chunkCount} chunks, mode: ${result.actualMode}`);
    }
  } catch (error) {
    console.error('[API] Document processing failed:', error);
  }
}
