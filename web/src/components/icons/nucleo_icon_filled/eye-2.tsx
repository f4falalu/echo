import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function eye2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "eye 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="9" cy="9" fill={secondaryfill} r="3.5"/>
		<path d="M1.75,9.75c-.076,0-.153-.012-.23-.036-.394-.127-.611-.549-.484-.944,.02-.06,2.007-6.02,7.964-6.02s7.945,5.962,7.965,6.022c.125,.394-.092,.814-.486,.941-.395,.128-.815-.091-.943-.484-.065-.203-1.666-4.979-6.536-4.979S2.48,9.18,2.464,9.23c-.103,.318-.397,.52-.714,.52Z" fill={fill}/>
	</g>
</svg>
	);
};

export default eye2;