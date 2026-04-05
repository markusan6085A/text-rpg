import { apiRequest } from "./core";

// Clan API
export interface Clan {
  id: string;
  name: string;
  level: number;
  reputation: number;
  adena: number;
  coinLuck: number;
  emblem: string | null;
  announcement?: string | null;
  createdAt: string;
  creator: {
    id: string;
    name: string;
  };
  members?: ClanMember[];
  isLeader?: boolean;
  isMember?: boolean;
  memberCount?: number;
}

export interface ClanInvite {
  id: string;
  clanId: string;
  clanName: string;
  clanLevel: number;
  clanEmblem: string | null;
  invitedBy: string;
  createdAt: string;
}

export interface ClanApplication {
  id: string;
  clanId: string;
  clanName: string;
  clanLevel: number;
  clanEmblem: string | null;
  characterId?: string;
  characterName?: string;
  characterLevel?: number;
  createdAt: string;
}

export interface ClanMember {
  id: string;
  characterId: string;
  characterName: string;
  characterLevel?: number;
  title: string | null;
  isDeputy: boolean;
  isLeader?: boolean;
  joinedAt: string;
  isOnline: boolean;
}

export interface ClanChatMessage {
  id: string;
  characterId: string;
  characterName: string;
  nickColor: string | null;
  emblem: string | null;
  message: string;
  createdAt: string;
}

export interface ClanLog {
  id: string;
  type: string;
  characterId: string | null;
  characterName: string | null;
  targetCharacterId: string | null;
  message: string;
  metadata: any;
  createdAt: string;
}

export interface ClansResponse {
  ok: boolean;
  clans: Array<{
    id: string;
    name: string;
    level: number;
    reputation: number;
    adena: number;
    coinLuck: number;
    emblem: string | null;
    createdAt: string;
    _count: { members: number };
  }>;
}

export interface MyClanResponse {
  ok: boolean;
  clan: Clan | null;
}

