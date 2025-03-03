import React from 'react';
import { iconProps } from './iconProps';



function paperPlane4(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px paper plane 4";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9.386 9L4.993 9" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M15.472,9.458L4.005,15.412c-.404,.21-.863-.168-.733-.605l1.721-5.807L3.272,3.193c-.129-.437,.329-.815,.733-.605l11.466,5.954c.371,.193,.371,.724,0,.917Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default paperPlane4;