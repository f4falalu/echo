import React from 'react';
import { iconProps } from './iconProps';



function objReduceSizeY(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px obj reduce size y";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="8.5" width="12.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="2.75" y="4.75"/>
		<path d="M10.94,.425c-.11-.258-.355-.425-.624-.425h-2.632c-.269,0-.514,.167-.624,.425-.11,.258-.066,.562,.113,.774l1.316,1.559c.13,.154,.316,.243,.512,.243s.382-.089,.511-.242l1.316-1.559h0c.178-.211,.223-.515,.112-.774Z" fill={secondaryfill}/>
		<path d="M10.94,17.575c-.11,.258-.355,.425-.624,.425h-2.632c-.269,0-.514-.167-.624-.425-.11-.258-.066-.562,.113-.774l1.316-1.559c.13-.154,.316-.243,.512-.243s.382,.089,.511,.242l1.316,1.559h0c.178,.211,.223,.515,.112,.774Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default objReduceSizeY;