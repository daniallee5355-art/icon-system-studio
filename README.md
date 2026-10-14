# Icon System Studio

팀이 쓸 아이콘 세트를 고르고, 그 결정을 코드 규칙으로 고정하는 도구입니다.

**사이트:** https://daniallee5355-art.github.io/icon-system-studio/
Lucide · Heroicons · Phosphor · Tabler · Remix Icon · IBM Carbon · Iconoir · Material Symbols · Bootstrap Icons 9개 세트를 실제 SVG로 비교합니다.

| 탭 | 하는 일 |
|---|---|
| 01 추천 | 프레임워크·CSS·제품 성격 등 조건으로 세트 점수와 근거, 세트 사양 표 |
| 02 비교 | 의미 85개 × 9개 세트, 크기·상태·선 굵기 조절, 24px 키라인 확대 |
| 03 상태 미리보기 | 사이드바·탭바·토글로 활성 상태(Fill 전환) 확인, 변형·Fill 대응률 |
| 04 가변 폰트 | Material Symbols의 FILL·wght·GRAD·opsz 조절과 CSS |
| 05 전체 검색 | 세트 전체에서 검색, 허용 세트의 아이콘을 팀 icon-map에 추가·교체 |
| 06 내보내기 · 공유 | 토큰·Tailwind 테마·래퍼 컴포넌트·icon-map, icon-system.json과 공유 링크 |

## 빠른 시작

Node.js 20 이상이 필요합니다.

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5173 을 엽니다. 처음 실행할 때 아이콘 데이터를 자동으로 만듭니다.

Windows에서는 폴더의 `start.bat`을 더블클릭해도 됩니다. 서버를 켜고 브라우저를 열며, 검은 창을 닫으면 꺼집니다.

## 팀에서 쓰는 법

1. 한 사람이 추천·비교 탭에서 세트를 정하고, 내보내기 · 공유 탭에서 이름·크기 단계·활성 색을 맞춥니다.
2. **icon-system.json 내려받기**로 받은 파일을 제품 저장소에 커밋합니다. 팀원은 같은 탭의 **파일에서 불러오기**로 엽니다.
   간단히 보여 줄 때는 **공유 링크 복사**를 씁니다. 링크를 연 사람에게는 적용할지 먼저 묻습니다.
3. 의미 사전에 없는 아이콘이 필요하면 전체 검색 탭에서 찾아 의미 키를 붙여 추가합니다. 허용 세트가 아닌 아이콘은 추가할 수 없습니다.
4. 내보내기 탭의 `tokens.css`, `Icon` 컴포넌트, `icon-map.json`을 제품 코드에 넣습니다. 화면의 아이콘은 모두 `Icon` 컴포넌트를 거치게 해 세트가 섞이지 않게 합니다.

결정 사항은 각자의 브라우저(localStorage)에도 저장되지만, 팀의 기준은 저장소에 커밋한 icon-system.json입니다.

## 배포

`main` 브랜치에 올리면 GitHub Actions가 테스트·빌드 후 GitHub Pages에 자동으로 배포합니다 (`.github/workflows/deploy.yml`).

### 다른 곳에 올릴 때

```bash
npm run build
```

`dist/` 폴더가 정적 사이트입니다. 사내 웹 서버, Cloudflare Pages, Vercel, GitHub Pages 등 어디에 올려도 됩니다(하위 경로도 됨).
`dist/sets/`의 세트 파일(약 18MB)은 전체 검색에서 세트를 고를 때만 내려받습니다.

## 의미 사전 고치기

`data/concepts.json`이 의미 사전입니다. 한 줄이 한 의미이고, 세트마다 기본형 이름을 적습니다.

```json
{"id": "invoice", "ko": "청구서", "kind": "object", "names": {"lucide": "receipt-text", "heroicons": "document-currency-dollar", ...}}
```

- `kind`: 상태(Fill) 전환 대상이면 `object`, 더하기·닫기 같은 동작이면 `action`
- 활성형(Solid·Fill 등)은 세트별 이름 규칙으로 자동으로 찾습니다 (`src/lib/naming.js`)

고친 뒤 `npm run data`를 실행하면 이름을 검사합니다. 세트에 없는 이름이면 비슷한 후보를 보여 주고 멈춥니다.

## 아이콘 세트 업데이트

```bash
npm update
npm run data
npm test
```

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run data` | `@iconify-json` 패키지 → `src/generated/core.json`, `public/sets/*.json` |
| `npm run build` | 데이터 재생성 + 타입 검사 + 정적 빌드 |
| `npm test` | 단위 테스트 (데이터 무결성, 추천, 공유 링크, 코드 생성) |

## 구조

```
data/concepts.json        의미 사전 (팀이 편집)
scripts/build-data.mjs    아이콘 데이터 빌드·검증
src/lib/naming.js         세트별 이름 규칙 (빌드와 앱이 공유)
src/lib/system.ts         icon-system.json 형식, 검증, 공유 링크
src/lib/recommend.ts      추천 점수
src/lib/codegen.ts        토큰·래퍼·icon-map 코드 생성
src/tabs/                 탭 화면
```

## 참고

- OneDrive·Dropbox 같은 동기화 폴더에 두면 `node_modules`(수만 개 파일)까지 동기화돼 느려집니다. 동기화되지 않는 폴더에서 작업하고, 공유는 Git 저장소로 하세요.
- 아이콘 라이선스는 앱의 라이선스 탭에 정리돼 있습니다. 9개 세트 모두 상업적 사용과 재배포를 허용하며, 배포물에 저작권 표시와 라이선스 전문을 넣는 것이 공통 조건입니다.
