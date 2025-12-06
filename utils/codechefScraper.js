const cheerio = require("cheerio");
const NodeCache = require("node-cache");

const myCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // Cache for 1 hour

const fecher = async (handle) => {
  try {
    const resdata = await fetch(`https://www.codechef.com/users/${handle}`);
    if (resdata.status !== 200) return { success: false, status: resdata.status };

    const d = await resdata.text();
    const $ = cheerio.load(d);

    let heatMapData = [];
    let ratingData = [];
    
    try {
        let heatMapDataCursour1 = d.search("var userDailySubmissionsStats =") + "var userDailySubmissionsStats =".length;
        let heatMapDataCursour2 = d.search("'#js-heatmap") - 34;
        let heatDataString = d.substring(heatMapDataCursour1, heatMapDataCursour2);
        heatMapData = JSON.parse(heatDataString);
        
        let allRatingCursor = d.search("var all_rating = ") + "var all_rating = ".length;
        let allRatingCursor2 = d.search("var current_user_rating =") - 6;
        ratingData = JSON.parse(d.substring(allRatingCursor, allRatingCursor2));
    } catch(e) {
        console.error("Error parsing scripts for " + handle, e.message);
    }

    const profileImage = $('.user-details-container .user-details-wrapper .user-profile-image img').attr('src');
    let name = $('header h1').text().trim(); // Primary selector for new UI
    if (!name) {
        name = $('.user-details-container .user-details-wrapper .user-name').text().trim();
    }

    const currentRating = parseInt($('.rating-number').text()) || 0;
    const highestRating = parseInt($('.rating-header small').text().match(/\d+/)?.[0]) || 0;
    const countryFlag = $('.user-country-flag').attr('src');
    const countryName = $('.user-country-name').text().trim();
    
    // Ranks: Handle "Inactive" or numbers
    let globalRank = $('.rating-ranks ul li:first-child a').text().trim();
    let countryRank = $('.rating-ranks ul li:last-child a').text().trim();
    
    // If numeric, convert to int, otherwise keep string (e.g. "Inactive")
    if (!isNaN(parseInt(globalRank))) globalRank = parseInt(globalRank);
    if (!isNaN(parseInt(countryRank))) countryRank = parseInt(countryRank);

    // Stars: Extract just the star part (e.g. "7★")
    let stars = $('.rating').text().trim() || "unrated";
    if (stars.includes("★")) {
        // Match number followed by star (e.g. "7★") or just star
        const starMatch = stars.match(/(\d?★+)/);
        if (starMatch) stars = starMatch[0];
    }
    
    // New fields
    const totalProblemsSolved = parseInt($('h3:contains("Total Problems Solved")').text().match(/\d+/)?.[0]) || 0;
    const contestCount = ratingData.length; 
    
    // Last rating change
    let lastRatingChange = 0;
    if(ratingData.length > 1) {
        lastRatingChange = parseInt(ratingData[ratingData.length - 1].rating) - parseInt(ratingData[ratingData.length - 2].rating);
    } else if (ratingData.length === 1) {
        lastRatingChange = parseInt(ratingData[0].rating) - 1500; 
    }

    return {
        success: true,
        status: 200,
        profile: profileImage,
        name,
        currentRating,
        highestRating,
        countryFlag,
        countryName,
        globalRank,
        countryRank,
        stars,
        totalProblemsSolved,
        contestCount,
        lastRatingChange,
        heatMap: heatMapData,
        ratingData
    };

  } catch (e) {
    console.log(e);
    return { success: false, status: 404 };
  }
}

// Helper to fetch with cache and retry
const getCodeChefData = async (handle) => {
    const cachedData = myCache.get(handle);
    if (cachedData) return cachedData;

    let data = await fecher(handle);
    
    if (data.status == 429) {
       await new Promise(resolve => setTimeout(resolve, 2000));
       data = await fecher(handle);
    }

    if (data.success) {
      myCache.set(handle, data);
    }
    return data;
}

module.exports = { getCodeChefData };
