import { esAddOne } from './add'
export * from './add'
export const tsAddOne = (n: number): number => esAddOne(n)

console.log(tsAddOne(1) + 2)
