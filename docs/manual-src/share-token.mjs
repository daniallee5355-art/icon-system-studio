// 설명서의 "공유 링크로 들어왔을 때" 화면을 찍기 위한 예시 아이콘 시스템을 공유 링크 토큰으로 출력한다
const sample = {
  version: 1,
  name: '디자인팀 아이콘 시스템',
  set: 'ph',
  sizes: [16, 20, 24],
  stroke: null,
  activeColor: '#C2185B',
  framework: 'react',
  css: 'tailwind',
  custom: { invoice: { base: 'ph:receipt', active: 'ph:receipt-fill', ko: '청구서' } },
  updated: '2026-10-14',
};
process.stdout.write(Buffer.from(JSON.stringify(sample)).toString('base64url'));
