const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const moment = require('moment-timezone');


const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


// Replace with your bot token from @BotFather using environment variables for security
const token = process.env.TELEGRAM_BOT_TOKEN || '6368266674:AAF8BKgaVNdR7guyACnsQH3FpQHbjl60bhE';
const channels = ['@UdayScripts', '@UdayScripts_Alerts'];
let balances = {};
let buyed = {};
let selling = {};
let sellearn = {};
let level = {};
let lastClaimed = {};
let bagitem = {};
let solds = {};
let userIds = [];
let orderids = [];

const dataFilePath = path.join(__dirname, 'userdata.json');

// Promisify file operations for easier async/await usage
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// Load data from file at startup
async function loadDataFromFile() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = await readFileAsync(dataFilePath, 'utf8');
      const parsedData = JSON.parse(data);

      balances = parsedData.balances || {};
      buyed = parsedData.buyed || {};
      selling = parsedData.selling || {};
      sellearn = parsedData.sellearn || {};
      level = parsedData.level || {};
      lastClaimed = parsedData.lastClaimed || {};
      bagitem = parsedData.bagitem || {};
      solds = parsedData.solds || {};
      userIds = parsedData.userIds || [];
      orderids = parsedData.orderids || [];
      
      console.log('Data loaded successfully.');
    } else {
      console.log('No existing data file found. Starting with empty data.');
    }
  } catch (error) {
    console.error('Error loading data from file:', error);
  }
}

// Save data to file
async function saveDataToFile() {
  try {
    const data = {
      balances,
      solds,
      buyed,
      selling,
      sellearn,
      level,
      lastClaimed,
      bagitem,
      userIds,
      orderids,
    };

    await writeFileAsync(dataFilePath, JSON.stringify(data, null, 2));
    console.log('Data saved successfully.');
  } catch (error) {
    console.error('Error saving data to file:', error);
  }
}

// Call this function to load data at the beginning
loadDataFromFile();

const userDataFilePath = path.join(__dirname, 'userProperties.json');

// Function to read user data from the file
function readUserData() {
  if (!fs.existsSync(userDataFilePath)) {
    return {};
  }
  const data = fs.readFileSync(userDataFilePath);
  return JSON.parse(data);
}

// Function to write user data to the file
function writeUserData(data) {
  fs.writeFileSync(userDataFilePath, JSON.stringify(data, null, 2));
}

// Function to set user property
function setUserProperty(userId, property, value) {
  const userData = readUserData();
  if (!userData[userId]) {
    userData[userId] = {};
  }
  userData[userId][property] = value;
  writeUserData(userData);
}

// Function to get user property
function getUserProperty(userId, property) {
  const userData = readUserData();
  return userData[userId] ? userData[userId][property] : null;
}

// Function to delete user property
function deleteUserProperty(userId, property) {
  const userData = readUserData();
  if (userData[userId]) {
    delete userData[userId][property];
    writeUserData(userData);
  }
}

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

function generateRandomString(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function getCurrentIndiaTime() {
  return moment().tz('Asia/Kolkata').format('MMMM Do YYYY, h:mm:ss a');
}

const checkUserMembership = async (userId) => {
  for (let channel of channels) {
    try {
      const member = await bot.getChatMember(channel, userId);
      const status = member.status;
      if (status !== 'member' && status !== 'administrator' && status !== 'creator') {
        return false;
      }
    } catch (error) {
      console.error(`Error checking membership for channel ${channel}:`, error);
      return false;
    }
  }
  return true;
};

// Listener for '/start' command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  if (!userIds.includes(chatId)) {
    userIds.push(chatId);
    saveDataToFile(); // Save the updated userIds to file
  }

  // Check if user is a member of all channels
  const isMember = await checkUserMembership(msg.from.id);

  if (isMember) {
    // User is a member, send keyboard buttons
    const opts = {
      reply_markup: {
        keyboard: [
          ['👤 Account', '💎 Get Fund'],['💝 Bonus', '🎒My Bag', '📁 Scripts'],['🛠 Support','🤩 More'],['🛍 Sellers Account 🛍']
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
      parse_mode: 'HTML',
    };
    const firstName = msg.from.first_name;
    bot.sendMessage(chatId, `<b>👋 Hey</b> ${firstName}, <b>Welcome To Our Bot.</b>`, opts);
  } else {
    // User is not a member, ask them to join the channels
    const channelList = channels.join('\n');
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🟢 Joined',
              callback_data: 'joined'
            }
          ]
        ]
      },
      parse_mode: 'HTML'
    };
    const firstName = msg.from.first_name;
    bot.sendMessage(chatId, `<b>👋 Hey</b> ${firstName},  <b>Please Join Our Channels To Use This Bot.</b>\n\n${channelList}`, opts);
  }
});

