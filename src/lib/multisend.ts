import {
  Address,
  decodeFunctionData,
  encodeFunctionData,
  encodePacked,
  getAddress,
  Hex,
  parseAbi,
  size,
  toHex,
} from 'viem';

import { MetaTransaction, OperationType } from './types';

export const MULTI_SEND_ABI = ['function multiSend(bytes memory transactions)'];

const MULTISEND_141 = '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526';
const MULTISEND_CALLONLY_141 = '0x9641d764fc13c8B624c04430C7356C1C7C8102e2';

const encodeMetaTx = (tx: MetaTransaction): Hex =>
  encodePacked(
    ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
    [
      tx.operation || OperationType.Call,
      tx.to as Address,
      BigInt(tx.value),
      BigInt(size(tx.data as Hex)),
      tx.data as Hex,
    ]
  );

const remove0x = (hexString: Hex): string => hexString.slice(2);

export function encodeMulti(
  transactions: readonly MetaTransaction[],
  multiSendContractAddress: string = transactions.some(
    (t) => t.operation === OperationType.DelegateCall
  )
    ? MULTISEND_141
    : MULTISEND_CALLONLY_141
): MetaTransaction {
  const encodedTransactions =
    '0x' + transactions.map(encodeMetaTx).map(remove0x).join('');

  return {
    operation: OperationType.DelegateCall,
    to: multiSendContractAddress,
    value: '0x00',
    data: encodeFunctionData({
      abi: parseAbi(MULTI_SEND_ABI),
      functionName: 'multiSend',
      args: [encodedTransactions as Hex],
    }),
  };
}

export function isMultisendTx(args: readonly unknown[]): boolean {
  const to = (args[0] as string).toLowerCase();
  return (
    to === MULTISEND_141.toLowerCase() ||
    to === MULTISEND_CALLONLY_141.toLowerCase()
  );
}

function unpack(
  packed: string,
  startIndex: number
): {
  operation: number;
  to: string;
  value: string;
  data: string;
  endIndex: number;
} {
  const operation = parseInt(packed.substring(startIndex, startIndex + 2), 16);
  const to = getAddress(
    `0x${packed.substring(startIndex + 2, startIndex + 42)}`
  );
  const value = toHex(
    BigInt(`0x${packed.substring(startIndex + 42, startIndex + 106)}`)
  );
  const hexDataLength = parseInt(
    packed.substring(startIndex + 106, startIndex + 170),
    16
  );
  const endIndex = startIndex + 170 + hexDataLength * 2;
  const data = `0x${packed.substring(startIndex + 170, endIndex)}`;
  return {
    operation,
    to,
    value,
    data,
    endIndex,
  };
}

export function decodeMulti(data: Hex): MetaTransaction[] {
  const tx = decodeFunctionData({
    abi: parseAbi(MULTI_SEND_ABI),
    data,
  });
  const [transactionsEncoded] = tx.args as [string];
  const result = [];
  let startIndex = 2;
  while (startIndex < transactionsEncoded.length) {
    const { endIndex, ...tx } = unpack(transactionsEncoded, startIndex);
    result.push(tx);
    startIndex = endIndex;
  }
  return result;
}
