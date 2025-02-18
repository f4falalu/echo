import React from 'react';
import { iconProps } from './iconProps';



function bus(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px bus";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M.75,7.75v-2c0-.552,.448-1,1-1h1.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M17.25,7.75v-2c0-.552-.448-1-1-1h-1.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M3.25,14.25v1.5c0,.276,.224,.5,.5,.5h.5c.276,0,.5-.224,.5-.5v-1.5h-1.5Z" fill={fill} stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M13.25,14.25v1.5c0,.276,.224,.5,.5,.5h.5c.276,0,.5-.224,.5-.5v-1.5h-1.5Z" fill={fill} stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M3.25,4.5c0-2.5,2.75-2.75,5.75-2.75s5.75,.25,5.75,2.75V14.25H3.25V4.5Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M3.25 9.25L14.75 9.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M3.5 4.75L14.5 4.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="5.75" cy="11.75" fill={secondaryfill} r=".75"/>
		<circle cx="12.25" cy="11.75" fill={secondaryfill} r=".75"/>
	</g>
</svg>
	);
};

export default bus;