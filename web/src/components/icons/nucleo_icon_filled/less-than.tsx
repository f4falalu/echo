import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_lessThan(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px less than";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m14.249,16c-.1299,0-.2627-.0342-.3828-.1055L3.3662,9.6445c-.2266-.1353-.3662-.3804-.3662-.6445s.1396-.5093.3662-.6445L13.8662,2.1055c.3564-.2114.8164-.0938,1.0283.2607.2119.356.0947.8164-.2607,1.0283l-9.417,5.6055,9.417,5.6055c.3555.2119.4727.6724.2607,1.0283-.1406.2354-.3896.3662-.6455.3662Z" fill={fill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default 18px_lessThan;