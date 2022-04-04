import Discord from 'discord.js';

import axios from "axios";

import dotenv from "dotenv"

const { Client } = Discord;

var interval;
let old_players = null;
let old_status = null;
let old_time = null

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

  let [ time ] = response.data.resources.match(/(\d\d?:\d\d)/g)

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
  console.log({old_status,status,old_players,players,old_time,time,condition:(old_players != players || old_status != status || old_time != time)})
  if(old_players != players || old_status != status){
    client.user.setPresence({ activities: [{ name: `${players} ${time}`, type: 'PLAYING' }], status: status });
    old_players = players
    old_status = status
    old_time = time
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
            if(args[0]){
              message.guild.me.setNickname("DayzServer");
              clearInterval(interval);
              resetPresence(client);
              setNick(client,message, args[0])
              interval = setInterval(() => track(client, message, args[0]),60000)
                message.reply("Rastreando id... (Tracking id").then(msg => {
                  setTimeout(() => msg.delete(), 10000)
                })
                .catch(console.error);
            } else {
              message.reply('Use !track <ServerID> : para rastrear o status do servidor.').then(msg => {
                setTimeout(() => msg.delete(), 20000)
              })
              .catch(console.error);
            }
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

          case 'Rock':
            message.reply("Melhor jogador de Dayz").then(msg => {
              setTimeout(() => msg.delete(), 10000)
            })
            .catch(console.error);
            break;
 
          case 'Pedro':
            message.reply("Veiaco").then(msg => {
              setTimeout(() => msg.delete(), 10000)
            })
            .catch(console.error);
            break;
 
          case 'Vitor':
            message.reply("SEU BOOOOSTA!!!").then(msg => {
              setTimeout(() => msg.delete(), 10000)
            })
            .catch(console.error);
            break;
 
          case 'Rafael':
            message.reply("Tomar no cu!").then(msg => {
              setTimeout(() => msg.delete(), 10000)
            })
            .catch(console.error);
            break;
 
          case 'status':
            axios.get('https://api.trackyserver.com/widget/index.php?id=' + args[0])
            .then((response) => {
              try{
                if(response.data){
                  let [ time ] = response.data.resources.match(/(\d\d?:\d\d)/g)
                  const StatusEmbed = new Discord.MessageEmbed()
                  .setColor('#0ED611')
                  .setTitle('Status!  :bar_chart:')
                  .setDescription(`>>> ${response.data.name}`)
                  .setThumbnail('https://fontmeme.com/images/Dayz-Game.jpg')
                  .addFields(
                    { name: 'Ip', value: response.data.ip, inline: true},
                    { name: 'Players', value: response.data.playerscount, inline: true },
                    { name: 'Mapa (Map)', value: response.data.map, inline: true })
                  .addFields(
                    { name: 'Horario (Time)', value: time, inline: true},
                    { name: 'País (Country)', value: response.data.country, inline: true },
                    { name: 'Versão (Version)', value: response.data.version, inline: true },
                  )
                  .addField('Mais informações (More info)', 'https://www.trackyserver.com/server/'+args[0])
                  .setTimestamp()
  
                  message.reply({ embeds: [StatusEmbed] }).then(msg => {
                    setTimeout(() => msg.delete(), 20000)
                  })
                  .catch(console.error);
                } else {
                message.reply("Não foi possivel encontrar o servidor...").then(msg => {
                  setTimeout(() => msg.delete(), 20000)
                })
                .catch(console.error);
                } 
              }catch{
                message.reply('Use !status <ServerID> : para mostrar o status do servidor.').then(msg => {
                  setTimeout(() => msg.delete(), 20000)
                })
                .catch(console.error);
                } 
            })
            break;
          case 'help':
            const helpEmbed = new Discord.MessageEmbed()
            .setColor('#0ED611')
            .setTitle('HELP! :grey_question:')
            .setDescription(`>>> "!track <id>": usado para rastrear um sevidor (atualiza a cada 60 segundos).\n"!stop" : restaura o estado inicial do Bot e para o rastreamento.\n"!status <ServerID>" : Mostra os status do servidor.`)
            .setThumbnail('https://fontmeme.com/images/Dayz-Game.jpg')
            .addField('Buscar ID (Search ID)', 'https://www.trackyserver.com/dayz-server/', true)
            .setTimestamp()

            message.reply({ embeds: [helpEmbed] }).then(msg => {
              setTimeout(() => msg.delete(), 20000)
            })
            .catch(console.error);
          // Just add any case commands if you want to..
      }
    }
  });

  client.login(process.env.APP_TOKEN)
  