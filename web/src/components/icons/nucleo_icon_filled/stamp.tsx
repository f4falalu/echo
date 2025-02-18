import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function stamp(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "stamp";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M14.25,15H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H14.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={secondaryfill}/>
		<path d="M15.971,9.776c-.428-.493-1.048-.776-1.7-.776h-3.571c.331-1.826,.926-5.144,.926-5.375,0-1.447-1.178-2.625-2.625-2.625s-2.625,1.178-2.625,2.625c0,.231,.595,3.549,.926,5.375H3.729c-.652,0-1.272,.283-1.7,.776-.428,.493-.62,1.146-.527,1.792l.256,1.788c.053,.369,.369,.644,.742,.644H15.5c.373,0,.689-.274,.742-.644l.256-1.789c.093-.646-.1-1.299-.527-1.792Z" fill={fill}/>
	</g>
</svg>
	);
};

export default stamp;