// Account button handler
bot.onText(/👤 Account/, (msg) => {
  const chatId = msg.chat.id;
  const photoUrl = 'https://t.me/djmdumcsh/121';
  const firstName = msg.from.first_name;
  const userId = msg.from.id;
  const balance = balances[userId] || 0;
  const leveled = level[userId] || 0;
  const buys = buyed[userId] || 0;

  const opts = {
    caption: `<b>👤 Name :</b> <code>${firstName}</code>\n<b>🆔 User ID :</b> <code>${userId}</code>\n\n<b>💵 Balance :</b> <code>${balance}</code> <b>XP 💎</b>\n\n<b>⚔️ Level :</b> ${leveled}/1000 <b>Completed</b>\n<b>📚 Total Script purchsed :</b> <code>${buys}</code>`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💎 Deposit', callback_data: 'deposit' },
          { text: '❤ Rate Us', callback_data: 'rate' }
        ],
        [
          { text: '🧸 Account Settings', callback_data: 'settings' }
        ]
      ]
    }
  };

  bot.sendPhoto(chatId, photoUrl, opts);
});

bot.onText(/🔙 Back/, (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    reply_markup: {
      keyboard: [
        ['👤 Account', '💎 Get Fund'],['💝 Bonus', '🎒My Bag', '📁 Scripts'],['🛠 Support','🤩 More'],['🛍 Sellers Account 🛍']
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
    parse_mode: 'HTML',
  };
  const firstName = msg.from.first_name;
  bot.sendMessage(chatId, `<b>👋 Hey</b> ${firstName}, <b>Welcome To Our Bot.</b>`, opts);
})

bot.onText(/💎 Get Fund/, (msg) => {
  const chatId = msg.chat.id;
  const photoUrl = 'https://t.me/djmdumcsh/95';
  const firstName = msg.from.first_name;
  const userId = msg.from.id;
  const balance = balances[userId] || 0;
  const leveled = level[userId] || 0;
  const buys = buyed[userId] || 0;

  const opts = {
    caption: `<b>👋 Welcome!</b>\n<i>Here You Can Add Funds To Your Balance!</i>\n\n<b>1 INR = 2 XP 💎\n1 TRX = 14 XP 💎</b>\n\n➕ Select Deposit Method, All deposits will be converted to <b>XP</b>\n\n<b>🤩 Offer Active</b> <i>» Deposit through paytm and Get ×2 Amount!! </i>\n<b>🤩 Offer Active</b> <i>» Deposit through CRYPTO and Get ×2 Amount!!</i>`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🦊 TRX', callback_data: 'trx' },
          { text: '🐧 INR', callback_data: 'inr' }
        ],
        [
          { text: '🔘 Redeem Code', callback_data: 'redeem' }
        ]
      ]
    }
  };

  bot.sendPhoto(chatId, photoUrl, opts);
});

bot.onText(/💝 Bonus/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const now = Date.now();

  // Check if user has claimed the bonus in the last 24 hours
  if (lastClaimed[userId] && (now - lastClaimed[userId]) < 24 * 60 * 60 * 1000) {
    const nextClaimTime = new Date(lastClaimed[userId] + 24 * 60 * 60 * 1000);
    bot.sendMessage(chatId, '*😃 You have already claimed your today\'s Bonus*', {
      parse_mode: 'Markdown'
    });

  } else {
    // Grant bonus points
    const bonusPoints = 3;
    balances[userId] = (balances[userId] || 0) + bonusPoints;

    // Update last claimed timestamp
    lastClaimed[userId] = now;

    bot.sendMessage(chatId, `<b>🎉 You have claimed ${bonusPoints} bonus points!</b>`, { parse_mode: 'HTML' });

    // Save data to file
    saveDataToFile();
  }
});;

