# trollsmile-core

The command parser used in trollsmile-djs and trollsmile-web.

`npm i trollsmile-core`

```ts
import Trollsmile from 'trollsmile-core'

// first type argument is the message type (if trollsmile sees a "content" property on the message, it will use that. if it doesn't, then it converts the message to a string)
// second type argument is the command. must have a run function
class Bot extends Trollsmile<string> {
  filter (message) {
    return true // this is if you need to say filter out messages from other bots. the message argument is the message type
  }
}

const bot = new Bot('-') // the prefix


bot.commmands.set('hello', {
  run: () => 'world!'
})

bot.emit('message', '-hello')

```

another example (trollsmile-djs)

```ts
class Bot extends Trollsmile<Message, CommandObj> {
  filter = (msg: Message) => !msg.author.bot
  client: Client
  constructor(prefix: string, token = process.env.TOKEN) {
    super(prefix)
    this.client = new Client({
      ws: {
        intents: [Intents.NON_PRIVILEGED]
      }
    })
    this.on('output', ([out, message]) => {
      message.channel.send(out)
    })

    // Load in events
    this.client.on('message', msg=>{
      this.emit('message', msg)
    })
    this.client.login(token)
    this.on('error', ([err, message]) => {
      message.channel.stopTyping()
      message.channel.send({
        embed: {
          author: {
            name: `${this.client.user?.username} ran into an error while running your command!`,
            // iconURL: this.user?.avatarURL()
          },
          title: err.toString(),
          color: 'RED'
        }
      })
    })
  }
}
```
