-- Create afterscribe_notes table
CREATE TABLE IF NOT EXISTS public.afterscribe_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  session_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.afterscribe_notes ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own notes
CREATE POLICY "Users can view their own notes" 
  ON public.afterscribe_notes
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own notes
CREATE POLICY "Users can insert their own notes" 
  ON public.afterscribe_notes
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own notes
CREATE POLICY "Users can update their own notes" 
  ON public.afterscribe_notes
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for users to delete their own notes
CREATE POLICY "Users can delete their own notes" 
  ON public.afterscribe_notes
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS afterscribe_notes_user_id_idx ON public.afterscribe_notes(user_id);
CREATE INDEX IF NOT EXISTS afterscribe_notes_session_id_idx ON public.afterscribe_notes(session_id);
