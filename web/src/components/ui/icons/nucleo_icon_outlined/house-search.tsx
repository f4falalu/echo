import React from 'react';
import { iconProps } from './iconProps';



function houseSearch(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px house search";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M15.25,9.438v-2.442c0-.312-.146-.607-.395-.796l-5.25-3.99c-.358-.272-.853-.272-1.21,0L3.145,6.2c-.249,.189-.395,.484-.395,.796v7.254c0,1.104,.895,2,2,2h5.093" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M15.59 15.59L17.25 17.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="14" cy="14" fill="none" r="2.25" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default houseSearch;