const cheerio = require("cheerio");

const fetchUser = async () => {
    try {
        const res = await fetch("https://www.codechef.com/users/gennady.korotkevich");
        const text = await res.text();
        const $ = cheerio.load(text);

        console.log("--- Name Search ---");
        // Try to find the element containing the name
        const nameElement = $('*:contains("Gennady Korotkevich")').last();
        console.log("Element with name:", nameElement.prop('tagName'), nameElement.attr('class'));
        console.log("Parent:", nameElement.parent().prop('tagName'), nameElement.parent().attr('class'));
        console.log("H1 text:", $('h1').text());
        console.log("H2 text:", $('h2').text());
        console.log("header text:", $('header').text());

        console.log("\n--- Stars/Rating Search ---");
        console.log("Rating class text:", $('.rating').text());
        console.log("Rating number text:", $('.rating-number').text());
        console.log("Rating header text:", $('.rating-header').text());
        
        console.log("\n--- Ranks Search ---");
        console.log("Rating ranks text:", $('.rating-ranks').text());
        console.log("Rating ranks HTML:", $('.rating-ranks').html());
        
    } catch (e) {
        console.error(e);
    }
};

fetchUser();