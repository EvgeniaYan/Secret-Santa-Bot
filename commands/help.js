const Discord   = require('discord.js');
const { query } = require('../mysql');
const config    = require('../json/config.json');
const methods   = require('../utils/methods');

module.exports = {
    name: 'help',
    aliases: [''],
    description: 'Показывает все команды бота.',
    hasArgs: false,
    requirePartner: false,
    worksInDM: true,
    forceDMsOnly: false,
    modOnly: false,
    adminOnly: false,

    async execute(message, args, prefix){
        if(args[0] == undefined){
            var helpArr = message.client.commands.filter(cmd => !cmd.adminOnly && cmd.name !== 'help').map(cmd => '`' + cmd.name + '` - ' + cmd.description);

            const helpEmbed = new Discord.MessageEmbed()
            .setTitle('__Команды Анонимного Деда Мороза (АДМ)__')
            .setDescription(helpArr.map((cmd, index) => (index + 1) + '. ' + cmd))
            .setFooter('Используйте ' + prefix + 'help <command> для получения справки по команде.')
            .setColor(config.embeds_color)

            message.channel.send(helpEmbed);
        }
        else{
            const command = message.client.commands.get(args[0]) || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0]));

            if(!command) return message.reply('Такая команда не существует.');

            var embedDesc = [command.description];

            if(command.worksInDM) embedDesc.push('Эта команда работает в личных сообщения');

            if(command.forceDMsOnly) embedDesc.push('Эта команда работает ТОЛЬКО в личных сообщения');

            if(command.adminOnly) embedDesc.push('Эту команду могут использовать только админы бота.');

            if(command.hasArgs) embedDesc.push('Эта команда требует параметры.');

            if(command.requirePartner) embedDesc.push('Для этой команды нужно, чтобы у вас уже был партнёр.');

            if(command.guildModsOnly) embedDesc.push('Для этого команды нужно, чтобы у вас было разрешение `MANAGE_SERVER`.');

            const cmdEmbed = new Discord.MessageEmbed()
            .setTitle('__Команда' + (command.name.charAt(0).toUpperCase() + command.name.slice(1)) + '__')
            .setDescription(embedDesc.map(cmd => '- ' + cmd).join('\n\n'))
            .setColor(config.embeds_color)

            if(command.aliases[0].length) cmdEmbed.addField('Алиасы', command.aliases);

            message.channel.send(cmdEmbed)
        }
    },
}