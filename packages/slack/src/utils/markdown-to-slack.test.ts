import { describe, expect, it } from 'vitest';
import { convertMarkdownToSlack } from './markdown-to-slack';

describe('convertMarkdownToSlack', () => {
  it('should handle empty or invalid input', () => {
    expect(convertMarkdownToSlack('')).toEqual({ text: '' });
    expect(convertMarkdownToSlack(null as any)).toEqual({ text: '' });
    expect(convertMarkdownToSlack(undefined as any)).toEqual({ text: '' });
  });

  it('should convert headers to section blocks', () => {
    const markdown = '# Main Title\n## Subtitle\nSome content';
    const result = convertMarkdownToSlack(markdown);

    expect(result.blocks).toHaveLength(3);
    expect(result.blocks?.[0]).toEqual({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Main Title*',
      },
    });
    expect(result.blocks?.[1]).toEqual({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Subtitle*',
      },
    });
    expect(result.blocks?.[2]).toEqual({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Some content',
      },
    });
  });

  it('should convert bold text', () => {
    const markdown = 'This is **bold** and this is __also bold__';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('This is *bold* and this is *also bold*');
  });

  it('should convert italic text', () => {
    const markdown = 'This is *italic* and this is _also italic_';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('This is _italic_ and this is _also italic_');
  });

  it('should handle inline code', () => {
    const markdown = 'Use `console.log()` to debug';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('Use `console.log()` to debug');
  });

  it('should handle code blocks', () => {
    const markdown = '```javascript\nconsole.log("hello");\n```';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('```javascript\nconsole.log("hello");\n```');
  });

  it('should handle code blocks without language', () => {
    const markdown = '```\nsome code\n```';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('```\nsome code\n```');
  });

  it('should convert unordered lists', () => {
    const markdown = '- Item 1\n* Item 2\n+ Item 3';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('• Item 1\n• Item 2\n• Item 3');
  });

  it('should convert ordered lists', () => {
    const markdown = '1. First item\n2. Second item\n3. Third item';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('1. First item\n2. Second item\n3. Third item');
  });

  it('should handle mixed formatting', () => {
    const markdown = '# Title\nThis is **bold** and *italic* with `code`\n- List item';
    const result = convertMarkdownToSlack(markdown);

    expect(result.blocks).toHaveLength(2);
    expect(result.blocks?.[0]).toEqual({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Title*',
      },
    });
    expect(result.blocks?.[1]).toEqual({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'This is *bold* and _italic_ with `code`\n• List item',
      },
    });
  });

  it('should handle text without complex formatting', () => {
    const markdown = 'Simple text with **bold** and *italic*';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('Simple text with *bold* and _italic_');
    expect(result.blocks).toBeUndefined();
  });

  it('should clean up extra whitespace', () => {
    const markdown = 'Text with\n\n\n\nmultiple newlines';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('Text with\n\nmultiple newlines');
  });

  it('should handle nested formatting correctly', () => {
    const markdown = '**This is bold with *italic* inside**';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('*This is bold with _italic_ inside*');
  });

  it('should preserve unsupported markdown unchanged', () => {
    const markdown = 'Text with [link](http://example.com) and ![image](image.png)';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('Text with [link](http://example.com) and ![image](image.png)');
  });

  it('should preserve content order when mixing headers, text, and bullet points', () => {
    const markdown = `I've created a comprehensive bicycle discontinuation report that identifies which bicycles you should probably stop selling. Here's what the analysis reveals:

## Key Findings

**High-Risk Bicycles for Discontinuation:**
- **Road-650 series** - Multiple variants showing negative profitability (-16.30% to -1.89%) with extremely low inventory turnover (0.34-0.83)
- **Touring-3000 series** - Several models with negative profitability (-11.36% to -3.29%) and poor gross margins (-14.15% to -7.69%)
- **Touring-1000 Yellow variants** - Despite higher sales volume, showing negative profitability (-8.75% to -4.42%)

## Analysis Methodology

I analyzed 97 bicycle products across three categories (Road Bikes, Mountain Bikes, Touring Bikes) using multiple performance metrics:

- **Profitability Index** - Overall financial performance including costs and revenue
- **Risk Factor** - Warranty and repair costs that impact profitability
- **Inventory Turnover** - How quickly products sell (below 2.0 indicates slow-moving inventory)
- **Sales Performance** - Revenue generated over the last 12 months
- **Gross Margin** - Profit margin percentage

## Discontinuation Recommendations

The report categorizes bicycles into three risk levels:

- **High Risk for Discontinuation** - 25+ bicycles with profitability index below 20, low inventory turnover, or negative margins
- **Medium Risk** - Products with moderate performance issues
- **Low Risk** - Well-performing bicycles that should continue

## Dashboard Components

1. **Detailed Analysis Table** - Complete performance metrics for all 97 bicycles with risk categorization
2. **Top 15 Worst Performers** - Bar chart highlighting bicycles with the lowest profitability
3. **Category Performance Comparison** - Shows that Mountain Bikes ($5.97M) slightly outperform Touring Bikes ($5.86M) and Road Bikes ($5.52M)

The analysis shows clear patterns: Road-650 and Touring-3000 series consistently underperform across multiple metrics and should be prioritized for discontinuation. Focus on eliminating products with negative profitability indices and inventory turnover below 2.0 to improve overall portfolio performance.`;

    const result = convertMarkdownToSlack(markdown);

    // Should have blocks for headers and content sections
    expect(result.blocks).toBeDefined();
    expect(result.blocks!.length).toBeGreaterThan(0);

    // Verify the order is preserved by checking that content sections appear between headers
    const blockTexts = result
      .blocks!.filter(
        (block): block is typeof block & { text: { text: string } } =>
          'text' in block && block.text !== undefined
      )
      .map((block) => block.text.text);

    // First block should be the intro text
    expect(blockTexts[0]).toContain("I've created a comprehensive bicycle discontinuation report");

    // Then Key Findings header
    expect(blockTexts[1]).toBe('*Key Findings*');

    // Then the bullet points about High-Risk Bicycles
    expect(blockTexts[2]).toContain('*High-Risk Bicycles for Discontinuation:*');
    expect(blockTexts[2]).toContain('• *Road-650 series*');
    expect(blockTexts[2]).toContain('• *Touring-3000 series*');
    expect(blockTexts[2]).toContain('• *Touring-1000 Yellow variants*');

    // Then Analysis Methodology header
    expect(blockTexts[3]).toBe('*Analysis Methodology*');

    // Then the methodology text and bullet points
    expect(blockTexts[4]).toContain('I analyzed 97 bicycle products');
    expect(blockTexts[4]).toContain('• *Profitability Index*');
    expect(blockTexts[4]).toContain('• *Risk Factor*');

    // Verify bullet points are not all grouped at the end
    const allText = blockTexts.join('\n');
    const keyFindingsIndex = allText.indexOf('*Key Findings*');
    const methodologyIndex = allText.indexOf('*Analysis Methodology*');
    const firstBulletIndex = allText.indexOf('• *Road-650 series*');
    const methodologyBulletIndex = allText.indexOf('• *Profitability Index*');

    // Bullet points should appear after their respective headers
    expect(firstBulletIndex).toBeGreaterThan(keyFindingsIndex);
    expect(firstBulletIndex).toBeLessThan(methodologyIndex);
    expect(methodologyBulletIndex).toBeGreaterThan(methodologyIndex);
  });
});
