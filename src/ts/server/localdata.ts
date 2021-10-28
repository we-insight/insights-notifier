import os from 'os'
import fs from 'fs'

const dataDir = os.homedir() + '/.chatbot'
const dataFile = dataDir + '/data.json'

const ensureDataFile = (): void => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir)
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, '{}')
  }
}

export const getData = (): Record<string, any> => {
  ensureDataFile()
  const data = fs.readFileSync(dataFile, 'utf8')
  return JSON.parse(data)
}

export const setData = (data: Record<string, any>): void => {
  ensureDataFile()
  fs.writeFileSync(dataFile, JSON.stringify(data))
}
