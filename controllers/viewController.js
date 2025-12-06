const renderHome = (req, res) => {
  res.render("home");
};

const renderHeatmap = (req, res) => {
  let theme = req.query.theme == "night" ? "night" : "day";
  res.render("heatmap", { handle: req.params.handle, theme });
};

const renderRating = (req, res) => {
  res.render("rating", { handle: req.params.handle });
};

module.exports = {
    renderHome,
    renderHeatmap,
    renderRating
};
