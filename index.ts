export default abstract class Bot<MesssageType = { content: string }, CommandObj extends { run: (...args: any[]) => any } = {
  run (this: Bot<MesssageType>, message: MesssageType, args: string[]): any
}> {
  private events = new Map<string, Set<(arg: any) => void>>()
  on (type: 'output', handler: (ev: [any, MesssageType]) => void): void
  on (type: 'error', handler: (ev: [any, MesssageType]) => void): void
  on (type: 'message', handler: (ev: MesssageType) => void): void
  on (type: string, handler: (arg: any) => void): void {
    if (!this.events.has(type)) this.events.set(type, new Set)
    this.events.get(type)?.add(handler)
  }
  emit (name: string, event: any) {
    if (!this.events.has(name)) this.events.set(name, new Set)
    for (const func of (this.events.get(name) || [])) func(event)
  }
  off (type: string, callback: (arg: any) => void) {
    this.events.get(type)?.delete(callback)
  }
  commands = new Map<string, CommandObj>()
  aliases = new Map<string, string>()
  filter: (msg: MesssageType) => boolean = () => true
  constructor(public prefix: string) {
    this.on('message', async (message: MesssageType) => {
      const content = (message as { content?: string }).content || message + ''
      if (!this.filter(message)) return

      const name = this.commandFromMessage(content, prefix)

      if (!name) return

      const command = this.getCommand(name)?.run || (() => { })

      try {
        const output = await command.call(
          this,
          message,
          this.getargs(content, prefix)
        )

        if (output) this.emit('output', [output, message])
      } catch (error) {
        this.emit('error', [error, message])
      }
    })
  }

  protected getCommandName (cmdname: string): string | undefined {
    return this.commands.has(cmdname) ? cmdname : this.aliases.get(cmdname)
  }

  protected getCommand (name: string | undefined) {
    if (!name) return undefined
    return this.commands.get(this.getCommandName(name || '') || '')
  }

  protected commandFromMessage (content: string, prefix: string): string | undefined {
    return [...this.commands.keys(), ...this.aliases.keys()].find(
      cmdname =>
        content.startsWith(`${prefix}${cmdname} `) || // matches any command with a space after
        content === `${prefix}${cmdname}` // matches any command without arguments
    )
  }

  protected getargs (content: string, prefix: string) {
    const name = this.commandFromMessage(content, prefix)
    if (!name) return []
    return content
      .substring(prefix.length + 1 + name.length) // only the part after the command
      .split(' ') // split with spaces
  }
}
