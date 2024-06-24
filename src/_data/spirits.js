require("dotenv").config();
const notion = require("../_lib/utils").notionClient;
const getDrinks = require("../_lib/utils").getDrinks;

const spiritsPage = process.env.NOTION_SPIRITS_PAGE_ID;

module.exports = async () => {
    let results = [];

    let data = await notion.blocks.children.list({
        block_id: spiritsPage,
    });

    results = [...data.results];

    let spirits = await Promise.all(results.map(getDrinks));

    return spirits.filter((category) => category !== undefined);
};
