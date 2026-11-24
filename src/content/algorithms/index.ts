import { AlgorithmData } from '@/types/algorithm';
import { desData } from './des';
import { aesData } from './aes';
import { rc5Data } from './rc5';
import { ideaData } from './idea';
import { gostData } from './gost';
import { rc4Data } from './rc4';
import { rc6Data } from './rc6';
import { castData } from './cast';
import { blowfishData } from './blowfish';

export const allAlgorithms: AlgorithmData[] = [
  desData,
  aesData,
  rc5Data,
  ideaData,
  gostData,
  rc4Data,
  rc6Data,
  castData,
  blowfishData,
];

export const coreAlgorithms = allAlgorithms.filter((a) => a.category === 'core');
export const additionalAlgorithms = allAlgorithms.filter((a) => a.category === 'additional');

export function getAlgorithmBySlug(slug: string): AlgorithmData | undefined {
  return allAlgorithms.find((a) => a.slug === slug);
}
