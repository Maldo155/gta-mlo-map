-- Gate tile click counts (MLO, Map, Cities) - shared across all visitors

CREATE TABLE IF NOT EXISTS gate_clicks (
  id integer PRIMARY KEY DEFAULT 1,
  mlo bigint NOT NULL DEFAULT 0,
  map bigint NOT NULL DEFAULT 0,
  cities bigint NOT NULL DEFAULT 0
);

INSERT INTO gate_clicks (id, mlo, map, cities)
VALUES (1, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

DROP FUNCTION IF EXISTS increment_gate_click(text);

CREATE OR REPLACE FUNCTION increment_gate_click(p_tile text)
RETURNS TABLE (mlo bigint, map bigint, cities bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_tile = 'mlo' THEN
    UPDATE gate_clicks SET mlo = mlo + 1 WHERE id = 1;
  ELSIF p_tile = 'map' THEN
    UPDATE gate_clicks SET map = map + 1 WHERE id = 1;
  ELSIF p_tile = 'cities' THEN
    UPDATE gate_clicks SET cities = cities + 1 WHERE id = 1;
  END IF;
  RETURN QUERY SELECT gc.mlo, gc.map, gc.cities FROM gate_clicks gc WHERE id = 1;
END;
$$;
