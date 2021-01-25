import Trollsmile from '..'
let willRun: string[] = []
class Bot extends Trollsmile<string> {
  filter () {
    return true
  }
}

const bot = new Bot('-')

bot.on('error', () => {
  console.error('trollsmile-core should not error')
})

bot.commands.set('willRun', {
  run (_, args) {
    willRun = args
  }
})

bot.commands.set('wontRun', {
  run () {
    console.error('-wontRun ran')
  }
})


bot.emit('message', '-willRun hello world')

console.assert(
  willRun.length === 2 && willRun[0] === 'hello' && willRun[1] === 'world',
  '"-willRun hello world" should call the command with the argument array being ["hello", "world"]'
)


bot.emit('message', 'wontRun hello world')

bot.emit('message', '!wontRun hello world')

bot.commands.set('this has spaces', {
  run (_, args) {
    console.assert(
      args.length === 3 && args[0] === 'which' && args[1] === 'is' && args[2] === 'cool',
      '-this has spaces was not passed the correct arguments (expected ["which","is","cool"])'
    )
  }
})

bot.emit('message', '-this has spaces which is cool')
