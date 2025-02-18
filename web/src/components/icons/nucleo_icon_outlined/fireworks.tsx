import React from 'react';
import { iconProps } from './iconProps';



function fireworks(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px fireworks";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="2" cy="6" fill={secondaryfill} r="1"/>
		<circle cx="16" cy="6" fill={secondaryfill} r="1"/>
		<path d="M13.25,6.75s-4.25,1.727-4.25,9.5c0-7.773-4.25-9.5-4.25-9.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.158,2.99l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474Z" fill={fill}/>
		<path d="M5.658,12.026l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474Z" fill={fill}/>
		<path d="M12.342,12.026l1.263-.421,.421-1.263c.137-.408,.813-.408,.949,0l.421,1.263,1.263,.421c.204,.068,.342,.259,.342,.474s-.138,.406-.342,.474l-1.263,.421-.421,1.263c-.068,.204-.26,.342-.475,.342s-.406-.138-.475-.342l-.421-1.263-1.263-.421c-.204-.068-.342-.259-.342-.474s.138-.406,.342-.474Z" fill={fill}/>
	</g>
</svg>
	);
};

export default fireworks;