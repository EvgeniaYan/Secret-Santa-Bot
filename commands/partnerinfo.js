const Discord   = require('discord.js');
const { query } = require('../mysql');
const config    = require('../json/config.json');
const methods   = require('../utils/methods');

module.exports = {
    name: 'partnerinfo',
    aliases: [''],
    description: 'Показывает информацию о вашем тайном получателе и его пожелания.',
    hasArgs: false,
    requirePartner: true,
    worksInDM: true,
    forceDMsOnly: true,
    modOnly: false,
    adminOnly: false,

    async execute(message, args, prefix) {
        const row = (await query(`SELECT * FROM users WHERE userId = ${message.author.id}`))[0];
        const partnerRow = (await query(`SELECT * FROM users WHERE userId = ${row.partnerId}`))[0];
        const wishList = partnerRow.wishlist || 'Нет пожеланий ¯\\_(ツ)_/¯';

        const partnerEmbed = new Discord.MessageEmbed()
            .setTitle('__Информация о партнёре__')
            .setDescription('<@' + row.partnerId + '>\n\nПожелания: ```' + wishList + '```')
            .setColor(config.embeds_color)
            .setFooter('Нужно больше информации? Напишите ему анонимное сообщение командой `' + prefix + 'message`!')

        message.channel.send(partnerEmbed);
    },
}
