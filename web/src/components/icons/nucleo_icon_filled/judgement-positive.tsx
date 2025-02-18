import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function judgementPositive(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "judgement positive";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="9" cy="3.25" fill={fill} r="2.5"/>
		<path d="M9,6.5c-2.481,0-4.5,2.019-4.5,4.5,0,.414,.336,.75,.75,.75h7.5c.414,0,.75-.336,.75-.75,0-2.481-2.019-4.5-4.5-4.5Z" fill={fill}/>
		<path d="M15.25,11H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.25v4.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-4.75h7v4.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-4.75h1.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={secondaryfill}/>
		<path d="M10.155,13.542l-1.917,2.493-.402-.504c-.26-.324-.731-.375-1.055-.117-.323,.259-.376,.73-.117,1.054l1,1.25c.143,.178,.358,.281,.586,.281h.007c.23-.002,.447-.11,.588-.292l2.5-3.25c.252-.329,.19-.799-.138-1.052-.328-.254-.799-.191-1.052,.137Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default judgementPositive;