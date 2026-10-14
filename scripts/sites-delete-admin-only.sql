-- Solo el rol admin puede eliminar sedes.
-- Infraestructura conserva crear y editar.
-- Ejecutar en Supabase → SQL Editor → Run.

DROP POLICY IF EXISTS "Infrastructure and admins can manage sites" ON sites;

DROP POLICY IF EXISTS "Infrastructure and admins can insert sites" ON sites;
CREATE POLICY "Infrastructure and admins can insert sites"
  ON sites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'infrastructure')
    )
  );

DROP POLICY IF EXISTS "Infrastructure and admins can update sites" ON sites;
CREATE POLICY "Infrastructure and admins can update sites"
  ON sites FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'infrastructure')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'infrastructure')
    )
  );

DROP POLICY IF EXISTS "Admins can delete sites" ON sites;
CREATE POLICY "Admins can delete sites"
  ON sites FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
