import React from 'react';
import { iconProps } from './iconProps';



function flipVertical(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px flip vertical";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="9" cy="9" fill={secondaryfill} r=".75"/>
		<circle cx="15.25" cy="9" fill={secondaryfill} r=".75"/>
		<circle cx="12.125" cy="9" fill={secondaryfill} r=".75"/>
		<circle cx="5.875" cy="9" fill={secondaryfill} r=".75"/>
		<circle cx="2.75" cy="9" fill={secondaryfill} r=".75"/>
		<path d="M12.504,2.583l-3.132,3.5c-.199,.222-.546,.222-.745,0l-3.132-3.5c-.288-.322-.06-.833,.373-.833h6.263c.432,0,.661,.511,.373,.833Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M12.504,15.417l-3.132-3.5c-.199-.222-.546-.222-.745,0l-3.132,3.5c-.288,.322-.06,.833,.373,.833h6.263c.432,0,.661-.511,.373-.833Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default flipVertical;