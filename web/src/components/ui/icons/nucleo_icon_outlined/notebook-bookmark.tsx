import React from 'react';
import { iconProps } from './iconProps';



function notebookBookmark(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px notebook bookmark";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M13,1.75h-4V6.5c0,.202,.122,.385,.309,.462,.187,.079,.401,.035,.545-.108l1.146-1.146,1.146,1.146c.096,.096,.224,.146,.354,.146,.064,0,.13-.012,.191-.038,.187-.077,.309-.26,.309-.462V1.75Z" fill={secondaryfill}/>
		<path d="M6.25 1.75L6.25 16.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<rect height="14.5" width="11.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="3.25" y="1.75"/>
	</g>
</svg>
	);
};

export default notebookBookmark;