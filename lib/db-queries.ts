import { supabase, supabaseAdmin } from './supabase';
import { Application, Department, ApplicationWithDepartments } from '@/types';

// User Management
export async function ensureUserExists(email: string, name?: string): Promise<string> {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  // Try to find existing user by email
  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    return existingUser.id;
  }

  // User doesn't exist, create new user
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({ email, name })
    .select('id')
    .single();

  if (insertError) throw insertError;
  return newUser.id;
}

// Applications
export async function getApplications(): Promise<ApplicationWithDepartments[]> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data: apps, error } = await supabase
    .from('applications')
    .select(`
      *,
      application_departments(
        departments(*)
      )
    `)
    .order('name');

  if (error) throw error;

  return apps.map(app => ({
    ...app,
    departments: app.application_departments?.map((ad: any) => ad.departments) || [],
  }));
}

export async function getApplicationById(id: string): Promise<ApplicationWithDepartments | null> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      application_departments(
        departments(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  return {
    ...data,
    departments: data.application_departments?.map((ad: any) => ad.departments) || [],
  };
}

export async function createApplication(
  app: Omit<Application, 'id' | 'created_at' | 'updated_at'>,
  departmentIds: string[]
) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
  const { data, error } = await supabaseAdmin
    .from('applications')
    .insert(app)
    .select()
    .single();

  if (error) throw error;

  // Add department associations
  if (departmentIds.length > 0) {
    const associations = departmentIds.map(depId => ({
      application_id: data.id,
      department_id: depId,
    }));

    if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
    const { error: assocError } = await supabaseAdmin
      .from('application_departments')
      .insert(associations);

    if (assocError) throw assocError;
  }

  return data;
}

export async function updateApplication(
  id: string,
  app: Partial<Application>,
  departmentIds?: string[]
) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
  const { data, error } = await supabaseAdmin
    .from('applications')
    .update(app)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Update department associations if provided
  if (departmentIds !== undefined) {
    if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
    // Delete existing associations
    await supabaseAdmin
      .from('application_departments')
      .delete()
      .eq('application_id', id);

    // Add new associations
    if (departmentIds.length > 0) {
      const associations = departmentIds.map(depId => ({
        application_id: id,
        department_id: depId,
      }));

      const { error: assocError } = await supabaseAdmin
        .from('application_departments')
        .insert(associations);

      if (assocError) throw assocError;
    }
  }

  return data;
}

export async function deleteApplication(id: string) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
  const { error } = await supabaseAdmin
    .from('applications')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Departments
export async function getDepartments(): Promise<Department[]> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function createDepartment(name: string) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
  const { data, error } = await supabaseAdmin
    .from('departments')
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDepartment(id: string, name: string) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
  const { data, error } = await supabaseAdmin
    .from('departments')
    .update({ name })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDepartment(id: string) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
  const { error } = await supabaseAdmin
    .from('departments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// User Favorites
export async function getUserFavorites(userId: string): Promise<string[]> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('user_favorites')
    .select('application_id')
    .eq('user_id', userId);

  if (error) throw error;
  return data.map(fav => fav.application_id);
}

export async function addFavorite(userId: string, applicationId: string) {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase
    .from('user_favorites')
    .insert({ user_id: userId, application_id: applicationId });

  if (error) throw error;
}

export async function removeFavorite(userId: string, applicationId: string) {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('application_id', applicationId);

  if (error) throw error;
}
