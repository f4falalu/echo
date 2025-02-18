import React from 'react';
import { iconProps } from './iconProps';



function boxPin(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px box pin";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9 2.25L9 8.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M3,6.284l1.449-2.922c.338-.681,1.032-1.112,1.792-1.112h5.518c.76,0,1.454,.431,1.792,1.112l1.449,2.923" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M15.25,8.326v-1.076c0-1.104-.895-2-2-2H4.75c-1.105,0-2,.896-2,2v6c0,1.104,.895,2,2,2h4.8" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M14.5,17.25s-2.75-1.509-2.75-3.75c0-1.519,1.231-2.75,2.75-2.75s2.75,1.231,2.75,2.75c0,2.241-2.75,3.75-2.75,3.75Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="14.5" cy="13.5" fill={secondaryfill} r=".75"/>
	</g>
</svg>
	);
};

export default boxPin;