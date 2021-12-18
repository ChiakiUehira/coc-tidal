import fs from 'fs'
import { commands, CompleteResult, ExtensionContext, listManager, sources, window, workspace } from 'coc.nvim'
import DemoList from './lists'

export async function activate(context: ExtensionContext): Promise<void> {
  // not enable
  const enable = workspace.getConfiguration('tidal').get<boolean>('enable')
  if (enable) return

  const samples = getSamples()
  context.subscriptions.push(listManager.registerList(new DemoList(workspace.nvim)))
  context.subscriptions.push(
    sources.createSource({
      name: 'coc-tidal completion source',
      doComplete: async () => {
        const items = await getCompletionItems(samples)
        return items
      },
    })
  )
}

async function getCompletionItems(samples: string[]): Promise<CompleteResult> {
  const items = samples.map((sample) => {
    return {
      word: sample,
      menu: '[Tidal - Samples]',
    }
  })
  return {
    items,
  }
}

function getSamples(): string[] {
  const path = workspace.getConfiguration('tidal').get<string[]>('samplePath')
  try {
    const samples = fs.readdirSync(path)
    return samples
  } catch (err) {
    window.showErrorMessage('coc-tidal: Samples couldn’t load')
    return []
  }
}