bot.onText(/🎒My Bag/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const bagit = bagitem[userId] || 0;
  const msgg = `<b>🎒 You have Added :</b> ${bagit} Item(s) <b>In Your Bag!</b>\n\n❇️ Click <b>Open Bag</b> Button to View all Item(s)`;

  const opt = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👁‍🗨 Open Bag', callback_data: 'openbag' }
        ]
      ]
    },
    parse_mode: 'HTML'
  };

  bot.sendMessage(chatId, msgg, opt);
});

bot.onText(/📁 Scripts/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  const msgg = `<b>🔍 Search Which Script You Want To Buy.</b>`;

  const opt = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔍 Search Script', switch_inline_query_current_chat: '' }
        ]
      ]
    },
    parse_mode: 'HTML'
  };

  bot.sendMessage(chatId, msgg, opt);
});

const JSON_FILE_PATH = './scripts.json';

bot.on('inline_query', async (inlineQuery) => {
  const query = inlineQuery.query.toLowerCase(); // Convert query to lowercase for case-insensitive matching

  try {
    const jsonData = fs.readFileSync(JSON_FILE_PATH);
    const data = JSON.parse(jsonData);

    let results = [];

    if (query.trim() === '') {
      // If query is empty, return all items
      results = data.map(item => ({
        type: 'article',
        id: String(item.id),
        title: item.title,
        input_message_content: {
          message_text: item.scid
        },
        description: item.description,
        thumb_url: item.thumb_url
      }));
    } else {
      // Filter results based on query
      results = data.filter(item => item.title.toLowerCase().includes(query)).map(item => ({
        type: 'article',
        id: String(item.id),
        title: item.title,
        input_message_content: {
          message_text: item.scid
        },
        description: item.description,
        thumb_url: item.thumb_url
      }));
    }

    bot.answerInlineQuery(inlineQuery.id, results);
  } catch (error) {
    console.error('Error reading JSON file:', error);
  }
});

/*bot.onText(/📁 Scripts/, (msg) => {
  const chatId = msg.chat.id;

  const message = `*😍 Welcome,* _Buy Now Your Dream Script Here_`;

  const opts = {
    reply_markup: {
      keyboard: [
        ["🛍 Lifafa", "🍭 Campaign", "🎮 Game"],
        ["🍄 Cool", "🦁 PLP", "🎛 Panel"],
        ["🤖 Bots", "🎨 Logo", "🔒 Premium"],
        ["💫 Rare", "👽 APK", "🆓 Free"],
        ["😎 Awesome", "🔩 Tools", "🌟 Booster"],
        ["🔙 Back", "Next 🔜"]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    },
    parse_mode: 'Markdown'
  };

  bot.sendMessage(chatId, message, opts);
});*/

bot.onText(/🛠 Support/, (msg) => {
  const chatId = msg.chat.id;
  const opt = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📞 Support", url: "https://t.me/uday_x" }]
      ]
    },
    parse_mode: 'Markdown'
  };
  bot.sendMessage(chatId, '*Get In Touch With Our Admin*', opt);
});

bot.onText(/🤩 More/, (msg) => {
  const chatId = msg.chat.id;
  const text = `*Welcome To Additional Menu*`;
  const opts = {
    reply_markup: {
      keyboard: [
        ["❤ Rate", "ℹ️ Info & Faqs"],
        ["☄️ Update", "👨‍👨‍👧‍👦 Referral", "💹 Stats"],
        ["⚒ Fixed", "⚙ Setting", "🎲 Game"],
        ["👨‍💻 Tasks", "📖 Review"],
        ["🔙 Back"]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    },
    parse_mode: 'Markdown'
  };
  bot.sendMessage(chatId,text,opts);
})

bot.onText(/🛍 Sellers Account 🛍/, (msg) => {
  const chatId = msg.chat.id;
  const pic = `https://t.me/djmdumcsh/91`;
  const bal = balances[chatId] || 0;
  const sold = solds[chatId] || 0;
  const opts = {
    caption: `<b>🖤 Welcome to Seller Panel!</b> 

<b>👤 Account ID:</b> <code>${chatId}</code>

<b>💎 Panel Balance:</b> <code>${bal}</code> <b>XP 💎</b>

<b>🛒 You have Sold:</b> ${sold} <b>Stuff(s) in Total!</b>`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: "➕ Add Script", callback_data: "/add_script" },
          { text: "🪫 My Script's", callback_data: "/my_sell 1" }
        ],
        [{ text: "💎 Withdraw", callback_data: "/withdraw" }]
      ]
    }
  };

  bot.sendPhoto(chatId, pic, opts);
});



