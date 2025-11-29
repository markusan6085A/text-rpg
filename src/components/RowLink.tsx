import React from "react";

type Props = { label: string; onClick?: () => void; accent?: boolean; right?: React.ReactNode };
export default function RowLink({ label, onClick, accent, right }: Props) {
  return (
    <div className="row" onClick={onClick} role="button">
      <span className={accent ? "label gold" : "label"}>{label}</span>
      {right ?? <span className="small">›</span>}
    </div>
  );
}
