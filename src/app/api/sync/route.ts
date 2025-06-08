import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/server-auth';
import { syncAllContacts } from '@/lib/sync-service';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await syncAllContacts(auth);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing contacts:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 