import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_key4(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px key 4";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="9" cy="4.5" fill={secondaryfill} r="1"/>
		<path d="M12.75,5c0-2.071-1.679-3.75-3.75-3.75s-3.75,1.679-3.75,3.75c0,1.435,.816,2.667,2,3.298v6.202l1.75,2.25,1.75-2.25v-1.75l-1.25-1.25,1.25-1.25v-1.952c1.184-.63,2-1.863,2-3.298Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_key4;