-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own transcripts" ON public.transcripts2;
DROP POLICY IF EXISTS "Users can insert their own transcripts" ON public.transcripts2;
DROP POLICY IF EXISTS "Users can update their own transcripts" ON public.transcripts2;
DROP POLICY IF EXISTS "Users can delete their own transcripts" ON public.transcripts2;

-- Enable Row Level Security
ALTER TABLE public.transcripts2 ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Policy for users to select their own transcripts
CREATE POLICY "Users can view their own transcripts" 
ON public.transcripts2
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for users to insert their own transcripts
CREATE POLICY "Users can insert their own transcripts" 
ON public.transcripts2
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own transcripts
CREATE POLICY "Users can update their own transcripts" 
ON public.transcripts2
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy for users to delete their own transcripts
CREATE POLICY "Users can delete their own transcripts" 
ON public.transcripts2
FOR DELETE 
USING (auth.uid() = user_id);

-- Make sure the user_id column exists and has a not null constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transcripts2' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.transcripts2 ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END
$$;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS transcripts2_user_id_idx ON public.transcripts2(user_id);
