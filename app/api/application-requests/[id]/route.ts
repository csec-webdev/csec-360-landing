import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// PUT - Update or approve an application request (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, admin_notes, approve, ...updateData } = body;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // If approving, create the actual application
    if (approve) {
      // Get the request details
      const { data: appRequest, error: fetchError } = await supabaseAdmin
        .from('application_requests')
        .select(`
          *,
          application_request_departments(
            department_id
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError || !appRequest) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }

      // Create the application
      const { data: newApp, error: createError } = await supabaseAdmin
        .from('applications')
        .insert({
          name: appRequest.name,
          description: appRequest.description,
          url: appRequest.url,
          image_url: appRequest.image_url,
          auth_type: appRequest.auth_type,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating application:', createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      // Add department associations
      if (appRequest.application_request_departments?.length > 0) {
        const associations = appRequest.application_request_departments.map((rd: any) => ({
          application_id: newApp.id,
          department_id: rd.department_id,
        }));

        const { error: assocError } = await supabaseAdmin
          .from('application_departments')
          .insert(associations);

        if (assocError) {
          console.error('Error adding department associations:', assocError);
        }
      }

      // Update request status to approved
      const { error: updateError } = await supabaseAdmin
        .from('application_requests')
        .update({ status: 'approved', admin_notes })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating request status:', updateError);
      }

      return NextResponse.json({ ...newApp, requestApproved: true });
    }

    // Otherwise, just update the request
    const { data, error } = await supabaseAdmin
      .from('application_requests')
      .update({ ...updateData, status, admin_notes })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating application request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in application-requests PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete an application request (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from('application_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting application request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in application-requests DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
