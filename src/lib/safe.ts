import {
  type Address,
  Hex,
  encodeFunctionData,
  encodePacked,
  getContractAddress,
  keccak256,
  parseAbi,
} from 'viem';
import { SAFE_PROXY_FACTORY_ABI, SAFE_SINGLETON_ABI } from './abi';
import { SAFE_PROXY_FACTORY, SAFE_SINGLETON } from './addresses';
import {
  buildAllowTargetTx,
  buildAssignRolesTx,
  buildDeployModuleTx,
  buildScopeFunctionTx,
  buildScopeTargetTx,
  calculateModuleProxyAddress,
  encodeRoleKey,
  getModuleSetUpData,
} from './roles';
import { ConditionFlat, type MetaTransaction } from './types';
import { getPublicClient } from './utils';
import { ExecutionOptions } from './enums';
import { encodeMulti } from './multisend';

const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000';

const SAFE_NETWORKS: { [chainId: number]: string } = {
  1: 'mainnet',
  10: 'optimism',
  56: 'binance',
  97: 'bsc-testnet',
  100: 'gnosis-chain',
  130: 'unichain',
  137: 'polygon',
  146: 'sonic',
  42161: 'arbitrum',
  43113: 'avalanche-fuji',
  43114: 'avalanche',
  480: 'world-chain',
  80001: 'polygon-mumbai',
  8453: 'base',
  11155111: 'sepolia',
};

export async function getModulesForSafe(
  safeAddress: Address,
  chainId: number
): Promise<Address[]> {
  const network = SAFE_NETWORKS[chainId];
  if (!network) {
    throw new Error(`Unsupported network for chainId ${chainId}`);
  }

  const SAFE_MODULES_URL = `https://safe-transaction-${network}.safe.global/api/v1/safes`;
  const resp = await fetch(`${SAFE_MODULES_URL}/${safeAddress}/modules/`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  });

  if (!resp.ok) {
    throw new Error(
      `Error fetching modules for ${safeAddress} on ${network}: ${resp.statusText}`
    );
  }

  const data: { modules: string[] } = await resp.json();
  return data.modules as Address[];
}

export function buildEnableModuleTx(
  safe: Address,
  module: Address
): MetaTransaction {
  const data = encodeFunctionData({
    abi: parseAbi(['function enableModule(address module)']),
    functionName: 'enableModule',
    args: [module],
  });
  return { to: safe, value: '0x0', data };
}

export async function prepareEnableModuleTransactions(
  safe: Address,
  chainId: number,
  saltNonce: bigint
): Promise<MetaTransaction[]> {
  const initData = getModuleSetUpData(safe);
  const moduleProxyAddress: Address = calculateModuleProxyAddress(
    initData,
    saltNonce
  );

  const deployModuleTx = buildDeployModuleTx(safe, saltNonce);
  const enableModuleTx = buildEnableModuleTx(safe, moduleProxyAddress);

  const client = getPublicClient(chainId);
  const [code, installedModules] = await Promise.all([
    client.getCode({ address: moduleProxyAddress }),
    getModulesForSafe(safe, chainId),
  ]);

  const isDeployed = code === '0x' || code === undefined ? false : true;
  const isInstalled = installedModules.includes(moduleProxyAddress);

  return [
    ...(isDeployed ? [] : [deployModuleTx]),
    ...(isInstalled ? [] : [enableModuleTx]),
  ];
}

export async function calculateSafeAddress(
  chainId: number,
  owners: Address[],
  saltNonce: bigint
): Promise<Address> {
  const client = getPublicClient(chainId);
  const proxyCreationCode = await client.readContract({
    address: SAFE_PROXY_FACTORY,
    abi: SAFE_PROXY_FACTORY_ABI,
    functionName: 'proxyCreationCode',
  });

  const setup = encodeFunctionData({
    abi: SAFE_SINGLETON_ABI,
    functionName: 'setup',
    args: [
      owners,
      1n,
      ZERO_ADDRESS,
      '0x',
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      0n,
      ZERO_ADDRESS,
    ],
  });

  const salt = keccak256(
    encodePacked(['bytes32', 'uint256'], [keccak256(setup), saltNonce])
  );

  const initCode = encodePacked(
    ['bytes', 'uint256'],
    [proxyCreationCode, BigInt(SAFE_SINGLETON)]
  );
  return getContractAddress({
    from: SAFE_PROXY_FACTORY,
    opcode: 'CREATE2',
    bytecode: initCode,
    salt,
  });
}

export function buildSafeDeploymentTx(
  owners: Address[],
  saltNonce: bigint
): MetaTransaction {
  const setup = encodeFunctionData({
    abi: SAFE_SINGLETON_ABI,
    functionName: 'setup',
    args: [
      owners,
      1n,
      ZERO_ADDRESS,
      '0x',
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      0n,
      ZERO_ADDRESS,
    ],
  });
  const data = encodeFunctionData({
    abi: SAFE_PROXY_FACTORY_ABI,
    functionName: 'createProxyWithNonce',
    args: [SAFE_SINGLETON, setup, saltNonce],
  });
  return {
    to: SAFE_PROXY_FACTORY,
    value: '0x0',
    data,
  };
}
