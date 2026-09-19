-- Add editable, publicly published policy pages and keep their footer links in site settings.
ALTER TABLE public.page_content DROP CONSTRAINT IF EXISTS page_content_page_id_check;
ALTER TABLE public.page_content ADD CONSTRAINT page_content_page_id_check
	CHECK (page_id IN ('home', 'shop', 'solutions', 'about', 'contact', 'category', 'product', 'work', 'services', 'studio', 'privacy', 'terms', 'cookies'));
ALTER TABLE public.page_published_content DROP CONSTRAINT IF EXISTS page_published_content_page_id_check;
ALTER TABLE public.page_published_content ADD CONSTRAINT page_published_content_page_id_check
	CHECK (page_id IN ('home', 'shop', 'solutions', 'about', 'contact', 'category', 'product', 'work', 'services', 'studio', 'privacy', 'terms', 'cookies'));

DO $$
DECLARE
	privacy jsonb := jsonb_build_object(
		'version', 1, 'pageId', 'privacy', 'title', 'Privacy Policy',
		'description', 'How Triad Studio collects, uses and protects information when you use this website or contact us.',
		'blocks', jsonb_build_array(
			jsonb_build_object('id', 'privacy_intro', 'kind', 'rich_text', 'label', 'Privacy Policy introduction', 'visible', true, 'mobileVisible', true, 'content', jsonb_build_object('eyebrow', 'Triad Studio', 'heading', 'Your information, handled with care.', 'body', 'How Triad Studio collects, uses and protects information when you use this website or contact us.'), 'items', jsonb_build_array(), 'design', jsonb_build_object()),
			jsonb_build_object('id', 'privacy_section_1', 'kind', 'rich_text', 'label', 'Information we collect', 'visible', true, 'mobileVisible', true, 'content', jsonb_build_object('heading', 'Information we collect', 'body', 'We collect information you choose to send us through enquiry forms, email, WhatsApp or other direct contact. This may include your name, contact details, company, project requirements and any files or context you provide.'), 'items', jsonb_build_array(), 'design', jsonb_build_object()),
			jsonb_build_object('id', 'privacy_section_2', 'kind', 'rich_text', 'label', 'How we use information', 'visible', true, 'mobileVisible', true, 'content', jsonb_build_object('heading', 'How we use information', 'body', 'We use enquiry information to respond to requests, prepare proposals, deliver projects, provide support and improve our services. We do not sell personal information or use it for unrelated marketing without a lawful basis or your consent.'), 'items', jsonb_build_array(), 'design', jsonb_build_object()),
			jsonb_build_object('id', 'privacy_section_3', 'kind', 'rich_text', 'label', 'Your choices', 'visible', true, 'mobileVisible', true, 'content', jsonb_build_object('heading', 'Your choices', 'body', 'You may ask us to access, correct or delete personal information we hold about you, subject to applicable law. Contact us at hello@triad.studio and include enough detail for us to identify your request.'), 'items', jsonb_build_array(), 'design', jsonb_build_object())
		), 'seo', jsonb_build_object('title', 'Privacy Policy — Triad Studio', 'description', 'Triad Studio privacy policy.', 'canonical', '/privacy-policy')
	);
	terms jsonb := jsonb_build_object(
		'version', 1, 'pageId', 'terms', 'title', 'Terms of Use',
		'description', 'The terms that apply when you browse this website, request a quote or engage Triad Studio.',
		'blocks', jsonb_build_array(
			jsonb_build_object('id', 'terms_intro', 'kind', 'rich_text', 'label', 'Terms of Use introduction', 'visible', true, 'mobileVisible', true, 'content', jsonb_build_object('eyebrow', 'Triad Studio', 'heading', 'Clear expectations make better work.', 'body', 'The terms that apply when you browse this website, request a quote or engage Triad Studio.'), 'items', jsonb_build_array(), 'design', jsonb_build_object()),
			jsonb_build_object('id', 'terms_section_1', 'kind', 'rich_text', 'label', 'Using this website', 'visible', true, 'mobileVisible', true, 'content', jsonb_build_object('heading', 'Using this website', 'body', 'You may use this website for lawful, personal or business purposes. You must not misuse the website, interfere with its operation, attempt unauthorised access or use its content in a way that infringes another person''s rights.'), 'items', jsonb_build_array(), 'design', jsonb_build_object()),
			jsonb_build_object('id', 'terms_section_2', 'kind', 'rich_text', 'label', 'Enquiries and quotes', 'visible', true, 'mobileVisible', true, 'content', jsonb_build_object('heading', 'Enquiries and quotes', 'body', 'An enquiry is not an order or a binding commitment. Prices, timelines, specifications and availability are confirmed in a written proposal or order confirmation.'), 'items', jsonb_build_array(), 'design', jsonb_build_object()),
			jsonb_build_object('id', 'terms_section_3', 'kind', 'rich_text', 'label', 'Intellectual property', 'visible', true, 'mobileVisible', true, 'content', jsonb_build_object('heading', 'Intellectual property', 'body', 'Unless agreed otherwise in writing, Triad Studio retains rights in its pre-existing tools, methods and unused concepts. Rights in final approved work transfer only as stated in the relevant project agreement and after outstanding invoices are settled.'), 'items', jsonb_build_array(), 'design', jsonb_build_object())
		), 'seo', jsonb_build_object('title', 'Terms of Use — Triad Studio', 'description', 'Triad Studio terms of use.', 'canonical', '/terms')
	);
	cookies jsonb := jsonb_build_object(
		'version', 1, 'pageId', 'cookies', 'title', 'Cookie Policy',
		'description', 'How Triad Studio uses cookies and similar technologies on this website.',
		'blocks', jsonb_build_array(
			jsonb_build_object('id', 'cookies_intro', 'kind', 'rich_text', 'label', 'Cookie Policy introduction', 'visible', true, 'mobileVisible', true, 'content', jsonb_build_object('eyebrow', 'Triad Studio', 'heading', 'A small note about cookies.', 'body', 'How Triad Studio uses cookies and similar technologies on this website.'), 'items', jsonb_build_array(), 'design', jsonb_build_object()),
			jsonb_build_object('id', 'cookies_section_1', 'kind', 'rich_text', 'label', 'What cookies are', 'visible', true, 'mobileVisible', true, 'content', jsonb_build_object('heading', 'What cookies are', 'body', 'Cookies are small text files stored on your device by a website. They help a site remember preferences, keep pages working and understand broad usage patterns.'), 'items', jsonb_build_array(), 'design', jsonb_build_object()),
			jsonb_build_object('id', 'cookies_section_2', 'kind', 'rich_text', 'label', 'How we use them', 'visible', true, 'mobileVisible', true, 'content', jsonb_build_object('heading', 'How we use them', 'body', 'Triad Studio may use essential cookies or browser storage to support site functionality and remember technical preferences. We may also use limited, privacy-conscious analytics where enabled to understand which pages are useful.'), 'items', jsonb_build_array(), 'design', jsonb_build_object()),
			jsonb_build_object('id', 'cookies_section_3', 'kind', 'rich_text', 'label', 'Your controls', 'visible', true, 'mobileVisible', true, 'content', jsonb_build_object('heading', 'Your controls', 'body', 'You can block or delete cookies through your browser settings. Some site features may not work as intended when essential storage is disabled.'), 'items', jsonb_build_array(), 'design', jsonb_build_object())
		), 'seo', jsonb_build_object('title', 'Cookie Policy — Triad Studio', 'description', 'Triad Studio cookie policy.', 'canonical', '/cookies')
	);
	page jsonb;
	page_key text;
