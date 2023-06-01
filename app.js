process.env.TZ = "Europe/Helsinki";

// Set timezone for the process

const Discord = require("discord.js");
require("dotenv").config();

if (!process.env.WEBHOOK_URL) {
  console.error("No env vars were set. Please set WEBHOOK_URL");
  return;
}

// Create WebhookClient
const webhook = new Discord.WebhookClient(
  process.env.WEBHOOK_URL,
);

const config = require("./config.json");

async function build_message() { }

async function get_menu() {
  let menu = await fetch("https://fi.jamix.cloud/apps/menuservice/rest/haku/menu/96346/2?lang=fi")
  menu = await menu.json()

  const clean_menu = extract_meals(menu);
  return clean_menu;

}

function extract_meals(menu) {
  let clean_meals = [];
  const days = menu[0]["menuTypes"][0]["menus"][0]["days"];

  for (let day in days) {
    const meals = days[day]["mealoptions"];
    let item_memo = [];

    for (let meal in meals) {
      const items = meals[meal]["menuItems"];

      for (let item in items) {
        let name = items[item]["name"].split("  ")[0];
        if (!item_memo.includes(name)) {
          item_memo.push(name);
        }
      }
    }

    clean_meals[days[day]["weekday"] - 1] = item_memo;
  }
  return clean_meals;
}

function generate_message(menu) {
  const weekdays = ["maanantai", "tiistai", "keskiviikko", "torstai", "perjantai", "lauantai", "sunnuntai"];
  let message = "";
  for (let day in menu) {
    message += "# " + weekdays[day] + "\n"
    message += "- " + menu[day].join("\n- ") + "\n";
  }

  return message;
}

get_menu().then((menu) => {
  const message = generate_message(menu);
  
  webhook.send({
    content: message,
  }).then(() => webhook.destroy())
});

