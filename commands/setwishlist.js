const Discord   = require('discord.js');
const { query } = require('../mysql');
const config    = require('../json/config.json');
const methods   = require('../utils/methods');

module.exports = {
    name: 'setwishlist',
    aliases: ['wishlist'],
    description: 'Редактирует пожелания, чтобы Дед Мороз знал, что вам подарить!☃',
    hasArgs: true,
    requirePartner: false,
    worksInDM: true,
    forceDMsOnly: true,
    modOnly: false,
    adminOnly: false,

    async execute(message, args, prefix) {
        var wishlistToSet = args.join(' ');

        if (wishlistToSet.length >= 1000) {
            return message.reply('Ваши пожелания должны уместиться в 1000 символов!');
        }

        await query(`UPDATE users SET wishlist = ? WHERE userId = ${message.author.id}`, [wishlistToSet]);

        message.reply('**Пожелания изменены:**\n\n' + wishlistToSet);
    },
}
