-- Create a function to execute arbitrary SQL queries (requires admin privileges)
CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS TEXT AS $$
BEGIN
  EXECUTE query;
  RETURN 'SQL executed successfully';
EXCEPTION WHEN OTHERS THEN
  RETURN 'Error executing SQL: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
