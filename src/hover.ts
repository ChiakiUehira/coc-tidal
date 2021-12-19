import { ExtensionContext, workspace, HoverProvider, TextDocument, Position, Hover, window } from 'coc.nvim'
import { BasicType, getBasics } from './helpers/getBasics'

export class BasicHoverProvider implements HoverProvider {
  private context: ExtensionContext
  private functions: BasicType[]
  constructor(context: ExtensionContext) {
    this.context = context
    this.functions = getBasics()
  }

  public async provideHover(document: TextDocument, position: Position): Promise<Hover | null> {
    const doc = workspace.getDocument(document.uri)
    if (!doc) return null

    const wordRange = doc.getWordRangeAtPosition(position, '')
    if (!wordRange) return null

    const text = document.getText(wordRange) || ''
    if (!text) return null

    window.showMessage(text)

    const target = this.functions.find((f) => f.name === text)
    const result = target ? target.description : ''
    if (!result) return null

    return {
      contents: {
        kind: 'plaintext',
        value: result,
      },
    }
  }
}
