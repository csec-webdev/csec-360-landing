import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ensureUserExists } from '@/lib/db-queries';

// PUT - Update the order of applications in user's custom list
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderedApplicationIds } = await request.json();

    if (!Array.isArray(orderedApplicationIds)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const userId = await ensureUserExists(session.user.email, session.user.name);

    if (!supabase) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Store supabase in a const to help TypeScript with type narrowing
    const db = supabase;

    // Update each application's order_index
    const updates = orderedApplicationIds.map((appId, index) => 
      db
        .from('user_application_lists')
        .update({ order_index: index })
        .eq('user_id', userId)
        .eq('application_id', appId)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
