"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { suspectLabel } from "@/lib/cardMap";

type SuspectId = keyof typeof suspectLabel;

type CardInfo = {
  suspect_id: SuspectId;
  title: string;
  body: string;
  evidence_strength: number;
  tag: string;
  location: string;
};

type Item = {
  card_id: string;
  acquired_at: string;
  cards?: CardInfo | null;
};

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function boot() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = "/login";
        return;
      }

      const { data: rows, error } = await supabase
        .from("user_cards")
        .select("card_id, acquired_at, cards(suspect_id,title,body,evidence_strength,tag,location)")
        .order("acquired_at", { ascending: false });

      if (error) {
        alert("인벤토리 오류: " + error.message);
        setLoading(false);
        return;
      }

      setItems((rows as Item[]) ?? []);
      setLoading(false);
    }
    boot();
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>인벤토리</h1>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <a href="/"><button>대시보드</button></a>
        <a href="/claim"><button>코드 입력</button></a>
        <a href="/casefiles"><button>사건파일</button></a>
      </div>

      {loading ? (
        <p style={{ marginTop: 16 }}>불러오는 중…</p>
      ) : items.length === 0 ? (
        <p style={{ marginTop: 16 }}>아직 획득한 카드가 없습니다.</p>
      ) : (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {items.map((it) => {
            const suspectName = it.cards?.suspect_id
              ? suspectLabel[it.cards.suspect_id]
              : "빅터";

            return (
              <div
                key={it.card_id}
                style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 900 }}>
                    {it.card_id} — {it.cards?.title ?? "카드"}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    {new Date(it.acquired_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                  용의자: <b>{suspectName}</b> · 강도: ★{it.cards?.evidence_strength ?? "?"} ·
                  태그: {it.cards?.tag ?? "-"} · 위치: {it.cards?.location ?? "-"}
                </div>

                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: "pointer" }}>전문 보기</summary>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.5,
                      fontFamily: "inherit",
                      marginTop: 8,
                    }}
                  >
                    {it.cards?.body ?? "(본문 없음)"}
                  </pre>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}