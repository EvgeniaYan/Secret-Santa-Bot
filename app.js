const fs        = require('fs');
const config    = require('./json/config.json');

const Discord = require('discord.js');

const { connectSQL, query } = require('./mysql.js');
const { handleCmd }         = require('./commandhandler.js');
const methods = require('./utils/methods');

const client = new Discord.Client({
    messageCacheMaxSize: 50,
    messageCacheLifetime: 300,
    messageSweepInterval: 500,
    disableMentions: 'everyone',
    partials: ['MESSAGE', 'REACTION', 'GUILD_MEMBER', 'USER']
});

client.sets         = require('./utils/sets.js');
client.commands     = new Discord.Collection();
client.commandsUsed = 0;
client.fullLockdown = true; // Will be disabled after bot starts up.

const commandFiles  = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const adminCommands = fs.readdirSync('./commands/admin').filter(file => file.endsWith('.js'));

for(const file of adminCommands){
    commandFiles.push(`admin/${file}`);
}
for(const file of commandFiles){
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.on('message', message => {
    if(message.author.bot) return;
    else if(client.fullLockdown) return console.log('[APP] Ignored message.');
    else if(client.sets.bannedUsers.has(message.author.id)) return;
    else if(!message.content.toLowerCase().startsWith(config.prefix)) return; // Ignore if message doesn't start with prefix.

    if(message.channel.type === "dm") handleCmd(message, config.prefix);
    else handleCmd(message, config.prefix);
});


client.on('error', (err) => {
    console.log(err);
});

client.on('disconnect', (err) => {
    console.log(err);
    client.destroy().then(client.login(config.botToken));
});

client.on('debug', (message) => {
	if(config.debug) console.debug(message);
});

client.on('reconnecting', () => {
	console.log('[APP] Bot reconnecting...');
});

client.on('ready', async () => {
    await client.user.setActivity(config.prefix + 'help', {type: 'PLAYING'});

    const bannedRows = await query(`SELECT * FROM banned`); // refreshes the list of banned users on startup
    bannedRows.forEach((bannedId) => {
        if(bannedId.userId !== undefined && bannedId.userId !== null){
            client.sets.bannedUsers.add(bannedId.userId);
        }
    });

    console.log(`[APP] Bot is ready`);
    client.fullLockdown = false;
});


client.on('messageReactionRemove', async (reaction, user) => {
    if(reaction.emoji.name !== '🎅') return;

    const exchangeId = reaction.message.id
    const exchange = (await query(`SELECT * FROM exchange WHERE exchangeId = ${exchangeId}`))[0];

    // no exchange associated with message
    if (!exchange) return;

    let row = (await query(`SELECT * FROM users WHERE userId = ${user.id}`))[0];

    if (exchange.started === 1) {
        if(row && row.exchangeId === 0) return; // event triggered by bot

        const leaveFailedEmbed = new Discord.MessageEmbed()
        .setDescription(`Извините, но Анонимный Дед Мороз уже начался :( \nНапишите <@${exchange.creatorId}> пока не поздно!`) //TODO: вывести список всех организаторов
        .setColor(config.embeds_color);

        client.users.fetch(user.id).then(recipient => recipient.send(leaveFailedEmbed));

        
        const leaveFailedEmbed2 = new Discord.MessageEmbed()
        .setDescription(`<@${user.id}> попытался отсоединиться, но уже поздно :(`)
        .setColor(config.embeds_color);

        client.users.fetch(exchange.creatorId).then(org => org.send(leaveFailedEmbed2));
        return; 
    }

    if (row && row.exchangeId !== 0) {
        await query(`UPDATE users SET exchangeId = 0 WHERE userId = ${user.id}`);

        const leaveEmbed = new Discord.MessageEmbed()
        .setDescription(`__Вы вышли из Анонимного Деда Мороза!__\nНам будет вас не хватать 😢!`)
        .setColor(config.embeds_color)

        client.users.fetch(user.id).then(recipient => recipient.send(leaveEmbed));
    }

});

client.on('messageReactionAdd', async (reaction, user) => {
    if(reaction.emoji.name !== '🎅') return;

    const exchangeId = reaction.message.id
    const exchange = (await query(`SELECT * FROM exchange WHERE exchangeId = ${exchangeId}`))[0];

    // no exchange associated with message
    if(!exchange) return;

    // exchange already started
    else if(exchange.started === 1) {
        reaction.users.remove(user.id);
        const joinFailedEmbed = new Discord.MessageEmbed()
        .setDescription(`Извините, но Анонимный Дед Мороз уже начался :( \nПопробуйте написать <@${exchange.creatorId}> пока не поздно!`)
        .setColor(config.embeds_color);

        await client.users.fetch(user.id).then(recipient => recipient.send(joinFailedEmbed));

        
        const joinFailedEmbed2 = new Discord.MessageEmbed()
        .setDescription(`<@${user.id}> попытался присоединиться, но уже поздно :(`)
        .setColor(config.embeds_color);

        client.users.fetch(exchange.creatorId).then(org => org.send(joinFailedEmbed2));

        return; 
    }

    let row = (await query(`SELECT * FROM users WHERE userId = ${user.id}`))[0];

    if(!row) {
        await methods.createNewUser(user.id);
        row = (await query(`SELECT * FROM users WHERE userId = ${user.id}`))[0];
    }

    if(row.exchangeId === 0){
        await query(`UPDATE users SET exchangeId = ${exchangeId} WHERE userId = ${user.id}`);

        const joinEmbed = new Discord.MessageEmbed()
        .setDescription(`__Вы успешно присоединились к Анонимному Деду Морозу от <@${exchange.creatorId}>!__\nЯ дам вам знать, когда всё начнется!`)
        .setColor(config.embeds_color)

        client.users.fetch(user.id).then(recipient => recipient.send(joinEmbed));
    }
});

process.on('unhandledRejection', (reason, p) => {
	console.error('[APP][' + new Date().toLocaleString(undefined, {timeZone: 'Europe/Samara'}) + '] Unhandled Rejection: ', reason);
});

client.login(config.botToken);