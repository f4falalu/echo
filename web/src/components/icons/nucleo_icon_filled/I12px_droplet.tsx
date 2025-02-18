import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 12px_droplet(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px droplet";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m7.924,1.753c-.451-.467-.917-.951-1.341-1.475-.285-.353-.881-.353-1.166,0-.424.524-.89,1.008-1.341,1.475-1.389,1.441-2.826,2.932-2.826,5.501,0,2.617,2.131,4.745,4.75,4.745s4.75-2.128,4.75-4.745c0-2.569-1.437-4.06-2.826-5.501Zm-1.924,7.747c-1.241,0-2.25-1.007-2.25-2.245,0-.414.336-.75.75-.75s.75.336.75.75c0,.411.336.745.75.745s.75.336.75.75-.336.75-.75.75Z" fill={fill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default 12px_droplet;