// Listener for '/help' command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
  Here are some commands you can use:
  /start - Start interacting with the bot
  /help - Get a list of available commands
  /echo [message] - Echo the message back to you
  /send [id] - Fetch transaction details from Paytm API
  /sticker - Receive a sticker
  /keyboard - Show inline keyboard
  /delete - Delete a message
  /contact - Share contact information
  /user - Show user details
  `;
  bot.sendMessage(chatId, helpMessage);
});

// Listener for '/echo [message]' command
bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "message"
  bot.sendMessage(chatId, resp);
});

// Listener for '/send [id]' command
bot.onText(/\/send (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const trsid = match[1];
  const mid = "SzFThC49898719386494";

  // Send a request to the Paytm API
  const apiUrl = `https://paytm.udayscriptsx.workers.dev/?mid=${mid}&id=${trsid}`;

  axios.get(apiUrl)
    .then(response => {
      const apiData = response.data;
      const apiMessage = `
        TXNID ID: ${apiData.TXNID}
        ORDERID: ${apiData.ORDERID}
        AMOUNT: ${apiData.TXNAMOUNT}
        MESSAGE: ${apiData.RESPMSG}
        DATE AND TIME: ${apiData.TXNDATE}
      `;
      bot.sendMessage(chatId, apiMessage);
    })
    .catch(error => {
      console.error('Error fetching transaction details:', error);
      bot.sendMessage(chatId, 'Sorry, I couldn\'t get the transaction information. Please check the transaction ID and try again.');
    });
});

// Listener for '/sticker' command
bot.onText(/\/sticker/, (msg) => {
  const chatId = msg.chat.id;
  // Replace with a file_id of a sticker you have
  const stickerId = 'CAACAgUAAxkBAAEr9ehmamm1RmIU94IfDhDj_3GzLMOINAAC9QUAAvHZEVeuNGrVKSp__DUE';
  bot.sendSticker(chatId, stickerId);
});

// Listener for '/keyboard' command
bot.onText(/\/keyboard/, (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Option 1',
            callback_data: '1'
          },
          {
            text: 'Option 2',
            callback_data: '2'
          }
        ],
        [
          {
            text: 'Edit message',
            callback_data: 'edit'
          },
          {
            text: 'Delete message',
            callback_data: 'delete'
          }
        ]
      ]
    }
  };
  bot.sendMessage(chatId, 'Choose an option:', opts);
});

