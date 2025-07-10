import {
  keccak256,
  type Address,
  getContractAddress,
  encodeAbiParameters,
  parseAbiParameters,
  Hex,
  encodeFunctionData,
  stringToHex,
} from 'viem';
import { MODULE_PROXY_FACTORY_ABI, ROLES_V2_MODULE_ABI } from './abi';
import { MODULE_PROXY_FACTORY, ROLES_V2_MODULE_MASTERCOPY } from './addresses';
import { ExecutionOptions } from './enums';
import { ConditionFlat, MetaTransaction } from './types';

const PROXY_BYTECODE_PREFIX = '0x602d8060093d393df3363d3d373d3d3d363d73';
const PROXY_BYTECODE_SUFFIX = '5af43d82803e903d91602b57fd5bf3';

export function getProxyInitCode(): Hex {
  const addr = ROLES_V2_MODULE_MASTERCOPY.replace(/^0x/, '');
  return stringToHex(`${PROXY_BYTECODE_PREFIX}${addr}${PROXY_BYTECODE_SUFFIX}`);
}

function calculateSalt(initData: Hex, saltNonce: bigint): Hex {
  return keccak256(
    encodeAbiParameters(parseAbiParameters('bytes32, uint256'), [
      keccak256(initData),
      saltNonce,
    ])
  );
}

export function getEncodedInitParams(safe: Address): Hex {
  return encodeAbiParameters(
    parseAbiParameters('address _owner, address _avatar, address _target'),
    [safe, safe, safe]
  );
}

export function getModuleSetUpData(safe: Address): Hex {
  return encodeFunctionData({
    abi: ROLES_V2_MODULE_ABI,
    functionName: 'setUp',
    args: [getEncodedInitParams(safe)],
  });
}

export function calculateModuleProxyAddress(
  initData: Hex,
  saltNonce: bigint
): Address {
  const salt = calculateSalt(initData, saltNonce);
  return getContractAddress({
    bytecode: getProxyInitCode(),
    from: MODULE_PROXY_FACTORY,
    opcode: 'CREATE2',
    salt,
  });
}

export function buildDeployModuleTx(
  safe: Address,
  saltNonce: bigint
): MetaTransaction {
  const to = MODULE_PROXY_FACTORY;
  const data = encodeFunctionData({
    abi: MODULE_PROXY_FACTORY_ABI,
    functionName: 'deployModule',
    args: [
      ROLES_V2_MODULE_MASTERCOPY,
      getModuleSetUpData(safe),
      BigInt(saltNonce),
    ],
  });
  return { to, value: '0x0', data };
}

export function encodeRoleKey(role: string): Hex {
  return keccak256(stringToHex(role));
}

export function buildAllowTargetTx(
  module: Address,
  roleKey: Hex,
  target: Address,
  executionOptions: number
): MetaTransaction {
  const data = encodeFunctionData({
    abi: ROLES_V2_MODULE_ABI,
    functionName: 'allowTarget',
    args: [roleKey, target, executionOptions],
  });
  return { to: module, value: '0x0', data };
}

export function buildAssignRolesTx(
  module: Address,
  member: Address,
  roleKeys: Hex[],
  memberOf: boolean[]
): MetaTransaction {
  const data = encodeFunctionData({
    abi: ROLES_V2_MODULE_ABI,
    functionName: 'assignRoles',
    args: [member, roleKeys, memberOf],
  });
  return { to: module, value: '0x0', data };
}

export function buildScopeTargetTx(
  module: Address,
  roleKey: Hex,
  target: Address
): MetaTransaction {
  const data = encodeFunctionData({
    abi: ROLES_V2_MODULE_ABI,
    functionName: 'scopeTarget',
    args: [roleKey, target],
  });
  return { to: module, value: '0x0', data };
}

export function buildAllowFunctionTx(
  module: Address,
  roleKey: Hex,
  target: Address,
  selector: Hex,
  executionOptions: number
): MetaTransaction {
  const data = encodeFunctionData({
    abi: ROLES_V2_MODULE_ABI,
    functionName: 'allowFunction',
    args: [roleKey, target, selector, executionOptions],
  });
  return { to: module, value: '0x0', data };
}

export function buildScopeFunctionTx(
  module: Address,
  roleKey: Hex,
  target: Address,
  selector: Hex,
  conditions: ConditionFlat[],
  executionOpts: ExecutionOptions
): MetaTransaction {
  const data = encodeFunctionData({
    abi: ROLES_V2_MODULE_ABI,
    functionName: 'scopeFunction',
    args: [roleKey, target, selector, conditions, executionOpts],
  });
  return { to: module, value: '0x0', data };
}

export function buildRevokeTargetTx(
  module: Address,
  roleKey: Hex,
  target: Address
): MetaTransaction {
  const data = encodeFunctionData({
    abi: ROLES_V2_MODULE_ABI,
    functionName: 'revokeTarget',
    args: [roleKey, target],
  });
  return { to: module, value: '0x0', data };
}

export function buildRevokeFunctionTx(
  module: Address,
  roleKey: Hex,
  target: Address,
  selector: Hex
): MetaTransaction {
  const data = encodeFunctionData({
    abi: ROLES_V2_MODULE_ABI,
    functionName: 'revokeFunction',
    args: [roleKey, target, selector],
  });
  return { to: module, value: '0x0', data };
}

export function buildSetAllowanceTx(
  module: Address,
  allowanceKey: Hex,
  balance: bigint,
  maxRefill: bigint,
  refill: bigint,
  period: bigint,
  timestamp: bigint
): MetaTransaction {
  const data = encodeFunctionData({
    abi: ROLES_V2_MODULE_ABI,
    functionName: 'setAllowance',
    args: [allowanceKey, balance, maxRefill, refill, period, timestamp],
  });
  return { to: module, value: '0x0', data };
}
