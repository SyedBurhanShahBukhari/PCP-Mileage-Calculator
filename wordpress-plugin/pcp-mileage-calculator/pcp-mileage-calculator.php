<?php
/**
 * Plugin Name:       PCP Mileage Calculator
 * Plugin URI:        https://github.com/SyedBurhanShahBukhari/PCP-Mileage-Calculator
 * Description:       An accessible PCP mileage calculator. Shows whether a driver is on track, how many miles they can safely drive from now, and an estimated excess mileage charge. Everything is calculated in the visitor's browser — nothing is sent to a server.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            PCP Mileage
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       pcp-mileage-calculator
 *
 * @package PCP_Mileage_Calculator
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // No direct file access.
}

define( 'PCP_MILEAGE_CALCULATOR_VERSION', '1.0.0' );
define( 'PCP_MILEAGE_CALCULATOR_FILE', __FILE__ );
define( 'PCP_MILEAGE_CALCULATOR_DIR', plugin_dir_path( __FILE__ ) );
define( 'PCP_MILEAGE_CALCULATOR_URL', plugin_dir_url( __FILE__ ) );

/**
 * Registers the front-end assets.
 *
 * They are only *registered* here. The shortcode and block enqueue them at
 * render time, so a page without the calculator ships none of this code.
 *
 * The bundle is a self-contained IIFE with React compiled in, so it does not
 * depend on the React version WordPress happens to ship, and needs no module
 * or import-map handling. Its CSS is scoped under `.pcp-mc`, so it cannot
 * restyle the surrounding theme.
 *
 * @return void
 */
function pcp_mileage_calculator_register_assets() {
	wp_register_script(
		'pcp-mileage-calculator',
		PCP_MILEAGE_CALCULATOR_URL . 'assets/pcp-mileage-calculator.js',
		array(),
		PCP_MILEAGE_CALCULATOR_VERSION,
		true
	);

	wp_register_style(
		'pcp-mileage-calculator',
		PCP_MILEAGE_CALCULATOR_URL . 'assets/pcp-mileage-calculator.css',
		array(),
		PCP_MILEAGE_CALCULATOR_VERSION
	);
}
add_action( 'init', 'pcp_mileage_calculator_register_assets' );

/**
 * Normalises a truthy shortcode or block attribute.
 *
 * Accepts the spellings people actually type in a shortcode.
 *
 * @param mixed $value   Raw attribute value.
 * @param bool  $default Value to use when the attribute is absent.
 * @return bool
 */
function pcp_mileage_calculator_to_bool( $value, $default = false ) {
	if ( null === $value || '' === $value ) {
		return $default;
	}
	if ( is_bool( $value ) ) {
		return $value;
	}
	return in_array( strtolower( (string) $value ), array( 'yes', 'true', '1', 'on' ), true );
}

/**
 * Renders the calculator placeholder.
 *
 * The React bundle mounts into every element carrying the
 * `data-pcp-mileage-calculator` attribute and reads its configuration from the
 * remaining data attributes.
 *
 * @param array $atts Shortcode or block attributes.
 * @return string Escaped HTML.
 */
function pcp_mileage_calculator_render( $atts = array() ) {
	$atts = shortcode_atts(
		array(
			'sections'   => 'calculator',
			'heading'    => '',
			'persist'    => 'yes',
			'faq_schema' => 'no',
			'class'      => '',
		),
		is_array( $atts ) ? $atts : array(),
		'pcp_mileage_calculator'
	);

	wp_enqueue_script( 'pcp-mileage-calculator' );
	wp_enqueue_style( 'pcp-mileage-calculator' );

	$sections   = ( 'full' === strtolower( (string) $atts['sections'] ) ) ? 'full' : 'calculator';
	$persist    = pcp_mileage_calculator_to_bool( $atts['persist'], true );
	$faq_schema = pcp_mileage_calculator_to_bool( $atts['faq_schema'], false );

	$classes = trim( 'pcp-mileage-calculator-embed ' . sanitize_html_class( (string) $atts['class'], '' ) );

	$attributes = array(
		'class'                        => $classes,
		'data-pcp-mileage-calculator'  => '1',
		'data-sections'                => $sections,
		'data-heading'                 => wp_strip_all_tags( (string) $atts['heading'] ),
		'data-persist'                 => $persist ? 'yes' : 'no',
		'data-faq-schema'              => $faq_schema ? 'yes' : 'no',
	);

	$rendered = '';
	foreach ( $attributes as $name => $value ) {
		if ( '' === $value ) {
			continue;
		}
		$rendered .= sprintf( ' %s="%s"', esc_attr( $name ), esc_attr( $value ) );
	}

	$noscript = esc_html__(
		'This mileage calculator needs JavaScript. Please enable JavaScript in your browser to use it.',
		'pcp-mileage-calculator'
	);

	return sprintf(
		'<div%1$s><noscript><p>%2$s</p></noscript></div>',
		$rendered,
		$noscript
	);
}

