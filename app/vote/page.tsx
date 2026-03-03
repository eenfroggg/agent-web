"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { suspects, suspectLabel } from "@/lib/cardMap";

type Round = {
  id: number;
  round_no: number;
  title: string;
  is_open: boolean;
};

export default function VotePage() {
  const [round, setRound] = useState<Round | null>(null);
  const [selected, setSelected] = useState<(typeof suspects)[number]>("victor");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const roundLabel = useMemo(() => {
    if (!round) return "라운드 로딩 중…";
    return `현재 라운드: ${round.round_no} — ${round.title} (${round.is_open ? "OPEN" : "CLOSED"})`;
  }, [round]);

  useEffect(() => {
    async function boot() {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        window.location.href = "/login";
        return;
      }

      // 1) 열린 라운드가 있으면 그걸 사용
      const { data: openRound, error: openErr } = await supabase
        .from("vote_rounds")
        .select("id, round_no, title, is_open")
        .eq("is_open", true)
        .order("round_no", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (openErr) {
        setMsg("라운드 로딩 오류: " + openErr.message);
        setLoading(false);
        return;
      }

      // 2) 열린 라운드가 없으면 가장 최근 라운드(큰 round_no)
      if (!openRound) {
        const { data: lastRound, error: lastErr } = await supabase
          .from("vote_rounds")
          .select("id, round_no, title, is_open")
          .order("round_no", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastErr) {
          setMsg("라운드 로딩 오류: " + lastErr.message);
          setLoading(false);
          return;
        }
        setRound((lastRound as any) ?? null);
        setLoading(false);
        return;
      }

      setRound(openRound as any);
      setLoading(false);
    }

    boot();
  }, []);

  async function submitVote() {
    setMsg("");

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (!round) {
      setMsg("라운드를 찾지 못했습니다.");
      return;
    }
    if (!round.is_open) {
      setMsg("현재 라운드는 마감(CLOSED) 상태라 투표할 수 없습니다.");
      return;
    }

    setSubmitting(true);

    // 핵심: votes 테이블 컬럼명이 round_id / user_id / choice 여야 함
    const { error } = await supabase.from("votes").upsert(
      {
        round_id: round.id,
        user_id: user.id,
        choice: selected,
      },
      { onConflict: "round_id,user_id" }
    );

    if (error) {
      setMsg("제출 실패: " + error.message);
      setSubmitting(false);
      return;
    }

    setMsg(`제출 완료: ${suspectLabel[selected]}`);
    setSubmitting(false);
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>투표</h1>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <a href="/"><button>대시보드</button></a>
        <a href="/news"><button>뉴스</button></a>
        <a href="/tally"><button>집계</button></a>
      </div>

      <section style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
        {loading ? (
          <p>불러오는 중…</p>
        ) : (
          <>
            <div style={{ fontWeight: 800 }}>{roundLabel}</div>
            {!round && <p style={{ marginTop: 8, opacity: 0.8 }}>vote_rounds에 라운드가 없습니다.</p>}

            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {suspects.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelected(s)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: selected === s ? "2px solid #111" : "1px solid #ddd",
                    background: selected === s ? "#111" : "#fff",
                    color: selected === s ? "#fff" : "#111",
                  }}
                  disabled={!round?.is_open}
                >
                  {suspectLabel[s]}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 10, opacity: 0.85 }}>
              선택: <b>{suspectLabel[selected]}</b>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button
                onClick={submitVote}
                disabled={submitting || !round || !round.is_open}
                style={{ padding: "10px 14px" }}
              >
                {submitting ? "제출 중…" : "투표 제출"}
              </button>
              <a href="/tally">
                <button style={{ padding: "10px 14px" }}>집계 보기</button>
              </a>
            </div>

            {msg && (
              <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
                {msg}
              </div>
            )}
          </>
        )}
      </section>

      <p style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
        * 라운드가 OPEN일 때만 투표가 저장됩니다. (한 라운드에 1인 1표 — 다시 제출하면 덮어씀)
      </p>
    </main>
  );
}