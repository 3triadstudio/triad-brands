UPDATE public.page_published_content
SET document = replace(
	replace(
		replace(
			replace(
				replace(document::text, 'Triad Studio', 'Triad Brands'),
				'hello@triad.studio',
				'hello@triadbrands.co.ke'
			),
			'About the studio',
			'About Triad Brands'
		),
		'Email the studio',
		'Email Triad Brands'
	),
	'"Studio"',
	'"Triad Brands"'
)::jsonb,
published_at = now()
WHERE document::text LIKE '%Triad Studio%'
	 OR document::text LIKE '%hello@triad.studio%'
	 OR document::text LIKE '%About the studio%'
	 OR document::text LIKE '%Email the studio%'
	 OR document::text LIKE '%"Studio"%';

UPDATE public.site_settings
SET value = replace(
	replace(value::text, 'Triad Studio', 'Triad Brands'),
	'hello@triad.studio',
	'hello@triadbrands.co.ke'
)::jsonb,
updated_at = now()
WHERE value::text LIKE '%Triad Studio%'
	 OR value::text LIKE '%hello@triad.studio%';
