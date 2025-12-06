const { getCodeChefData } = require("../utils/codechefScraper");

const getUsers = async (req, res) => {
    const handles = req.query.handles;
    if (!handles) return res.status(400).json({ success: false, error: "No handles provided" });
    
    const handleList = handles.split(',').map(h => h.trim()).filter(h => h);
    if(handleList.length > 100) return res.status(400).json({ success: false, error: "Max 100 handles per request" });

    const promises = handleList.map(async (handle) => {
        const data = await getCodeChefData(handle);
        if(!data.success) return { handle, success: false };
        
        // Strip heavy data
        const { heatMap, ratingData, ...summary } = data;
        return summary;
    });
    
    const results = await Promise.all(promises);
    res.json({ success: true, users: results });
};

const getUserRating = async (req, res) => {
    const data = await getCodeChefData(req.params.handle);
    if(!data.success) return res.status(404).json(data);
    res.json({ success: true, ratingData: data.ratingData });
};

const getUserHeatmap = async (req, res) => {
    const data = await getCodeChefData(req.params.handle);
    if(!data.success) return res.status(404).json(data);
    res.json({ success: true, heatMap: data.heatMap });
};

const getUserProfile = async (req, res) => {
  try {
    if (req.params.handle === "favicon.ico")
      return res.send({ success: false, error: 'invalid handle' });
    
    let data = await getCodeChefData(req.params.handle);

    if (!data.success) return res.status(404).json(data);

    // Handle granular data request
    if (req.query.fields) {
        const fields = req.query.fields.split(',').map(f => f.trim());
        const filteredData = { success: true, status: 200 }; 
        
        let found = false;
        fields.forEach(field => {
            if (data[field] !== undefined) {
                filteredData[field] = data[field];
                found = true;
            }
        });
        
        if (found) return res.json(filteredData);
    }
    
    res.send(data)
  } catch (err) {
    res.send({ success: false, error: err });
  }
};

const redirectHandle = (req, res) => {
  const handle = req.params.handle;
  if (handle && handle.length && !handle.includes("."))
    res.redirect(`/handle/${handle}`);
  else
    res.send({
      success: false,
      error: `Invalid Endpoint kindly change your url from https://sm-codechef.vercel.app/${handle} to https://sm-codechef.vercel.app/handle/${handle} or may be incorrect handle`,
    });
};

module.exports = {
    getUsers,
    getUserRating,
    getUserHeatmap,
    getUserProfile,
    redirectHandle
};
