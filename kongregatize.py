#!/usr/bin/python3

import os
import shutil
from lxml import html

try:
	from jsmin import jsmin
except ImportError:
	jsmin = lambda x: x

RELEASE_DIR = "release"


for filename in os.listdir():
	if filename.endswith(".html"):
		MAIN_HTML = filename


root = html.parse(MAIN_HTML)
try:
	shutil.rmtree(RELEASE_DIR)
except FileNotFoundError:
	pass

os.mkdir(RELEASE_DIR)
shutil.copytree("assets", os.path.join(RELEASE_DIR, "assets"))

for s in root.findall("head/script"):
	s.attrib["type"] = "text/javascript"
	src = s.attrib.get("src")
	if not src:
		continue
	if src.startswith("http://") or src.startswith("https://"):
		s.text = " "
		continue
	with open(src) as f:
		script = jsmin(f.read())
	s.attrib.pop("src")
	s.text = script
	
with open(os.path.join(RELEASE_DIR, MAIN_HTML), "w") as f:
	f.write(html.tostring(root, encoding="unicode"))
