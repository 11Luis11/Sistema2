// Test Neon database connection
import { sql } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test connection to Neon
    const result = await sql('SELECT NOW() as current_time');
    
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Neon database',
      timestamp: result[0].current_time,
      connectionStatus: 'Active',
    });
  } catch (error) {
    console.error('[DB Connection Error]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to connect to Neon database',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
