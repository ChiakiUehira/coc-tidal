import { commands, CompleteResult, ExtensionContext, listManager, sources, window, workspace } from 'coc.nvim'
import { getSamples } from './helpers/getSamples'
import SamplesList from './lists/samples'

export async function activate(context: ExtensionContext): Promise<void> {
  const enable = workspace.getConfiguration('tidal').get<boolean>('enable')
  if (enable) return

  const samples = getSamples()
  context.subscriptions.push(listManager.registerList(new SamplesList(workspace.nvim)))
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
