import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { ensureUserExists } from '@/lib/db-queries';

// GET - Fetch all application requests (admin only for full list, users see their own)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const userId = await ensureUserExists(session.user.email, session.user.name);

    // If admin, get all requests; otherwise, get only user's own requests
    let query = supabase
      .from('application_requests')
      .select(`
        *,
        users!requested_by (
          email,
          name
        ),
        application_request_departments(
          departments(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (!session.user.isAdmin) {
      query = query.eq('requested_by', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching application requests:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data
    const requests = data.map((req: any) => ({
      ...req,
      departments: req.application_request_departments?.map((rd: any) => rd.departments) || [],
      requestedBy: req.users,
    }));

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error in application-requests GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new application request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, url, image_url, auth_type, departmentIds } = await request.json();

    if (!name || !url || !auth_type) {
      return NextResponse.json(
        { error: 'Name, URL, and auth type are required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const userId = await ensureUserExists(session.user.email, session.user.name);

    // Insert the application request
    const { data: newRequest, error: insertError } = await supabase
      .from('application_requests')
      .insert({
        name,
        description,
        url,
        image_url,
        auth_type,
        requested_by: userId,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating application request:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Add department associations if provided
    if (departmentIds && departmentIds.length > 0) {
      const associations = departmentIds.map((depId: string) => ({
        request_id: newRequest.id,
        department_id: depId,
      }));

      const { error: assocError } = await supabase
        .from('application_request_departments')
        .insert(associations);

      if (assocError) {
        console.error('Error adding department associations:', assocError);
        // Don't fail the request creation, just log the error
      }
    }

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error in application-requests POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
