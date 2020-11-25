const config = require('./json/config.json');
const Discord = require('discord.js');
const { query } = require('./mysql.js');
const methods  = require('./utils/methods');

exports.handleCmd = async function(message, prefix){
    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = message.client.commands.get(commandName) || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if(!command) return; // Command doesnt exist

    else if(!command.worksInDM && message.channel.type !== 'text') return message.reply('Эта команда не работает в личных сообщениях!');

    else if(command.forceDMsOnly && message.channel.type !== 'dm') return message.reply('Эта команда работает только в личных сообщениях!');

    if(message.channel.type !== 'dm') await cacheMembers(message);
    if(!(await query(`SELECT * FROM users WHERE userId = ${message.author.id}`)).length) await methods.createNewUser(message.author.id); // Create new account in database for user BEFORE executing a command.

    const row = (await query(`SELECT * FROM users WHERE userId = ${message.author.id}`))[0];

    if(command.requirePartner && row.partnerId == 0) return message.reply('Вам ещё не был назначен пртнёр! Попробуйте, когда партнёр будет назначен.');

    else if(command.guildModsOnly && !message.member.hasPermission("MANAGE_GUILD")) return message.reply('Вам требуется разрешение `MANAGE_SERVER` для выполнения этой команды.');

    else if(command.adminOnly && !message.client.sets.adminUsers.has(message.author.id)) return message.reply('Вы должны быть админом бота, чтобы выполнить эту команду.');

    try{
        command.execute(message, args, prefix); // CALL COMMAND HERE
        message.client.commandsUsed++;
    }
    catch(err){
        console.error(err);
        message.reply('Command failed to execute!');
    }
}

async function cacheMembers(message){
    try{
        console.log('[CMD] Fetching members...')
        await message.guild.members.fetch();
    }
    catch(err){
        console.log('[CMD] Failed to fetch guild members: ' + err);
    }
}