import pkg from 'discord.js';

import axios from "axios";

import dotenv from "dotenv"

const { Client } = pkg;

var interval;
let old_players = null;
let old_status = null;

dotenv.config();

const track = (client, message, id) => {
  axios.get('https://api.trackyserver.com/widget/index.php?id=' + id)
  .then((response) => {
    console.log("updating...")
    if(response.data){
        updatePresence(client, response);
    } else {
      message.reply("Não foi possivel encontrar o servidor...")
      clearInterval(interval)
    }
  })
}

const setNick = (client,message,id) => {
  axios.get('https://api.trackyserver.com/widget/index.php?id=' + id)
  .then((response) => {
    console.log('updateNick...')
    if(response.data.name.length > 32) {
      message.guild.me.setNickname(response.data.name.substring(0,29) + '...');
      updatePresence(client, response)
    }
    else{
      message.guild.me.setNickname(response.data.name);
      updatePresence(client, response)
    }
  })
}

const updatePresence = (client, response) => {
  
  let status = null

  let players = response.data.playerscount

  let [now, maxPlayers] = players.split('/')
  
  let playerRate = parseFloat(parseInt(now)/parseInt(maxPlayers)).toFixed(1)

  if(playerRate < 0.3){
    status = 'online'
  }
  else if(playerRate < 0.7){
    status = 'idle'
  }
  else{
    status = 'dnd'
  }
  console.log({ maxPlayers, now, playerRate, status })
  console.log('updatePresence...')
  console.log({old_status,status,old_players,players,condition:(old_players != players || old_status != status)})
  if(old_players != players || old_status != status){
    client.user.setPresence({ activities: [{ name: players, type: 'PLAYING' }], status: status });
    old_players = players
    old_status = status
  }
};

const resetPresence = async (client) => {
  console.log('reseting presence...')
  client.user.setPresence({ activities: [{ name: '!track', type: 'LISTENING' }], status: 'online' });
};

const client = new Client({
    intents: ['GUILDS', 'GUILD_MESSAGES'],
  });

  client.on('ready', async () =>{
    console.log("Ready!");
    resetPresence(client); //reset last state
   });
  
  client.on('messageCreate', (message) => {

    if (message.content.substring(0, 1) == '!') {

      var args = message.content.substring(1).split(' ');
  
      var cmd = args[0];
  
      args = args.splice(1);

      switch(cmd) {
  
          // !track
  
          case 'track':
            message.guild.me.setNickname("DayzServer");
            clearInterval(interval);
            resetPresence(client);
            setNick(client,message, args[0])
            interval = setInterval(() => track(client, message, args[0]),10000)
              message.reply("Rastreando id...").then(msg => {
                setTimeout(() => msg.delete(), 10000)
              })
              .catch(console.error);
            break;

          case 'stop':
            clearInterval(interval);
            message.reply("Parando...").then(msg => {
              setTimeout(() => msg.delete(), 10000)
            })
            .catch(console.error);
            resetPresence(client);
            message.guild.me.setNickname("DayzServer");
            break;

          case 'help':
            message.reply(`"!track <id>": usado para rastrear um sevidor (atualiza a cada 10 segundos).\n"!stop" : restaura o estado inicial do Bot e para o rastreamento.`).then(msg => {
              setTimeout(() => msg.delete(), 15000)
            })
            .catch(console.error);
            break;
          // Just add any case commands if you want to..
      }
    }
  });

  client.login(process.env.APP_TOKEN)
  