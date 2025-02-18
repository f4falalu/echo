import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function fileSparkle(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "file sparkle";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M17.585,13.579l-1.776-.888-.888-1.776c-.254-.508-1.088-.508-1.342,0l-.888,1.776-1.776,.888c-.254,.127-.415,.387-.415,.671s.161,.544,.415,.671l1.776,.888,.888,1.776c.127,.254,.387,.415,.671,.415s.544-.161,.671-.415l.888-1.776,1.776-.888c.254-.127,.415-.387,.415-.671s-.161-.544-.415-.671Z" fill={secondaryfill}/>
		<path d="M11.573,16.927l-1.329-.665c-.767-.384-1.244-1.155-1.244-2.013s.477-1.629,1.244-2.013l1.329-.665,.665-1.329c.374-.746,1.145-1.21,2.013-1.21,.705,0,1.334,.317,1.75,.832v-3.201c0-.467-.182-.907-.513-1.237l-3.914-3.914c-.331-.331-.77-.513-1.237-.513H4.75c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75h6.859l-.036-.073Zm-1.073-14.349c.009-.004,.004-.001,.013-.005l3.922,3.921s-.001,.003-.002,.005h-2.932c-.55,0-1-.45-1-1V2.579Zm-4.75,3.421h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75Zm-.75,3.75c0-.414,.336-.75,.75-.75h4.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H5.75c-.414,0-.75-.336-.75-.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default fileSparkle;