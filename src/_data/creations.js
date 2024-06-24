require("dotenv").config();
const notion = require("../_lib/utils").notionClient;

const creationsDatabase = process.env.NOTION_CREATIONS_DB_ID;

module.exports = async () => {
    let results = [];

    let data = await notion.databases.query({
        database_id: creationsDatabase,
    });

    results = [...data.results];

    while (data.has_more) {
        data = await notion.databases.query({
            database_id: creationsDatabase,
            start_cursor: data.next_cursor,
        });

        results = [...results, ...data.results];
    }

    let structuredCreations = await Promise.all(results.map(getCocktailDetails));

    return structuredCreations
        .map((cocktail) => {
            return {
                name: cocktail.properties.Name.title[0].plain_text,
                created: getCustomDate(cocktail.properties.Created.date.start),
                flavors: cocktail.properties.Flavors.rich_text[0].plain_text,
                imageUrl: cocktail.properties.Image.rich_text[0].plain_text,
                isNew: cocktail.properties.New.checkbox,
                ingredients: cocktail.ingredients,
                instructions: cocktail.instructions,
                notes: cocktail.notes,
            };
        })
        .sort((a, b) => {
            return new Date(b.created) - new Date(a.created);
        });
};

function getCustomDate(date) {
    return new Date(date).toDateString().split(" ").splice(1).join(" ");
}

async function getCocktailDetails(cocktail) {
    var blocks = [];

    let blockPage = await notion.blocks.children.list({
        block_id: cocktail.id,
    });

    blocks = [...blockPage.results];

    while (blockPage.has_more) {
        blockPage = await notion.blocks.children.list({
            block_id: cocktail.id,
            start_cursor: blockPage.next_cursor,
        });

        blocks = [...blocks, ...blockPage.results];
    }

    blocks.forEach(async (block) => {
        if (block.has_children) {
            let children = await notion.blocks.children.list({
                block_id: block.id,
            });

            block.children = [...children.results];
        }

        switch (block.toggle.rich_text[0].plain_text) {
            case "Ingredients":
                cocktail.ingredients = block.children.map((child) => {
                    let ingredient = child.paragraph.rich_text[0].plain_text.split(",");
                    return {
                        measure: ingredient[0],
                        name: ingredient[1],
                    };
                });
                break;
            case "Instructions":
                cocktail.instructions = block.children.map((child) => {
                    return child.paragraph.rich_text[0].plain_text;
                });
                break;
            case "Notes":
                if (!block.has_children) {
                    cocktail.notes = null;
                    break;
                }

                cocktail.notes = block.children.map((child) => {
                    return child.paragraph.rich_text[0].plain_text;
                });
                break;
            default:
                break;
        }
    });

    return cocktail;
}
