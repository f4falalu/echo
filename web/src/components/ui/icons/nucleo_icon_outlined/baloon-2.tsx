import React from 'react';
import { iconProps } from './iconProps';



function baloon2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px baloon 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M10.854,15.74l-1.5-1.5c-.195-.195-.512-.195-.707,0l-1.5,1.5c-.113,.113-.165,.272-.141,.43,.024,.157,.122,.294,.263,.367,.59,.308,1.168,.461,1.743,.461s1.148-.155,1.724-.464c.14-.075,.235-.211,.258-.368,.023-.156-.029-.314-.141-.426Z" fill={secondaryfill}/>
		<path d="M6,8c0-2.068,1.346-3.75,3-3.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<ellipse cx="9" cy="8" fill="none" rx="5.5" ry="6.25" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default baloon2;