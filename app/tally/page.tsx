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

type TallyRow = {
  round_no: number;
  title: string;
  is_open: boolean;
  suspect_id: string;
  votes_count: number;
};

export default function TallyPage() {
  const [round, setRound] = useState<Round | null>(null);
  const [rows, setRows] = useState<TallyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const bySuspect = useMemo(() => {
    const base: Record<string, number> = {
      victor: 0,
      sophia: 0,
      kai: 0,
      leonard: 0,
    };
    for (const r of rows) {
      if (base[r.suspect_id] !== undefined) base[r.suspect_id] = r.votes_count;
    }
    return base;
  }, [rows]);

  const totalVotes = useMemo(() => {
    return Object.values(bySuspect).reduce((a, b) => a + b, 0);
  }, [bySuspect]);

  useEffect(() => {
    async function boot() {
      setLoading(true);

      // 로그인 안 했으면 /login로
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        window.location.href = "/login";
        return;
      }

      // 1) 현재 라운드(열린 라운드 우선, 없으면 가장 최근 라운드)
      const { data: openRound, error: openErr } = await supabase
        .from("vote_rounds")
        .select("id, round_no, title, is_open")
        .eq("is_open", true)
        .order("round_no", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (openErr) {
        alert("라운드 조회 오류: " + openErr.message);
        setLoading(false);
        return;
      }

      let current = openRound as Round | null;

      if (!current) {
        const { data: latest, error: latestErr } = await supabase
          .from("vote_rounds")
          .select("id, round_no, title, is_open")
          .order("round_no", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestErr) {
          alert("라운드 조회 오류: " + latestErr.message);
          setLoading(false);
          return;
        }
        current = latest as Round | null;
      }

      setRound(current);

      if (!current) {
        setRows([]);
        setLoading(false);
        return;
      }

      // 2) 집계 뷰에서 해당 라운드만 가져오기
      const { data: tally, error: tallyErr } = await supabase
        .from("vote_tally")
        .select("round_no, title, is_open, suspect_id, votes_count")
        .eq("round_no", current.round_no);

      if (tallyErr) {
        alert("집계 조회 오류: " + tallyErr.message);
        setLoading(false);
        return;
      }

      setRows((tally as any) ?? []);
      setLoading(false);
    }

    boot();
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>투표 집계</h1>

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href="/"><button>대시보드</button></a>
        <a href="/vote"><button>투표</button></a>
        <a href="/news"><button>뉴스</button></a>
      </div>

      {loading ? (
        <p style={{ marginTop: 16 }}>불러오는 중…</p>
      ) : !round ? (
        <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <b>라운드 없음</b>
          <p style={{ marginTop: 8, opacity: 0.8 }}>
            vote_rounds 테이블에 라운드가 아직 없습니다.
          </p>
        </div>
      ) : (
        <>
          <section style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 900 }}>
              현재 라운드: {round.round_no} — {round.title}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
              상태: {round.is_open ? "OPEN(진행 중)" : "CLOSED(마감)"} · 총 투표수: {totalVotes}
            </div>
          </section>

          <section style={{ marginTop: 16, display: "grid", gap: 12 }}>
            {suspects.map((s) => (
              <div key={s} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 900 }}>{suspectLabel[s]}</div>
                  <div style={{ fontWeight: 900 }}>{bySuspect[s]}표</div>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    height: 10,
                    background: "#eee",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${totalVotes === 0 ? 0 : Math.round((bySuspect[s] / totalVotes) * 100)}%`,
                      height: "100%",
                      background: "#111",
                    }}
                  />
                </div>
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                  비율: {totalVotes === 0 ? 0 : Math.round((bySuspect[s] / totalVotes) * 100)}%
                </div>
              </div>
            ))}
          </section>

          <p style={{ marginTop: 14, fontSize: 12, opacity: 0.7 }}>
            * 새로고침(F5)하면 최신 집계가 반영됩니다.
          </p>
        </>
      )}
    </main>
  );
}