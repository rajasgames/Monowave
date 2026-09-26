const fs = require('fs');

const appPath = 'src/App.tsx';
let content = fs.readFileSync(appPath, 'utf8');

const importStr = 'import { formatTime, timeAgo } from "./ui/utils";';
if (content.includes(importStr)) {
  content = content.replace(importStr, importStr + '\nimport {\n  Artwork,\n  BrandHeader,\n  Action,\n  SectionHeader,\n  ScreenTitle,\n  TrackRow as TrackLine,\n  SectionRail,\n  MiniPlayer,\n} from "./ui/components";');
}

const artworkStart = content.indexOf('function Artwork({');
const mixPanelStart = content.indexOf('function DiscoverMixPanel({');

if (artworkStart !== -1 && mixPanelStart !== -1) {
  content = content.substring(0, artworkStart) + content.substring(mixPanelStart);
}

const miniPlayerStart = content.indexOf('function MiniPlayer({');
const bottomNavStart = content.indexOf('function BottomNav({');

if (miniPlayerStart !== -1 && bottomNavStart !== -1) {
  content = content.substring(0, miniPlayerStart) + content.substring(bottomNavStart);
}

fs.writeFileSync(appPath, content, 'utf8');
console.log('Refactored App.tsx');
