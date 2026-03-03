"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { suspects, suspectLabel } from "@/lib/cardMap";

type Counts = Record<string, number>;

export default function CasefilesPage() {
  const [counts, setCounts] = useState<Counts>({
    victor: 0,
    sophia: 0,
    kai: 0,
    leonard: 0,
  });
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const total = 5;

  const statusText = useMemo(() => {
    const out: Record<string, string> = {};
    for (const s of suspects) out[s] = unlocked.has(s) ? "열림" : `잠김 (${counts[s]}/${total})`;
    return out;
  }, [counts, unlocked]);

  useEffect(() => {
    async function boot() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = "/login";
        return;
      }

      const { data: rows, error } = await supabase
        .from("user_cards")
        .select("card_id, cards(suspect_id)");
      if (error) {
        alert("오류: " + error.message);
        setLoading(false);
        return;
      }

      const c: Counts = { victor: 0, sophia: 0, kai: 0, leonard: 0 };
      for (const r of rows ?? []) {
        const s = (r as any).cards?.suspect_id as string | undefined;
        if (s && c[s] !== undefined) c[s] += 1;
      }
      setCounts(c);

      const { data: unlockRows } = await supabase.from("casefile_unlocks").select("suspect_id");
      setUnlocked(new Set((unlockRows ?? []).map((x) => x.suspect_id)));

      setLoading(false);
    }
    boot();
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>사건파일</h1>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <a href="/"><button>대시보드</button></a>
        <a href="/claim"><button>코드 입력</button></a>
        <a href="/inventory"><button>인벤토리</button></a>
      </div>

      {loading ? (
        <p style={{ marginTop: 16 }}>불러오는 중…</p>
      ) : (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {suspects.map((s) => (
            <div key={s} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 900 }}>{suspectLabel[s]}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{statusText[s]}</div>
              </div>
              <div style={{ marginTop: 10 }}>
                <a href={`/casefiles/${s}`}>
                  <button disabled={!unlocked.has(s)} style={{ padding: "10px 14px" }}>
                    사건파일 열기
                  </button>
                </a>
              </div>
              {!unlocked.has(s) && (
                <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                  {total}장 중 {counts[s]}장 수집 필요
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
