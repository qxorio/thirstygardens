require("dotenv").config();
const notion = require("../_lib/utils").notionClient;

const cocktailsDatabase = process.env.NOTION_COCKTAILS_DB_ID;

module.exports = async () => {
    let results = [];

    let data = await notion.databases.query({
        database_id: cocktailsDatabase,
    });

    results = [...data.results];

    while (data.has_more) {
        data = await notion.databases.query({
            database_id: cocktailsDatabase,
            start_cursor: data.next_cursor,
        });

        results = [...results, ...data.results];
    }

    let structuredCocktails = await Promise.all(results.map(getCocktailDetails));

    return structuredCocktails
        .filter((cocktail) => cocktail.properties.Unavailable.checkbox)
        .map((cocktail) => {
            return {
                name: cocktail.properties.Name.title[0].plain_text,
                flavors: cocktail.properties.Flavors.rich_text[0].plain_text,
                ingredients: cocktail.ingredients,
                instructions: cocktail.instructions,
                notes: cocktail.notes,
            };
        })
        .sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
};

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
