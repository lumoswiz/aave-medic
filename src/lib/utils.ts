import { getChainById } from '@bitte-ai/agent-sdk';
import {
  createPublicClient,
  createWalletClient,
  custom,
  PublicClient,
  WalletClient,
} from 'viem';

export function getPublicClient(chainId: number): PublicClient {
  const chain = getChainById(chainId);
  const client = createPublicClient({
    chain,
    transport: custom((window as any).ethereum!),
  });
  return client;
}

export function getWalletClient(chainId: number): WalletClient {
  const chain = getChainById(chainId);
  const client = createWalletClient({
    chain,
    transport: custom((window as any).ethereum!),
  });
  return client;
}
