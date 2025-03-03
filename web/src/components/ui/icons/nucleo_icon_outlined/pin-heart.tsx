import React from 'react';
import { iconProps } from './iconProps';



function pinHeart(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px pin heart";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="8" cy="7.5" fill="none" r="1.75" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M13.658,8.178c.075-.318,.122-.625,.122-.911,0-3.491-2.987-5.516-5.779-5.516S2.221,3.776,2.221,7.266c0,2.623,3.428,6.833,5.004,8.631,.413,.471,1.139,.471,1.551,0,.131-.15,.279-.322,.433-.503" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M13.781,16.197c.138,.071,.299,.071,.437,0,.729-.374,3.031-1.73,3.031-3.934,.004-.968-.791-1.757-1.777-1.763-.593,.007-1.144,.301-1.473,.786-.329-.484-.881-.778-1.473-.786-.985,.006-1.78,.794-1.777,1.763,0,2.205,2.303,3.56,3.031,3.934Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default pinHeart;