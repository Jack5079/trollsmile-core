type DefaultCommand<MesssageType = DefaultMessage> = {
  run (this: Bot<MesssageType>, message: MesssageType, args: string[]): any
}
type DefaultMessage = {
  content: string
}
interface Events<MessageType> {
  output: [any, MessageType]
  error: [any, MessageType]
  message: MessageType
}
abstract class Bot<MesssageType = DefaultMessage, CommandObj extends DefaultCommand<MesssageType> = DefaultCommand<MesssageType>> {
  protected events = new Map<string, Set<(arg: any) => void>>()
  on<Key extends keyof Events<MesssageType>> (type: Key, handler: (arg: Events<MesssageType>[Key]) => void): void {
    if (!this.events.has(type)) this.events.set(type, new Set)
    this.events.get(type)?.add(handler)
  }
  emit<Key extends keyof Events<MesssageType>> (name: Key, event: Events<MesssageType>[Key]) {
    if (!this.events.has(name)) this.events.set(name, new Set)
    for (const func of (this.events.get(name) || [])) func(event)
  }
  off (type: keyof Events<MesssageType>, callback: (arg: any) => void) {
    this.events.get(type)?.delete(callback)
  }
  commands = new Map<string, CommandObj>()
  aliases = new Map<string, string>()
  abstract filter (msg: MesssageType): boolean

  constructor(public prefix: string) {
    this.on('message', async (message: MesssageType) => {
      const content = (message as { content?: string }).content || message + ''
      if (!this.filter(message)) return

      const name = this.commandFromMessage(content)

      if (!name) return

      const command = this.getCommand(name)?.run || (() => { })

      try {
        const output = await command.call(
          this,
          message,
          this.getArguments(content)
        )

        if (output) this.emit('output', [output, message])
      } catch (error) {
        this.emit('error', [error, message])
      }
    })
  }

  getCommandName (cmdname: string): string | undefined {
    return this.commands.has(cmdname) ? cmdname : this.aliases.get(cmdname)
  }

  getCommand (name: string | undefined) {
    if (!name) return undefined
    if (this.commands.has(name) || this.aliases.has(name)) {
      return this.commands.get(this.getCommandName(name!)!)
    } else return
  }

  commandFromMessage (content: string): string | undefined {
    return [...this.commands.keys(), ...this.aliases.keys()].find(
      cmdname =>
        content.startsWith(`${this.prefix}${cmdname} `) || // matches any command with a space after
        content === `${this.prefix}${cmdname}` // matches any command without arguments
    )
  }

  getArguments (content: string) {
    const name = this.commandFromMessage(content)
    if (!name) return []
    return content
      .substring(this.prefix.length + 1 + name.length) // only the part after the command
      .split(' ') // split with spaces
  }
}

export default Bot
