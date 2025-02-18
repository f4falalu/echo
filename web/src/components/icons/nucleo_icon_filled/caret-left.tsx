import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function caretLeft(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "caret left";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M13.094,2.442c-.559-.309-1.242-.288-1.781,.055L3.389,7.522c-.509,.323-.812,.875-.812,1.478s.304,1.155,.812,1.478l7.924,5.025c.286,.181,.611,.271,.937,.271,.29,0,.581-.072,.844-.217,.559-.308,.906-.895,.906-1.533V3.976c0-.638-.347-1.226-.906-1.533Z" fill={fill}/>
	</g>
</svg>
	);
};

export default caretLeft;