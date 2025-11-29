import React from "react";

type Props = {
  path: string;
  go: (p: string) => void;
};

function Btn({
  href,
  onClick,
  active,
  children,
}: {
  href: string;
  onClick: (p: string) => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick(href);
      }}
      className={`bm-pill ${active ? "bm-active" : ""}`}
    >
      {children}
    </a>
  );
}

export default function BottomMenu({ path, go }: Props) {
  return (
    <div className="bottom-menu">
      <div className="bottom-menu-wrap">
        <Btn href="/mail" onClick={go}>📨 Почта</Btn>
        <Btn href="/chat" onClick={go}>💬 Чат</Btn>
        <Btn href="/forum" onClick={go}>📜 Форум</Btn>

        <Btn href="/clan" onClick={go}>👑 Клан</Btn>
        <Btn href="/city" onClick={go} active={path.startsWith("/city")}>
          ✚ Город
        </Btn>
        <Btn href="/character" onClick={go} active={path.startsWith("/character")}>
          🙂 Персонаж
        </Btn>
      </div>
    </div>
  );
}
