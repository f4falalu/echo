import React from 'react';
import { iconProps } from './iconProps';



function headSideVrHeadset(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px head side vr headset";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M12.874,4.249c-1.318-1.832-3.644-2.891-6.167-2.364-2.266,.473-4.097,2.305-4.571,4.57-.595,2.846,.84,5.418,3.114,6.6v3.195" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M10.25,16.25v-2.5h1.639c1.049,0,1.919-.81,1.995-1.856l.112-1.543,1.504-.601-1.125-1.5" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M10.75,4.25h3.5c.552,0,1,.448,1,1v2c0,.552-.448,1-1,1h-3.5c-1.104,0-2-.896-2-2h0c0-1.104,.896-2,2-2Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M8.75 6.25L2.183 6.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default headSideVrHeadset;