export interface ClanChatResponse {
  ok: boolean;
  messages: ClanChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClanLogsResponse {
  ok: boolean;
  logs: ClanLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClanMembersResponse {
  ok: boolean;
  members: ClanMember[];
  isLeader: boolean;
}

export async function listClans(): Promise<ClansResponse> {
  const response = await apiRequest<ClansResponse>('/clans', {
    method: 'GET',
  });
  return response;
}

export async function getMyClan(): Promise<MyClanResponse> {
  const response = await apiRequest<MyClanResponse>('/clans/my', {
    method: 'GET',
  });
  return response;
}

export async function getClan(id: string): Promise<{ ok: boolean; clan: Clan }> {
  const response = await apiRequest<{ ok: boolean; clan: Clan }>(`/clans/${id}`, {
    method: 'GET',
  });
  return response;
}

export async function createClan(name: string, characterId?: string): Promise<{ ok: boolean; clan: Clan }> {
  const body: { name: string; characterId?: string } = { name };
  if (characterId) body.characterId = characterId;
  const response = await apiRequest<{ ok: boolean; clan: Clan }>('/clans', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return response;
}

export async function deleteClan(id: string): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>(`/clans/${id}`, {
    method: 'DELETE',
  });
  return response;
}

export async function getClanChat(clanId: string, page: number = 1, limit: number = 50): Promise<ClanChatResponse> {
  const response = await apiRequest<ClanChatResponse>(`/clans/${clanId}/chat?page=${page}&limit=${limit}`, {
    method: 'GET',
  });
  return response;
}

export async function postClanChatMessage(clanId: string, message: string): Promise<{ ok: boolean; message: ClanChatMessage }> {
  const response = await apiRequest<{ ok: boolean; message: ClanChatMessage }>(`/clans/${clanId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  return response;
}

export async function getClanLogs(clanId: string, page: number = 1, limit: number = 50): Promise<ClanLogsResponse> {
  const response = await apiRequest<ClanLogsResponse>(`/clans/${clanId}/logs?page=${page}&limit=${limit}`, {
    method: 'GET',
  });
  return response;
}

export async function getClanMembers(clanId: string): Promise<ClanMembersResponse> {
  const response = await apiRequest<ClanMembersResponse>(`/clans/${clanId}/members`, {
    method: 'GET',
  });
  return response;
}

export async function kickClanMember(clanId: string, characterId: string): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>(`/clans/${clanId}/members/${characterId}/kick`, {
    method: 'POST',
  });
  return response;
}

export async function changeClanMemberTitle(clanId: string, characterId: string, title: string | null): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>(`/clans/${clanId}/members/${characterId}/title`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  return response;
}

export async function setClanMemberDeputy(clanId: string, characterId: string, isDeputy: boolean): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>(`/clans/${clanId}/members/${characterId}/deputy`, {
    method: 'POST',
    body: JSON.stringify({ isDeputy }),
  });
  return response;
}

export interface ClanWarehouseItem {
  id: string;
  itemId: string;
  qty: number;
  meta: any;
  depositedBy: string | null;
  depositedAt: string;
}

export interface ClanWarehouseResponse {
  ok: boolean;
  items: ClanWarehouseItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getClanWarehouse(clanId: string, page: number = 1, limit: number = 10): Promise<ClanWarehouseResponse> {
  const response = await apiRequest<ClanWarehouseResponse>(`/clans/${clanId}/warehouse?page=${page}&limit=${limit}`, {
    method: 'GET',
  });
  return response;
}

export async function depositClanWarehouseItem(
  clanId: string,
  itemId: string,
  qty: number = 1,
  meta: any = {},
  expectedRevision: number
): Promise<{ ok: boolean; item: ClanWarehouseItem; character?: any }> {
  const response = await apiRequest<{ ok: boolean; item: ClanWarehouseItem; character?: any }>(`/clans/${clanId}/warehouse/deposit`, {
    method: 'POST',
    body: JSON.stringify({ itemId, qty, meta, expectedRevision }),
  });
  return response;
}

export async function withdrawClanWarehouseItem(
  clanId: string,
  itemId: string,
  expectedRevision: number
): Promise<{ ok: boolean; character?: any }> {
  const response = await apiRequest<{ ok: boolean; character?: any }>(`/clans/${clanId}/warehouse/withdraw`, {
    method: 'POST',
    body: JSON.stringify({ itemId, expectedRevision }),
  });
  return response;
}

export async function depositClanAdena(
  clanId: string,
  amount: number,
  expectedRevision: number
): Promise<{ ok: boolean; character?: any }> {
  const response = await apiRequest<{ ok: boolean; character?: any }>(`/clans/${clanId}/adena/deposit`, {
    method: 'POST',
    body: JSON.stringify({ amount, expectedRevision }),
  });
  return response;
}

export async function withdrawClanAdena(
  clanId: string,
  amount: number,
  expectedRevision: number
): Promise<{ ok: boolean; character?: any }> {
  const response = await apiRequest<{ ok: boolean; character?: any }>(`/clans/${clanId}/adena/withdraw`, {
    method: 'POST',
    body: JSON.stringify({ amount, expectedRevision }),
  });
  return response;
}

export async function depositClanCoinLuck(
  clanId: string,
  amount: number,
  expectedRevision: number
): Promise<{ ok: boolean; character?: any }> {
  const response = await apiRequest<{ ok: boolean; character?: any }>(`/clans/${clanId}/coin-luck/deposit`, {
    method: 'POST',
    body: JSON.stringify({ amount, expectedRevision }),
  });
  return response;
}

export async function withdrawClanCoinLuck(
  clanId: string,
  amount: number,
  expectedRevision: number
): Promise<{ ok: boolean; character?: any }> {
  const response = await apiRequest<{ ok: boolean; character?: any }>(`/clans/${clanId}/coin-luck/withdraw`, {
    method: 'POST',
    body: JSON.stringify({ amount, expectedRevision }),
  });
  return response;
}

export async function setClanEmblem(clanId: string, emblem: string): Promise<{ ok: boolean; clan: Clan }> {
  const response = await apiRequest<{ ok: boolean; clan: Clan }>(`/clans/${clanId}/emblem`, {
    method: 'POST',
    body: JSON.stringify({ emblem }),
  });
  return response;
}

// Invite / Apply / Leave / Transfer
export async function getClanInvites(): Promise<{ ok: boolean; invites: ClanInvite[] }> {
  return apiRequest<{ ok: boolean; invites: ClanInvite[] }>('/clans/invites/mine', { method: 'GET' });
}

export async function respondClanInvite(inviteId: string, accept: boolean): Promise<{ ok: boolean; accepted: boolean }> {
  return apiRequest<{ ok: boolean; accepted: boolean }>(`/clans/invites/${inviteId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ accept }),
  });
}

