//bot

import Discord from 'discord.js';

import axios from "axios";

import dotenv from "dotenv"

const { Client } = Discord;

var interval;
let old_players = null;
let old_status = null;
let old_time = null;
let notifyed = null;
let notifyed_lag = null;
let old_formattedTime = null;

dotenv.config();

const track = (client, message, id) => {
  axios.get('https://api.trackyserver.com/widget/index.php?id=' + id)
  .then((response) => {
    console.log("updating...");
    if(response.data){
        updatePresence(client, response, id, message);
    } else {
      message.reply("Não foi possivel encontrar o servidor...");
      clearInterval(interval);
    }
  }).catch(() => offline(client));
}

const offline_embed = (id, message) => {
  let [ time ] = 'offline'
                      const StatusEmbed = new Discord.MessageEmbed()
                      .setColor('#0ED611')
                      .setTitle('Status!  :bar_chart:')
                      .setDescription(`>>> Offline`)
                      .setThumbnail('https://fontmeme.com/images/Dayz-Game.jpg')
                      .addFields(
                        { name: 'Ip', value: 'offline', inline: true},
                        { name: 'Players', value: 'offline', inline: true },
                        { name: 'Mapa (Map)', value: 'offline', inline: true })
                      .addFields(
                        { name: 'Horario (Time)', value: time, inline: true},
                        { name: 'País (Country)', value: 'offline', inline: true },
                        { name: 'Versão (Version)', value: 'offline', inline: true },
                      )
                      .addFields(
                        { name: 'Mais informações (More info)', value: 'https://www.trackyserver.com/server/'+id, inline: true},
                        { name: 'Atualizado em (updated at)', value: 'offline', inline: true },
                      )
                      .setTimestamp()
      
                      message.reply({ embeds: [StatusEmbed] }).then(msg => {
                        setTimeout(() => msg.delete(), 20000)
                      })
                      .catch(console.error);
}

const offline = (client) => {
          
  let status = 'dnd';

  let players = 'offline';

  let time = 'no-data'

  console.log({old_status,status,old_players,players,old_time,time,condition:(old_players != players || old_status != status || old_time != time)})
  if(old_players != players || old_status != status){
    client.user.setPresence({ activities: [{ name: `${players} ${time}` }], status: status });
    old_players = players;
    old_status = status;
    old_time = time;
  }
}

const setNick = (client,message,id) => {
  let name = null;
  axios.get('https://api.trackyserver.com/widget/index.php?id=' + id)
  .then((response) => {
   if(response.data){
    console.log('updateNick...');
    if(response.data.name.length > 32) {
      name  = response.data.name.substring(0,29) + '...';
    }
    else{
      name  =  response.data.name;
    }
    message.guild.me.setNickname(name);
    updatePresence(client, response, id, message)
  
   } else {
    message.reply("Não foi possivel encontrar o servidor...").then(msg => {
      setTimeout(() => msg.delete(), 20000)
    })
    .catch(console.error);
    } 
  }).catch(() => offline(client));
}

