/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
          \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
           \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

var fs = require('fs');


controller.hears(['hello','hi'],'direct_message,direct_mention,mention',function(bot, message) {

    controller.storage.users.get(message.user,function(err, user) {
        if (user && user.name) {
            bot.reply(message,'Hello ' + user.name + '!!');
        } else {
            bot.reply(message,'Hello.');
        }
    });
});



controller.hears(['add (.*)'],'direct_message,direct_mention,mention',function(bot, message) {
    var matches = message.text.match(/add (.*)/i);
    var task = matches[1];
    var data;
    var num;

    controller.storage.users.get(message.user,function(err, user) {


      fs.readFile('./test.txt', 'utf8', function (err, text) {
        matches = text.match(/現在保存しているメモ数: \d+/);
        num = matches[0].match(/\d+/) * 1 + 1;
        bot.reply(message, "「" + task + "」" + "をメモに追加しました．");
        var newnum = "現在保存しているメモ数: " + num;

        var tasks = text.split(/\(\d+\)/)

        var write_data = "【" + newnum + "】\n\n"

        for (var i = 1; i < num; i++) {
          write_data = write_data + "(" + i + ") " + tasks[i]; 
        };

        write_data = write_data + "\n(" + i + ")" + task;


        fs.writeFile('./test.txt',write_data,function(err){
         if(err) throw err;
        });

      });


        
    });
});

controller.hears(['show'],'direct_message,direct_mention,mention',function(bot, message) {
    controller.storage.users.get(message.user,function(err, user) {

      fs.readFile('./test.txt', 'utf8', function (err, text) {
          bot.reply(message, "メモを表示します\n" + text);
          // console.log('text file!');
          // console.log(text);
          // console.log('error!?');
          // console.log(err);
      });

    });
});


controller.hears(['delete (.*)'],'direct_message,direct_mention,mention',function(bot, message) {
    var matches = message.text.match(/delete (\d+)/);
    if(matches){
      var task = matches[1];

      controller.storage.users.get(message.user,function(err, user) {
        fs.readFile('./test.txt', 'utf8', function (err, text) {
          matches = text.match(/現在保存しているメモ数: \d+/);
          num = matches[0].match(/\d+/) * 1 - 1;
          bot.reply(message, "(" + task + ")" + "のメモを削除します．");
          var newnum = "現在保存しているメモ数: " + num;

          var tasks = text.split(/\(\d+\)/)

          var write_data = "【" + newnum + "】\n\n"

          tasks.splice( task , 1 );

          for (var i = 1; i < num+1; i++) {
            write_data = write_data + "(" + i + ") " + tasks[i]; 
          };


          fs.writeFile('./test.txt',write_data,function(err){
           if(err) throw err;
          });

        });
      });
    } else {
      bot.reply(message, "引数が間違ってます");
    }
});







controller.hears(['call me (.*)'],'direct_message,direct_mention,mention',function(bot, message) {
    var matches = message.text.match(/call me (.*)/i);
    var name = matches[1];
    controller.storage.users.get(message.user,function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user,function(err, id) {
            bot.reply(message,'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what is my name','who am i'],'direct_message,direct_mention,mention',function(bot, message) {

    controller.storage.users.get(message.user,function(err, user) {
        if (user && user.name) {
            bot.reply(message,'Your name is ' + user.name);
        } else {
            bot.reply(message,'I don\'t know yet!');
        }
    });
});


controller.hears(['shutdown'],'direct_message,direct_mention,mention',function(bot, message) {

    bot.startConversation(message,function(err, convo) {
        convo.ask('Are you sure you want me to shutdown?',[
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    },3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});


controller.hears(['uptime','identify yourself','who are you','what is your name'],'direct_message,direct_mention,mention',function(bot, message) {

    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());

    bot.reply(message,':robot_face: I am a bot named <@' + bot.identity.name + '>. I have been running for ' + uptime + ' on ' + hostname + '.');

});

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
