import { Hex } from 'viem';
import { ParameterType, Operator } from './enums';
import type { ConditionFlat } from './types';

export function makeConditionFlat(
  parent: number,
  paramType: ParameterType,
  operator: Operator,
  compValue: Hex
): ConditionFlat {
  if (parent < 0 || parent > 0xff) {
    throw new Error(`ConditionFlat.parent must be 0–255, got ${parent}`);
  }
  return { parent, paramType, operator, compValue };
}
