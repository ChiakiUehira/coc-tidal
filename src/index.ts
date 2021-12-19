import { commands, CompleteResult, ExtensionContext, listManager, sources, languages, workspace } from 'coc.nvim'
import { BasicType, getBasics } from './helpers/getBasics'
import { getSamples } from './helpers/getSamples'
import { BasicHoverProvider } from './hover'
import BasicsList from './lists/basics'
import SamplesList from './lists/samples'

export async function activate(context: ExtensionContext): Promise<void> {
  const enable = workspace.getConfiguration('tidal').get<boolean>('enable')
  if (enable) return

  const samples = getSamples()
  const basics = getBasics()
  context.subscriptions.push(languages.registerHoverProvider(['tidal'], new BasicHoverProvider(context)))
  context.subscriptions.push(listManager.registerList(new SamplesList(workspace.nvim)))
  context.subscriptions.push(listManager.registerList(new BasicsList(workspace.nvim)))
  context.subscriptions.push(
    sources.createSource({
      name: 'coc-tidal completion source',
      doComplete: async () => {
        const items = await getCompletionItems(basics, samples)
        return items
      },
    })
  )
}

async function getCompletionItems(basics: BasicType[], samples: string[]): Promise<CompleteResult> {
  const _basics = basics.map((basic) => {
    return {
      word: basic.name,
      menu: '[Tidal - Basic]',
    }
  })
  const _samples = samples.map((sample) => {
    return {
      word: sample,
      menu: '[Tidal - Samples]',
    }
  })
  return {
    items: [..._basics, ..._samples],
  }
}
