import { describe, expect, it } from 'vitest';
import { decodeHtmlEntities, decodeSlackMessageText } from './html-entities';

describe('decodeHtmlEntities', () => {
  it('should decode common HTML entities', () => {
    expect(decodeHtmlEntities('&lt;')).toBe('<');
    expect(decodeHtmlEntities('&gt;')).toBe('>');
    expect(decodeHtmlEntities('&amp;')).toBe('&');
    expect(decodeHtmlEntities('&quot;')).toBe('"');
    expect(decodeHtmlEntities('&#39;')).toBe("'");
    expect(decodeHtmlEntities('&apos;')).toBe("'");
  });

  it('should decode multiple entities in a string', () => {
    expect(decodeHtmlEntities('&lt;div&gt;Hello &amp; World&lt;/div&gt;')).toBe(
      '<div>Hello & World</div>'
    );
    expect(decodeHtmlEntities('&quot;Hello&quot; &amp; &#39;World&#39;')).toBe(
      '"Hello" & \'World\''
    );
  });

  it('should decode numeric character references', () => {
    // Decimal references
    expect(decodeHtmlEntities('&#60;')).toBe('<');
    expect(decodeHtmlEntities('&#62;')).toBe('>');
    expect(decodeHtmlEntities('&#38;')).toBe('&');
    expect(decodeHtmlEntities('&#123;')).toBe('{');
    expect(decodeHtmlEntities('&#125;')).toBe('}');

    // Hexadecimal references
    expect(decodeHtmlEntities('&#x3C;')).toBe('<');
    expect(decodeHtmlEntities('&#x3E;')).toBe('>');
    expect(decodeHtmlEntities('&#x26;')).toBe('&');
    expect(decodeHtmlEntities('&#x7B;')).toBe('{');
    expect(decodeHtmlEntities('&#x7D;')).toBe('}');

    // Case insensitive hex
    expect(decodeHtmlEntities('&#X3C;')).toBe('<');
    expect(decodeHtmlEntities('&#X3E;')).toBe('>');
  });

  it('should handle special characters', () => {
    expect(decodeHtmlEntities('&nbsp;')).toBe(' ');
    expect(decodeHtmlEntities('&ndash;')).toBe('–');
    expect(decodeHtmlEntities('&mdash;')).toBe('—');
    expect(decodeHtmlEntities('&hellip;')).toBe('…');
    expect(decodeHtmlEntities('&ldquo;')).toBe('\u201C'); // Left double quotation mark
    expect(decodeHtmlEntities('&rdquo;')).toBe('\u201D'); // Right double quotation mark
  });

  it('should handle empty or undefined input', () => {
    expect(decodeHtmlEntities('')).toBe('');
    expect(decodeHtmlEntities(null as unknown as string)).toBe(null);
    expect(decodeHtmlEntities(undefined as unknown as string)).toBe(undefined);
  });

  it('should preserve text without entities', () => {
    expect(decodeHtmlEntities('Hello World')).toBe('Hello World');
    expect(decodeHtmlEntities('No entities here!')).toBe('No entities here!');
  });

  it('should handle repeated entities', () => {
    expect(decodeHtmlEntities('&amp;&amp;&amp;')).toBe('&&&');
    expect(decodeHtmlEntities('&lt;&lt;&lt;')).toBe('<<<');
  });

  it('should decode entities in code examples', () => {
    const input = 'if (x &lt; 10 &amp;&amp; y &gt; 5) { console.log(&quot;Hello&quot;); }';
    const expected = 'if (x < 10 && y > 5) { console.log("Hello"); }';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });
});

describe('decodeSlackMessageText', () => {
  it('should decode HTML entities while preserving Slack user mentions', () => {
    const input = '&lt;@U123456&gt; said &quot;Hello&quot;';
    const expected = '<@U123456> said "Hello"';
    expect(decodeSlackMessageText(input)).toBe(expected);

    // When mention is already properly formatted
    const input2 = '<@U123456> said &quot;Hello&quot;';
    const expected2 = '<@U123456> said "Hello"';
    expect(decodeSlackMessageText(input2)).toBe(expected2);
  });

  it('should preserve Slack channel mentions', () => {
    const input = 'Check out &lt;#C123456&gt; for more info';
    const expected = 'Check out <#C123456> for more info';
    expect(decodeSlackMessageText(input)).toBe(expected);

    // When channel mention is already properly formatted
    const input2 = 'Check out <#C123456> for more info';
    const expected2 = 'Check out <#C123456> for more info';
    expect(decodeSlackMessageText(input2)).toBe(expected2);
  });

  it('should preserve Slack links', () => {
    const input = 'Visit &lt;https://example.com|our website&gt; for details';
    const expected = 'Visit <https://example.com|our website> for details';
    expect(decodeSlackMessageText(input)).toBe(expected);

    // When link is already properly formatted
    const input2 = 'Visit <https://example.com|our website> for details';
    const expected2 = 'Visit <https://example.com|our website> for details';
    expect(decodeSlackMessageText(input2)).toBe(expected2);
  });

  it('should preserve simple Slack URLs', () => {
    const input = 'Check &lt;https://example.com&gt;';
    const expected = 'Check <https://example.com>';
    expect(decodeSlackMessageText(input)).toBe(expected);

    // When URL is already properly formatted
    const input2 = 'Check <https://example.com>';
    const expected2 = 'Check <https://example.com>';
    expect(decodeSlackMessageText(input2)).toBe(expected2);
  });

  it('should decode entities in regular text while preserving Slack formatting', () => {
    const input = '<@U123456> wrote: &lt;div&gt;Hello &amp; welcome&lt;/div&gt; in <#C789012>';
    const expected = '<@U123456> wrote: <div>Hello & welcome</div> in <#C789012>';
    expect(decodeSlackMessageText(input)).toBe(expected);
  });

  it('should handle mixed content with code blocks', () => {
    const input =
      'Here&#39;s the code: if (x &lt; 10 &amp;&amp; y &gt; 5) { alert(&quot;Hi&quot;); }';
    const expected = 'Here\'s the code: if (x < 10 && y > 5) { alert("Hi"); }';
    expect(decodeSlackMessageText(input)).toBe(expected);
  });

  it('should handle undefined or empty input', () => {
    expect(decodeSlackMessageText(undefined)).toBe(undefined);
    expect(decodeSlackMessageText('')).toBe('');
    expect(decodeSlackMessageText('   ')).toBe('   ');
  });

  it('should handle complex Slack messages', () => {
    const input =
      '<@U123456> mentioned <@U789012> in <#C345678>: &quot;Check this &lt;https://example.com|link&gt; for the &lt;code&gt; example&quot;';
    const expected =
      '<@U123456> mentioned <@U789012> in <#C345678>: "Check this <https://example.com|link> for the <code> example"';
    expect(decodeSlackMessageText(input)).toBe(expected);
  });

  it('should handle messages with multiple entity types', () => {
    const input = 'Testing &amp; more: &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;';
    const expected = "Testing & more: <script>alert('XSS')</script>";
    expect(decodeSlackMessageText(input)).toBe(expected);
  });
});