BEGIN
	FOREACH page_key IN ARRAY ARRAY['privacy', 'terms', 'cookies'] LOOP
		page := CASE page_key WHEN 'privacy' THEN privacy WHEN 'terms' THEN terms ELSE cookies END;
		INSERT INTO public.page_content (page_id, draft, published, draft_revision, published_revision)
		VALUES (page_key, page, page, 1, 1)
		ON CONFLICT (page_id) DO NOTHING;
		INSERT INTO public.page_published_content (page_id, document, revision)
		VALUES (page_key, page, 1)
		ON CONFLICT (page_id) DO NOTHING;
	END LOOP;

	INSERT INTO public.site_settings (key, value)
	VALUES ('navigation', '[{"label":"Privacy","href":"/privacy-policy","target":"_self"},{"label":"Terms","href":"/terms","target":"_self"},{"label":"Cookies","href":"/cookies","target":"_self"}]'::jsonb)
	ON CONFLICT (key) DO UPDATE SET value = (
		SELECT coalesce(jsonb_agg(link), '[]'::jsonb)
		FROM jsonb_array_elements(CASE WHEN jsonb_typeof(public.site_settings.value) = 'array' THEN public.site_settings.value ELSE '[]'::jsonb END) link
		WHERE link->>'href' NOT IN ('/privacy-policy', '/terms', '/cookies')
	) || EXCLUDED.value;
END $$;
