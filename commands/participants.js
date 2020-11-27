const Discord   = require('discord.js');
const { query } = require('../mysql');
const config    = require('../json/config.json');
const methods   = require('../utils/methods');

module.exports = {
    name: 'participants',
    aliases: ['exchangeinfo', 'listparticipants'],
    description: 'Показывает, кто участвует в АДМ.',
    hasArgs: false,
    requirePartner: false,
    worksInDM: true,
    forceDMsOnly: false,
    modOnly: false,
    adminOnly: true,

    async execute(message, args, prefix) {
        const row = (await query(`SELECT * FROM users WHERE userId = ${message.author.id}`))[0];
        const rows = (await query(`SELECT * FROM users WHERE exchangeId = ${row.exchangeId}`));
        const exchangeRow = (await query(`SELECT * FROM exchange WHERE exchangeId = ${row.exchangeId}`))[0];

        if (row.exchangeId === 0) return message.reply('Вы не участвуете в АДМ.');

        var userTags = [];

        for (var i = 0; i < rows.length; i++) {
            userTags.push((await message.client.users.fetch(rows[i].userId)).tag)
        }

        const embed = new Discord.MessageEmbed()
            .setTitle('__Участники__')
            .setDescription(userTags.map((user, index) => (index + 1) + '. ' + user).join('\n'))
            .setColor(config.embeds_color)
            .setFooter('Запущено ' + (await message.client.users.fetch(exchangeRow.creatorId)).username)

        message.channel.send(embed);
    },
}