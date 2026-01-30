import { NextRequest, NextResponse } from 'next/server';
import {
  getFieldsAtThreshold,
  getAllPendingFields,
  promoteField,
  ignoreField,
  dismissField,
} from '@/lib/analytics/field-discovery';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    let fields;

    if (status === 'threshold') {
      fields = await getFieldsAtThreshold();
    } else {
      fields = await getAllPendingFields();
    }

    return NextResponse.json({ fields });
  } catch (error) {
    console.error('[API] Get fields error:', error);
    return NextResponse.json(
      { error: 'Failed to get fields' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { fieldId, action } = body;

    if (!fieldId || !action) {
      return NextResponse.json(
        { error: 'fieldId and action are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'promote':
        result = await promoteField(fieldId);
        break;
      case 'ignore':
        result = await ignoreField(fieldId);
        break;
      case 'dismiss':
        await dismissField(fieldId);
        result = { id: fieldId, status: 'dismissed' };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use promote, ignore, or dismiss' },
          { status: 400 }
        );
    }

    return NextResponse.json({ field: result });
  } catch (error) {
    console.error('[API] Update field error:', error);
    return NextResponse.json(
      { error: 'Failed to update field' },
      { status: 500 }
    );
  }
}
