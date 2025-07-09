import { Hex } from 'viem';
import { ParameterType, Operator } from './enums';

export interface ConditionFlat {
  parent: number;
  paramType: ParameterType;
  operator: Operator;
  compValue: Hex;
}

export enum OperationType {
  Call = 0,
  DelegateCall = 1,
}

export interface MetaTransaction {
  readonly to: string;
  readonly value: string;
  readonly data: string;
  readonly operation?: OperationType;
}
