import { useRef } from 'react';
import { copyText, downloadText } from '../lib/files';
import { useStore } from '../store';

interface Props {
  title: string;
  file: string;
  code: string;
  note?: string;
  /** 파일로 내려받기 버튼을 보일지 */
  downloadable?: boolean;
}

export function CodeBlock({ title, file, code, note, downloadable }: Props) {
  const { toast } = useStore();
  const pre = useRef<HTMLPreElement>(null);
  const onCopy = async () => {
    toast((await copyText(code, pre.current)) ? '복사했습니다' : '선택했습니다. Ctrl+C로 복사하세요');
  };
  const isFile = /\.[a-z]+$/i.test(file);
  return (
    <div className="card code">
      <header>
        <div>
          <h3>{title}</h3>
          <p className="mono">{file}</p>
        </div>
        <div className="btns">
          {downloadable && isFile && (
            <button className="btn" onClick={() => { downloadText(file, code, file.endsWith('.json') ? 'application/json' : 'text/plain'); toast(`${file}을(를) 저장했습니다`); }}>
              내려받기
            </button>
          )}
          <button className="btn" onClick={onCopy}>복사</button>
        </div>
      </header>
      <pre ref={pre}>{code}</pre>
      {note && <p className="code-note">{note}</p>}
    </div>
  );
}
