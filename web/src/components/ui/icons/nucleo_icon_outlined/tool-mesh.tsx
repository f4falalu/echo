import React from 'react';
import { iconProps } from './iconProps';



function toolMesh(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px tool mesh";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M1.75 6.75L16.25 6.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M1.75 11.25L16.25 11.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M6,3c.368,.334,2.656,2.484,2.656,6,0,.497-.053,3.636-2.656,6" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.25,3c.534,.999,1.503,3.132,1.503,6,0,1.132-.151,3.471-1.503,6" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<rect height="12.5" width="14.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} transform="rotate(180 9 9)" x="1.75" y="2.75"/>
	</g>
</svg>
	);
};

export default toolMesh;