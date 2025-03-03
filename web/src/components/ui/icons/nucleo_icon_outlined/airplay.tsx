import React from 'react';
import { iconProps } from './iconProps';



function airplay(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px airplay";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M4.25,13.25h-.5c-1.105,0-2-.895-2-2V5.25c0-1.105,.895-2,2-2H14.25c1.105,0,2,.895,2,2v6c0,1.105-.895,2-2,2h-.5" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M8.586,11.659l-2.58,3.811c-.225,.332,.013,.78,.414,.78h5.16c.401,0,.639-.448,.414-.78l-2.58-3.811c-.198-.293-.63-.293-.828,0Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default airplay;