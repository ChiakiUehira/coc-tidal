import { BasicList, ListAction, ListContext, ListItem, Neovim, window, workspace } from 'coc.nvim'
import { Position, Range, TextEdit } from 'vscode-languageserver-protocol'
import { getSamples } from '../helpers/getSamples'

export default class DemoList extends BasicList {
  public readonly name = 'samples'
  public readonly description = 'search for samples'
  public readonly defaultAction = 'append'
  public actions: ListAction[] = []

  constructor(nvim: Neovim) {
    super(nvim)

    this.addAction('append', async (item: ListItem) => {
      const { document, position } = await workspace.getCurrentState()
      const doc = workspace.getDocument(document.uri)
      if (!doc || !doc.attached) {
        window.showMessage(`Current document not attached.`)
        return
      }
      const edits: TextEdit[] = []
      const line = doc.getline(position.line)
      const pos = Position.create(position.line, Math.min(position.character + 1, line.length))
      edits.push({
        range: Range.create(pos, pos),
        newText: item.data,
      })
      await doc.applyEdits(edits)
    })
  }

  public async loadItems(): Promise<ListItem[]> {
    const samples = getSamples()
    return samples.map((sample) => {
      return {
        label: sample,
        data: sample,
      }
    })
  }
}
