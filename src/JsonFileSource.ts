import { reactive } from 'vue'
import { Block, LocalizedInMemorySource } from '@vue-content/core'

interface JsonFileSourceOptions {
    locales: string[]
    path: string
}

export class JsonFileSource extends LocalizedInMemorySource {
    protected _locales: string[]
    protected _path: string

    constructor(options: JsonFileSourceOptions) {
      super({})
      this._locales = options.locales
      this._path = options.path
    }

    public get locales() {
        return this._locales
    }

    override async updateBlock(block: Block) {
      const id = block.id.replace(/^root.?/, '')
      await fetch(`/vue-content/${this.locale}/blocks/${id}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(block.modifiedFields)
      })
      return super.updateBlock(block)
    }

    override async fetchContent() {
        this.initialized.value = false
        const module = await import(`../${this._path}/${this.locale}.json`)
        this.content[this.locale] = module.default
        this.root = reactive(this.blockify(this.content[this.locale], "root"))
        this.initialized.value = true
    }
}