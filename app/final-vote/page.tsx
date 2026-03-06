"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { suspects, suspectLabel } from "@/lib/cardMap";

export default function FinalVotePage() {
  const [selected, setSelected] = useState<(typeof suspects)[number]>("victor");
  const [submitted, setSubmitted] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function boot() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("final_votes")
        .select("id, suspect_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setSubmitted(true);
        setMsg(
          `이미 최종 투표를 제출했습니다: ${
            suspectLabel[(data as any).suspect_id] ?? (data as any).suspect_id
          }`
        );
      }
    }

    boot();
  }, []);

  async function submitVote() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("final_votes").insert({
      user_id: user.id,
      suspect_id: selected,
    });

    if (error) {
      setMsg("제출 실패: " + error.message);
      return;
    }

    setSubmitted(true);
    setMsg(`최종 투표 완료: ${suspectLabel[selected]}`);
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>최종 투표</h1>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <a href="/"><button>대시보드</button></a>
      </div>

      <section style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
        <p>모든 추리를 마쳤다면, 배신자를 선택하세요.</p>

        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {suspects.map((s) => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              disabled={submitted}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: selected === s ? "2px solid #111" : "1px solid #ddd",
                background: selected === s ? "#111" : "#fff",
                color: selected === s ? "#fff" : "#111",
                opacity: submitted ? 0.6 : 1,
              }}
            >
              {suspectLabel[s]}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          선택: <b>{suspectLabel[selected]}</b>
        </div>

        <button
          onClick={submitVote}
          disabled={submitted}
          style={{ marginTop: 12, padding: "12px 16px" }}
        >
          {submitted ? "제출 완료" : "최종 투표 제출"}
        </button>

        {msg && (
          <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
            {msg}
          </div>
        )}
      </section>

      {submitted && (
        <section
          style={{
            marginTop: 16,
            border: "1px solid #111",
            borderRadius: 12,
            padding: 18,
            background: "#fafafa",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 900 }}>최종 보고 완료</div>
          <p style={{ marginTop: 10, lineHeight: 1.7 }}>
            최종 투표 제출 완료
            <br />
            모든 후보들이 시험을 마칠 때까지 기다려 주세요.
          </p>
          <p style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            수고했습니다 입단식을 위해 Hall 으로 이동해 주세요.
          </p>
        </section>
      )}
    </main>
  );
}