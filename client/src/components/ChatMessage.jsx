import ReactMarkdown from 'react-markdown';

/**
 * Parse numbered options ONLY when they form a contiguous sequential block
 * starting at 1 with at least 2 items. This prevents arbitrary numbered lists
 * in LLM responses (e.g. "1. First step in the process") from becoming
 * clickable option buttons.
 */
function parseOptions(content) {
  const lines = content.split('\n');
  // Collect contiguous numbered-line blocks
  const blocks = [];
  let current = [];
  for (const line of lines) {
    const m = line.match(/^(\d+)\.\s+(.+)/);
    if (m) {
      current.push({ number: parseInt(m[1], 10), label: m[2].trim() });
    } else {
      if (current.length) { blocks.push(current); current = []; }
    }
  }
  if (current.length) blocks.push(current);

  // Accept the first block that: starts at 1, is sequential, has ≥2 items
  for (const block of blocks) {
    if (block.length >= 2 && block[0].number === 1 &&
        block.every((item, i) => item.number === i + 1)) {
      return block.map(item => ({ number: String(item.number), label: item.label }));
    }
  }
  return [];
}

function stripOptions(content) {
  // Strip ALL lines that look like numbered list items to avoid partial option display
  return content.split('\n').filter(l => !/^\d+\.\s+.+/.test(l)).join('\n').trim();
}

function cleanTokens(text) {
  return (text || '').replace(/\[NEXT_QUESTION\]/g, '').replace(/\[PREV_QUESTION\]/g, '').trim();
}

function StatusPara({ children }) {
  const text = String(children ?? '');

  if (text.startsWith('✅'))
    return (
      <p className="flex items-start gap-2 font-medium" style={{ color: '#3A5A40' }}>
        {children}
      </p>
    );
  if (text.startsWith('⚠') || text.startsWith('⚠️'))
    return (
      <p className="flex items-start gap-2 text-sm px-3 py-2 rounded-lg"
        style={{ background: '#fdf6e3', border: '1px solid #f0e0a0', color: '#7a6000' }}>
        {children}
      </p>
    );
  if (text.startsWith('✗'))
    return (
      <p className="flex items-start gap-2 text-sm px-3 py-2 rounded-lg"
        style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
        {children}
      </p>
    );
  if (text.startsWith('ℹ') || text.startsWith('ℹ️'))
    return (
      <p className="flex items-start gap-2 text-sm px-3 py-2 rounded-lg"
        style={{ background: '#eef1ea', border: '1px solid #d4deca', color: '#3A5A40' }}>
        {children}
      </p>
    );
  return <p>{children}</p>;
}

const mdComponents = {
  p:      StatusPara,
  em:     ({ children }) => (
    <em className="not-italic text-xs font-normal" style={{ color: '#A3B18A' }}>{children}</em>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: '#344E41' }}>{children}</strong>
  ),
  hr: () => <hr style={{ borderColor: '#e4e0da', margin: '8px 0' }} />,
};

export default function ChatMessage({ message, onOptionClick }) {
  const isUser = message.role === 'user';
  const raw    = cleanTokens(message.content);

  // The server always formats assistant messages as:
  //   {llm_confirmation}\n\n---\n\n{question_with_numbered_options}
  // Parsing options from the FULL string causes LLM confirmation numbered
  // lists (e.g. "here is what's next: 1. Tax ID 2. Reporting Year") to be
  // rendered as clickable option buttons for the WRONG question.
  // Fix: split at the separator and parse/strip options ONLY from the
  // question section (after ---).
  const SEP         = '\n\n---\n\n';
  const sepIdx      = raw.indexOf(SEP);
  const confirmPart = sepIdx !== -1 ? raw.slice(0, sepIdx).trim() : '';
  const questionPart = sepIdx !== -1 ? raw.slice(sepIdx + SEP.length).trim() : raw;

  const opts         = isUser ? [] : parseOptions(questionPart);
  const questionBody = opts.length ? stripOptions(questionPart) : questionPart;
  const body         = confirmPart ? `${confirmPart}${SEP}${questionBody}` : questionBody;

  // User bubble
  if (isUser) {
    return (
      <div className="flex justify-end message-animate">
        <div
          className="max-w-[75%] text-sm px-4 py-3 rounded-2xl rounded-tr-sm leading-relaxed"
          style={{ background: '#344E41', color: 'white' }}
        >
          {message.content}
          {message.file && (
            <span className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: 'rgba(163,177,138,0.7)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
              {message.file.name}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Assistant bubble
  return (
    <div className="flex items-start gap-3 message-animate">
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: '#588157', boxShadow: '0 3px 10px rgba(88,129,87,0.25)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
          <path d="M8 12l3 3 5-5"/>
        </svg>
      </div>

      <div className="flex-1 space-y-2 min-w-0">
        {/* Message bubble */}
        {body && (
          <div
            className="rounded-2xl rounded-tl-sm px-4 py-3.5 text-sm leading-relaxed"
            style={{ background: 'white', border: '1px solid #e4e0da', boxShadow: '0 1px 3px rgba(52,78,65,0.06)' }}
          >
            <div className="prose prose-sm max-w-none space-y-2
              prose-p:my-0 prose-p:leading-relaxed
              prose-li:my-0.5 prose-ul:my-1"
              style={{ color: '#2d3b2e' }}
            >
              <ReactMarkdown components={mdComponents}>{body}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Option cards */}
        {opts.length > 0 && onOptionClick && (
          <div className="grid gap-1.5 pt-0.5">
            {opts.map(opt => (
              <button
                key={opt.number}
                onClick={() => onOptionClick(opt.number)}
                className="group flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                style={{
                  background: 'white',
                  border: '1px solid #e4e0da',
                  boxShadow: '0 1px 3px rgba(52,78,65,0.05)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#eef1ea';
                  e.currentTarget.style.borderColor = '#A3B18A';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(88,129,87,0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e4e0da';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(52,78,65,0.05)';
                }}
              >
                {/* Number badge */}
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all"
                  style={{ background: '#f2f0ec', color: '#A3B18A', border: '1px solid #e4e0da' }}
                >
                  {opt.number}
                </span>

                {/* Label */}
                <span className="text-sm leading-snug flex-1" style={{ color: '#344E41' }}>
                  {opt.label}
                </span>

                {/* Arrow */}
                <svg
                  className="flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                  width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="#A3B18A" strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
