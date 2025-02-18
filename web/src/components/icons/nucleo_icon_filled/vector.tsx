import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_vector(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px vector";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M7.75,5.25c0-.414-.336-.75-.75-.75H2.792c-.26-.447-.738-.75-1.292-.75-.828,0-1.5,.672-1.5,1.5s.672,1.5,1.5,1.5c.554,0,1.032-.303,1.292-.75h1.802c-1.297,1.209-2.094,2.914-2.094,4.75,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-2.081,1.311-3.966,3.261-4.689,.317-.118,.496-.427,.477-.747,.002-.022,.013-.041,.013-.063Z" fill={secondaryfill}/>
		<path d="M16.5,3.75c-.554,0-1.032,.303-1.292,.75h-4.208c-.414,0-.75,.336-.75,.75,0,.022,.011,.041,.013,.063-.019,.321,.159,.63,.477,.747,1.95,.724,3.261,2.608,3.261,4.689,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-1.836-.797-3.541-2.094-4.75h1.802c.26,.447,.738,.75,1.292,.75,.828,0,1.5-.672,1.5-1.5s-.672-1.5-1.5-1.5Z" fill={secondaryfill}/>
		<rect height="4.5" width="4.5" fill={fill} rx="1.432" ry="1.432" x="6.75" y="3"/>
		<rect height="4.5" width="4.5" fill={fill} rx="1.432" ry="1.432" x="1" y="10.5"/>
		<rect height="4.5" width="4.5" fill={fill} rx="1.432" ry="1.432" x="12.5" y="10.5"/>
	</g>
</svg>
	);
};

export default 18px_vector;