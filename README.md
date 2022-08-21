# <img src="https://i.postimg.cc/FK60gmhx/papv2-5-CROPPED.png" width=30/> PAPbot 
A discord bot that help us manage our University server

- Written in [Typescript](https://www.typescriptlang.org) with [Discord.js](https://github.com/discordjs/discord.js)
- Deployed on [Heroku](https://www.heroku.com)

### Tools
- Google API (Gmail, Drive, Calendar, Sheets)
- PostgreSQL DB

### Features
- [Registering](https://github.com/papsavas/PAP-bot/blob/master/src/Commands/Guild/Impl/KEP_registrationCmdImpl.ts) student members
- Generating personal schedules for [lectures](https://github.com/papsavas/PAP-bot/blob/master/src/Commands/Guild/Impl/KEP_myScheduleCmdImpl.ts) & [exams](https://github.com/papsavas/PAP-bot/blob/master/src/Commands/Guild/Impl/KEP_myExamsCmdImpl.ts)
- [Locking](https://github.com/papsavas/PAP-bot/blob/65203a11bd32d29678eaa1c696b9b6c32ad65366/src/Handlers/Guilds/Impl/KepGuild.ts#L562-L588) examined channels
- Moderation ([Quarantine](https://github.com/papsavas/PAP-bot/blob/master/src/Commands/Guild/Impl/KEP_muteCmdImpl.ts), [Pinning](https://github.com/papsavas/PAP-bot/blob/master/src/Handlers/Guilds/AbstractGuild.ts#L138-L163)-[Clearing](https://github.com/papsavas/PAP-bot/blob/master/src/Commands/Guild/Impl/clearMessagesCmdImpl.ts) Messages, [Bookmarks](https://github.com/papsavas/PAP-bot/blob/master/src/Handlers/Guilds/AbstractGuild.ts#L166-L183))
- Responding from a pool of submitted responses
- [TicTacToe](https://github.com/papsavas/PAP-bot/blob/master/src/Commands/Global/Impl/tictactoeCmdImpl.ts)
