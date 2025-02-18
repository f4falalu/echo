import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function arrowSymbolDown(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "arrow symbol down";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9,15.75c-.414,0-.75-.336-.75-.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V15c0,.414-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M9.001,15.998h-.005c-.342-.002-.639-.232-.723-.564-.027-.102-.723-2.601-3.783-3.73-.389-.144-.587-.575-.444-.963,.145-.388,.574-.587,.964-.444,2.12,.782,3.328,2.12,3.99,3.181,.662-1.061,1.87-2.398,3.99-3.181,.393-.143,.82,.056,.964,.444,.143,.389-.056,.82-.444,.963-3.061,1.129-3.756,3.629-3.784,3.734-.087,.329-.385,.56-.725,.56Z" fill={fill}/>
	</g>
</svg>
	);
};

export default arrowSymbolDown;