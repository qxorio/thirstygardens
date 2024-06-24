require("dotenv").config();
const notion = require("../_lib/utils").notionClient;
const getDrinks = require("../_lib/utils").getDrinks;

const nonalcoholicPage = process.env.NOTION_SANSBOOZE_PAGE_ID;

module.exports = async () => {
    let results = [];

    let data = await notion.blocks.children.list({
        block_id: nonalcoholicPage,
    });

    results = [...data.results];

    let drinks = await Promise.all(results.map(getDrinks));

    return drinks.filter((category) => category !== undefined);
};
