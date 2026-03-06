"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { cardMap, suspects, suspectLabel } from "@/lib/cardMap";

type Suspect = (typeof suspects)[number];

export default function ClaimPage() {
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect>("sophia");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string>("");
  const [cardBody, setCardBody] = useState<string>("");
  const [cardTitle, setCardTitle] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [unlockSuspect, setUnlockSuspect] = useState<string>("");

  const selectedCardId = useMemo(
    () => cardMap[selectedSuspect][selectedIndex],
    [selectedSuspect, selectedIndex]
  );

  useEffect(() => {
    async function guard() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) window.location.href = "/login";
    }
    guard();
  }, []);

  async function claim() {
    setLoading(true);
    setMessage("");
    setCardBody("");
    setCardTitle("");

    const cleaned = code.trim().toUpperCase();
    if (cleaned.length !== 6) {
      setMessage("코드는 6자리입니다.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc("claim_card", {
      p_card_id: selectedCardId,
      p_code: cleaned,
    });

    if (error) {
      setMessage("서버 오류: " + error.message);
      setLoading(false);
      return;
    }

    if (!data?.ok) {
      setMessage(
        data?.error === "INVALID_CODE" ? "코드가 틀렸습니다." : "실패: " + data?.error
      );
      setLoading(false);
      return;
    }

    setCardTitle(data.card.title);
    setCardBody(data.card.body);

    const prog = data.progress?.count ?? "?";
    const unlock = data.new_unlock ? " (사건파일 언락!)" : "";
    setMessage(`획득 성공: ${selectedCardId} | 진행 ${prog}/5${unlock}`);

    if (data.new_unlock) {
      setUnlockSuspect(selectedSuspect);
    }

    setLoading(false);
  }

  return (
    <main style={{ padding: 24, maxWidth: 840, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>코드 입력 (카드 획득)</h1>
      <p style={{ opacity: 0.85 }}>
        실물 카드의 <b>용의자 + 번호</b>를 선택하고, <b>6자리 코드</b>를 입력하세요.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {suspects.map((s) => (
          <button
            key={s}
            onClick={() => {
              setSelectedSuspect(s);
              setSelectedIndex(0);
              setMessage("");
              setCardBody("");
              setCardTitle("");
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: selectedSuspect === s ? "2px solid #111" : "1px solid #ddd",
              background: selectedSuspect === s ? "#111" : "#fff",
              color: selectedSuspect === s ? "#fff" : "#111",
            }}
          >
            {suspectLabel[s]}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <button
            key={i}
            onClick={() => {
              setSelectedIndex(i);
              setMessage("");
              setCardBody("");
              setCardTitle("");
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: selectedIndex === i ? "2px solid #111" : "1px solid #ddd",
              background: selectedIndex === i ? "#111" : "#fff",
              color: selectedIndex === i ? "#fff" : "#111",
              minWidth: 56,
            }}
          >
            {i + 1}번
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12, opacity: 0.85 }}>
        선택됨: <b>{suspectLabel[selectedSuspect]}</b> / <b>{selectedIndex + 1}번</b> (ID:{" "}
        <b>{selectedCardId}</b>)
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="6자리 코드"
          style={{ padding: 12, fontSize: 16, width: 200, letterSpacing: 2 }}
          maxLength={6}
        />
        <button onClick={claim} disabled={loading} style={{ padding: "12px 16px", fontSize: 16 }}>
          {loading ? "처리 중…" : "획득하기"}
        </button>

        <a href="/" style={{ marginLeft: "auto" }}>
          <button style={{ padding: "12px 16px" }}>대시보드</button>
        </a>
      </div>

      {message && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
          {message}
        </div>
      )}

      {(cardTitle || cardBody) && (
        <section style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 900 }}>{cardTitle}</div>
          <pre
            style={{
              marginTop: 10,
              whiteSpace: "pre-wrap",
              lineHeight: 1.5,
              fontFamily: "inherit",
            }}
          >
            {cardBody}
          </pre>
        </section>
      )}

      {unlockSuspect && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              maxWidth: 420,
              width: "100%",
              textAlign: "center",
              border: "1px solid #ddd",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 900 }}>사건파일 언락</div>
            <p style={{ marginTop: 12, lineHeight: 1.6 }}>
              <b>{suspectLabel[unlockSuspect as keyof typeof suspectLabel]}</b>의 단서 5개를 모두 모았습니다.
              이제 사건파일을 열 수 있습니다.
            </p>

            <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center" }}>
              <a href={`/casefiles/${unlockSuspect}`}>
                <button style={{ padding: "12px 16px" }}>사건파일 열기</button>
              </a>
              <button
                onClick={() => setUnlockSuspect("")}
                style={{ padding: "12px 16px" }}
              >
                계속 수집
              </button>
            </div>
          </div>
        </div>
      )}

      <p style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
        * 수집한 단서는 인벤토리에서 확인할 수 있습니다.
      </p>
    </main>
  );
}