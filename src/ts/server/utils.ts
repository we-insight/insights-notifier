
export const isPromise = (tar: Promise<any> | any): boolean => {
  if (tar instanceof Promise) {
    return true
  } else {
    return false
  }
  // return Boolean(tar) && Object.prototype.toString.call(tar) === '[object Promise]'
}
