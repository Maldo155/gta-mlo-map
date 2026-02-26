-- Apply Neon Cyber format to FiveM servers banner
update public.site_banner_servers
set
  font_family = 'Bebas Neue',
  title_font_size = 36,
  subtitle_font_size = 18,
  title_font_weight = '900',
  letter_spacing = '1.2px',
  title_font_color = '#ffffff',
  subtitle_color = '#67e8f9',
  background_color = '#0f172a',
  border_color = '#22d3ee',
  animation = 'flash',
  updated_at = now()
where id = 1;
