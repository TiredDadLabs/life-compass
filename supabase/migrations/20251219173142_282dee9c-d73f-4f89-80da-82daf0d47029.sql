-- Remove the check constraint on the relationship column to allow custom values
ALTER TABLE public.people DROP CONSTRAINT IF EXISTS people_relationship_check;