const svg = d3.select("#treemap");
const tooltip = d3.select("#tooltip");
const legend = d3.select("#legend");

let width = parseInt(svg.style("width"));
let height = 600;

// Color palette
const colors = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728",
  "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
  "#bcbd22", "#17becf"
];

function drawTreemap(url, title, desc) {
  svg.selectAll("*").remove();
  legend.selectAll("*").remove();
  tooltip.style("display", "none");

  d3.json(url).then((data) => {
    d3.select("#title").text(title);
    d3.select("#description").text(desc);

    const root = d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    d3.treemap().size([width, height]).padding(2)(root);

    const categories = data.children.map(d => d.name);
    const colorScale = d3.scaleOrdinal()
      .domain(categories)
      .range(colors);

    const tiles = svg.selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

    // Rectangles with hover effects
    tiles.append("rect")
      .attr("class", "tile")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => colorScale(d.data.category))
      .attr("data-name", d => d.data.name)
      .attr("data-category", d => d.data.category)
      .attr("data-value", d => d.data.value)
      .style("transition", "transform 0.2s, filter 0.2s")
      .on("mouseover", function() {
        d3.select(this)
          .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.3))")
          .style("transform", "scale(1.03)");
      })
      .on("mouseout", function() {
        d3.select(this)
          .style("filter", "none")
          .style("transform", "scale(1)");
      })
      .on("mousemove", (event, d) => {
        const [mouseX, mouseY] = d3.pointer(event, svg.node());
        const tooltipWidth = tooltip.node().offsetWidth;
        const tooltipHeight = tooltip.node().offsetHeight;
        let left = mouseX + 15;
        let top = mouseY - tooltipHeight - 10;

        if (left + tooltipWidth > width) left = mouseX - tooltipWidth - 15;
        if (top < 0) top = mouseY + 15;

        tooltip.style("display", "block")
          .style("left", `${left}px`)
          .style("top", `${top}px`)
          .attr("data-value", d.data.value)
          .html(
            `Name: ${d.data.name}<br>Category: ${d.data.category}<br>Value: ${d.data.value}`
          );
      })
      .on("mouseout", () => tooltip.style("display", "none"));

    // Labels with wrapping
    tiles.append("text")
      .attr("x", 4)
      .attr("y", 12)
      .attr("font-size", "10px")
      .attr("fill", "#fff")
      .selectAll("tspan")
      .data(d => {
        const words = d.data.name.split(/[\s\-:]+/);
        const lines = [];
        let line = "";
        const rectWidth = d.x1 - d.x0 - 4;

        words.forEach(word => {
          const testLine = line.length > 0 ? line + " " + word : word;
          const tempText = svg.append("text").text(testLine).attr("font-size", "10px");
          const textWidth = tempText.node().getBBox().width;
          tempText.remove();
          if (textWidth < rectWidth) {
            line = testLine;
          } else {
            if(line) lines.push(line);
            line = word;
          }
        });
        if(line) lines.push(line);
        return lines;
      })
      .join("tspan")
      .attr("x", 4)
      .attr("y", (d, i) => 12 + i * 12)
      .text(d => d);

    // Legend
    const legendItemSize = 20;
    const legendPerRow = Math.floor(width / 150);

    const legendGroup = legend.selectAll("g")
      .data(categories)
      .join("g")
      .attr("transform", (d, i) => {
        const x = (i % legendPerRow) * 150;
        const y = Math.floor(i / legendPerRow) * 30;
        return `translate(${x}, ${y})`;
      });

    legendGroup.append("rect")
      .attr("width", legendItemSize)
      .attr("height", legendItemSize)
      .attr("fill", d => colorScale(d));

    legendGroup.append("text")
      .attr("x", legendItemSize + 5)
      .attr("y", legendItemSize - 5)
      .text(d => d)
      .attr("font-size", "12px")
      .attr("fill", "#333");
  });
}

// Initial draw
drawTreemap(
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json",
  "Video Game Sales",
  "Top 100 Most Sold Video Games Grouped by Platform"
);

// Buttons
d3.selectAll("#buttons button").on("click", function() {
  d3.selectAll("#buttons button").classed("active", false);
  d3.select(this).classed("active", true);
  drawTreemap(this.dataset.url, this.dataset.title, this.dataset.desc);
});

// Responsive
window.addEventListener("resize", () => {
  width = parseInt(svg.style("width"));
  drawTreemap(
    d3.select("#buttons button.active").node().dataset.url,
    d3.select("#title").text(),
    d3.select("#description").text()
  );
});
