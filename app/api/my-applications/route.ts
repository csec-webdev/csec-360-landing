import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ensureUserExists } from '@/lib/db-queries';

// GET - Fetch user's custom application list
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await ensureUserExists(session.user.email, session.user.name);

    if (!supabase) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('user_application_lists')
      .select(`
        application_id,
        order_index,
        applications (
          id,
          name,
          description,
          url,
          image_url,
          auth_type
        )
      `)
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching my applications:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to match ApplicationWithDepartments format
    const applications = await Promise.all(
      (data || []).map(async (item: any) => {
        const app = item.applications;
        
        // Fetch departments for each application
        const { data: deptData } = await supabase
          .from('application_departments')
          .select(`
            departments (
              id,
              name
            )
          `)
          .eq('application_id', app.id);

        const departments = (deptData || []).map((d: any) => d.departments);

        return {
          ...app,
          departments,
        };
      })
    );

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error in my-applications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add application to user's custom list
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId } = await request.json();

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const userId = await ensureUserExists(session.user.email, session.user.name);

    if (!supabase) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Get the current max order_index for this user
    const { data: maxOrderData } = await supabase
      .from('user_application_lists')
      .select('order_index')
      .eq('user_id', userId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const newOrderIndex = maxOrderData ? maxOrderData.order_index + 1 : 0;

    // Insert the new application
    const { error } = await supabase
      .from('user_application_lists')
      .insert({
        user_id: userId,
        application_id: applicationId,
        order_index: newOrderIndex,
      });

    if (error) {
      console.error('Error adding to my applications:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in my-applications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove application from user's custom list
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const userId = await ensureUserExists(session.user.email, session.user.name);

    if (!supabase) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { error } = await supabase
      .from('user_application_lists')
      .delete()
      .eq('user_id', userId)
      .eq('application_id', applicationId);

    if (error) {
      console.error('Error removing from my applications:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in my-applications DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
