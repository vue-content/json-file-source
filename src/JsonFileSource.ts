import { reactive } from 'vue'
import { Block, LocalizedInMemorySource } from '@vue-content/core'

interface JsonFileSourceOptions {
    /**
     * Set up where json-file-source should look for content files. Note that the files must follow the naming convention [locale].json. Typically you want to do it with import.meta.glob like this:
     * 
     * @example
     * new JsonFileSource({
     *   files: import.meta.glob('/content/*.json')
     * }
     */
    files: Record<string, () => Promise<unknown>>
}


export class JsonFileSource extends LocalizedInMemorySource {
    protected files: Record<string, () => Promise<unknown>>
    protected localePaths: Record<string, string> = {}

    constructor(options: JsonFileSourceOptions) {
      super({})
      this.files = options.files
      Object.keys(this.files).forEach(key => {
        const match = key.match(/.*\/([^/]+).json$/)
        if (match) {
          this.localePaths[match[1]] = key
        }
      })
    }

    public get locales() {
        return Object.keys(this.localePaths)
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
        const path = this.localePaths[this.locale]
        const module: any = await this.files[path]()
        this.content[this.locale] = module.default
        this.root = reactive(this.blockify(this.content[this.locale], "root"))
        this.initialized.value = true
    }
}