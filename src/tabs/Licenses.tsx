import { CodeBlock } from '../components/CodeBlock';
import { DATA, LIB, LIBS } from '../lib/data';
import { noticeText } from '../lib/codegen';
import { useStore } from '../store';

export function Licenses() {
  const { sys } = useStore();
  return (
    <section>
      <div className="panel-head">
        <div>
          <h2>아이콘 라이선스</h2>
          <p>이 앱이 보여 주는 아이콘은 모두 각 라이브러리의 오픈소스 라이선스를 따릅니다. 9개 세트 모두 상업적 사용과 재배포를 허용하며, 배포물에 저작권 표시와 라이선스 전문을 함께 넣는 것이 공통 조건입니다.</p>
        </div>
      </div>
      <div className="card scroll-x">
        <table>
          <thead><tr><th>라이브러리</th><th>저작권자</th><th>라이선스</th><th>패키지 버전</th><th>원문</th></tr></thead>
          <tbody>
            {LIBS.map((p) => {
              const s = DATA.sets[p];
              return (
                <tr key={p}>
                  <td><b>{LIB[p].label}</b>{p === sys.set && <span className="pill ok" style={{ marginLeft: 8 }}>허용 세트</span>}</td>
                  <td>{s.authorUrl ? <a href={s.authorUrl} target="_blank" rel="noreferrer">{s.author}</a> : s.author}</td>
                  <td>{s.license} <span className="mono tiny muted">{s.spdx}</span></td>
                  <td className="mono tiny">@iconify-json/{p} {s.pkgVersion}</td>
                  <td>{s.licenseUrl && <a href={s.licenseUrl} target="_blank" rel="noreferrer">라이선스 보기</a>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="two" style={{ marginTop: 20 }}>
        <div className="card pad prose">
          <h3>팀에서 지킬 것</h3>
          <ul className="rules">
            <li>제품에 아이콘을 넣어 배포하면 오픈소스 고지 화면이나 NOTICE 파일에 오른쪽 고지문과 라이선스 전문을 넣습니다.</li>
            <li>Apache 2.0 세트(Remix Icon, IBM Carbon, Material Symbols)는 원본에 NOTICE 파일이 있으면 그 내용도 함께 고지합니다.</li>
            <li>라이브러리 이름은 출처 표시용으로만 쓰고, 제작사의 로고나 상표를 우리 제품의 보증처럼 쓰지 않습니다.</li>
            <li>세트를 새 버전으로 올리면(<code>npm update</code> 후 <code>npm run data</code>) 이 표의 버전도 함께 바뀝니다.</li>
          </ul>
          <p className="tiny muted" style={{ marginTop: 12 }}>이 안내는 일반적인 정리이며 법률 자문이 아닙니다. 외부 배포 전에는 각 원문을 확인하세요.</p>
        </div>
        <CodeBlock title="허용 세트 고지문" file="ICON-LICENSE.txt" code={noticeText(sys)} downloadable />
      </div>
    </section>
  );
}