// Listener for callback queries
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;
  const chatId = message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    if (data === 'edit') {
      await bot.editMessageText('You chose to edit the message', {
        chat_id: chatId,
        message_id: message.message_id,
      });
    } else if (data === 'delete') {
      await bot.deleteMessage(chatId, message.message_id);
    } else if (data === 'rate'){
      
      var but = [
        [{ text: "❤❤❤❤❤", callback_data: "/rate22 5" }],
        [{ text: "🧡🧡🧡🧡", callback_data: "/rate22 4" }],
        [{ text: "💚💚💚", callback_data: "/rate22 4" }],
        [{ text: "💙💙", callback_data: "/rate22 2" }],
        [{ text: "🖤", callback_data: "/Rate0" }]
      ];
      var xxyz = "💛 *Please Rate Us :*";
      bot.sendMessage(message.chat.id, xxyz, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: but
        }
      });
    } else if (data === 'joined') {
      await bot.deleteMessage(chatId, message.message_id);

      const isMember = await checkUserMembership(userId);
      if (isMember) {
        const opts = {
          reply_markup: {
            keyboard: [
              ['👤 Account', '💎 Get Fund'],
              ['💝 Bonus', '🎒 My Bag', '📁 Scripts'],
              ['🛠 Support', '🤩 More'],
              ['🛍 Sellers Account 🛍']
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
          parse_mode: 'HTML',
        };
        const firstName = callbackQuery.from.first_name;
        await bot.sendMessage(chatId, `<b>👋 Hey</b> ${firstName}, <b>Welcome To Our Bot.</b>`, opts);
      } else {
        await bot.sendMessage(chatId, 'You still need to join the required channels to use this bot.');
      }
    } else if (data === 'deposit') {
      const newPhotoUrl = 'https://t.me/djmdumcsh/95';
      const newCaption = `<b>👋 Welcome!</b>\n<i>Here You Can Add Funds To Your Balance!</i>\n\n<b>1 INR = 2 XP 💎\n1 TRX = 14 XP 💎</b>\n\n➕ Select Deposit Method, All deposits will be converted to <b>XP</b>\n\n<b>🤩 Offer Active</b> <i>» Deposit through paytm and Get ×2 Amount!! </i>\n<b>🤩 Offer Active</b> <i>» Deposit through CRYPTO and Get ×2 Amount!!</i>`;

      const opts = {
        caption: newCaption,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🦊 TRX', callback_data: 'trx' },
              { text: '🐧 INR', callback_data: 'inr' }
            ],
            [
              { text: '🔘 Redeem Code', callback_data: 'redeem' }
            ]
          ]
        }
      };

      // Send a new photo with caption and reply_markup
      await bot.sendPhoto(chatId, newPhotoUrl, opts);

      // Delete the original message after sending the updated one
      await bot.deleteMessage(chatId, message.message_id);
    } else if (data === 'inr') {
     bot.answerCallbackQuery(callbackQuery.id, { text: 'Generating QR code...' });
        const oid = generateRandomString(20);

        const data = `upi://pay?pa=paytmqr7fj21gs2it@paytm&pn=Paytm%20Merchant&tr=${oid}&tn=Adding%20Fund`;
        const fdata = encodeURIComponent(data);
        const apiUrl = `https://qr.udayscriptsx.workers.dev/?data=${fdata}`;
      axios.get(apiUrl)
      .then(response => {
        const apiData = response.data;
        const image = apiData.image; // Assuming apiData contains the image URL

        // Define the new caption for the QR code message
        const newCaption = `<b>Pay On This Qr Code</b>\n<i>And Click Paid, You Fund Will Add Automatically (If Paid)</i>`;

        // Define the options for editing the message
        const opts = {
          media: {
            type: 'photo',
            media: image,
            caption: newCaption,
            parse_mode: 'HTML'
          },
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Paid", callback_data: "auto_dep "+oid },
                { text: "🔁 Regenerate Qr", callback_data: "inr" }
              ],
              [{ text: "🔙 Back", callback_data: "/inr_info" }]
            ]
          }
        };

        // Edit the message media with the new QR code and caption
        bot.editMessageMedia(opts.media, {
          chat_id: chatId,
          message_id: message.message_id,
          reply_markup: opts.reply_markup
        }).catch(error => {
          // Log the error and notify the user if something goes wrong
          console.error('Error editing message media:', error);
          bot.sendMessage(chatId, 'Sorry, I couldn\'t update the QR code. Please try again.');
        });
      })
      .catch(error => {
        // Handle errors from the axios request
        console.error('Error fetching QR code:', error);
        bot.sendMessage(chatId, 'Sorry, I couldn\'t generate the QR code. Please try again.');
      });
    } else if (data.startsWith('auto_dep')) {
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Checking...' });

      const oid = data.split(' ')[1];
      const mid = "SzFThC49898719386494";

      // Send a request to the Paytm API
      const apiUrl = `https://paytm.udayscriptsx.workers.dev/?mid=${mid}&id=${oid}`;

      axios.get(apiUrl)
        .then(response => {
          const apiData = response.data;
          const id = apiData.ORDERID;
          const stat = apiData.STATUS;
          const resp = apiData.RESPMSG;
          const vl = apiData.TXNAMOUNT;
          const val = parseFloat(vl);

          if (stat === "TXN_SUCCESS" && resp === "Txn Success") {
            if (!orderids.includes(id)) {
              orderids.push(id);
              saveDataToFile();
            } 
          }
          else {
            const timenow = getCurrentIndiaTime();
            //const not = 'https://t.me/djmdumcsh/148';
            bot.sendMessage({
              chat_id: message.chat.id,
              text: `<b>❌ Deposit Not Found...</b>\n<i>Order Id: ${id}</i>\n\n<i>Don't Use Same QR Code Again Generate New QR Code</i>\n\n<i>Last Checked: ${timenow}</i>`,
              disable_web_page_preview: true,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "🔁 Refresh", callback_data: `auto_dep ${id}` },
                    { text: "⬅️ Return", callback_data: "deposit" }
                  ],
                  [{ text: "❤️‍🩹 New Qr", callback_data: "inr" }]
                ]
              }
            });
          }
        })
        .catch(error => {
          console.error('Error fetching data from API:', error);
          bot.answerCallbackQuery(callbackQuery.id, {
            text: '🚫 Error checking deposit status!',
            show_alert: true
          });
        });

    }else {
      await bot.sendMessage(chatId, `You chose option ${data}`);
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
  }
});



