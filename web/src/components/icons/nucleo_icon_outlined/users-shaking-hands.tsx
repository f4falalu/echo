import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_usersShakingHands(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px users shaking hands";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="3.75" cy="3.5" fill="none" r="1.75" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="14.25" cy="3.5" fill="none" r="1.75" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M5.75,12.75v1.5c0,.552-.448,1-1,1H2.75c-.552,0-1-.448-1-1v-4.5c0-1.105,.895-2,2-2h0c1.105,0,1.641,.66,2.109,1.734,.423,.969,1.287,1.406,1.961,1.604" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M12.25,12.75v1.5c0,.552,.448,1,1,1h2c.552,0,1-.448,1-1v-4.5c0-1.105-.895-2-2-2h0c-1.105,0-1.641,.66-2.109,1.734-.423,.969-1.287,1.406-1.961,1.604" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_usersShakingHands;