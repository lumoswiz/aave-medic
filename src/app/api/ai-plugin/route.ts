import { ACCOUNT_ID } from '@/app/config';
import { NextResponse } from 'next/server';
import {
  chainIdParam,
  addressParam,
  SignRequestResponse200,
  AddressSchema,
  MetaTransactionSchema,
  SignRequestSchema,
} from '@bitte-ai/agent-sdk';

export async function GET() {
  const pluginData = {
    openapi: '3.0.0',
    info: {
      title: 'Aave V3 Medic',
      description:
        'API exposing state queries and transaction payloads for automating Aave V3 lending strategies via Safe smart accounts and Silverback bots, including Safe deployment, funding and delegation and bot deployments and configurable health factor management.',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'https://snapshot-agent.vercel.app/',
      },
    ],
    'x-mb': {
      'account-id': ACCOUNT_ID,
      email: 'lumosiwz@protonmail.com',
      assistant: {
        name: 'Aave Medic',
        description:
          'An assistant exposing endpoints for deploying Safe smart accounts, funding them, and configuring delegation permissions to enable automated bot-based asset management.',
        instructions:
          'You generate a single batched transaction payload that deploys a deterministic Safe smart account, funds it with the user’s chosen collateral, and sets up delegation permissions for bot-based asset management, then returns the payload for client-side signing and submission.',
        tools: [{ type: 'generate-evm-tx' }, { type: 'sign-message' }],
        image:
          'https://pbs.twimg.com/profile_images/1804597854725431296/fLn9-v6H_400x400.jpg',
        repo: 'https://github.com/lumoswiz/aave-medic',
        categories: ['DeFi', 'Automation'],
        chainIds: [84532],
      },
    },
    paths: {},
    components: {
      parameters: {
        evmAddress: { ...addressParam, name: 'evmAddress' },
        method: {
          name: 'method',
          description: 'The signing method to be used.',
          type: 'enum',
          in: 'query',
          required: true,
          enum: [
            'eth_sign',
            'personal_sign',
            'eth_signTypedData',
            'eth_signTypedData_v4',
          ],
          schema: { type: 'string' },
          example: 'eth_sign',
        },
        chainId: { ...chainIdParam, example: 11155111, required: false },
      },
      responses: {
        SignRequestResponse200,
      },
      schemas: {
        Address: AddressSchema,
        MetaTransaction: MetaTransactionSchema,
        SignRequest: SignRequestSchema,
      },
    },
  };

  return NextResponse.json(pluginData);
}
