import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_personDressArrowDown(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px person dress arrow down";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="6.001" cy="2.5" fill="none" r="1.75" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M10.076,13.617l-1.659-6.014c-.105-.382-.421-.664-.812-.726-.469-.073-1.008-.125-1.604-.125-.45,0-.99,.029-1.594,.123-.392,.061-.717,.344-.822,.726l-1.659,6.014c-.088,.318,.152,.633,.482,.633h1.593s.174,2.083,.174,2.083c.043,.518,.476,.917,.997,.917h1.66c.52,0,.953-.399,.997-.917l.174-2.083h1.593c.33,0,.57-.315,.482-.633Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M14.25 5L14.25 13" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M16.5 10.75L14.25 13 12 10.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_personDressArrowDown;