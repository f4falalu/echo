import React from 'react';
import { iconProps } from './iconProps';



function userLink(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px user link";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="9" cy="4.5" fill="none" r="2.75" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M12.25,16.75h-.5c-.828,0-1.5-.672-1.5-1.5v-1c0-.828,.672-1.5,1.5-1.5h.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.485,10.277c-.762-.333-1.599-.527-2.484-.527-2.551,0-4.739,1.53-5.709,3.72-.365,.825,.087,1.774,.947,2.045,.975,.308,2.211,.583,3.638,.685" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M14.75,16.75h.5c.828,0,1.5-.672,1.5-1.5v-1c0-.828-.672-1.5-1.5-1.5h-.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M12.75 14.75L14.25 14.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default userLink;