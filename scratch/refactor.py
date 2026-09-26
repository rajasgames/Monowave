import os

app_path = "src/App.tsx"
with open(app_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find the import
import_idx = -1
for i, line in enumerate(lines):
    if 'import { formatTime, timeAgo } from "./ui/utils";' in line:
        import_idx = i
        break

if import_idx != -1:
    imports_to_add = """import {
  Artwork,
  BrandHeader,
  Action,
  SectionHeader,
  ScreenTitle,
  TrackRow as TrackLine,
  SectionRail,
  MiniPlayer,
} from "./ui/components";\n"""
    lines.insert(import_idx + 1, imports_to_add)

# Find Artwork start and SectionRail end
artwork_start = -1
section_rail_end = -1
for i, line in enumerate(lines):
    if line.startswith("function Artwork({"):
        if artwork_start == -1:
            artwork_start = i
    if line.startswith("function DiscoverMixPanel({"):
        if section_rail_end == -1:
            section_rail_end = i - 1

if artwork_start != -1 and section_rail_end != -1:
    # Delete lines
    del lines[artwork_start:section_rail_end+1]

# Now find MiniPlayer start and BottomNav start
mini_player_start = -1
bottom_nav_start = -1
for i, line in enumerate(lines):
    if line.startswith("function MiniPlayer({"):
        mini_player_start = i
    if line.startswith("function BottomNav({"):
        bottom_nav_start = i - 1

if mini_player_start != -1 and bottom_nav_start != -1:
    del lines[mini_player_start:bottom_nav_start+1]

with open(app_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("Refactored App.tsx")
