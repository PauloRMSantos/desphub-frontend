import type { GovbrSessionState, PairingTokenResponse } from "@/types";
import { apiGet, apiSend } from "./http";

export function getGovbrSession(): Promise<GovbrSessionState> {
  return apiGet<GovbrSessionState>("/rpa/session");
}

export async function issuePairingToken(): Promise<string> {
  const res = await apiSend<PairingTokenResponse>("POST", "/rpa/pairing-token");
  if (!res?.pairingToken) throw new Error("pairingToken ausente");
  return res.pairingToken;
}
