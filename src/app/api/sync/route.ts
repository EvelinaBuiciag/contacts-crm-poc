import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/server-auth';
import { syncAllContacts } from '@/lib/sync-service';

// Set timeout for API routes
const TIMEOUT = 50000; // 50 seconds

// Helper function to handle timeouts
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting sync operation');
    const auth = getAuthFromRequest(request);
    if (!auth.customerId) {
      console.log('No customer ID found in auth');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('Auth validated, customer ID:', auth.customerId);

    // Start sync with timeout
    console.log('Starting contact sync...');
    await withTimeout(syncAllContacts(auth), TIMEOUT);
    console.log('Sync completed successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Contacts synchronized successfully'
    });
  } catch (error) {
    console.error('Error in sync operation:', error);
    if (error instanceof Error && error.message.includes('timed out')) {
      return NextResponse.json(
        { error: 'Request timeout', details: error.message },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 