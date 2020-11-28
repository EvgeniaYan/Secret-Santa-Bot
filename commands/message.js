const Discord   = require('discord.js');
const { query } = require('../mysql');
const config    = require('../json/config.json');
const methods   = require('../utils/methods');

module.exports = {
    name: 'message',
    aliases: [''],
    description: 'Отправляет сообщение Деду Морозу или получателю.',
    hasArgs: true,
    requirePartner: true,
    worksInDM: true,
    forceDMsOnly: true,
    modOnly: false,
    adminOnly: false,

    async execute(message, args, prefix) {
        const row = (await query(`SELECT * FROM users WHERE userId = ${message.author.id}`))[0];
        const gifterRow = (await query(`SELECT * FROM users WHERE partnerId = ${message.author.id}`))[0];
        const exchangeRow = (await query(`SELECT * FROM users INNER JOIN exchange ON users.exchangeId = exchange.exchangeId WHERE userId = ${message.author.id}`))[0];

        if (row.exchangeId === 0) return message.reply('Вы не участвуете в АДМ.');

        else if (!args.length)
            return message.reply('Нужно указать кому сообщение! `' + prefix + 'message <даритель/получатель> <сообщение>`.\n\n' +
                'получатель - человек, которому вы дарите подаров (<@' + row.partnerId + '>).\nдаритель - человек, дарящий подарок вам.');

        else if (args[0] !== 'получатель' && args[0] !== 'даритель')
            return message.reply('Нужно указать кому сообщение! `' + prefix + 'message <даритель/получатель> <сообщение>`.\n\n' +
                'получатель - человек, которому вы дарите подаров (<@' + row.partnerId + '>).\nдаритель - человек, дарящий подарок вам.');

        else if (args[0] === 'получатель') {
            const gifteeEmbed = new Discord.MessageEmbed()
                .setTitle('__Вы получили сообщение от Анонимного Деда Мороза!__')
                .setDescription('\n' + args.slice(1).join(' '))
                .setColor(config.embeds_color)
                .setFooter('Вы можете ответить командой `' + prefix + 'message даритель <сообщение>`')
                .setThumbnail('https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/209/father-christmas_1f385.png')

            try {
                const giftee = await message.client.users.fetch(row.partnerId);
                await giftee.send(getAttachments(message, gifteeEmbed));

                message.reply('Ваше сообщение отправлено анонимно <@' + row.partnerId + '>!');
            } catch (err) {
                message.reply('Ошибка при отправке сообщения: ```' + err + '```');
            }
        } else if (args[0] === 'даритель') {
            const gifterEmbed = new Discord.MessageEmbed()
                .setTitle('__Вы получили сообщение от вашего подаркополучателя ' + message.author.tag + '!__')
                .setDescription('\n' + args.slice(1).join(' '))
                .setColor(config.embeds_color)
                .setFooter('Вы можете ответить командой `' + prefix + 'message получатель <сообщение>`')
                .setThumbnail('https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/209/incoming-envelope_1f4e8.png')

            try {
                const gifter = await message.client.users.fetch(gifterRow.userId);
                await gifter.send(getAttachments(message, gifterEmbed));

                message.reply('Сообщение отправлено вашему Деду Морозу!❄');
            } catch (err) {
                message.reply('Ошибка при отправке сообщения: ```' + err + '```');
            }
        }
    },
}

function getAttachments(message, embed) {
    let imageAttached = message.attachments.array();

    if (Array.isArray(imageAttached) && imageAttached.length) {
        if (imageAttached[0].url.endsWith(".mp4") || imageAttached[0].url.endsWith(".mp3")) {
            embed.addField('File', imageAttached[0].url);
            return {files: [imageAttached[0].url], embed: embed};
            //attachURL = `{name: "File", value: "${imageAttached[0].url}"},`;
            //embedFile = `files: [{attachment: "${imageAttached[0].url}"}], embed: `;
        } else {
            embed.setImage(imageAttached[0].url);
            return embed;
        }
    }

    return embed;
}
