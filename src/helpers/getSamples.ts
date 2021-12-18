import fs from 'fs'
import { window, workspace } from 'coc.nvim'

export function getSamples(): string[] {
  const path = workspace.getConfiguration('tidal').get<string>('samplePath')
  try {
    const readSamples: string[] = fs.readdirSync(path)
    const samples = readSamples.filter((sample) => !ignores.includes(sample))
    return samples
  } catch (err) {
    window.showErrorMessage('coc-tidal: Samples couldn’t load')
    return []
  }
}

export const ignores = ['.git', '.DS_Store', 'Dirt-Samples.quark', 'README.md']
