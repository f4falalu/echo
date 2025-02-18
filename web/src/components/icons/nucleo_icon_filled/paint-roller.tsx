import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_paintRoller(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px paint roller";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9,11.5c-.414,0-.75-.336-.75-.75v-1.519c0-.09-.046-.15-.073-.177s-.087-.073-.178-.073h0l-4.238,.011h-.009c-1.001,0-1.941-.389-2.649-1.095-.71-.709-1.102-1.651-1.102-2.655v-1.242c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.242c0,.602,.234,1.167,.661,1.593,.425,.424,.989,.657,1.59,.657h.005l4.239-.011h.003c.468,0,.907,.182,1.238,.512,.331,.331,.514,.771,.514,1.239v1.519c0,.414-.336,.75-.75,.75Z" fill={fill}/>
		<rect height="7.5" width="4" fill={fill} rx="1.75" ry="1.75" x="7" y="10"/>
		<rect height="5.5" width="13" fill={secondaryfill} rx="1.75" ry="1.75" x="2.5" y="1"/>
	</g>
</svg>
	);
};

export default 18px_paintRoller;