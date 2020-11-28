const Discord   = require('discord.js');
const { query } = require('../mysql');
const config    = require('../json/config.json');
const methods   = require('../utils/methods');

module.exports = {
    name: 'start',
    aliases: [''],
    description: 'Назначает всем случайного партнёра!',
    hasArgs: false,
    requirePartner: false,
    worksInDM: true,
    forceDMsOnly: false,
    modOnly: false,
    adminOnly: false,

    async execute(message, args, prefix) {
        const row = (await query(`SELECT * FROM users WHERE userId = ${message.author.id}`))[0];
        const exchangeRow = (await query(`SELECT * FROM users INNER JOIN exchange ON users.exchangeId = exchange.exchangeId WHERE userId = ${message.author.id}`))[0];

        if (row.exchangeId === 0) return message.reply('Вы не участвуете в АДМ.');

        else if (!exchangeRow || exchangeRow.userId !== exchangeRow.creatorId) return message.reply('Вы не можете начать АДМ, который не создавали.\n\n' +
            'Обратитесь к  `' + (await message.client.users.fetch(exchangeRow.creatorId)).tag + '` чтобы начать его.');

        else if (exchangeRow.started === 1) return message.reply('АДМ уже начат!');

        await query(`UPDATE exchange SET started = 1 WHERE exchangeId = ${exchangeRow.exchangeId}`);
        const botMsg = await message.reply('Перемешиваем участников и рассылаем сообщения...');

        await pickRandom(message, exchangeRow.exchangeId, prefix);

        botMsg.edit('Ваш АДМ успешно начат!');
    },
}

async function pickRandom(message, exchangeId, prefix) {
    const rows = (await query(`SELECT * FROM users WHERE exchangeId = ${exchangeId}`));
    var userIds = [];

    for (let i = 0; i < rows.length; i++) {
        userIds.push(rows[i].userId);
    }

    shuffle(userIds);

    for (let i = 0; i < userIds.length; i++) {
        var partnerId = i === userIds.length - 1 ? userIds[0] : userIds[i + 1];

        try {
            await query(`UPDATE users SET partnerId = ${partnerId} WHERE userId = ${userIds[i]}`);
            const partnerInfo = (await query(`SELECT * FROM users WHERE userId = ${partnerId}`))[0];
            const user = await message.client.users.fetch(userIds[i]);

            const startEmbed = new Discord.MessageEmbed()
                .setTitle('__Анонимный Дед Мороз начался!__')
                .setDescription('Вы были выбраны в качестве Деда Мороза для: <@' + partnerId + '> 🎄'
                    + (partnerInfo.wishlist === '' ? '' : '\n\nВот пожелания:\n```' + partnerInfo.wishlist + '```') +
                    '\n\nВы можете отправить анонимное сообщение получателю подарка командой `' + prefix + 'message получатель <сообщение>`')
                .setFooter('Тссссссссс 🤐')
                .setColor(config.embeds_color)

            await user.send(startEmbed)
        } catch (err) {
            console.log('[START.JS] Unable to fetch a user while picking randomly: ' + err);
        }
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