add_shortcode( 'pcp_mileage_calculator', 'pcp_mileage_calculator_render' );

/**
 * Registers the block and its editor script.
 *
 * The block is dynamic: the editor shows a lightweight placeholder with the
 * settings panel, and the published page renders through the same callback the
 * shortcode uses, so the two can never drift apart.
 *
 * @return void
 */
function pcp_mileage_calculator_register_block() {
	if ( ! function_exists( 'register_block_type' ) ) {
		return; // Classic-editor-only installs still have the shortcode.
	}

	wp_register_script(
		'pcp-mileage-calculator-editor',
		PCP_MILEAGE_CALCULATOR_URL . 'editor/editor.js',
		array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n' ),
		PCP_MILEAGE_CALCULATOR_VERSION,
		true
	);

	if ( function_exists( 'wp_set_script_translations' ) ) {
		wp_set_script_translations( 'pcp-mileage-calculator-editor', 'pcp-mileage-calculator' );
	}

	register_block_type(
		'pcp/mileage-calculator',
		array(
			'api_version'     => 2,
			'title'           => __( 'PCP Mileage Calculator', 'pcp-mileage-calculator' ),
			'category'        => 'widgets',
			'icon'            => 'dashboard',
			'description'     => __( 'Embed the PCP mileage calculator.', 'pcp-mileage-calculator' ),
			'editor_script'   => 'pcp-mileage-calculator-editor',
			'attributes'      => array(
				'sections'  => array(
					'type'    => 'string',
					'default' => 'calculator',
				),
				'heading'   => array(
					'type'    => 'string',
					'default' => '',
				),
				'persist'   => array(
					'type'    => 'boolean',
					'default' => true,
				),
				'faqSchema' => array(
					'type'    => 'boolean',
					'default' => false,
				),
			),
			'render_callback' => 'pcp_mileage_calculator_render_block',
		)
	);
}
add_action( 'init', 'pcp_mileage_calculator_register_block', 20 );

/**
 * Maps block attributes onto the shared renderer.
 *
 * @param array $attributes Block attributes.
 * @return string
 */
function pcp_mileage_calculator_render_block( $attributes ) {
	$attributes = is_array( $attributes ) ? $attributes : array();

	return pcp_mileage_calculator_render(
		array(
			'sections'   => isset( $attributes['sections'] ) ? $attributes['sections'] : 'calculator',
			'heading'    => isset( $attributes['heading'] ) ? $attributes['heading'] : '',
			'persist'    => ! empty( $attributes['persist'] ) ? 'yes' : 'no',
			'faq_schema' => ! empty( $attributes['faqSchema'] ) ? 'yes' : 'no',
		)
	);
}

/**
 * Adds a Settings-adjacent "How to use" link on the Plugins screen.
 *
 * @param array $links Existing action links.
 * @return array
 */
function pcp_mileage_calculator_action_links( $links ) {
	$hint = sprintf(
		'<span aria-hidden="true">%s</span>',
		esc_html( '[pcp_mileage_calculator]' )
	);
	array_unshift( $links, $hint );

	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'pcp_mileage_calculator_action_links' );
