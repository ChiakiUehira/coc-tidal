import fs from 'fs'
import path from 'path'
import { window } from 'coc.nvim'

export function getBasics(): BasicType[] {
  try {
    const readBasics: any[] = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../docs.json'), 'utf8'))
    const basics = Object.keys(readBasics).map((key) => {
      return {
        name: key,
        description: String(readBasics[key]),
      }
    })
    return basics
  } catch (err) {
    window.showErrorMessage('coc-tidal: Documents couldn’t load')
    return []
  }
}

export type BasicType = {
  name: string
  description: string
}
