import React from "react";
import GuildScreen from "./GuildScreen";

export default function MageGuild(props: { navigate: (path: string) => void }) {
  return (
    <GuildScreen
      {...props}
      title="Гильдия магов — изучение и прокачка скилов"
      backLabel="В город"
    />
  );
}
