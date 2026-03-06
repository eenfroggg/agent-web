"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { suspectLabel } from "@/lib/cardMap";

export default function CasefileDetailPage() {
  const params = useParams();
  const suspect = (params?.suspect as string) || "";

  const [unlocked, setUnlocked] = useState(false);
  const [fullText, setFullText] = useState("");
  const [lockedText, setLockedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function boot() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = "/login";
        return;
      }

      if (!suspect) {
        setLoading(false);
        return;
      }

      // 1) 언락 체크
      const { data: unlockRow, error: unlockErr } = await supabase
        .from("casefile_unlocks")
        .select("suspect_id")
        .eq("suspect_id", suspect)
        .maybeSingle();

      if (unlockErr) {
        alert("언락 조회 오류: " + unlockErr.message);
        setLoading(false);
        return;
      }

      if (!unlockRow) {
        setUnlocked(false);
        setLoading(false);
        return;
      }

      setUnlocked(true);

      // 2) 사건파일 본문 로드
      const { data: casefile, error } = await supabase
        .from("casefiles")
        .select("full_text, locked_text")
        .eq("suspect_id", suspect)
        .single();

      if (error) {
        alert("사건파일 오류: " + error.message);
        setLoading(false);
        return;
      }

      setFullText(casefile.full_text || "");
      setLockedText(casefile.locked_text ?? null);
      setLoading(false);
    }

    boot();
  }, [suspect]);

  const name = (suspectLabel as any)[suspect] ?? suspect;

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>사건파일: {name}</h1>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <a href="/casefiles">
          <button>목록</button>
        </a>
        <a href="/">
          <button>대시보드</button>
        </a>
      </div>

      {loading ? (
        <p style={{ marginTop: 16 }}>불러오는 중…</p>
      ) : !suspect ? (
        <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <b>오류</b>
          <p style={{ marginTop: 8, opacity: 0.8 }}>
            suspect 파라미터를 읽지 못했습니다. /casefiles/sophia 처럼 접속했는지 확인하세요.
          </p>
        </div>
      ) : !unlocked ? (
        <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <b>잠김</b>
          <p style={{ marginTop: 8, opacity: 0.8 }}>
            해당 용의자 카드 5장을 모두 수집해야 열립니다.
          </p>
        </div>
      ) : (
        <>
          <section style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>전문</div>
            <pre style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, fontFamily: "inherit" }}>
{fullText}
            </pre>
          </section>

          <section style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>잠김 섹션</div>
            <pre style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, fontFamily: "inherit" }}>
{lockedText ?? "(잠김 섹션 없음)"}
            </pre>
          </section>
        </>
      )}
    </main>
  );
}
