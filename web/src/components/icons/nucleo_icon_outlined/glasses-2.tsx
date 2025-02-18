import React from 'react';
import { iconProps } from './iconProps';



function glasses2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px glasses 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M7.75 10.25L10.25 10.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M6.399,4.115c-1.08-.76-2.588-.283-3.034,.961l-1.503,4.328c-.073,.211-.111,.433-.111,.656v.14" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.601,4.115c1.08-.76,2.588-.283,3.034,.961l1.503,4.328c.073,.211,.111,.433,.111,.656v.14" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M12.889,14.25h.79c1.337,0,2.437-1.051,2.497-2.386l.07-1.545c.039-.854-.643-1.568-1.498-1.568h-2.929c-.855,0-1.537,.714-1.498,1.568l.07,1.545c.061,1.335,1.161,2.386,2.497,2.386Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M5.111,14.25h-.79c-1.337,0-2.437-1.051-2.497-2.386l-.07-1.545c-.039-.854,.643-1.568,1.498-1.568h2.929c.855,0,1.537,.714,1.498,1.568l-.07,1.545c-.061,1.335-1.161,2.386-2.497,2.386Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default glasses2;