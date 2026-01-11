import React from "react";
import GuildScreen from "./GuildScreen";

export default function WarriorGuild(props: { navigate: (path: string) => void }) {
  return <GuildScreen {...props} />;
}
