import React from 'react';
import { iconProps } from './iconProps';



function sack(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px sack";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M7.25,4.75c-2.391,1.281-4.25,4.516-4.25,7.25,0,3.314,2.686,4.25,6,4.25,3.314,0,6-.936,6-4.25,0-2.734-1.859-5.969-4.25-7.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M10.75,4.75l2-3c0-.552-.448-1-1-1h-2.75s-2.75,0-2.75,0c-.552,0-1,.448-1,1l2,3h3.5Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M9 4.75L9 3.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default sack;