// Listener for '/delete' command
bot.onText(/\/delete/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'This message will be deleted in 5 seconds')
    .then((sentMsg) => {
      setTimeout(() => {
        bot.deleteMessage(chatId, sentMsg.message_id);
      }, 5000);
    });
});

// Listener for '/contact' command
bot.onText(/\/contact/, (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    reply_markup: {
      keyboard: [
        [{
          text: 'Send my contact',
          request_contact: true
        }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    }
  };
  bot.sendMessage(chatId, 'Please share your contact information:', opts);
});

// Listener for '/user' command
bot.onText(/\/user/, (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;

  bot.getUserProfilePhotos(user.id)
    .then(profilePhotos => {
      if (profilePhotos.total_count > 0) {
        const photo = profilePhotos.photos[0][0].file_id;
        bot.sendPhoto(chatId, photo, {
          caption: `
            User Details:
            First Name: ${user.first_name}
            Last Name: ${user.last_name || 'N/A'}
            User ID: ${user.id}
            Language: ${user.language_code}
          `
        });
      } else {
        bot.sendMessage(chatId, `
          User Details:
          First Name: ${user.first_name}
          Last Name: ${user.last_name || 'N/A'}
          User ID: ${user.id}
          Language: ${user.language_code}
        `);
      }
    })
    .catch(error => {
      console.error('Error fetching user profile photos:', error);
      bot.sendMessage(chatId, 'Sorry, I could not fetch your profile photos.');
    });
});

const ADMIN_CHAT_ID = 1489381549; // Replace with your actual admin chat ID
let isAwaitingBroadcastMessage = false;

// Assume userIds is an array of user IDs to whom the message will be broadcasted

bot.onText(/\/broadcast/, (msg) => {
  const chatId = msg.chat.id;

  if (chatId === ADMIN_CHAT_ID) {
    bot.sendMessage(chatId, 'Please send the message you want to broadcast.');
    isAwaitingBroadcastMessage = true;
  } else {
    bot.sendMessage(chatId, 'You are not authorized to use this command.');
  }
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userId === ADMIN_CHAT_ID && isAwaitingBroadcastMessage && msg.text !== '/broadcast') {
    const messageText = msg.text || msg.caption || 'You forwarded a message';

    userIds.forEach(userId => {
      if (msg.forward_from_chat || msg.forward_from) {
        bot.forwardMessage(userId, chatId, msg.message_id);
      } else {
        bot.sendMessage(userId, messageText, {
          parse_mode: 'Markdown'
        });
      }
    });
    bot.sendMessage(chatId, 'Broadcast message sent to all users.');
    isAwaitingBroadcastMessage = false;
  }
});


bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userId === ADMIN_CHAT_ID && isAwaitingBroadcastMessage && msg.text !== '/broadcast') {
    const messageText = msg.text || msg.caption || 'You forwarded a message';

    userIds.forEach(userId => {
      if (msg.forward_from_chat || msg.forward_from) {
        bot.forwardMessage(userId, chatId, msg.message_id);
      } else {
        bot.sendMessage(userId, messageText);
      }
    });
    bot.sendMessage(chatId, 'Broadcast message sent to all users.');
    isAwaitingBroadcastMessage = false;
  }
});


// Handle errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code);
});
      
console.log('Bot is running...');
