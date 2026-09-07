/**
 * Block editor registration for the PCP Mileage Calculator.
 *
 * Written as plain ES5-compatible JavaScript against the `wp.*` globals, so the
 * plugin needs no build step of its own and no JSX transform.
 *
 * The editor deliberately shows a lightweight placeholder rather than booting
 * the calculator inside the editor iframe: the settings panel is what an author
 * needs here, and a static preview cannot break.
 */
(function (blocks, element, blockEditor, components, i18n) {
	'use strict';

	var el = element.createElement;
	var __ = i18n.__;
	var InspectorControls = blockEditor.InspectorControls;
	var useBlockProps = blockEditor.useBlockProps;
	var PanelBody = components.PanelBody;
	var SelectControl = components.SelectControl;
	var TextControl = components.TextControl;
	var ToggleControl = components.ToggleControl;
	var Placeholder = components.Placeholder;

	blocks.registerBlockType('pcp/mileage-calculator', {
		edit: function (props) {
			var attributes = props.attributes;
			var setAttributes = props.setAttributes;
			var isFull = attributes.sections === 'full';

			var summary = isFull
				? __(
						'Calculator, plus the "how it works", explanation and FAQ sections.',
						'pcp-mileage-calculator'
				  )
				: __('The calculator on its own.', 'pcp-mileage-calculator');

			var inspector = el(
				InspectorControls,
				{},
				el(
					PanelBody,
					{ title: __('Calculator settings', 'pcp-mileage-calculator') },
					el(SelectControl, {
						label: __('What to show', 'pcp-mileage-calculator'),
						value: attributes.sections,
						options: [
							{
								label: __('Calculator only', 'pcp-mileage-calculator'),
								value: 'calculator',
							},
							{
								label: __(
									'Calculator plus explanatory content',
									'pcp-mileage-calculator'
								),
								value: 'full',
							},
						],
						onChange: function (value) {
							setAttributes({ sections: value });
						},
						help: __(
							'For search visibility, prefer "Calculator only" and write your own explanatory content in the page.',
							'pcp-mileage-calculator'
						),
					}),
					el(TextControl, {
						label: __('Heading above the calculator', 'pcp-mileage-calculator'),
						value: attributes.heading,
						onChange: function (value) {
							setAttributes({ heading: value });
						},
						help: __(
							'Optional. Leave blank if the page already has its own heading.',
							'pcp-mileage-calculator'
						),
					}),
					el(ToggleControl, {
						label: __('Remember entries in the browser', 'pcp-mileage-calculator'),
						checked: !!attributes.persist,
						onChange: function (value) {
							setAttributes({ persist: value });
						},
						help: __(
							'Saves the visitor’s entries to their own browser only, with a clear-data button. Nothing is sent to your server.',
							'pcp-mileage-calculator'
						),
					}),
					isFull
						? el(ToggleControl, {
								label: __('Add FAQ structured data', 'pcp-mileage-calculator'),
								checked: !!attributes.faqSchema,
								onChange: function (value) {
									setAttributes({ faqSchema: value });
								},
								help: __(
									'Leave off if this page already publishes FAQ schema from an SEO plugin.',
									'pcp-mileage-calculator'
								),
						  })
						: null
				)
			);

			return el(
				'div',
				useBlockProps ? useBlockProps() : {},
				inspector,
				el(
					Placeholder,
					{
						icon: 'dashboard',
						label: __('PCP Mileage Calculator', 'pcp-mileage-calculator'),
						instructions: summary,
					},
					el(
						'p',
						{ style: { margin: 0, fontSize: '13px', opacity: 0.75 } },
						attributes.heading
							? __('Heading: ', 'pcp-mileage-calculator') + attributes.heading
							: __(
									'The calculator appears here on the published page.',
									'pcp-mileage-calculator'
							  )
					)
				)
			);
		},

		// Rendered in PHP so the block and the shortcode share one code path.
		save: function () {
			return null;
		},
	});
})(window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n);
