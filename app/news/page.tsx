"use client";

export default function NewsPage() {
  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>뉴스</h1>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <a href="/"><button>대시보드</button></a>
        <a href="/vote"><button>투표</button></a>
      </div>

      <section style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>LIVE FEED</div>
        <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
          <li>[T+00] 프로젝트 도파민 유출. 내부 봉쇄 시작.</li>
          <li>[T+30] 1차 투표 준비. 조사 대상 1인 지목 예정.</li>
          <li>[T+60] Shadow Channel 활동 감지.</li>
        </ul>
        <p style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          * 다음 단계에서 DB(뉴스 테이블)와 연결합니다.
        </p>
      </section>
    </main>
  );
}
