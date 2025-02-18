import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_userLongHair4(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px user long hair 4";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="9" cy="6.5" fill="none" r="3.75" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="4" cy="1.5" fill={fill} r="1.5"/>
		<circle cx="14" cy="1.5" fill={fill} r="1.5"/>
		<path d="M12.75,6.5c0-2.071-1.679-3.75-3.75-3.75s-3.75,1.679-3.75,3.75c0,.085,.019,.165,.025,.249,1.555-.009,2.923-.811,3.725-2.02,.802,1.21,2.17,2.011,3.725,2.02,.006-.084,.025-.164,.025-.249Z" fill={fill}/>
		<path d="M2.953,16c1.298-1.958,3.522-3.25,6.047-3.25s4.749,1.291,6.047,3.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_userLongHair4;