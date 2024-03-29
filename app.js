process.env.TZ = "Europe/Helsinki";

// Set timezone for the process

const Discord = require("discord.js");
require("dotenv").config();

if (!process.env.WEBHOOK_URL) {
  console.error("No env vars were set. Please set WEBHOOK_URL");
  return;
}

// Create WebhookClient
const webhook = new Discord.WebhookClient(process.env.WEBHOOK_URL);

const config = require("./config.json");

async function get_menu() {
  let menu = await fetch(
    "https://fi.jamix.cloud/apps/menuservice/rest/haku/menu/96346/2?lang=fi"
  );
  menu = await menu.json();

  const clean_menu = extract_meals(menu);
  return clean_menu;
}

function extract_meals(menu) {
  let clean_meals = [];
  const days = menu[0]["menuTypes"][0]["menus"][0]["days"];
  let counter = 0;

  for (let day of days) {
    if (counter == 5) return clean_meals;
    counter++;
    const meals = day["mealoptions"];
    let item_memo = [];

    for (let meal of meals) {
      const items = meal["menuItems"];

      if (meal["name"] == "Erityisruokavalio") continue;

      for (let item in items) {
        let name = items[item]["name"].replace(/([A-Z]+, )+[A-Za-z]+/, "");
        if (!item_memo.includes(name)) {
          item_memo.push(name);
        }
      }
    }

    clean_meals[day["weekday"] - 1] = item_memo;
  }
  return clean_meals;
}

function generate_message(menu) {
  const weekdays = [
    "maanantai",
    "tiistai",
    "keskiviikko",
    "torstai",
    "perjantai",
    // "lauantai",
    // "sunnuntai",
  ];
  let message = "";
  for (let day in weekdays) {
    if (!menu[day]) menu[day] = ["Ei ruokalistaa!"];
    message += "# " + weekdays[day] + "\n";
    message += "- " + menu[day].join("\n- ") + "\n";
  }

  return message;
}

get_menu().then((menu) => {
  const message = generate_message(menu);

  webhook
    .send({
      content: message,
    })
    .then(() => webhook.destroy());
});
