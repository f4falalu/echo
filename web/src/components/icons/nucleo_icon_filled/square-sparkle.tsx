import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_squareSparkle(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px square sparkle";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-.724,7.697l-2.027,.802-.802,2.027c-.113,.286-.39,.474-.697,.474s-.584-.188-.697-.474l-.802-2.027-2.027-.802c-.286-.113-.474-.39-.474-.697s.188-.584,.474-.697l2.027-.802,.802-2.027c.226-.572,1.169-.572,1.395,0l.802,2.027,2.027,.802c.286,.113,.474,.39,.474,.697s-.188,.584-.474,.697Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_squareSparkle;