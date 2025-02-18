import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_balanceOff(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px balance off";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M15.997,5.708L1.733,8.317c-.408,.075-.678,.465-.603,.873,.066,.362,.382,.615,.737,.615,.045,0,.09-.004,.136-.012l14.264-2.609c.408-.075,.678-.465,.603-.873s-.467-.676-.873-.603Z" fill={secondaryfill}/>
		<path d="M10.135,10.155c-.474-.82-1.797-.82-2.271,0l-2.816,4.878c-.237,.411-.237,.9,0,1.311,.237,.41,.662,.655,1.135,.655h5.633c.474,0,.898-.245,1.135-.655,.237-.411,.237-.9,0-1.311l-2.816-4.878Z" fill={fill}/>
		<circle cx="4" cy="4" fill={fill} r="3"/>
		<circle cx="14.75" cy="2.75" fill={fill} r="2.25"/>
	</g>
</svg>
	);
};

export default 18px_balanceOff;