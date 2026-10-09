export const THEME_STORAGE_KEY = "witsquest-theme";
export const PALETTE_STORAGE_KEY = "witsquest-palette";
export const palettes = [
  { id: "wits", name: "Wits classic", description: "Navy and gold", colours: ["#043673", "#c9a24b", "#f7f9fc"] },
  { id: "forest", name: "Forest", description: "Deep green, mint and soft neutrals", colours: ["#164b36", "#25815b", "#eaf1ed"] },
  { id: "ocean", name: "Ocean", description: "Starlight blue, wave blue and Prussian blue", colours: ["#BED6E0", "#3B8AB1", "#003153"] },
  { id: "plum", name: "Plum", description: "Blush, mauve and deep purple", colours: ["#F2D7EE", "#D3BCC0", "#A5668B", "#69306D", "#0E103D"] },
  { id: "blush", name: "Blush", description: "Soft pastel pinks and warm neutrals", colours: ["#FFEAEA", "#FFE3E3", "#FFD9D9", "#FFC6C6", "#FFB3B3"] },
  { id: "buttermilk", name: "Buttermilk", description: "Buttercream, pastel blue and old burgundy", colours: ["#FFF1B5", "#C1DBE8", "#43302E"] },
  { id: "graphite", name: "Graphite", description: "Charcoal, soft greys and off-white", colours: ["#101010", "#606060", "#B4B4B4", "#C4C4C4", "#EEEEEE"] },
] as const;
export type Palette = typeof palettes[number]["id"];
// Run before the page paints so a saved dark theme never flashes light.
export const themeInitScript = `(function(){var theme,palette;try{theme=localStorage.getItem('${THEME_STORAGE_KEY}');palette=localStorage.getItem('${PALETTE_STORAGE_KEY}')}catch(e){}if(palette==='sage-rose'||palette==='raspberry')palette='blush';var dark=theme==='dark'||(theme!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.dataset.palette=${JSON.stringify(palettes.map(option => option.id))}.includes(palette)?palette:'wits'})()`;