const updatePresence = (client, response, id, message) => {
  try {
      if(response.data.playerscount != 'offline') {
        
        let status = null;

        let players = response.data.playerscount;

        let [ time ] = response.data.resources.match(/(\d\d?:\d\d)/g);

        let unix_timestamp = response.data.date;
        console.log(response.data.date,unix_timestamp)
        var date = new Date(unix_timestamp).toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"});
       
        let formattedTime = date.split(" ")[1];

        let [now, maxPlayers] = players.split('/');

        let playerRate = parseFloat(parseInt(now)/parseInt(maxPlayers)).toFixed(1);

        if(playerRate <= 0.3){
          status = 'online';
          notifyed = false;
        }
        else if(playerRate < 0.7){
          status = 'idle';
          notifyed = false;
        }
        else{
          status = 'dnd';
          if(now > 50){
            if(!notifyed_lag) {
              const populationEmbed = new Discord.MessageEmbed()
                .setColor('#0ED611')
                .setTitle('Lag Alert!  :coffin:  :skull: :skull_crossbones:  ')
                .setDescription(`>>> O servidor está com ${playerRate*100}% da sua capacidade!\npodendo resultar em LAG! `)
                .setThumbnail('https://fontmeme.com/images/Dayz-Game.jpg')
                .addField('Mais informações (More info)' , 'https://www.trackyserver.com/server/'+ id)
                .setTimestamp()
  
                message.channel.send({content:'@everyone', embeds: [populationEmbed] }).then(msg => {
                  setTimeout(() => msg.delete(), 60000)
                })
                .catch(console.error);
                notifyed_lag = true;
            }
          } else {
            notifyed_lag = false;
            if(!notifyed) {
              const populationEmbed = new Discord.MessageEmbed()
                .setColor('#0ED611')
                .setTitle('High Population!  :people_wrestling: ')
                .setDescription(`>>> O servidor está com ${playerRate*100}% da sua capacidade! `)
                .setThumbnail('https://fontmeme.com/images/Dayz-Game.jpg')
                .addField('Mais informações (More info)' , 'https://www.trackyserver.com/server/'+ id)
                .setTimestamp()
  
                message.channel.send({content:'@everyone', embeds: [populationEmbed] }).then(msg => {
                  setTimeout(() => msg.delete(), 60000)
                })
                .catch(console.error);
                notifyed = true;
            }
          }
        }
        console.log({ maxPlayers, now, playerRate, status });
        console.log('updatePresence...');
        console.log({old_status,status,old_players,players,old_time,time,notifyed,old_formattedTime,formattedTime,condition:(old_players != players || old_status != status || old_time != time || old_formattedTime != formattedTime)})
        if(old_players != players || old_status != status || old_time != time || old_formattedTime != formattedTime){
          client.user.setPresence({ activities: [{ name: `${players} ${time}\nupdated at: ${formattedTime}` }], status: status });
          old_players = players;
          old_status = status;
          old_time = time;
          old_formattedTime = formattedTime;
        }
    } else {
      offline(client);
    }
  }
  catch(e) {
    console.error(e);
    console.log(response.data)
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
  
      var cmd = args[0].toLowerCase();
  
      args = args.splice(1);

      switch(cmd) {
  
          // !track
  
          case 'track':
            if(args[0]){
              old_players = null;
              old_status = null;
              old_time = null;
              message.guild.me.setNickname("DayzServer");
              clearInterval(interval);
              resetPresence(client);
              setNick(client,message, args[0])
              interval = setInterval(() => track(client, message, args[0]),10000)
                message.reply("Rastreando id... (Tracking id)").then(msg => {
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
            message.reply("Parando... (stopping)").then(msg => {
              setTimeout(() => msg.delete(), 10000)
            })
            .catch(console.error);
            resetPresence(client);
            message.guild.me.setNickname("DayzServer");
            break;

          case 'rock':
            message.reply("Melhor jogador de Dayz").then(msg => {
              setTimeout(() => msg.delete(), 10000)
            })
            .catch(console.error);
            break;
 
          case 'pedro':
            message.reply("Veiaco").then(msg => {
              setTimeout(() => msg.delete(), 10000)
            })
            .catch(console.error);
            break;
 
          case 'babi':
            message.reply("LINDA D+!!!!!!!!!!!!").then(msg => {
              setTimeout(() => msg.delete(), 10000)
            })
            .catch(console.error);
            break;

          case 'flamengo':
            message.reply("É é o Ronaldinho Gaucho ronal ronaldinho Gaucho é é Thiago Neves!! To sem freio to sem freio é o bonde do mengão sem freio!!!!").then(msg => {
              setTimeout(() => msg.delete(), 10000)
            })
            .catch(console.error);
            break;

          case 'vasco':
            message.reply("É o vaxco porra!!!!!").then(msg => {
              setTimeout(() => msg.delete(), 10000)
            })
            .catch(console.error);
            break;
          
          case "pleu":
            message.reply("Plicty Plecty!").then(msg => {
              setTimeout(() => msg.delete(), 10000)
            })
            .catch(console.error);
            break;
 
          case 'vitor':
            message.reply("SEU BOOOOSTA!!!").then(msg => {
              setTimeout(() => msg.delete(), 10000)
            })
            .catch(console.error);
            break;
 
          case 'rafael':
            message.reply("Tomar no cu!").then(msg => {
              setTimeout(() => msg.delete(), 10000)
            })
            .catch(console.error);
            break;
 
          case 'status':
            if(args[0]){
              axios.get('https://api.trackyserver.com/widget/index.php?id=' + args[0])
              .then((response) => {
                try{
                  if(response.data.playerscount != 'offline') {
                    if(response.data){
                      let [ time ] = response.data.resources.match(/(\d\d?:\d\d)/g)
  
                      let unix_timestamp = response.data.date
  
                      var date = new Date(unix_timestamp).toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"});
                      
                      var formattedTime = date.split(" ")[1];
  
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
                      .addFields(
                        { name: 'Mais informações (More info)', value: 'https://www.trackyserver.com/server/'+args[0], inline: true},
                        { name: 'Atualizado em (updated at)', value: formattedTime, inline: true },
                      )
                      .setTimestamp()
      
                      message.reply({ embeds: [StatusEmbed] }).then(msg => {
                        setTimeout(() => msg.delete(), 30000)
                      })
                      .catch(console.error);
                    } else {
                    message.reply("Não foi possivel encontrar o servidor...").then(msg => {
                      setTimeout(() => msg.delete(), 20000)
                    })
                    .catch(console.error);
                    } 
                  } else {
                      offline_embed(args[0],message);
                    }
                }catch (e){
                  console.error(e)
                  message.reply('Erro ao gerar fazer ao gerar Status.').then(msg => {
                    setTimeout(() => msg.delete(), 20000)
                  })
                  .catch(console.error);
                  } 
              }).catch(() => offline_embed(args[0],message));
            }else{
              message.reply('Use !status <ServerID> : para mostrar o status do servidor.').then(msg => {
                setTimeout(() => msg.delete(), 20000)
              })
              .catch(console.error);
              } 
            break;
          case 'help':
            const helpEmbed = new Discord.MessageEmbed()
            .setColor('#0ED611')
            .setTitle('HELP! :grey_question:')
            .setDescription(`>>> "!track <id>": usado para rastrear um sevidor (atualiza a cada 2 minutos.\n"!stop" : restaura o estado inicial do Bot e para o rastreamento.\n"!status <ServerID>" : Mostra os status do servidor.`)
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
  