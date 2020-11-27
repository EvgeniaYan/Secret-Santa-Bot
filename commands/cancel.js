const Discord   = require('discord.js');
const { query } = require('../mysql');
const config    = require('../json/config.json');
const methods   = require('../utils/methods');

module.exports = {
    name: 'cancel',
    aliases: ['stop'],
    description: 'Отменяет текущего АДМ, если он был запущен вами.',
    hasArgs: false,
    requirePartner: false,
    worksInDM: true,
    forceDMsOnly: false,
    modOnly: false,
    adminOnly: false,

    async execute(message, args, prefix) {
        const row = (await query(`SELECT * FROM users WHERE userId = ${message.author.id}`))[0];
        const exchangeRow = (await query(`SELECT * FROM users INNER JOIN exchange ON users.exchangeId = exchange.exchangeId WHERE userId = ${message.author.id}`))[0];

        if (row.exchangeId === 0)
            return message.reply('Вы не участвуете в АДМ');
        // return message.reply('You aren\'t in a Secret Santa.');

        else if (!exchangeRow || exchangeRow.userId !== exchangeRow.creatorId)
            return message.reply('Вы не можете отменить АДМ, которого не создавали.\n\n' +
                'Обратитесь к `' + (await message.client.users.fetch(exchangeRow.creatorId)).tag + '`, чтобы отменить его.');

        await query(`DELETE FROM exchange WHERE exchangeId = ${exchangeRow.exchangeId}`);
        await query(`UPDATE users SET partnerId = 0 WHERE exchangeId = ${exchangeRow.exchangeId}`);
        await query(`UPDATE users SET exchangeId = 0 WHERE exchangeId = ${exchangeRow.exchangeId}`);
        message.reply('Анонимный Дед Мороз успешно отменён.');
    },
}