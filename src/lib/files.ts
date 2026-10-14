// 클립보드와 파일 저장

function selectText(el: Element) {
  const r = document.createRange();
  r.selectNodeContents(el);
  const s = getSelection();
  s?.removeAllRanges();
  s?.addRange(r);
}

/** 복사에 성공하면 true. 실패하면 fallback 요소의 글자를 선택해 두고 false */
export async function copyText(text: string, fallback?: Element | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (fallback) selectText(fallback);
    return false;
  }
}

export function downloadText(filename: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFileText(file: File): Promise<string> {
  return file.text();
}
