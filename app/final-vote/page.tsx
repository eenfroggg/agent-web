import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { suspects, suspectLabel } from "@/lib/cardMap";

export default function FinalVotePage() {
  const [selected, setSelected] = useState<(typeof suspects)[number]>("victor");
  const [submitted, setSubmitted] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function check() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("final_votes")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setSubmitted(true);
        setMsg("이미 최종 투표를 제출했습니다.");
      }
    }

    check();
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
        <p>배신자라고 생각하는 인물을 1회만 선택하세요.</p>

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
    </main>
  );
}