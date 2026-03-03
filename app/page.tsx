"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { suspects, suspectLabel } from "@/lib/cardMap";

type Progress = Record<string, number>;

export default function HomePage() {
  const [nickname, setNickname] = useState<string>("");
  const [progress, setProgress] = useState<Progress>({
    victor: 0,
    sophia: 0,
    kai: 0,
    leonard: 0,
  });
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const total = 5;

  const pct = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of suspects) out[s] = Math.round((progress[s] / total) * 100);
    return out;
  }, [progress]);

  useEffect(() => {
    async function boot() {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        window.location.href = "/login";
        return;
      }

      const metaNick =
        (sessionData.session.user.user_metadata?.nickname as string) || "";
      const localNick = localStorage.getItem("nickname") || "";
      setNickname(metaNick || localNick || "UNKNOWN");

      // 진행도: user_cards + cards 조인하여 suspect_id별 count
      const { data: rows, error } = await supabase
        .from("user_cards")
        .select("card_id, cards(suspect_id)");

      if (error) {
        alert("진행도 로딩 오류: " + error.message);
        setLoading(false);
        return;
      }

      const counts: Progress = { victor: 0, sophia: 0, kai: 0, leonard: 0 };
      for (const r of rows ?? []) {
        const suspectId = (r as any).cards?.suspect_id as string | undefined;
        if (suspectId && counts[suspectId] !== undefined) counts[suspectId] += 1;
      }
      setProgress(counts);

      // 언락 상태
      const { data: unlockRows, error: unlockErr } = await supabase
        .from("casefile_unlocks")
        .select("suspect_id");
      if (!unlockErr) {
        setUnlocked(new Set((unlockRows ?? []).map((x) => x.suspect_id)));
      }

      setLoading(false);
    }
    boot();
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900 }}>도파민 아카데미</h1>
          <div style={{ opacity: 0.75 }}>콜사인: {nickname || "..."}</div>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            localStorage.removeItem("nickname");
            localStorage.removeItem("user_id");
            window.location.href = "/login";
          }}
        >
          로그아웃
        </button>
      </header>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800 }}>용의자 수집 진행</h2>
        {loading ? (
          <p>불러오는 중…</p>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {suspects.map((s) => (
              <div
                key={s}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 800 }}>
                    {suspectLabel[s]} ({progress[s]}/{total})
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {unlocked.has(s) ? "사건파일: 열림" : "사건파일: 잠김"}
                  </div>
                </div>
                <div
                  style={{
                    height: 10,
                    background: "#eee",
                    borderRadius: 999,
                    overflow: "hidden",
                    marginTop: 10,
                  }}
                >
                  <div
                    style={{
                      width: `${pct[s]}%`,
                      height: "100%",
                      background: "#111",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href="/claim"><button style={{ padding: "10px 14px" }}>코드 입력(카드 획득)</button></a>
        <a href="/inventory"><button style={{ padding: "10px 14px" }}>인벤토리</button></a>
        <a href="/casefiles"><button style={{ padding: "10px 14px" }}>사건파일</button></a>
        <a href="/news"><button style={{ padding: "10px 14px" }}>뉴스</button></a>
        <a href="/vote"><button style={{ padding: "10px 14px" }}>투표</button></a> 
        <a href="/tally"><button style={{ padding: "10px 14px" }}>집계</button></a>
      </section>

      <p style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
        * 진행바가 안 바뀌면 새로고침(F5)하면 반영됩니다.
      </p>
    </main>
  );
}