export async function inviteToClan(clanId: string, characterId: string): Promise<{ ok: boolean; invite?: { id: string } }> {
  return apiRequest<{ ok: boolean; invite?: { id: string } }>(`/clans/${clanId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ characterId }),
  });
}

// ——— Party (до 5 осіб; локація не перевіряється) ———

export type PartyMemberDto = { characterId: string; name: string; level: number };
export type PartyDto = { id: string; leaderCharacterId: string; members: PartyMemberDto[] };
export type PartyInviteMine = {
  id: string;
  partyId: string;
  fromCharacterId: string;
  fromName: string;
  createdAt: string;
  partySize: number;
};

export async function getPartyCurrent(): Promise<{ ok: boolean; party: PartyDto | null }> {
  return apiRequest<{ ok: boolean; party: PartyDto | null }>("/parties/current", { method: "GET" });
}

export async function getPartyInvitesMine(): Promise<{ ok: boolean; invites: PartyInviteMine[] }> {
  return apiRequest<{ ok: boolean; invites: PartyInviteMine[] }>("/parties/invites/mine", { method: "GET" });
}

export async function inviteToParty(targetCharacterId: string): Promise<{ ok: boolean; invite?: { id: string } }> {
  return apiRequest<{ ok: boolean; invite?: { id: string } }>("/parties/invite", {
    method: "POST",
    body: JSON.stringify({ targetCharacterId }),
  });
}

export async function respondPartyInvite(
  inviteId: string,
  accept: boolean
): Promise<{ ok: boolean; accepted?: boolean }> {
  return apiRequest<{ ok: boolean; accepted?: boolean }>(`/parties/invites/${inviteId}/respond`, {
    method: "POST",
    body: JSON.stringify({ accept }),
  });
}

export async function leaveParty(): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("/parties/leave", { method: "POST", body: JSON.stringify({}) });
}

export async function kickPartyMember(characterId: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("/parties/kick", {
    method: "POST",
    body: JSON.stringify({ characterId }),
  });
}

/** Сервер нараховує частку EXP/SP/адени іншим членам пати; убивця вже отримав свою частку локально. */
export async function postPartyKillShare(payload: {
  baseExp: number;
  baseSp: number;
  baseAdena: number;
}): Promise<{ ok: boolean; applied?: number; partySize?: number }> {
  return apiRequest<{ ok: boolean; applied?: number; partySize?: number }>("/parties/kill-share", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Глобальний стан HP/респавну мобів у зоні (сервер — джерело правди). */
export async function fetchWorldZoneMobStateApi(zoneId: string): Promise<{
  ok: boolean;
  hp: Record<string, { currentHp: number; maxHp: number }>;
  respawn: Record<string, string>;
}> {
  const enc = encodeURIComponent(zoneId);
  return apiRequest(`/world/zones/${enc}`, { method: "GET" });
}

export async function putWorldMobHp(
  zoneId: string,
  mobIndex: number,
  currentHp: number,
  maxHp: number
): Promise<{ ok: boolean }> {
  const enc = encodeURIComponent(zoneId);
  return apiRequest(`/world/zones/${enc}/mobs/${mobIndex}/hp`, {
    method: "PUT",
    body: JSON.stringify({ currentHp, maxHp }),
  });
}

export async function postWorldMobKill(
  zoneId: string,
  mobIndex: number,
  respawnDelayMs: number
): Promise<{ ok: boolean; respawnAt?: string }> {
  const enc = encodeURIComponent(zoneId);
  return apiRequest(`/world/zones/${enc}/mobs/${mobIndex}/kill`, {
    method: "POST",
    body: JSON.stringify({ respawnDelayMs }),
  });
}

export async function applyToClan(clanId: string): Promise<{ ok: boolean; application?: { id: string } }> {
  return apiRequest<{ ok: boolean; application?: { id: string } }>(`/clans/${clanId}/apply`, {
    method: 'POST',
  });
}

export async function getClanApplications(): Promise<{ ok: boolean; applications: ClanApplication[] }> {
  return apiRequest<{ ok: boolean; applications: ClanApplication[] }>(`/clans/applications/mine`, { method: 'GET' });
}

export async function getClanApplicationsList(clanId: string): Promise<{ ok: boolean; applications: ClanApplication[] }> {
  return apiRequest<{ ok: boolean; applications: ClanApplication[] }>(`/clans/${clanId}/applications`, { method: 'GET' });
}

export async function acceptClanApplication(clanId: string, characterId: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/clans/${clanId}/applications/${characterId}/accept`, { method: 'POST' });
}

export async function declineClanApplication(clanId: string, characterId: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/clans/${clanId}/applications/${characterId}/decline`, { method: 'POST' });
}

export async function leaveClan(clanId: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/clans/${clanId}/leave`, { method: 'POST' });
}

export async function transferClanLeadership(clanId: string, newLeaderCharacterId: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/clans/${clanId}/transfer`, {
    method: 'POST',
    body: JSON.stringify({ characterId: newLeaderCharacterId }),
  });
}

export async function setClanAnnouncement(clanId: string, announcement: string): Promise<{ ok: boolean; announcement: string }> {
  return apiRequest<{ ok: boolean; announcement: string }>(`/clans/${clanId}/announcement`, {
    method: 'PATCH',
    body: JSON.stringify({ announcement }),
  });
}
