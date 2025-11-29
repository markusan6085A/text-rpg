import React from "react";

interface ItemRowProps {
  item: {
    icon: string;
    name: string;
    count?: number;
  };
}

export default function ItemRow({ item }: ItemRowProps) {
  return (
    <div className="py-2 pl-2 flex items-center gap-2">
      <img
        src={item.icon}
        alt={item.name}
        className="w-6 h-6 object-contain"
      />
      <span>
        {item.name}
        {item.count && item.count > 1 ? ` x${item.count}` : ""}
      </span>
    </div>
  );
}
