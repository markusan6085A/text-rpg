export type ChatChannel = "general" | "trade" | "clan" | "private";

export interface ChatProps {
  navigate: (path: string) => void;
}
